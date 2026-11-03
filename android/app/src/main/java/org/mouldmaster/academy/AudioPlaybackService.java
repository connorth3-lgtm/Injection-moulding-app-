package org.mouldmaster.academy;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.content.pm.ServiceInfo;
import android.media.AudioAttributes;
import android.media.AudioFocusRequest;
import android.media.AudioManager;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;
import android.os.PowerManager;
import android.speech.tts.TextToSpeech;
import android.speech.tts.UtteranceProgressListener;
import android.speech.tts.Voice;
import android.webkit.WebView;

import org.json.JSONObject;

import java.lang.ref.WeakReference;
import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Set;

public final class AudioPlaybackService extends Service {
    static final String ACTION_SPEAK = "org.mouldmaster.academy.action.SPEAK";
    private static final String ACTION_SPEAK_QUEUE = "org.mouldmaster.academy.action.SPEAK_QUEUE";
    private static final String ACTION_STOP = "org.mouldmaster.academy.action.STOP";
    private static final String CHANNEL_ID = "mouldmaster-book-audio";
    private static final int NOTIFICATION_ID = 4102;
    private static final long IDLE_SHUTDOWN_DELAY_MS = 1800L;
    private static final long TTS_INIT_TIMEOUT_MS = 12000L;
    private static final long UTTERANCE_RETRY_DELAY_MS = 350L;
    private static final int MAX_UTTERANCE_RETRIES = 2;

    private static WeakReference<WebView> webViewRef = new WeakReference<>(null);
    private static final Object REQUEST_LOCK = new Object();
    private static ArrayDeque<SpeechItem> requestedQueue = new ArrayDeque<>();
    private static float requestedRate = 1f;

    static final class SpeechItem {
        final String id;
        final String text;
        final int retries;

        SpeechItem(String id, String text) {
            this(id, text, 0);
        }

        SpeechItem(String id, String text, int retries) {
            this.id = id;
            this.text = text;
            this.retries = retries;
        }
    }

    private static final class QueueRequest {
        final ArrayDeque<SpeechItem> items;
        final float rate;

        QueueRequest(ArrayDeque<SpeechItem> items, float rate) {
            this.items = items;
            this.rate = rate;
        }
    }

    static void attachWebView(WebView webView) {
        if (webView != null) webViewRef = new WeakReference<>(webView);
    }

    static void detachWebView(WebView webView) {
        WebView current = webViewRef.get();
        if (current == webView) webViewRef = new WeakReference<>(null);
    }

    static void startSpeech(Context context, String text, float rate, String requestId) {
        ArrayList<SpeechItem> items = new ArrayList<>();
        items.add(new SpeechItem(requestId, text));
        startSpeechQueue(context, items, rate);
    }

    static void startSpeechQueue(Context context, List<SpeechItem> items, float rate) {
        if (items == null || items.isEmpty()) return;
        synchronized (REQUEST_LOCK) {
            requestedQueue = new ArrayDeque<>(items);
            requestedRate = Math.max(0.5f, Math.min(2f, rate));
        }
        Intent intent = new Intent(context, AudioPlaybackService.class)
                .setAction(ACTION_SPEAK_QUEUE);
        if (Build.VERSION.SDK_INT >= 26) {
            context.startForegroundService(intent);
        } else {
            context.startService(intent);
        }
    }

    static void stopSpeech(Context context) {
        context.startService(new Intent(context, AudioPlaybackService.class).setAction(ACTION_STOP));
    }

    private static QueueRequest takeRequestedQueue() {
        synchronized (REQUEST_LOCK) {
            if (requestedQueue.isEmpty()) return null;
            QueueRequest request = new QueueRequest(new ArrayDeque<>(requestedQueue), requestedRate);
            requestedQueue.clear();
            return request;
        }
    }

    private TextToSpeech textToSpeech;
    private AudioManager audioManager;
    private AudioFocusRequest audioFocusRequest;
    private final AudioManager.OnAudioFocusChangeListener audioFocusListener = change -> {
        if (change == AudioManager.AUDIOFOCUS_LOSS) {
            stopCurrent(true, "Phone audio focus was lost. Tap Listen to retry.");
        } else if (change == AudioManager.AUDIOFOCUS_LOSS_TRANSIENT) {
            pauseForAudioFocus();
        } else if (change == AudioManager.AUDIOFOCUS_GAIN) {
            resumeAfterAudioFocus();
        }
    };
    private PowerManager.WakeLock wakeLock;
    private ArrayDeque<SpeechItem> speechQueue;
    private float pendingRate = 1f;
    private String activeId;
    private SpeechItem activeItem;
    private boolean ttsReady;
    private boolean ttsInitFinished;
    private String ttsInitError;
    private boolean stopping;
    private boolean waitingForAudioFocus;
    private boolean foregroundStarted;
    private String lastNotificationText;

    private final Handler mainHandler = new Handler(Looper.getMainLooper());
    private final Runnable delayedShutdown = () -> {
        if (activeId == null && (speechQueue == null || speechQueue.isEmpty())) {
            stopForeground(true);
            foregroundStarted = false;
            lastNotificationText = null;
            stopSelf();
        }
    };

    @Override
    public void onCreate() {
        super.onCreate();
        createChannel();
        audioManager = (AudioManager) getSystemService(AUDIO_SERVICE);
        AudioAttributes attributes = new AudioAttributes.Builder()
                .setUsage(AudioAttributes.USAGE_MEDIA)
                .setContentType(AudioAttributes.CONTENT_TYPE_SPEECH)
                .build();
        if (Build.VERSION.SDK_INT >= 26) {
            audioFocusRequest = new AudioFocusRequest.Builder(AudioManager.AUDIOFOCUS_GAIN)
                    .setAudioAttributes(attributes)
                    .setOnAudioFocusChangeListener(audioFocusListener)
                    .build();
        }

        ttsInitFinished = false;
        ttsInitError = null;
        textToSpeech = new TextToSpeech(this, status -> initializeTextToSpeech(status, attributes));
        mainHandler.postDelayed(ttsInitTimeout, TTS_INIT_TIMEOUT_MS);
    }

    private final Runnable ttsInitTimeout = () -> {
        if (ttsInitFinished) return;
        ttsInitFinished = true;
        ttsInitError = "Android text-to-speech did not respond. Check that a speech engine is installed, then tap Listen again.";
        failQueuedSpeech(ttsInitError);
    };

    private void initializeTextToSpeech(int status, AudioAttributes attributes) {
        if (ttsInitFinished) return;
        ttsInitFinished = true;
        mainHandler.removeCallbacks(ttsInitTimeout);
        if (status != TextToSpeech.SUCCESS) {
            ttsReady = false;
            ttsInitError = "Android text-to-speech could not start. Open Settings > Accessibility > Text-to-speech output, choose an engine, and install an English voice.";
            failQueuedSpeech(ttsInitError);
            return;
        }

        try {
            textToSpeech.setAudioAttributes(attributes);
            Locale speechLocale = Locale.getDefault();
            if (!"en".equalsIgnoreCase(speechLocale.getLanguage())) {
                speechLocale = Locale.ENGLISH;
            }
            int languageStatus = textToSpeech.setLanguage(speechLocale);
            if (languageStatus < TextToSpeech.LANG_AVAILABLE) {
                speechLocale = Locale.ENGLISH;
                languageStatus = textToSpeech.setLanguage(speechLocale);
            }
            if (languageStatus < TextToSpeech.LANG_AVAILABLE) {
                ttsReady = false;
                ttsInitError = "No usable English voice is installed. Open Settings > Accessibility > Text-to-speech output and download an English voice.";
                failQueuedSpeech(ttsInitError);
                return;
            }

            preferBestInstalledEnglishVoice(speechLocale);
            textToSpeech.setOnUtteranceProgressListener(new UtteranceProgressListener() {
                @Override
                public void onStart(String utteranceId) {
                    if (isCurrent(utteranceId)) emit(utteranceId, "start", null);
                }

                @Override
                public void onDone(String utteranceId) {
                    if (isCurrent(utteranceId)) {
                        emit(utteranceId, "done", null);
                        finishCurrent();
                    }
                }

                @Override
                public void onError(String utteranceId) {
                    retryOrFailCurrent(utteranceId,
                            "Android text-to-speech repeatedly failed. Check the selected engine and downloaded voice, then tap Listen to retry.");
                }

                @Override
                public void onError(String utteranceId, int errorCode) {
                    retryOrFailCurrent(utteranceId,
                            "Android text-to-speech repeatedly failed (" + errorCode + "). Check the selected engine and downloaded voice, then tap Listen to retry.");
                }

                @Override
                public void onStop(String utteranceId, boolean interrupted) {
                    retryOrFailCurrent(utteranceId,
                            "Phone voice repeatedly stopped before this section finished. Tap Listen to retry.");
                }
            });
            ttsReady = true;
            ttsInitError = null;
            speakNextQueued();
        } catch (Exception error) {
            ttsReady = false;
            ttsInitError = "Android text-to-speech could not initialize. Check Settings > Accessibility > Text-to-speech output.";
            failQueuedSpeech(ttsInitError);
        }
    }

    private void preferBestInstalledEnglishVoice(Locale preferredLocale) {
        if (textToSpeech == null) return;
        try {
            Set<Voice> voices = textToSpeech.getVoices();
            if (voices == null || voices.isEmpty()) return;

            Voice best = null;
            for (Voice voice : voices) {
                Locale voiceLocale = voice.getLocale();
                if (voiceLocale == null || !"en".equalsIgnoreCase(voiceLocale.getLanguage())) continue;
                if (voice.isNetworkConnectionRequired()) continue;

                Set<String> features = voice.getFeatures();
                if (features == null
                        || features.contains(TextToSpeech.Engine.KEY_FEATURE_NOT_INSTALLED)) {
                    continue;
                }
                if (best == null || isBetterEnglishVoice(voice, best, preferredLocale)) {
                    best = voice;
                }
            }

            // Prefer the best already-installed offline voice so playback sounds
            // natural without depending on network synthesis while the screen is off.
            if (best != null) textToSpeech.setVoice(best);
        } catch (Exception ignored) {
            // Keep the TTS engine's language-selected default voice on any engine-specific issue.
        }
    }

    private boolean isBetterEnglishVoice(Voice candidate, Voice current, Locale preferredLocale) {
        if (candidate.getQuality() != current.getQuality()) {
            return candidate.getQuality() > current.getQuality();
        }
        boolean candidateMatchesRegion = candidate.getLocale().getCountry()
                .equalsIgnoreCase(preferredLocale.getCountry());
        boolean currentMatchesRegion = current.getLocale().getCountry()
                .equalsIgnoreCase(preferredLocale.getCountry());
        if (candidateMatchesRegion != currentMatchesRegion) return candidateMatchesRegion;
        return candidate.getLatency() < current.getLatency();
    }

    private void retryOrFailCurrent(String utteranceId, String failureMessage) {
        if (!isCurrent(utteranceId) || activeItem == null) return;

        SpeechItem interruptedItem = activeItem;
        if (interruptedItem.retries < MAX_UTTERANCE_RETRIES) {
            activeId = null;
            activeItem = null;
            if (speechQueue == null) speechQueue = new ArrayDeque<>();
            speechQueue.addFirst(new SpeechItem(
                    interruptedItem.id, interruptedItem.text, interruptedItem.retries + 1));
            long delay = UTTERANCE_RETRY_DELAY_MS * (1L << interruptedItem.retries);
            mainHandler.postDelayed(() -> {
                if (!stopping && !waitingForAudioFocus && activeId == null) speakNextQueued();
            }, delay);
            return;
        }

        emit(utteranceId, "error", failureMessage);
        speechQueue = null;
        finishCurrent();
    }

    private void pauseForAudioFocus() {
        if (stopping || waitingForAudioFocus) return;
        boolean hasPendingSpeech = activeItem != null || (speechQueue != null && !speechQueue.isEmpty());
        if (!hasPendingSpeech) return;

        stopping = true;
        try {
            if (textToSpeech != null) textToSpeech.stop();
        } catch (Exception ignored) { }
        if (activeItem != null) {
            if (speechQueue == null) speechQueue = new ArrayDeque<>();
            speechQueue.addFirst(activeItem);
        }
        activeId = null;
        activeItem = null;
        stopping = false;
        waitingForAudioFocus = true;
        releaseWakeLock();
        updateNotification("Book narration paused for another app's audio");
    }

    private void resumeAfterAudioFocus() {
        if (!waitingForAudioFocus) return;
        waitingForAudioFocus = false;
        if (speechQueue == null || speechQueue.isEmpty()) {
            finishCurrent();
            return;
        }
        cancelDelayedShutdown();
        updateNotification("Book narration is playing");
        speakNextQueued();
    }

    private void failQueuedSpeech(String message) {
        ttsInitError = message;
        SpeechItem firstPending = speechQueue == null ? null : speechQueue.peekFirst();
        String id = activeId != null ? activeId : firstPending == null ? null : firstPending.id;
        if (id == null) return;

        waitingForAudioFocus = false;
        cancelDelayedShutdown();
        stopping = true;
        if (textToSpeech != null) {
            try { textToSpeech.stop(); } catch (Exception ignored) { }
        }
        emit(id, "error", message);
        activeId = null;
        activeItem = null;
        speechQueue = null;
        releaseAudioFocus();
        releaseWakeLock();
        if (foregroundStarted) {
            stopForeground(true);
        } else {
            ((NotificationManager) getSystemService(NOTIFICATION_SERVICE)).cancel(NOTIFICATION_ID);
        }
        foregroundStarted = false;
        lastNotificationText = null;
        stopSelf();
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent == null) return START_NOT_STICKY;
        String action = intent.getAction();
        if (ACTION_STOP.equals(action)) {
            stopCurrent(false, null);
            return START_NOT_STICKY;
        }
        if (!ACTION_SPEAK_QUEUE.equals(action) && !ACTION_SPEAK.equals(action)) {
            return START_NOT_STICKY;
        }

        QueueRequest request;
        if (ACTION_SPEAK.equals(action)) {
            String text = intent.getStringExtra("text");
            String requestId = intent.getStringExtra("requestId");
            ArrayDeque<SpeechItem> single = new ArrayDeque<>();
            if (text == null || requestId == null) return START_NOT_STICKY;
            single.add(new SpeechItem(requestId, text));
            request = new QueueRequest(single,
                    intent.getFloatExtra("rate", 1f));
        } else {
            request = takeRequestedQueue();
            if (request == null || request.items.isEmpty()) return START_NOT_STICKY;
        }

        cancelDelayedShutdown();
        replaceQueue(request.items, request.rate);
        startForegroundSafe(buildNotification("Starting Book narration"));
        if (ttsInitError != null) {
            failQueuedSpeech(ttsInitError);
            return START_NOT_STICKY;
        }
        if (ttsReady) speakNextQueued();
        return START_STICKY;
    }

    private void replaceQueue(ArrayDeque<SpeechItem> nextQueue, float rate) {
        waitingForAudioFocus = false;
        stopping = true;
        if (textToSpeech != null) {
            try { textToSpeech.stop(); } catch (Exception ignored) { }
        }
        activeId = null;
        activeItem = null;
        releaseAudioFocus();
        releaseWakeLock();
        speechQueue = nextQueue;
        pendingRate = Math.max(0.5f, Math.min(2f, rate));
        stopping = false;
    }

    private void speakNextQueued() {
        if (!ttsReady || stopping || waitingForAudioFocus || activeId != null) return;
        if (speechQueue == null || speechQueue.isEmpty()) {
            finishCurrent();
            return;
        }

        cancelDelayedShutdown();
        SpeechItem item = speechQueue.removeFirst();
        activeItem = item;
        activeId = item.id;
        acquireAudioFocus();
        acquireWakeLock();
        updateNotification("Book narration is playing");
        textToSpeech.setSpeechRate(pendingRate);
        Bundle params = new Bundle();
        params.putString(TextToSpeech.Engine.KEY_PARAM_UTTERANCE_ID, activeId);
        int result = textToSpeech.speak(item.text, TextToSpeech.QUEUE_FLUSH, params, activeId);
        if (result == TextToSpeech.ERROR) {
            emit(activeId, "error", "Android text-to-speech rejected the sentence.");
            speechQueue = null;
            finishCurrent();
        }
    }

    private boolean isCurrent(String id) {
        return id != null && id.equals(activeId) && !stopping;
    }

    private void stopCurrent(boolean notify, String message) {
        waitingForAudioFocus = false;
        cancelDelayedShutdown();
        String id = activeId;
        stopping = true;
        if (textToSpeech != null) {
            try { textToSpeech.stop(); } catch (Exception ignored) { }
        }
        if (notify && id != null) {
            emit(id, "error", message == null ? "Book narration stopped." : message);
        }
        activeId = null;
        activeItem = null;
        speechQueue = null;
        releaseAudioFocus();
        releaseWakeLock();
        updateNotification(null);
        stopForeground(true);
        foregroundStarted = false;
        lastNotificationText = null;
        stopSelf();
        stopping = false;
    }

    private void finishCurrent() {
        activeId = null;
        activeItem = null;
        if (speechQueue != null && !speechQueue.isEmpty()) {
            // Keep CPU awake and retain audio focus across utterance boundaries.
            // The next native chunk starts immediately, while the screen may be off.
            speakNextQueued();
            return;
        }
        speechQueue = null;
        waitingForAudioFocus = false;
        releaseAudioFocus();
        releaseWakeLock();
        scheduleDelayedShutdown();
    }

    private void scheduleDelayedShutdown() {
        cancelDelayedShutdown();
        mainHandler.postDelayed(delayedShutdown, IDLE_SHUTDOWN_DELAY_MS);
    }

    private void cancelDelayedShutdown() {
        mainHandler.removeCallbacks(delayedShutdown);
    }

    private void acquireAudioFocus() {
        if (audioManager == null) return;
        if (Build.VERSION.SDK_INT >= 26 && audioFocusRequest != null) {
            audioManager.requestAudioFocus(audioFocusRequest);
        } else {
            audioManager.requestAudioFocus(audioFocusListener, AudioManager.STREAM_MUSIC,
                    AudioManager.AUDIOFOCUS_GAIN);
        }
    }

    private void releaseAudioFocus() {
        if (audioManager == null) return;
        if (Build.VERSION.SDK_INT >= 26 && audioFocusRequest != null) {
            audioManager.abandonAudioFocusRequest(audioFocusRequest);
        } else {
            audioManager.abandonAudioFocus(audioFocusListener);
        }
    }

    private void acquireWakeLock() {
        if (wakeLock == null) {
            PowerManager power = (PowerManager) getSystemService(POWER_SERVICE);
            wakeLock = power.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "MouldMaster:BookAudio");
            wakeLock.setReferenceCounted(false);
        }
        if (!wakeLock.isHeld()) wakeLock.acquire();
    }

    private void releaseWakeLock() {
        if (wakeLock != null && wakeLock.isHeld()) wakeLock.release();
    }

    private void createChannel() {
        if (Build.VERSION.SDK_INT >= 26) {
            NotificationChannel channel = new NotificationChannel(
                    CHANNEL_ID, getString(R.string.audio_channel_name), NotificationManager.IMPORTANCE_LOW);
            channel.setDescription("One silent foreground notification while Book narration plays.");
            channel.setSound(null, null);
            channel.enableVibration(false);
            channel.enableLights(false);
            channel.setShowBadge(false);
            ((NotificationManager) getSystemService(NOTIFICATION_SERVICE)).createNotificationChannel(channel);
        }
    }

    private Notification buildNotification(String text) {
        Intent launch = new Intent(this, MainActivity.class)
                .addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        PendingIntent open = PendingIntent.getActivity(this, 4103, launch,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        Notification.Builder builder = Build.VERSION.SDK_INT >= 26
                ? new Notification.Builder(this, CHANNEL_ID)
                : new Notification.Builder(this);
        builder.setSmallIcon(R.drawable.ic_stat_mouldmaster)
                .setContentTitle(getString(R.string.audio_notification_title))
                .setContentText(text == null ? getString(R.string.audio_notification_text) : text)
                .setContentIntent(open)
                .setOngoing(text != null)
                .setOnlyAlertOnce(true)
                .setCategory(Notification.CATEGORY_SERVICE)
                .setVisibility(Notification.VISIBILITY_PRIVATE)
                .setShowWhen(false);
        return builder.build();
    }

    private void startForegroundSafe(Notification notification) {
        if (foregroundStarted) return;
        if (Build.VERSION.SDK_INT >= 29) {
            startForeground(NOTIFICATION_ID, notification, ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK);
        } else {
            startForeground(NOTIFICATION_ID, notification);
        }
        foregroundStarted = true;
        lastNotificationText = notification.extras == null
                ? null : notification.extras.getString(Notification.EXTRA_TEXT);
    }

    private void updateNotification(String text) {
        NotificationManager manager = (NotificationManager) getSystemService(NOTIFICATION_SERVICE);
        if (text == null) {
            manager.cancel(NOTIFICATION_ID);
            lastNotificationText = null;
            return;
        }
        if (!foregroundStarted || text.equals(lastNotificationText)) return;
        lastNotificationText = text;
        manager.notify(NOTIFICATION_ID, buildNotification(text));
    }

    private static void emit(String id, String type, String message) {
        WebView webView = webViewRef.get();
        if (webView == null || id == null) return;
        try {
            String json = "{\"id\":" + JSONObject.quote(id)
                    + ",\"type\":" + JSONObject.quote(type)
                    + (message == null ? "" : ",\"message\":" + JSONObject.quote(message))
                    + "}";
            webView.post(() -> webView.evaluateJavascript(
                    "(function(){if(window.MMNativeTtsEvent)window.MMNativeTtsEvent(" + json + ");})()",
                    null));
        } catch (Exception ignored) {
        }
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    @Override
    public void onDestroy() {
        mainHandler.removeCallbacks(ttsInitTimeout);
        cancelDelayedShutdown();
        stopCurrent(false, null);
        if (textToSpeech != null) {
            try { textToSpeech.shutdown(); } catch (Exception ignored) { }
            textToSpeech = null;
        }
        super.onDestroy();
    }
}

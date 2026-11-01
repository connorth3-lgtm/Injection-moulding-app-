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
import android.media.MediaMetadata;
import android.media.session.MediaSession;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;
import android.os.PowerManager;
import android.speech.tts.TextToSpeech;
import android.speech.tts.UtteranceProgressListener;
import android.webkit.WebView;

import org.json.JSONObject;

import java.lang.ref.WeakReference;
import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.List;

public final class AudioPlaybackService extends Service {
    static final String ACTION_SPEAK = "org.mouldmaster.academy.action.SPEAK";
    private static final String ACTION_SPEAK_QUEUE = "org.mouldmaster.academy.action.SPEAK_QUEUE";
    private static final String ACTION_STOP = "org.mouldmaster.academy.action.STOP";
    private static final String CHANNEL_ID = "mouldmaster-book-audio";
    private static final int NOTIFICATION_ID = 4102;
    private static final long IDLE_SHUTDOWN_DELAY_MS = 1800L;

    private static WeakReference<WebView> webViewRef = new WeakReference<>(null);
    private static final Object REQUEST_LOCK = new Object();
    private static ArrayDeque<SpeechItem> requestedQueue = new ArrayDeque<>();
    private static float requestedRate = 1f;

    static final class SpeechItem {
        final String id;
        final String text;

        SpeechItem(String id, String text) {
            this.id = id;
            this.text = text;
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
        if (change == AudioManager.AUDIOFOCUS_LOSS || change == AudioManager.AUDIOFOCUS_LOSS_TRANSIENT) {
            stopCurrent(true, "Phone audio focus was lost. Tap Listen to retry.");
        }
    };
    private MediaSession mediaSession;
    private PowerManager.WakeLock wakeLock;
    private ArrayDeque<SpeechItem> speechQueue;
    private float pendingRate = 1f;
    private String activeId;
    private boolean ttsReady;
    private boolean stopping;
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
            audioFocusRequest = new AudioFocusRequest.Builder(AudioManager.AUDIOFOCUS_GAIN_TRANSIENT_MAY_DUCK)
                    .setAudioAttributes(attributes)
                    .setOnAudioFocusChangeListener(audioFocusListener)
                    .build();
        }

        mediaSession = new MediaSession(this, "MouldMasterBook");
        mediaSession.setCallback(new MediaSession.Callback() {
            @Override
            public void onPause() {
                stopCurrent(true, "Paused from the phone controls. Tap Listen to resume.");
            }

            @Override
            public void onStop() {
                stopCurrent(true, "Stopped from the phone controls.");
            }
        });
        mediaSession.setMetadata(new MediaMetadata.Builder()
                .putString(MediaMetadata.METADATA_KEY_TITLE, "MouldMaster Book")
                .putString(MediaMetadata.METADATA_KEY_ARTIST, "MouldMaster Academy")
                .build());
        mediaSession.setActive(true);

        textToSpeech = new TextToSpeech(this, status -> {
            if (status == TextToSpeech.SUCCESS) {
                ttsReady = true;
                textToSpeech.setAudioAttributes(attributes);
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
                        if (isCurrent(utteranceId)) {
                            emit(utteranceId, "error", "Android text-to-speech failed.");
                            speechQueue = null;
                            finishCurrent();
                        }
                    }

                    @Override
                    public void onError(String utteranceId, int errorCode) {
                        if (isCurrent(utteranceId)) {
                            emit(utteranceId, "error", "Android text-to-speech failed (" + errorCode + ").");
                            speechQueue = null;
                            finishCurrent();
                        }
                    }
                });
                speakNextQueued();
            } else {
                emit(activeId, "error", "Android text-to-speech is unavailable. Install or enable a system voice.");
                speechQueue = null;
                finishCurrent();
            }
        });
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
        if (ttsReady) speakNextQueued();
        return START_STICKY;
    }

    private void replaceQueue(ArrayDeque<SpeechItem> nextQueue, float rate) {
        stopping = true;
        if (textToSpeech != null) {
            try { textToSpeech.stop(); } catch (Exception ignored) { }
        }
        activeId = null;
        releaseAudioFocus();
        releaseWakeLock();
        speechQueue = nextQueue;
        pendingRate = Math.max(0.5f, Math.min(2f, rate));
        stopping = false;
    }

    private void speakNextQueued() {
        if (!ttsReady || stopping || activeId != null) return;
        if (speechQueue == null || speechQueue.isEmpty()) {
            finishCurrent();
            return;
        }

        cancelDelayedShutdown();
        SpeechItem item = speechQueue.removeFirst();
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
        releaseAudioFocus();
        releaseWakeLock();
        activeId = null;
        if (speechQueue != null && !speechQueue.isEmpty()) {
            speakNextQueued();
            return;
        }
        speechQueue = null;
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
                    AudioManager.AUDIOFOCUS_GAIN_TRANSIENT_MAY_DUCK);
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
            channel.setDescription("One quiet control notification for Book narration while the screen is off.");
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
                .setCategory(Notification.CATEGORY_TRANSPORT)
                .setVisibility(Notification.VISIBILITY_PUBLIC)
                .setShowWhen(false);
        if (mediaSession != null) {
            builder.setStyle(new Notification.MediaStyle()
                    .setMediaSession(mediaSession.getSessionToken()));
        }
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
        cancelDelayedShutdown();
        stopCurrent(false, null);
        if (textToSpeech != null) {
            try { textToSpeech.shutdown(); } catch (Exception ignored) { }
            textToSpeech = null;
        }
        if (mediaSession != null) {
            mediaSession.setActive(false);
            mediaSession.release();
            mediaSession = null;
        }
        super.onDestroy();
    }
}

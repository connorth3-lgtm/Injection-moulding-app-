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
import android.os.IBinder;
import android.os.PowerManager;
import android.speech.tts.TextToSpeech;
import android.speech.tts.UtteranceProgressListener;
import android.webkit.WebView;

import org.json.JSONObject;

import java.lang.ref.WeakReference;

public final class AudioPlaybackService extends Service {
    static final String ACTION_SPEAK = "org.mouldmaster.academy.action.SPEAK";
    static final String ACTION_STOP = "org.mouldmaster.academy.action.STOP";
    private static final String CHANNEL_ID = "mouldmaster-book-audio";
    private static final int NOTIFICATION_ID = 4102;

    private static WeakReference<WebView> webViewRef = new WeakReference<>(null);

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
    private String pendingText;
    private float pendingRate = 1f;
    private String pendingId;
    private String activeId;
    private boolean ttsReady;
    private boolean stopping;

    static void attachWebView(WebView webView) {
        if (webView != null) webViewRef = new WeakReference<>(webView);
    }

    static void detachWebView(WebView webView) {
        WebView current = webViewRef.get();
        if (current == webView) webViewRef = new WeakReference<>(null);
    }

    static void startSpeech(Context context, String text, float rate, String requestId) {
        Intent intent = new Intent(context, AudioPlaybackService.class)
                .setAction(ACTION_SPEAK)
                .putExtra("text", text)
                .putExtra("rate", rate)
                .putExtra("requestId", requestId);
        if (Build.VERSION.SDK_INT >= 26) {
            context.startForegroundService(intent);
        } else {
            context.startService(intent);
        }
    }

    static void stopSpeech(Context context) {
        context.startService(new Intent(context, AudioPlaybackService.class).setAction(ACTION_STOP));
    }

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
                            finishCurrent();
                        }
                    }

                    @Override
                    public void onError(String utteranceId, int errorCode) {
                        if (isCurrent(utteranceId)) {
                            emit(utteranceId, "error", "Android text-to-speech failed (" + errorCode + ").");
                            finishCurrent();
                        }
                    }
                });
                speakPending();
            } else {
                emit(pendingId, "error", "Android text-to-speech is unavailable. Install or enable a system voice.");
                stopSelf();
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
        if (!ACTION_SPEAK.equals(action)) return START_NOT_STICKY;

        pendingText = intent.getStringExtra("text");
        pendingRate = Math.max(0.5f, Math.min(2f, intent.getFloatExtra("rate", 1f)));
        pendingId = intent.getStringExtra("requestId");
        startForegroundSafe(buildNotification("Starting Book narration"));
        if (ttsReady) speakPending();
        return START_STICKY;
    }

    private void speakPending() {
        if (!ttsReady || pendingText == null || pendingId == null) return;
        clearCurrentForReplacement();
        activeId = pendingId;
        String text = pendingText;
        pendingText = null;
        pendingId = null;

        acquireAudioFocus();
        acquireWakeLock();
        updateNotification("Book narration is playing");
        textToSpeech.setSpeechRate(pendingRate);
        Bundle params = new Bundle();
        params.putString(TextToSpeech.Engine.KEY_PARAM_UTTERANCE_ID, activeId);
        int result = textToSpeech.speak(text, TextToSpeech.QUEUE_FLUSH, params, activeId);
        if (result == TextToSpeech.ERROR) {
            emit(activeId, "error", "Android text-to-speech rejected the sentence.");
            finishCurrent();
        }
    }

    private boolean isCurrent(String id) {
        return id != null && id.equals(activeId) && !stopping;
    }

    private void clearCurrentForReplacement() {
        stopping = true;
        if (textToSpeech != null) {
            try { textToSpeech.stop(); } catch (Exception ignored) { }
        }
        activeId = null;
        releaseAudioFocus();
        releaseWakeLock();
        updateNotification(null);
        stopping = false;
    }

    private void stopCurrent(boolean notify, String message) {
        String id = activeId != null ? activeId : pendingId;
        stopping = true;
        if (textToSpeech != null) {
            try { textToSpeech.stop(); } catch (Exception ignored) { }
        }
        if (notify && id != null) {
            emit(id, "error", message == null ? "Book narration stopped." : message);
        }
        activeId = null;
        pendingText = null;
        pendingId = null;
        releaseAudioFocus();
        releaseWakeLock();
        updateNotification(null);
        stopForeground(true);
        stopSelf();
        stopping = false;
    }

    private void finishCurrent() {
        releaseAudioFocus();
        releaseWakeLock();
        updateNotification(null);
        activeId = null;
        stopForeground(true);
        stopSelf();
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
            channel.setDescription("Controls for Book narration while the screen is off.");
            channel.setSound(null, null);
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
                .setVisibility(Notification.VISIBILITY_PUBLIC);
        if (mediaSession != null) {
            builder.setStyle(new Notification.MediaStyle()
                    .setMediaSession(mediaSession.getSessionToken()));
        }
        return builder.build();
    }

    private void startForegroundSafe(Notification notification) {
        if (Build.VERSION.SDK_INT >= 29) {
            startForeground(NOTIFICATION_ID, notification, ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK);
        } else {
            startForeground(NOTIFICATION_ID, notification);
        }
    }

    private void updateNotification(String text) {
        NotificationManager manager = (NotificationManager) getSystemService(NOTIFICATION_SERVICE);
        if (text == null) {
            manager.cancel(NOTIFICATION_ID);
        } else {
            manager.notify(NOTIFICATION_ID, buildNotification(text));
        }
    }

    private static void emit(String id, String type, String message) {
        WebView webView = webViewRef.get();
        if (webView == null || id == null) return;
        try {
            String json = "{\\"id\\":" + JSONObject.quote(id)
                    + ",\\"type\\":" + JSONObject.quote(type)
                    + (message == null ? "" : ",\\"message\\":" + JSONObject.quote(message))
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

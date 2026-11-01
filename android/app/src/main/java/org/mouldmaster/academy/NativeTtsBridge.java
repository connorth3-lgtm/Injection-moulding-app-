package org.mouldmaster.academy;

import android.content.Context;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;

import org.json.JSONArray;
import org.json.JSONObject;

import java.util.ArrayList;

public final class NativeTtsBridge {
    private static final int MAX_QUEUE_ITEMS = 5000;
    private final Context context;
    private final WebView webView;

    NativeTtsBridge(Context context, WebView webView) {
        this.context = context.getApplicationContext();
        this.webView = webView;
    }

    @JavascriptInterface
    public boolean isAvailable() {
        return true;
    }

    @JavascriptInterface
    public boolean speak(String text, double rate, String requestId) {
        if (text == null || text.trim().isEmpty() || requestId == null || requestId.trim().isEmpty()) {
            return false;
        }
        AudioPlaybackService.attachWebView(webView);
        AudioPlaybackService.startSpeech(context, text, (float) rate, requestId);
        return true;
    }

    @JavascriptInterface
    public boolean speakQueue(String queueJson, double rate) {
        if (queueJson == null || queueJson.trim().isEmpty()) return false;
        try {
            JSONArray queue = new JSONArray(queueJson);
            if (queue.length() == 0 || queue.length() > MAX_QUEUE_ITEMS) return false;
            ArrayList<AudioPlaybackService.SpeechItem> items = new ArrayList<>(queue.length());
            for (int i = 0; i < queue.length(); i++) {
                JSONObject item = queue.optJSONObject(i);
                if (item == null) return false;
                String id = item.optString("id", "").trim();
                String text = item.optString("text", "").trim();
                if (id.isEmpty() || text.isEmpty()) return false;
                items.add(new AudioPlaybackService.SpeechItem(id, text));
            }
            AudioPlaybackService.attachWebView(webView);
            AudioPlaybackService.startSpeechQueue(context, items, (float) rate);
            return true;
        } catch (Exception ignored) {
            return false;
        }
    }

    @JavascriptInterface
    public void stop() {
        AudioPlaybackService.stopSpeech(context);
    }

    @JavascriptInterface
    public String platform() {
        return "android-native-text-to-speech";
    }
}

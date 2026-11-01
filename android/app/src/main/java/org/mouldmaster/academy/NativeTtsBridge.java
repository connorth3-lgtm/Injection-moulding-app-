package org.mouldmaster.academy;

import android.content.Context;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;

public final class NativeTtsBridge {
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
    public void stop() {
        AudioPlaybackService.stopSpeech(context);
    }

    @JavascriptInterface
    public String platform() {
        return "android-native-text-to-speech";
    }
}

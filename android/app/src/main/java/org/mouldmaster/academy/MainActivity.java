package org.mouldmaster.academy;

import android.Manifest;
import android.app.Activity;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.graphics.Color;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.webkit.ServiceWorkerClient;
import android.webkit.ServiceWorkerController;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import java.io.InputStream;
import java.util.Collections;

public final class MainActivity extends Activity {
    private WebView webView;

    @Override
    protected void onCreate(Bundle state) {
        super.onCreate(state);
        webView = new WebView(this);
        webView.setBackgroundColor(Color.rgb(8, 16, 29));
        setContentView(webView);

        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setMediaPlaybackRequiresUserGesture(true);
        settings.setBuiltInZoomControls(false);
        settings.setDisplayZoomControls(false);
        settings.setSupportZoom(false);
        settings.setUserAgentString(settings.getUserAgentString() + " MouldMasterAndroid/2026.11.01");
        webView.setWebViewClient(new PreviewWebViewClient());
        if (Build.VERSION.SDK_INT >= 24) {
            ServiceWorkerController.getInstance().setServiceWorkerClient(new ServiceWorkerClient() {
                @Override
                public WebResourceResponse shouldInterceptRequest(WebResourceRequest request) {
                    return nativeReadAloud(request.getUrl());
                }
            });
        }

        AudioPlaybackService.attachWebView(webView);
        webView.addJavascriptInterface(new NativeTtsBridge(this, webView), "MouldMasterNativeTts");
        webView.loadUrl(BuildConfig.WEB_URL);

        if (Build.VERSION.SDK_INT >= 33
                && checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
            requestPermissions(new String[]{Manifest.permission.POST_NOTIFICATIONS}, 4101);
        }
    }

    @Override
    public void onBackPressed() {
        if (webView != null && webView.canGoBack()) {
            webView.goBack();
        } else {
            super.onBackPressed();
        }
    }

    @Override
    protected void onDestroy() {
        AudioPlaybackService.detachWebView(webView);
        if (webView != null) {
            webView.removeJavascriptInterface("MouldMasterNativeTts");
            webView.destroy();
            webView = null;
        }
        super.onDestroy();
    }

    private WebResourceResponse nativeReadAloud(Uri uri) {
        if (uri == null || !"https".equalsIgnoreCase(uri.getScheme())
                || !"connorth3-lgtm.github.io".equalsIgnoreCase(uri.getHost())
                || !"read-aloud.js".equals(uri.getLastPathSegment())) {
            return null;
        }
        try {
            InputStream source = getAssets().open("read-aloud.js");
            return new WebResourceResponse(
                    "application/javascript",
                    "UTF-8",
                    200,
                    "OK",
                    Collections.singletonMap("Cache-Control", "no-store"),
                    source);
        } catch (Exception ignored) {
            return null;
        }
    }

    private final class PreviewWebViewClient extends WebViewClient {
        private static final String HOST = "connorth3-lgtm.github.io";

        @Override
        public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
            WebResourceResponse nativeResponse = nativeReadAloud(request.getUrl());
            return nativeResponse != null ? nativeResponse : super.shouldInterceptRequest(view, request);
        }

        @Override
        public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
            Uri uri = request.getUrl();
            if ("https".equalsIgnoreCase(uri.getScheme()) && HOST.equalsIgnoreCase(uri.getHost())) {
                return false;
            }
            if ("http".equalsIgnoreCase(uri.getScheme()) || "https".equalsIgnoreCase(uri.getScheme())) {
                view.getContext().startActivity(new Intent(Intent.ACTION_VIEW, uri));
                return true;
            }
            return true;
        }
    }
}

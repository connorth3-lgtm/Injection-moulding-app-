# MouldMaster does not use reflection-heavy libraries. Keep the native bridge names
# stable because WebView resolves @JavascriptInterface methods by name.
-keepclassmembers class org.mouldmaster.academy.NativeTtsBridge {
    public <methods>;
}

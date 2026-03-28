# myPOS Smart SDK
-keep class com.mypos.smartsdk.** { *; }
-dontwarn com.mypos.smartsdk.**

# WebView JavaScript interface
-keepclassmembers class app.sadaq.android.MyPOSBridge {
    @android.webkit.JavascriptInterface <methods>;
}

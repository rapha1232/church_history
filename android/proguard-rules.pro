# The web page calls the bridge by name
-keepclassmembers class org.hcc.history.Bridge { @android.webkit.JavascriptInterface <methods>; }
-keepattributes JavascriptInterface

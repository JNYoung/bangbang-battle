# Capacitor apps mostly ship minified web assets inside a native WebView.
# Keep bridge and plugin classes reachable while allowing R8 to shrink the rest.
-keep class com.getcapacitor.** { *; }
-keep class com.professionballarena.game.MainActivity { *; }
-keep class org.apache.cordova.** { *; }
-keep class androidx.webkit.** { *; }

-keepattributes *Annotation*, Signature, InnerClasses, EnclosingMethod

-dontwarn com.getcapacitor.**
-dontwarn org.apache.cordova.**

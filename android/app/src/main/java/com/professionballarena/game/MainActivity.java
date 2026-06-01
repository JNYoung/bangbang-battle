package com.professionballarena.game;

import android.graphics.Color;
import android.os.Build;
import android.os.Bundle;
import android.view.View;
import android.view.ViewGroup;
import android.view.Window;
import android.view.WindowManager;

import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    private static final int IMMERSIVE_UI_FLAGS =
        View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
            | View.SYSTEM_UI_FLAG_LAYOUT_STABLE
            | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
            | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
            | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
            | View.SYSTEM_UI_FLAG_FULLSCREEN;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(GameAnalyticsPlugin.class);
        registerPlugin(GameSocialPlugin.class);
        super.onCreate(savedInstanceState);
        configureImmersiveWebViewInsets();
        enableImmersiveMode();
    }

    @Override
    public void onResume() {
        super.onResume();
        configureImmersiveWebViewInsets();
        enableImmersiveMode();
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus) {
            enableImmersiveMode();
        }
    }

    private void enableImmersiveMode() {
        Window window = getWindow();
        View decorView = window.getDecorView();

        WindowCompat.setDecorFitsSystemWindows(window, false);
        window.setStatusBarColor(Color.TRANSPARENT);
        window.setNavigationBarColor(Color.TRANSPARENT);
        decorView.setSystemUiVisibility(IMMERSIVE_UI_FLAGS);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
            WindowManager.LayoutParams attributes = window.getAttributes();
            attributes.layoutInDisplayCutoutMode =
                WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES;
            window.setAttributes(attributes);
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            window.setStatusBarContrastEnforced(false);
            window.setNavigationBarContrastEnforced(false);
        }

        WindowInsetsControllerCompat controller = WindowCompat.getInsetsController(window, decorView);
        controller.setSystemBarsBehavior(
            WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
        );
        controller.hide(WindowInsetsCompat.Type.systemBars());
    }

    private void configureImmersiveWebViewInsets() {
        if (getBridge() == null || getBridge().getWebView() == null) {
            return;
        }

        View webView = getBridge().getWebView();
        View parent = (View) webView.getParent();
        if (parent == null) {
            return;
        }

        parent.setFitsSystemWindows(false);
        parent.setPadding(0, 0, 0, 0);
        webView.setFitsSystemWindows(false);

        if (parent instanceof ViewGroup) {
            ((ViewGroup) parent).setClipToPadding(false);
        }

        ViewCompat.setOnApplyWindowInsetsListener(parent, (view, insets) -> {
            Insets safeInsets = insets.getInsetsIgnoringVisibility(
                WindowInsetsCompat.Type.systemBars() | WindowInsetsCompat.Type.displayCutout()
            );
            Insets imeInsets = insets.getInsets(WindowInsetsCompat.Type.ime());
            int bottomPadding = insets.isVisible(WindowInsetsCompat.Type.ime()) ? imeInsets.bottom : 0;

            injectSafeAreaInsets(webView, safeInsets);
            view.setPadding(0, 0, 0, bottomPadding);
            return new WindowInsetsCompat.Builder(insets)
                .setInsets(
                    WindowInsetsCompat.Type.systemBars() | WindowInsetsCompat.Type.displayCutout(),
                    Insets.of(0, 0, 0, 0)
                )
                .build();
        });
        ViewCompat.requestApplyInsets(parent);
    }

    private void injectSafeAreaInsets(View webView, Insets insets) {
        float density = getResources().getDisplayMetrics().density;
        int top = Math.round(insets.top / density);
        int right = Math.round(insets.right / density);
        int bottom = Math.round(insets.bottom / density);
        int left = Math.round(insets.left / density);
        String script =
            "window.__nativeSafeAreaInsets={top:" + top
                + ",right:" + right
                + ",bottom:" + bottom
                + ",left:" + left
                + "};"
                + "try{"
                + "var s=document.documentElement.style;"
                + "s.setProperty('--safe-top','" + top + "px');"
                + "s.setProperty('--safe-right','" + right + "px');"
                + "s.setProperty('--safe-bottom','" + bottom + "px');"
                + "s.setProperty('--safe-left','" + left + "px');"
                + "}catch(e){}";

        if (webView instanceof android.webkit.WebView) {
            ((android.webkit.WebView) webView).evaluateJavascript(script, null);
        }
    }
}

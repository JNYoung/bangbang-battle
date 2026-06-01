package com.professionballarena.game;

import android.content.Context;
import android.os.Bundle;
import android.util.Log;

import com.facebook.FacebookSdk;
import com.facebook.appevents.AppEventsLogger;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import com.google.firebase.analytics.FirebaseAnalytics;

import java.util.Iterator;

@CapacitorPlugin(name = "GameAnalytics")
public class GameAnalyticsPlugin extends Plugin {
    private static final String TAG = "GameAnalytics";
    private FirebaseAnalytics firebaseAnalytics;
    private AppEventsLogger facebookAppEventsLogger;
    private boolean facebookCollectionEnabled;

    @Override
    public void load() {
        firebaseAnalytics = FirebaseAnalytics.getInstance(getContext());
        setFacebookCollectionEnabled(false);
        Log.d(TAG, "GameAnalyticsPlugin loaded, FirebaseAnalytics instance obtained, "
                + getFirebaseStatusLog() + ", " + getFacebookStatusLog());
    }

    @PluginMethod
    public void logEvent(PluginCall call) {
        String name = call.getString("name");
        if (name == null || name.isEmpty()) {
            call.reject("Analytics event name is required");
            return;
        }

        JSObject params = call.getObject("params", new JSObject());
        Bundle bundle = new Bundle();
        Iterator<String> keys = params.keys();
        while (keys.hasNext()) {
            String key = keys.next();
            putBundleValue(bundle, key, params.opt(key));
        }

        Log.d(TAG, "logEvent: " + name + " params=" + bundle);
        firebaseAnalytics.logEvent(name, bundle);
        boolean facebookSent = logFacebookEvent(name, bundle);

        JSObject result = new JSObject();
        result.put("sent", true);
        result.put("transport", "firebase_native");
        result.put("facebook_app_events_sent", facebookSent);
        call.resolve(result);
    }

    @PluginMethod
    public void setCollectionEnabled(PluginCall call) {
        Boolean enabled = call.getBoolean("enabled");
        boolean effectiveEnabled = enabled == null || enabled;
        Log.d(TAG, "setCollectionEnabled: " + effectiveEnabled + ", " + getFirebaseStatusLog());
        firebaseAnalytics.setAnalyticsCollectionEnabled(effectiveEnabled);
        setFacebookCollectionEnabled(effectiveEnabled);
        JSObject result = new JSObject();
        result.put("enabled", effectiveEnabled);
        putFirebaseStatus(result);
        putFacebookStatus(result);
        call.resolve(result);
    }

    @PluginMethod
    public void getStatus(PluginCall call) {
        JSObject result = new JSObject();
        result.put("available", firebaseAnalytics != null);
        putFirebaseStatus(result);
        putFacebookStatus(result);
        call.resolve(result);
    }

    private void putBundleValue(Bundle bundle, String key, Object value) {
        if (value == null) {
            return;
        }

        if (value instanceof Integer || value instanceof Long) {
            bundle.putLong(key, ((Number) value).longValue());
            return;
        }

        if (value instanceof Float || value instanceof Double) {
            bundle.putDouble(key, ((Number) value).doubleValue());
            return;
        }

        if (value instanceof Boolean) {
            bundle.putLong(key, ((Boolean) value) ? 1L : 0L);
            return;
        }

        bundle.putString(key, String.valueOf(value));
    }

    private boolean logFacebookEvent(String name, Bundle params) {
        if (!facebookCollectionEnabled || !ensureFacebookLogger()) {
            return false;
        }

        try {
            facebookAppEventsLogger.logEvent(name, params);
            return true;
        } catch (RuntimeException error) {
            Log.w(TAG, "Facebook App Event failed: " + name, error);
            return false;
        }
    }

    private void setFacebookCollectionEnabled(boolean enabled) {
        facebookCollectionEnabled = enabled;
        FacebookSdk.setAdvertiserIDCollectionEnabled(false);
        FacebookSdk.setAutoLogAppEventsEnabled(false);
        FacebookSdk.setLimitEventAndDataUsage(getContext().getApplicationContext(), !enabled);

        if (enabled) {
            ensureFacebookLogger();
        }
    }

    private boolean ensureFacebookLogger() {
        if (!isFacebookConfigured()) {
            return false;
        }

        try {
            if (!FacebookSdk.isInitialized()) {
                FacebookSdk.setApplicationId(getStringResource("facebook_app_id"));
                FacebookSdk.setClientToken(getStringResource("facebook_client_token"));
                FacebookSdk.sdkInitialize(getContext().getApplicationContext());
            }
            FacebookSdk.fullyInitialize();

            if (facebookAppEventsLogger == null) {
                facebookAppEventsLogger = AppEventsLogger.newLogger(getContext());
            }
            return true;
        } catch (RuntimeException error) {
            Log.w(TAG, "Facebook App Events initialization failed", error);
            return false;
        }
    }

    private boolean isFacebookConfigured() {
        String appId = getStringResource("facebook_app_id");
        String clientToken = getStringResource("facebook_client_token");
        return appId != null && !appId.isEmpty() && !"0".equals(appId)
                && clientToken != null && !clientToken.isEmpty();
    }

    private String getStringResource(String name) {
        Context context = getContext();
        int resourceId = context.getResources().getIdentifier(name, "string", context.getPackageName());
        if (resourceId == 0) {
            return "";
        }
        return context.getString(resourceId).trim();
    }

    private String getFirebaseStatusLog() {
        FirebaseOptions options = getFirebaseOptions();
        if (options == null) {
            return "firebase_app_id=unavailable, gcm_sender_id=unavailable, project_id=unavailable";
        }

        return "firebase_app_id=" + safeValue(options.getApplicationId())
                + ", gcm_sender_id=" + safeValue(options.getGcmSenderId())
                + ", project_id=" + safeValue(options.getProjectId());
    }

    private void putFirebaseStatus(JSObject result) {
        FirebaseOptions options = getFirebaseOptions();
        if (options == null) {
            result.put("firebase_app_id", "unavailable");
            result.put("gcm_sender_id", "unavailable");
            result.put("project_id", "unavailable");
            return;
        }

        result.put("firebase_app_id", safeValue(options.getApplicationId()));
        result.put("gcm_sender_id", safeValue(options.getGcmSenderId()));
        result.put("project_id", safeValue(options.getProjectId()));
    }

    private String getFacebookStatusLog() {
        return "facebook_app_events_configured=" + isFacebookConfigured()
                + ", facebook_collection_enabled=" + facebookCollectionEnabled
                + ", facebook_sdk_initialized=" + FacebookSdk.isInitialized();
    }

    private void putFacebookStatus(JSObject result) {
        result.put("facebook_app_events_configured", isFacebookConfigured());
        result.put("facebook_collection_enabled", facebookCollectionEnabled);
        result.put("facebook_sdk_initialized", FacebookSdk.isInitialized());
    }

    private FirebaseOptions getFirebaseOptions() {
        try {
            return FirebaseApp.getInstance().getOptions();
        } catch (IllegalStateException error) {
            Log.w(TAG, "FirebaseApp options unavailable", error);
            return null;
        }
    }

    private String safeValue(String value) {
        return value == null || value.isEmpty() ? "unavailable" : value;
    }
}

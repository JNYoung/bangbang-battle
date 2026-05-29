package com.professionballarena.game;

import android.os.Bundle;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import com.google.firebase.analytics.FirebaseAnalytics;

import android.util.Log;

import java.util.Iterator;

@CapacitorPlugin(name = "GameAnalytics")
public class GameAnalyticsPlugin extends Plugin {
    private static final String TAG = "GameAnalytics";
    private FirebaseAnalytics firebaseAnalytics;

    @Override
    public void load() {
        firebaseAnalytics = FirebaseAnalytics.getInstance(getContext());
        Log.d(TAG, "GameAnalyticsPlugin loaded, FirebaseAnalytics instance obtained, " + getFirebaseStatusLog());
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

        JSObject result = new JSObject();
        result.put("sent", true);
        result.put("transport", "firebase_native");
        call.resolve(result);
    }

    @PluginMethod
    public void setCollectionEnabled(PluginCall call) {
        Boolean enabled = call.getBoolean("enabled");
        boolean effectiveEnabled = enabled == null || enabled;
        Log.d(TAG, "setCollectionEnabled: " + effectiveEnabled + ", " + getFirebaseStatusLog());
        firebaseAnalytics.setAnalyticsCollectionEnabled(effectiveEnabled);
        JSObject result = new JSObject();
        result.put("enabled", effectiveEnabled);
        putFirebaseStatus(result);
        call.resolve(result);
    }

    @PluginMethod
    public void getStatus(PluginCall call) {
        JSObject result = new JSObject();
        result.put("available", firebaseAnalytics != null);
        putFirebaseStatus(result);
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

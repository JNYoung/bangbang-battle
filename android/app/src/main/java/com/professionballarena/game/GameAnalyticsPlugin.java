package com.professionballarena.game;

import android.os.Bundle;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.google.firebase.analytics.FirebaseAnalytics;

import java.util.Iterator;

@CapacitorPlugin(name = "GameAnalytics")
public class GameAnalyticsPlugin extends Plugin {
    private FirebaseAnalytics firebaseAnalytics;

    @Override
    public void load() {
        firebaseAnalytics = FirebaseAnalytics.getInstance(getContext());
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

        firebaseAnalytics.logEvent(name, bundle);

        JSObject result = new JSObject();
        result.put("sent", true);
        result.put("transport", "firebase_native");
        call.resolve(result);
    }

    @PluginMethod
    public void setCollectionEnabled(PluginCall call) {
        Boolean enabled = call.getBoolean("enabled");
        firebaseAnalytics.setAnalyticsCollectionEnabled(enabled == null || enabled);
        JSObject result = new JSObject();
        result.put("enabled", enabled == null || enabled);
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
}

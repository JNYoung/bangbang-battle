package com.professionballarena.game;

import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.net.Uri;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.google.android.gms.tasks.Task;
import com.google.android.play.core.review.ReviewInfo;
import com.google.android.play.core.review.ReviewManager;
import com.google.android.play.core.review.ReviewManagerFactory;

@CapacitorPlugin(name = "GameReview")
public class GameReviewPlugin extends Plugin {
    private static final String TRANSPORT_REVIEW = "google_play_review_api";
    private static final String TRANSPORT_STORE = "android_store_intent";

    @PluginMethod
    public void requestReview(PluginCall call) {
        Activity activity = getActivity();
        if (activity == null) {
            call.resolve(createReviewResult(false, "activity_unavailable"));
            return;
        }

        ReviewManager reviewManager = ReviewManagerFactory.create(getContext());
        Task<ReviewInfo> request = reviewManager.requestReviewFlow();
        request.addOnCompleteListener(task -> {
            if (!task.isSuccessful()) {
                JSObject result = createReviewResult(false, "request_review_flow_failed");
                Exception error = task.getException();
                if (error != null) {
                    result.put("error", error.getMessage());
                }
                call.resolve(result);
                return;
            }

            Task<Void> flow = reviewManager.launchReviewFlow(activity, task.getResult());
            flow.addOnCompleteListener(flowTask -> {
                JSObject result = createReviewResult(true, "completed_or_quota_not_shown");
                if (!flowTask.isSuccessful() && flowTask.getException() != null) {
                    result.put("error", flowTask.getException().getMessage());
                }
                call.resolve(result);
            });
        });
    }

    @PluginMethod
    public void openStoreListing(PluginCall call) {
        String packageName = call.getString("google_play_package", getContext().getPackageName());
        String marketUrl = "market://details?id=" + packageName;
        String webUrl = "https://play.google.com/store/apps/details?id=" + packageName;

        if (openStoreUrl(marketUrl)) {
            call.resolve(createStoreResult(true, marketUrl));
            return;
        }

        if (openStoreUrl(webUrl)) {
            call.resolve(createStoreResult(true, webUrl));
            return;
        }

        JSObject result = createStoreResult(false, webUrl);
        result.put("reason", "store_activity_unavailable");
        call.resolve(result);
    }

    @PluginMethod
    public void getStatus(PluginCall call) {
        JSObject result = new JSObject();
        result.put("available", true);
        result.put("platform", "android");
        result.put("transport", TRANSPORT_REVIEW);
        result.put("google_play_package", getContext().getPackageName());
        call.resolve(result);
    }

    private boolean openStoreUrl(String url) {
        try {
            Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getActivity().startActivity(intent);
            return true;
        } catch (ActivityNotFoundException error) {
            return false;
        }
    }

    private JSObject createReviewResult(boolean requested, String reason) {
        JSObject result = new JSObject();
        result.put("requested", requested);
        result.put("shownMaybe", requested);
        result.put("transport", TRANSPORT_REVIEW);
        result.put("reason", reason);
        return result;
    }

    private JSObject createStoreResult(boolean opened, String url) {
        JSObject result = new JSObject();
        result.put("opened", opened);
        result.put("transport", TRANSPORT_STORE);
        result.put("url", url);
        return result;
    }
}

package com.professionballarena.game;

import android.app.Activity;
import android.content.ContentResolver;
import android.content.ContentValues;
import android.content.ClipData;
import android.content.ComponentName;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.content.ActivityNotFoundException;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.content.pm.ResolveInfo;
import android.media.MediaScannerConnection;
import android.net.Uri;
import android.os.Build;
import android.os.Environment;
import android.provider.MediaStore;
import android.util.Base64;
import android.util.Log;

import androidx.core.content.FileProvider;

import com.facebook.FacebookSdk;
import com.facebook.share.model.SharePhoto;
import com.facebook.share.model.SharePhotoContent;
import com.facebook.share.widget.ShareDialog;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.tiktok.open.sdk.share.Format;
import com.tiktok.open.sdk.share.MediaType;
import com.tiktok.open.sdk.share.ShareApi;
import com.tiktok.open.sdk.share.ShareRequest;
import com.tiktok.open.sdk.share.constants.ShareErrorCodes;
import com.tiktok.open.sdk.share.model.LaunchResult;
import com.tiktok.open.sdk.share.model.MediaContent;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.OutputStream;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Locale;

@CapacitorPlugin(name = "GameSocial")
public class GameSocialPlugin extends Plugin {
    private static final String TAG = "GameSocial";
    private static final String TARGET_FACEBOOK = "facebook";
    private static final String TARGET_TIKTOK = "tiktok";
    private static final String TARGET_SYSTEM = "system";
    private static final String FACEBOOK_PACKAGE = "com.facebook.katana";
    private static final String TIKTOK_M_PACKAGE = "com.zhiliaoapp.musically";
    private static final String TIKTOK_T_PACKAGE = "com.ss.android.ugc.trill";
    private static final List<String> TIKTOK_PACKAGES = Arrays.asList(TIKTOK_M_PACKAGE, TIKTOK_T_PACKAGE);

    @PluginMethod
    public void shareImage(PluginCall call) {
        String base64Data = call.getString("base64Data");
        if (base64Data == null || base64Data.trim().isEmpty()) {
            call.reject("base64Data is required");
            return;
        }

        try {
            String target = normalizeTarget(call.getString("target", TARGET_SYSTEM));
            String fileName = sanitizeFileName(call.getString("fileName", "battle-report.png"), "battle-report.png", ".png");
            String contentType = call.getString("contentType", "image/png");
            File imageFile = writeSharedMedia(base64Data, fileName);
            Uri contentUri = FileProvider.getUriForFile(
                    getContext(),
                    getContext().getPackageName() + ".fileprovider",
                    imageFile
            );

            if (TARGET_FACEBOOK.equals(target) && launchFacebookShareIntent(call, contentUri, contentType)) {
                resolveShared(call, target, "facebook_direct_intent", contentUri);
                return;
            }

            if (TARGET_FACEBOOK.equals(target) && shareToFacebookSdk(imageFile, contentUri)) {
                resolveShared(call, target, "facebook_share_sdk_fallback", contentUri);
                return;
            }

            if (TARGET_TIKTOK.equals(target) && shareToTikTokShareKit(contentUri, MediaType.IMAGE)) {
                resolveShared(call, target, "tiktok_share_kit", contentUri);
                return;
            }

            launchShareIntent(call, contentUri, contentType, target);
        } catch (Exception error) {
            call.reject("Image sharing failed: " + error.getMessage(), error);
        }
    }

    @PluginMethod
    public void shareVideo(PluginCall call) {
        String base64Data = call.getString("base64Data");
        if (base64Data == null || base64Data.trim().isEmpty()) {
            call.reject("base64Data is required");
            return;
        }

        try {
            String target = normalizeTarget(call.getString("target", TARGET_SYSTEM));
            String contentType = call.getString("contentType", "video/webm");
            String fileName = sanitizeFileName(call.getString("fileName", "match-short.webm"), "match-short.webm", getDefaultVideoExtension(contentType));
            File videoFile = writeSharedMedia(base64Data, fileName);
            Uri contentUri = FileProvider.getUriForFile(
                    getContext(),
                    getContext().getPackageName() + ".fileprovider",
                    videoFile
            );

            if (TARGET_TIKTOK.equals(target) && shareToTikTokShareKit(contentUri, MediaType.VIDEO)) {
                resolveShared(call, target, "tiktok_share_kit", contentUri);
                return;
            }

            launchShareIntent(call, contentUri, contentType, target);
        } catch (Exception error) {
            call.reject("Video sharing failed: " + error.getMessage(), error);
        }
    }

    @PluginMethod
    public void saveVideo(PluginCall call) {
        String base64Data = call.getString("base64Data");
        if (base64Data == null || base64Data.trim().isEmpty()) {
            call.reject("base64Data is required");
            return;
        }

        try {
            String contentType = call.getString("contentType", "video/webm");
            String fileName = sanitizeFileName(call.getString("fileName", "match-short.webm"), "match-short.webm", getDefaultVideoExtension(contentType));
            Uri uri = saveVideoToGallery(decodeBase64Payload(base64Data), fileName, contentType);
            JSObject result = new JSObject();
            result.put("saved", true);
            result.put("transport", "android_mediastore");
            result.put("uri", uri.toString());
            call.resolve(result);
        } catch (Exception error) {
            call.reject("Video save failed: " + error.getMessage(), error);
        }
    }

    @PluginMethod
    public void getLaunchDeepLink(PluginCall call) {
        JSObject result = createDeepLinkResult(getActivity() != null ? getActivity().getIntent() : null);
        if (result == null) {
            result = new JSObject();
            result.put("url", "");
            result.put("source", "none");
            result.put("native", true);
        }
        call.resolve(result);
    }

    @Override
    protected void handleOnNewIntent(Intent intent) {
        JSObject result = createDeepLinkResult(intent);
        if (result != null) {
            notifyListeners("deepLinkOpen", result, true);
        }
    }

    private boolean launchFacebookShareIntent(PluginCall call, Uri contentUri, String contentType) {
        if (!isPackageInstalled(FACEBOOK_PACKAGE)) {
            Log.w(TAG, "Facebook share skipped: Facebook app is not installed");
            return false;
        }

        Intent shareIntent = createImageShareIntent(call, contentUri, contentType);
        shareIntent.setPackage(FACEBOOK_PACKAGE);
        ResolveInfo shareActivity = findFacebookShareActivity(shareIntent);
        if (shareActivity == null || shareActivity.activityInfo == null) {
            Log.w(TAG, "Facebook share skipped: no Facebook activity can handle ACTION_SEND");
            return false;
        }

        shareIntent.setComponent(new ComponentName(shareActivity.activityInfo.packageName, shareActivity.activityInfo.name));
        try {
            grantReadPermission(FACEBOOK_PACKAGE, contentUri);
            getActivity().startActivity(shareIntent);
            Log.d(TAG, "Facebook share launched via direct ACTION_SEND intent: " + shareActivity.activityInfo.name);
            return true;
        } catch (ActivityNotFoundException error) {
            Log.w(TAG, "Facebook direct share activity not found", error);
            return false;
        }
    }

    private ResolveInfo findFacebookShareActivity(Intent shareIntent) {
        List<ResolveInfo> candidates = getContext()
                .getPackageManager()
                .queryIntentActivities(shareIntent, PackageManager.MATCH_DEFAULT_ONLY);
        ResolveInfo fallback = null;

        for (ResolveInfo candidate : candidates) {
            if (candidate.activityInfo == null || !FACEBOOK_PACKAGE.equals(candidate.activityInfo.packageName)) {
                continue;
            }

            String activityName = candidate.activityInfo.name;
            if (activityName == null) {
                continue;
            }

            if (activityName.contains("ImplicitShareIntentHandlerDefaultAlias")
                    || activityName.contains("ShareIntentHandlerDefault")) {
                return candidate;
            }

            if (fallback == null
                    && !activityName.contains("ShareToGroups")
                    && !activityName.contains("Inspiration")
                    && !activityName.contains("Camera")) {
                fallback = candidate;
            }
        }

        return fallback;
    }

    private boolean shareToFacebookSdk(File imageFile, Uri contentUri) {
        if (!isFacebookConfigured() || !isPackageInstalled(FACEBOOK_PACKAGE)) {
            Log.w(TAG, "Facebook SDK share skipped: Facebook config or app missing");
            return false;
        }

        ensureFacebookInitialized();
        if (!ShareDialog.canShow(SharePhotoContent.class)) {
            Log.w(TAG, "Facebook SDK share skipped: ShareDialog cannot show SharePhotoContent");
            return false;
        }

        grantReadPermission(FACEBOOK_PACKAGE, contentUri);
        Bitmap bitmap = BitmapFactory.decodeFile(imageFile.getAbsolutePath());
        if (bitmap == null) {
            return false;
        }

        SharePhoto photo = new SharePhoto.Builder()
                .setBitmap(bitmap)
                .setUserGenerated(true)
                .build();
        SharePhotoContent content = new SharePhotoContent.Builder()
                .addPhoto(photo)
                .build();
        Log.d(TAG, "Facebook SDK share launching ShareDialog");
        new ShareDialog(getActivity()).show(content, ShareDialog.Mode.NATIVE);
        return true;
    }

    private boolean shareToTikTokShareKit(Uri contentUri, MediaType mediaType) {
        String clientKey = getStringResource("tiktok_client_key");
        if (clientKey == null || clientKey.isEmpty() || !isAnyPackageInstalled(TIKTOK_PACKAGES)) {
            return false;
        }

        for (String packageName : TIKTOK_PACKAGES) {
            grantReadPermission(packageName, contentUri);
        }

        ArrayList<String> mediaPaths = new ArrayList<>();
        mediaPaths.add(contentUri.toString());
        MediaContent mediaContent = new MediaContent(mediaType, mediaPaths);
        ShareRequest request = new ShareRequest(
                clientKey,
                mediaContent,
                Format.DEFAULT,
                getContext().getPackageName(),
                MainActivity.class.getName()
        );
        LaunchResult launchResult = new ShareApi(getActivity()).share(request);
        return launchResult.getResult() == ShareErrorCodes.SUCCESS;
    }

    private void launchShareIntent(PluginCall call, Uri contentUri, String contentType, String target) {
        Intent shareIntent = createMediaShareIntent(call, contentUri, contentType);

        String directPackage = getDirectPackageForTarget(target);
        if (directPackage != null) {
            grantReadPermission(directPackage, contentUri);
            shareIntent.setPackage(directPackage);
        } else {
            grantReadPermission(FACEBOOK_PACKAGE, contentUri);
            for (String packageName : TIKTOK_PACKAGES) {
                grantReadPermission(packageName, contentUri);
            }
        }

        try {
            Activity activity = getActivity();
            if (directPackage != null) {
                activity.startActivity(shareIntent);
                resolveShared(call, target, "android_direct_intent", contentUri);
                return;
            }

            activity.startActivity(Intent.createChooser(shareIntent, call.getString("title", "")));
            resolveShared(call, target, "android_sharesheet", contentUri);
        } catch (ActivityNotFoundException error) {
            if (directPackage == null) {
                throw error;
            }

            shareIntent.setPackage(null);
            getActivity().startActivity(Intent.createChooser(shareIntent, call.getString("title", "")));
            resolveShared(call, TARGET_SYSTEM, "android_sharesheet_fallback", contentUri);
        }
    }

    private Intent createImageShareIntent(PluginCall call, Uri contentUri, String contentType) {
        return createMediaShareIntent(call, contentUri, contentType);
    }

    private Intent createMediaShareIntent(PluginCall call, Uri contentUri, String contentType) {
        Intent shareIntent = new Intent(Intent.ACTION_SEND);
        shareIntent.setType(contentType == null || contentType.isEmpty() ? "image/png" : contentType);
        shareIntent.putExtra(Intent.EXTRA_STREAM, contentUri);
        shareIntent.putExtra(Intent.EXTRA_SUBJECT, call.getString("title", ""));
        shareIntent.putExtra(Intent.EXTRA_TITLE, call.getString("title", ""));
        shareIntent.putExtra(Intent.EXTRA_TEXT, buildShareText(call));
        shareIntent.setClipData(ClipData.newUri(getContext().getContentResolver(), call.getString("title", ""), contentUri));
        shareIntent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
        return shareIntent;
    }

    private JSObject createDeepLinkResult(Intent intent) {
        Uri data = intent != null ? intent.getData() : null;
        if (data == null) {
            return null;
        }

        JSObject result = new JSObject();
        result.put("url", data.toString());
        result.put("source", "android_intent");
        result.put("native", true);
        return result;
    }

    private String buildShareText(PluginCall call) {
        String text = call.getString("text", "");
        String deepLinkUrl = call.getString("deepLinkUrl", "");
        if (deepLinkUrl == null || deepLinkUrl.isEmpty() || (text != null && text.contains(deepLinkUrl))) {
            return text;
        }
        return (text == null || text.isEmpty()) ? deepLinkUrl : text + "\n" + deepLinkUrl;
    }

    private File writeSharedMedia(String base64Data, String fileName) throws IOException {
        byte[] mediaBytes = decodeBase64Payload(base64Data);
        File shareDirectory = new File(getContext().getCacheDir(), "social-share");
        if (!shareDirectory.exists() && !shareDirectory.mkdirs()) {
            throw new IOException("Could not create share cache directory");
        }

        File mediaFile = new File(shareDirectory, fileName);
        try (FileOutputStream outputStream = new FileOutputStream(mediaFile)) {
            outputStream.write(mediaBytes);
        }
        return mediaFile;
    }

    private byte[] decodeBase64Payload(String base64Data) {
        String normalizedData = base64Data == null ? "" : base64Data;
        int commaIndex = normalizedData.indexOf(',');
        if (commaIndex >= 0) {
            normalizedData = normalizedData.substring(commaIndex + 1);
        }
        return Base64.decode(normalizedData, Base64.DEFAULT);
    }

    private Uri saveVideoToGallery(byte[] videoBytes, String fileName, String contentType) throws IOException {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            ContentResolver resolver = getContext().getContentResolver();
            ContentValues values = new ContentValues();
            values.put(MediaStore.Video.Media.DISPLAY_NAME, fileName);
            values.put(MediaStore.Video.Media.MIME_TYPE, contentType);
            values.put(MediaStore.Video.Media.RELATIVE_PATH, Environment.DIRECTORY_MOVIES + "/Profession Ball Arena");
            values.put(MediaStore.Video.Media.IS_PENDING, 1);
            Uri collection = MediaStore.Video.Media.getContentUri(MediaStore.VOLUME_EXTERNAL_PRIMARY);
            Uri itemUri = resolver.insert(collection, values);
            if (itemUri == null) {
                throw new IOException("Could not create MediaStore video item");
            }

            try (OutputStream outputStream = resolver.openOutputStream(itemUri)) {
                if (outputStream == null) {
                    throw new IOException("Could not open MediaStore output stream");
                }
                outputStream.write(videoBytes);
            }

            values.clear();
            values.put(MediaStore.Video.Media.IS_PENDING, 0);
            resolver.update(itemUri, values, null, null);
            return itemUri;
        }

        File moviesDirectory = new File(Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_MOVIES), "Profession Ball Arena");
        if (!moviesDirectory.exists() && !moviesDirectory.mkdirs()) {
            throw new IOException("Could not create Movies directory");
        }

        File videoFile = new File(moviesDirectory, fileName);
        try (FileOutputStream outputStream = new FileOutputStream(videoFile)) {
            outputStream.write(videoBytes);
        }
        MediaScannerConnection.scanFile(
                getContext(),
                new String[] { videoFile.getAbsolutePath() },
                new String[] { contentType },
                null
        );
        return Uri.fromFile(videoFile);
    }

    private String normalizeTarget(String target) {
        String normalizedTarget = target == null ? TARGET_SYSTEM : target.toLowerCase(Locale.ROOT);
        if (TARGET_FACEBOOK.equals(normalizedTarget) || TARGET_TIKTOK.equals(normalizedTarget)) {
            return normalizedTarget;
        }
        return TARGET_SYSTEM;
    }

    private String sanitizeFileName(String fileName, String fallbackFileName, String defaultExtension) {
        String sanitized = fileName == null ? "" : fileName.replaceAll("[^a-zA-Z0-9._-]", "-");
        if (sanitized.isEmpty()) {
            return fallbackFileName;
        }
        return sanitized.contains(".") ? sanitized : sanitized + defaultExtension;
    }

    private String getDefaultVideoExtension(String contentType) {
        return contentType != null && contentType.toLowerCase(Locale.ROOT).contains("mp4") ? ".mp4" : ".webm";
    }

    private String getDirectPackageForTarget(String target) {
        if (TARGET_FACEBOOK.equals(target) && isPackageInstalled(FACEBOOK_PACKAGE)) {
            return FACEBOOK_PACKAGE;
        }

        if (TARGET_TIKTOK.equals(target)) {
            for (String packageName : TIKTOK_PACKAGES) {
                if (isPackageInstalled(packageName)) {
                    return packageName;
                }
            }
        }

        return null;
    }

    private boolean isFacebookConfigured() {
        String appId = getStringResource("facebook_app_id");
        String clientToken = getStringResource("facebook_client_token");
        return appId != null && !appId.isEmpty() && !"0".equals(appId)
                && clientToken != null && !clientToken.isEmpty();
    }

    private void ensureFacebookInitialized() {
        if (!FacebookSdk.isInitialized()) {
            FacebookSdk.setApplicationId(getStringResource("facebook_app_id"));
            FacebookSdk.setClientToken(getStringResource("facebook_client_token"));
            FacebookSdk.sdkInitialize(getContext().getApplicationContext());
        }
        FacebookSdk.fullyInitialize();
    }

    private String getStringResource(String name) {
        Context context = getContext();
        int resourceId = context.getResources().getIdentifier(name, "string", context.getPackageName());
        if (resourceId == 0) {
            return "";
        }
        return context.getString(resourceId).trim();
    }

    private boolean isAnyPackageInstalled(List<String> packageNames) {
        for (String packageName : packageNames) {
            if (isPackageInstalled(packageName)) {
                return true;
            }
        }
        return false;
    }

    private boolean isPackageInstalled(String packageName) {
        try {
            getContext().getPackageManager().getPackageInfo(packageName, 0);
            return true;
        } catch (PackageManager.NameNotFoundException error) {
            return false;
        }
    }

    private void grantReadPermission(String packageName, Uri contentUri) {
        getContext().grantUriPermission(packageName, contentUri, Intent.FLAG_GRANT_READ_URI_PERMISSION);
    }

    private void resolveShared(PluginCall call, String target, String transport, Uri contentUri) {
        JSObject result = new JSObject();
        result.put("shared", true);
        result.put("target", target);
        result.put("transport", transport);
        result.put("uri", contentUri.toString());
        call.resolve(result);
    }
}

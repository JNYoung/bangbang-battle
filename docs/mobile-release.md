# Mobile Release Packaging

## Android

Current local release artifacts:

- `android/app/build/outputs/apk/release/app-release.apk`
- `android/app/build/outputs/bundle/release/app-release.aab`

Generate a local release keystore before building signed release artifacts:

```sh
npm run android:prepare-signing
npm run android:gp:bundle
```

Use `npm run android:gp:bundle` for Google Play upload because new Play apps use Android App Bundles. Use `npm run android:release` only when a signed release APK is needed for side-loading or local QA.

Capacitor Android currently compiles with Java 21. This local project uses Android Studio's bundled JBR as the Android build JDK; if the terminal defaults to an older JDK, export the Android Studio environment before running Gradle:

```sh
export JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home"
export ANDROID_HOME="$HOME/Library/Android/sdk"
export ANDROID_SDK_ROOT="$ANDROID_HOME"
export PATH="$ANDROID_HOME/platform-tools:$ANDROID_HOME/emulator:$PATH"
```

The currently observed plain terminal default is Java 17, which fails with `invalid source release: 21`; the Android Studio JBR path above satisfies the Java 21 requirement.

The keystore is written to `android/keystores/bangbang-release.jks`, and its passwords are written to `android/keystore.properties`. Both paths are ignored by Git. Back them up securely; losing the release keystore means future updates cannot be signed with the same key.

Release builds enable R8 minification and resource shrinking. The project-specific ProGuard rules keep Capacitor bridge and WebView plugin classes while allowing the rest of the native shell to shrink.

Run the GA release smoke test before checking the next-day Google Analytics report:

```sh
npm run android:ga:smoke
```

This test rebuilds the release APK, installs it on the emulator, disables Firebase debug mode, clears stale Google Play services analytics queues on the emulator, starts a match, and fails if logcat shows an old Firebase app id, debug `_dbg` events, upload failures, or no successful Firebase upload. Use `npm run android:ga:smoke -- --skip-build` only after the APK is already current.

For GitHub Actions production signing, add these repository secrets:

- `ANDROID_KEYSTORE_BASE64`: base64-encoded keystore file
- `ANDROID_KEYSTORE_PASSWORD`
- `ANDROID_KEY_ALIAS`
- `ANDROID_KEY_PASSWORD`

If those secrets are missing, CI generates a temporary signing key so the APK artifact can still be produced for testing.

## iOS

The workflow produces an unsigned IPA artifact from a Release archive so packaging can be checked without exposing Apple signing credentials. That IPA is useful as a build artifact, but it is not suitable for App Store, TestFlight, or device installation.

This workspace does not currently contain a signed `.ipa` release package.

Use `docs/ios-first-release.md` for the first Apple Developer account, App Store Connect, signing, TestFlight, and App Store submission checklist.

For a signed export, copy `ios/exportOptions.plist.example` to `ios/exportOptions.plist`, update the export method/team settings in Xcode, and run an archive/export on a machine with a valid Apple Developer certificate and provisioning profile.

This local workspace has full Xcode installed at `/Applications/Xcode.app`, but the active terminal developer directory may still point at Command Line Tools. Use `DEVELOPER_DIR=/Applications/Xcode.app/Contents/Developer` for local commands or switch with `sudo xcode-select -s /Applications/Xcode.app/Contents/Developer`.

As of 2026-06-18, no code-signing identities or provisioning profiles are installed locally, and Xcode archive/build fails with `iOS 26.4 Platform Not Installed` until the matching iOS platform/runtime is installed from Xcode > Settings > Components. A signed IPA needs full Xcode, a paid Apple Developer Program team, and valid Apple signing assets.

## CI Artifacts

The `Mobile Build` workflow runs on pushes to `main` and `codex/**`, pull requests, and manual dispatch. It uploads:

- `profession-ball-arena-release-apk`
- `profession-ball-arena-unsigned-ipa`

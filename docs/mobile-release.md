# Mobile Release Packaging

## Android

Current local release artifacts:

- `android/app/build/outputs/apk/release/app-release.apk`
- `android/app/build/outputs/bundle/release/app-release.aab`

Generate a local release keystore before building a signed release APK:

```sh
npm run android:prepare-signing
npm run android:release
```

Capacitor Android currently compiles with Java 21. If your terminal defaults to an older JDK, point `JAVA_HOME` at Android Studio's bundled JBR 21 before running the release build.

The keystore is written to `android/keystores/bangbang-release.jks`, and its passwords are written to `android/keystore.properties`. Both paths are ignored by Git. Back them up securely; losing the release keystore means future updates cannot be signed with the same key.

Release builds enable R8 minification and resource shrinking. The project-specific ProGuard rules keep Capacitor bridge and WebView plugin classes while allowing the rest of the native shell to shrink.

For GitHub Actions production signing, add these repository secrets:

- `ANDROID_KEYSTORE_BASE64`: base64-encoded keystore file
- `ANDROID_KEYSTORE_PASSWORD`
- `ANDROID_KEY_ALIAS`
- `ANDROID_KEY_PASSWORD`

If those secrets are missing, CI generates a temporary signing key so the APK artifact can still be produced for testing.

## iOS

The workflow produces an unsigned IPA artifact from a Release archive so packaging can be checked without exposing Apple signing credentials. That IPA is useful as a build artifact, but it is not suitable for App Store, TestFlight, or device installation.

This workspace does not currently contain a signed `.ipa` release package.

For a signed export, copy `ios/exportOptions.plist.example` to `ios/exportOptions.plist`, update the export method/team settings in Xcode, and run an archive/export on a machine with a valid Apple Developer certificate and provisioning profile.

This local workspace currently only has Command Line Tools selected, not full Xcode, and no code-signing identities are installed. A signed IPA needs full Xcode plus Apple signing assets.

## CI Artifacts

The `Mobile Build` workflow runs on pushes to `main` and `codex/**`, pull requests, and manual dispatch. It uploads:

- `profession-ball-arena-release-apk`
- `profession-ball-arena-unsigned-ipa`

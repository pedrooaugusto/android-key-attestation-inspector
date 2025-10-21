# Android Key Attestation Inspector

A small web tool to inspect Android Key Attestation certificate chains in the browser.

**Check it out here:** https://pedrooaugusto.github.io/android-key-attestation-inspector

Why
- I built this to use in another project. It was heavily vibe-coded, so there might be bugs.

What it does
- Checks whether the root certificate is signed by Google (compares against known Google roots).
- Detects whether an Android Key Attestation record/extension is present in the chain.

What it is not
- Not a full validator. For comprehensive validation rules and guidance, see Google’s official documentation:
  https://developer.android.com/privacy-and-security/security-key-attestation

How to use
- Upload a PEM file containing the attestation certificate chain (or load one via URL if supported in the UI).
- The app parses the chain and shows a quick summary of the checks above.

Notes
- Everything runs client-side in your browser.


export function InfoBox() {
    return (
        <section
            className="info-box"
            aria-label="Tool information and limitations"
        >
            <div className="wrapper">
                <h2>About This Tool</h2>
                <p>
                    This tool checks two things: whether an Android Key
                    Attestation is present in the certificate chain, and whether
                    the chain’s root certificate matches a known Google
                    attestation root. It does not validate overall certificate
                    validity (e.g., expiry) or revocation status.
                </p>
                <p>
                    For full validation (including verification logic,
                    revocation, and policy checks), see the official Android
                    verifier:{" "}
                    <a
                        href="https://github.com/android/keyattestation?tab=readme-ov-file#android-key-attestation-verifier"
                        target="_blank"
                        rel="noreferrer"
                    >
                        Android Key Attestation Verifier
                    </a>
                    .
                </p>
                <p>
                    The list of Google attestation root certificates is sourced
                    from:{" "}
                    <a
                        href="https://developer.android.com/privacy-and-security/security-key-attestation#root_certificate"
                        target="_blank"
                        rel="noreferrer"
                    >
                        Android developers – Root Certificate
                    </a>
                    .
                </p>
            </div>
        </section>
    );
}

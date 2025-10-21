import type { ParsedCert } from "../types";
import { formatDn } from "../parser";

type Props = {
  cert: ParsedCert;
  issuerColorIndex?: number;
  subjectColorIndex?: number;
  googleRootSpkis?: Set<string> | null;
};

export function CertCard({ cert: c, issuerColorIndex, subjectColorIndex, googleRootSpkis }: Props) {
  const showGoogle = Boolean(googleRootSpkis && c.publicKeyInfo?.spkiSha256 && googleRootSpkis.has(c.publicKeyInfo.spkiSha256));
  return (
    <details className="cert-item" open={c.index === 0}>
      <summary>
        {(showGoogle || c.hasAndroidKeyAttestation) && (
          <div className="markers" aria-hidden>
            {showGoogle && (
              <img
                className="marker marker-google"
                src="https://www.gstatic.com/marketing-cms/assets/images/d5/dc/cfe9ce8b4425b410b49b7f2dd3f3/g.webp=s96-fcrop64=1,00000000ffffffff-rw"
                alt="Google Root"
                title="Google-issued root"
              />
            )}
            {c.hasAndroidKeyAttestation && (
              <img
                className="marker marker-android"
                src="https://www.gstatic.com/marketing-cms/assets/images/e4/09/c1fe2731462599695f4bf3680173/andriod.webp=s96-fcrop64=1,00000000ffffffff-rw"
                alt="Android Key Attestation"
                title="Android Key Attestation"
              />
            )}
          </div>
        )}
        <span className="badge">#{c.index + 1}</span>
        <span className={"subject" + (subjectColorIndex != null ? ` issuer-color-${subjectColorIndex}` : "")}>
          {formatDn(c.subject)}
        </span>
        <span className="issuer">
          issuer: {" "}
          <span className={issuerColorIndex != null ? `issuer-color-${issuerColorIndex}` : ""}><b>{formatDn(c.issuer)}</b></span>
        </span>
      </summary>

      <div className="grid">
        <div>
          <div className="label">Validity</div>
          <div className="mono small">
            <b>notBefore:</b> {c.notBefore}
            <br />
            <b>notAfter:</b> {c.notAfter}
          </div>
        </div>
        <div>
          <div className="label">Public Key</div>
          <div className="mono small">
            <b>Algorithm:</b> {c.publicKeyInfo?.algorithm || "Unknown"}
          </div>
          {c.publicKeyInfo?.x && (
            <div className="mono small" style={{ wordBreak: "break-word" }}>
              <b>X Cord:</b> {c.publicKeyInfo.x}
            </div>
          )}
          {c.publicKeyInfo?.y && (
            <div className="mono small" style={{ wordBreak: "break-word" }}>
              <b>Y Cord:</b> {c.publicKeyInfo.y}
            </div>
          )}
          <div className="mono small" style={{ wordBreak: "break-word" }}>
            <b>spki sha256:</b> {c.publicKeyInfo?.spkiSha256}
          </div>
        </div>
        <div>
          <div className="label">Android Key Attestation</div>
          {!c.hasAndroidKeyAttestation && <div>Not present</div>}
          {c.hasAndroidKeyAttestation && (
            <div className="mono small">
              {c.attestation ? (
                <>
                  <b>version:</b> {c.attestation.attestationVersion ?? "?"}
                  <br />
                  <b>attestationSecurityLevel:</b> {c.attestation.attestationSecurityLevel ?? "?"}
                  <br />
                  <b>keymasterVersion:</b> {c.attestation.keymasterVersion ?? "?"}
                  <br />
                  <b>keymasterSecurityLevel:</b> {c.attestation.keymasterSecurityLevel ?? "?"}
                  <br />
                  <b>challenge:</b> {c.attestation.challengeBase64?.slice(0, 64)}
                  {c.attestation.challengeBase64 && c.attestation.challengeBase64.length > 64 ? " …" : ""}
                  <br />
                  <b>uniqueId:</b> {c.attestation.uniqueIdBase64}
                </>
              ) : (
                <div>Present but could not decode.</div>
              )}
            </div>
          )}
        </div>
      </div>
    </details>
  );
}


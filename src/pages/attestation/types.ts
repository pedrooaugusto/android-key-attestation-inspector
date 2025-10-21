export type PublicKeyInfo = {
  algorithm?: string;
  spkiSha256?: string;
  x?: string;
  y?: string;
};

export type AttestationInfo = {
  attestationVersion?: number;
  attestationSecurityLevel?: string; // Software | TrustedEnvironment | StrongBox
  keymasterVersion?: number;
  keymasterSecurityLevel?: string; // Software | TrustedEnvironment | StrongBox
  challengeBase64?: string;
  uniqueIdBase64?: string;
};

export type ParsedCert = {
  index: number;
  subject: string;
  issuer: string;
  notBefore?: string;
  notAfter?: string;
  publicKeyInfo?: PublicKeyInfo;
  hasAndroidKeyAttestation: boolean;
  attestation?: AttestationInfo;
};


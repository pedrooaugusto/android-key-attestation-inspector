import { X509Certificate } from "@peculiar/x509";
import { sha256, splitPemChain } from "./parser";

export const GOOGLE_ROOTS_PEM_PATH = "google-root-certs.pem";

export async function buildRootSpkiSetFromPem(pemBundle: string): Promise<Set<string>> {
  const parts = splitPemChain(pemBundle);
  const set = new Set<string>();
  for (const p of parts) {
    try {
      const cert = new X509Certificate(p);
      const spki = cert.publicKey.rawData;
      const spkiSha = await sha256(spki);
      set.add(spkiSha);
    } catch (e) {
      console.warn("Failed to parse a Google root certificate entry", e);
    }
  }
  return set;
}

export async function loadGoogleRootSpkis(path: string = GOOGLE_ROOTS_PEM_PATH): Promise<Set<string>> {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`Failed to fetch Google roots: ${res.status}`);
  const pem = await res.text();
  return buildRootSpkiSetFromPem(pem);
}


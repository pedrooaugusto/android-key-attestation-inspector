import { X509Certificate } from "@peculiar/x509";
import { BaseBlock, fromBER, ValueBlock, type AsnType } from "asn1js";
import type { ParsedCert, PublicKeyInfo, AttestationInfo } from "./types";

export const ANDROID_KEY_ATTESTATION_OID = "1.3.6.1.4.1.11129.2.1.17";

export function splitPemChain(pem: string): string[] {
    const regex = /-----BEGIN CERTIFICATE-----[\s\S]*?-----END CERTIFICATE-----/g;
    const matches = pem.match(regex) || [];

    return matches.map((m) => m.trim());
}

export async function sha256(buf: ArrayBuffer): Promise<string> {
    const hash = await crypto.subtle.digest("SHA-256", buf);
    const arr = Array.from(new Uint8Array(hash));

    return arr.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export const toHex = (arr: ArrayBuffer) =>
    Array.from(new Uint8Array(arr))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");

export function formatDn(dn: string): string {
    return dn
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
        .join(" · ");
}

function arrayBufferToHexString(buffer: ArrayBuffer) {
    const bytes = new Uint8Array(buffer);

    if (!bytes.length) return undefined;

    let hex = "";

    for (let i = 0; i < bytes.length; i++) {
        hex += bytes[i].toString(16).padStart(2, "0");
    }

    return hex;
}

function arrayBufferToPlainString(buffer: ArrayBuffer) {
    const bytes = new Uint8Array(buffer);

    if (!bytes.length) return undefined;

    let text = "";

    for (let i = 0; i < bytes.length; i++) {
        text += String.fromCharCode(bytes[i]);
    }

    return text;
}

type LocalConstructedValueBlock = ValueBlock & {
    valueHex: ArrayBuffer;
    value: BaseBlock[];
}

type AsnTypeFixture = AsnType & { valueBlock: LocalConstructedValueBlock };

export function parseAndroidAttestation(extValue: ArrayBuffer): AttestationInfo | undefined {
    try {
        const level1 = fromBER(extValue);

        if (level1.offset === -1 || !level1.result.valueBlock) return undefined;

        let inner = level1.result as AsnTypeFixture;

        console.log(inner);

        if (inner.idBlock && inner.idBlock.tagClass === 1 && inner.idBlock.tagNumber === 4) {
            const bytes = inner.valueBlock.valueHex;
            const level2 = fromBER(bytes);

            if (level2.offset === -1) {
                return undefined;
            }

            inner = level2.result as AsnTypeFixture;
        }

        const seqItems = inner.valueBlock?.value || [];

        if (!Array.isArray(seqItems) || seqItems.length < 6) return undefined;

        const getInt = (idx: number): number | undefined => {
            const node = seqItems[idx];
            const vb = node?.valueBlock as LocalConstructedValueBlock;

            // INTEGER (2) or ENUM (10)
            if (!node || (node.idBlock?.tagNumber !== 2 && node.idBlock?.tagNumber !== 10)) return undefined;

            const hex = arrayBufferToHexString(vb.valueHex);

            if (hex === undefined) return undefined;

            return parseInt(hex, 16);
        };

        const getOctetBase64 = (idx: number): string | undefined => {
            const node = seqItems[idx];

            // OCTET STRING
            if (!node || node.idBlock?.tagNumber !== 4) return undefined;
            if ((node.valueBlock as any)?.valueHex == undefined) return undefined;

            const plainValue = arrayBufferToPlainString((node.valueBlock as any)?.valueHex as ArrayBuffer);

            if (plainValue == undefined) return undefined;

            return plainValue;
        };

        const secLevelName = (n?: number) =>
            n === 2 ? "StrongBox" : n === 1 ? "TrustedEnvironment" : n === 0 ? "Software" : undefined;

        return {
            attestationVersion: getInt(0),
            attestationSecurityLevel: secLevelName(getInt(1)),
            keymasterVersion: getInt(2),
            keymasterSecurityLevel: secLevelName(getInt(3)),
            challengeBase64: getOctetBase64(4),
            uniqueIdBase64: getOctetBase64(5),
        };
    } catch {
        return undefined;
    }
}

export async function getPublicKeyInfo(certificate: X509Certificate): Promise<PublicKeyInfo | undefined> {
    try {
        const publicKey = certificate.publicKey;
        const spkiSha256 = await sha256(publicKey.rawData);
        const algorithm = String(certificate.publicKey?.algorithm?.name || (certificate as any).signatureAlgorithm || "");
        const base: PublicKeyInfo = { algorithm, spkiSha256 };
        if (algorithm !== "ECDSA") return base;
        return {
            ...base,
            x: toHex(publicKey.rawData.slice(1, 33)),
            y: toHex(publicKey.rawData.slice(33, 65)),
        };
    } catch (err) {
        console.error("Unable to parse public key.", err);
        return undefined;
    }
}

export async function parseCert(pem: string, index: number): Promise<ParsedCert> {
    const cert = new X509Certificate(pem);
    const publicKeyInfo = await getPublicKeyInfo(cert);
    const ext = cert.extensions.find((e: any) => e.type === ANDROID_KEY_ATTESTATION_OID);
    const attestation = ext ? parseAndroidAttestation(ext.value) : undefined;
    return {
        index,
        subject: cert.subject,
        issuer: cert.issuer,
        notBefore: (cert as any).notBefore?.toISOString?.() ?? undefined,
        notAfter: (cert as any).notAfter?.toISOString?.() ?? undefined,
        publicKeyInfo,
        hasAndroidKeyAttestation: Boolean(ext),
        attestation,
    };
}


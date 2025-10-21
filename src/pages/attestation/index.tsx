import React, { useCallback, useEffect, useMemo, useState } from "react";
import "./style.css";
import { Uploader } from "./components/Uploader";
import { SummaryBar } from "./components/SummaryBar";
import { CertCard } from "./components/CertCard";

// We use lightweight X.509/ASN.1 parsers for the browser
// Make sure to add these deps to @website/package.json if not present:
//   "@peculiar/x509" and "asn1js"
import { parseCert, splitPemChain, sha256 } from "./parser";
import { GOOGLE_ROOTS_PEM_PATH, buildRootSpkiSetFromPem } from "./googleRoots";
import { InfoBox } from "./components/InfoBox";

import type { ParsedCert } from "./types";

// moved helpers to parser.ts and googleRoots.ts

export default function AttestationPage() {
    const [pemText, setPemText] = useState<string>("");
    const [parsed, setParsed] = useState<ParsedCert[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [googleRootSpkis, setGoogleRootSpkis] = useState<Set<string> | null>(null);
    const [pemUrl, setPemUrl] = useState<string>("");
    const [loadingFromUrl, setLoadingFromUrl] = useState<boolean>(false);
    const [fileSha256, setFileSha256] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;
        fetch(GOOGLE_ROOTS_PEM_PATH)
            .then((r) => (r.ok ? r.text() : Promise.reject(r.statusText)))
            .then((txt) => buildRootSpkiSetFromPem(txt))
            .then((set) => {
                if (!cancelled) setGoogleRootSpkis(set);
            })
            .catch((e) => {
                console.warn("Unable to load Google root certs:", e);
                if (!cancelled) setGoogleRootSpkis(null);
            });
        return () => {
            cancelled = true;
        };
    }, []);

    const parseText = useCallback(async (text: string) => {
        setPemText(text);
        try {
            const bytes = new TextEncoder().encode(text);
            const hash = await sha256(bytes.buffer);

            setFileSha256(hash);
        } catch {
            setFileSha256(null);
        }
        const parts = splitPemChain(text);
        if (!parts.length) {
            setError("No certificates found in PEM file.");
            setParsed([]);
            return;
        }
        try {
            const list: ParsedCert[] = [];
            for (let i = 0; i < parts.length; i++) list.push(await parseCert(parts[i], i));
            setParsed(list);
            setError(null);
        } catch (err) {
            console.error(err);
            setParsed([]);
            setError("Failed to parse certificates. Ensure it's a valid PEM chain.");
        }
    }, []);

    // Auto-load PEM from query string: ?attestationFileUrl=https://...
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const presetUrl = params.get("attestationFileUrl");
        if (!presetUrl) return;
        setPemUrl(presetUrl);
        let active = true;
        (async () => {
            try {
                setLoadingFromUrl(true);
                setError(null);
                setParsed([]);
                const resp = await fetch(presetUrl, { cache: "no-store" });
                if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
                const text = await resp.text();
                if (active) await parseText(text);
            } catch (e) {
                console.error("Failed to auto-load PEM from URL param:", e);
                if (active) setError("Unable to fetch PEM from URL parameter (check the link and CORS).");
            } finally {
                if (active) setLoadingFromUrl(false);
            }
        })();
        return () => {
            active = false;
        };
    }, [parseText]);

    const rootIsGoogle = useMemo(() => {
        if (!parsed.length) return null;
        if (!googleRootSpkis) return null;
        const root = parsed[parsed.length - 1];
        const spki = root.publicKeyInfo?.spkiSha256;
        if (!spki) return null;
        return googleRootSpkis.has(spki);
    }, [parsed, googleRootSpkis]);

    const nameColorMap = useMemo(() => {
        const map = new Map<string, number>();
        let nextColor = 0;
        for (let i = 0; i < parsed.length - 1 && nextColor < 6; i++) {
            const issuerName = parsed[i].issuer;
            if (!map.has(issuerName)) {
                map.set(issuerName, nextColor);
                nextColor++;
            }
        }
        return map;
    }, [parsed]);

    const keyLocation = useMemo(() => {
        const attHolder = parsed.find((c) => c.attestation);
        return attHolder?.attestation?.keymasterSecurityLevel ?? null;
    }, [parsed]);

    const onFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        setError(null);
        setParsed([]);
        const file = e.target.files?.[0];
        if (!file) return;
        const text = await file.text();
        await parseText(text);
    }, [parseText]);

    const onLoadFromUrl = useCallback(async () => {
        const url = pemUrl.trim();
        if (!url) {
            setError("Please enter a URL to load a PEM file.");
            return;
        }
        setLoadingFromUrl(true);
        setError(null);
        setParsed([]);
        try {
            const resp = await fetch(url, { cache: "no-store" });
            if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
            const text = await resp.text();
            await parseText(text);
        } catch (e) {
            console.error("Failed to load PEM from URL:", e);
            setError("Unable to fetch PEM from URL (check the link and CORS).");
        } finally {
            setLoadingFromUrl(false);
        }
    }, [pemUrl, parseText]);

    return (
        <div className="page attestation-page">
            <header>
                <h1>Android Key Attestation Inspector</h1>
                <p>Upload a PEM file containing the attestation certificate chain.</p>
            </header>

            <a
                className="github-link"
                href="https://github.com/pedrooaugusto/android-key-attestation-inspector"
                target="_blank"
                rel="noreferrer"
                title="View project on GitHub"
            >
                GitHub
            </a>

            <Uploader onFileChange={onFileChange} pemUrl={pemUrl} setPemUrl={setPemUrl} onLoadFromUrl={onLoadFromUrl} loadingFromUrl={loadingFromUrl} error={error} />

            <SummaryBar certCount={parsed.length} rootIsGoogle={rootIsGoogle} keyLocation={keyLocation} fileSha256={fileSha256} />

            {parsed.length > 0 && (
                <section className="cert-list">
                    {parsed.map((c) => (
                        <CertCard key={c.index} cert={c} googleRootSpkis={googleRootSpkis} issuerColorIndex={nameColorMap.get(c.issuer)} subjectColorIndex={nameColorMap.get(c.subject)} />
                    ))}
                </section>
            )}

            <InfoBox />

            {pemText && (
                <section className="raw" style={{cursor: 'pointer'}}>
                    <details>
                        <summary>Raw PEM</summary>
                        <pre>{pemText}</pre>
                    </details>
                </section>
            )}
        </div>
    );
}

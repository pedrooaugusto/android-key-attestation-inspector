import React from "react";

type Props = {
    onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    pemUrl: string;
    setPemUrl: (v: string) => void;
    onLoadFromUrl: () => void;
    loadingFromUrl: boolean;
    error: string | null;
};

export function Uploader(props: Props) {
    return (
        <section className="uploader">
            <div className="row file">
                <input
                    type="file"
                    accept=".pem,.cer,.crt,.txt"
                    onChange={props.onFileChange}
                />
            </div>
            <div className="or">or</div>
            <div className="row url-loader">
                <input
                    list="sample"
                    type="url"
                    placeholder="https://example.com/attestation.pem"
                    value={props.pemUrl}
                    onChange={(e) => props.setPemUrl(e.target.value)}
                />
                <datalist id="sample">
                    <option value={window.location.origin + window.location.pathname +  '/sample.pem'} />
                </datalist>
                <button
                    type="button"
                    onClick={props.onLoadFromUrl}
                    disabled={props.loadingFromUrl}
                    style={{ cursor: 'pointer' }}
                >
                    {props.loadingFromUrl ? "Loading..." : "Load from URL"}
                </button>
            </div>
            <div className="hint">
                Note: some servers may block cross‑origin requests (CORS).
            </div>
            {props.error && <div className="error">{props.error}</div>}
        </section>
    );
}

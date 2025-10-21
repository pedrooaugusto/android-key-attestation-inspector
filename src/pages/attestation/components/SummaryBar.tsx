type Props = {
    certCount: number;
    rootIsGoogle: boolean | null;
    keyLocation: string | null | undefined;
    fileSha256?: string | null;
};

export function SummaryBar({
    certCount,
    rootIsGoogle,
    keyLocation,
    fileSha256,
}: Props) {
    if (!certCount) return null;
    return (
        <section className="summary">
            <div className="summary-item">
                <span>Certificates:</span>
                <b>{certCount}</b>
            </div>
            <div className="summary-item">
                <span>Root issued by Google:</span>
                {rootIsGoogle == null ? (
                    <i>n/a</i>
                ) : rootIsGoogle ? (
                    <b className="ok">Yes</b>
                ) : (
                    <b className="bad">No</b>
                )}
            </div>
            <div className="summary-item">
                <span>Private key location:</span>
                {keyLocation ? <b>{keyLocation}</b> : <i>n/a</i>}
            </div>
            {fileSha256 && (
                <div className="summary-item">
                    <span>File SHA-256:</span>
                    <span className="mono small">{fileSha256}</span>
                </div>
            )}
        </section>
    );
}

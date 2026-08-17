"use client";

export type TransferDirection = "upload" | "download";
export type TransferPhase = "preparing" | "transferring" | "processing" | "complete";

export type TransferProgressState = {
  direction: TransferDirection;
  phase: TransferPhase;
  label: string;
  currentName: string;
  completedItems: number;
  totalItems: number;
  transferredBytes: number;
  totalBytes: number;
  bytesPerSecond: number;
};

type TransferSample = Omit<TransferProgressState, "direction" | "bytesPerSecond">;

export function createTransferMeter(
  direction: TransferDirection,
  onChange: (progress: TransferProgressState) => void,
): (sample: TransferSample) => void {
  const startedAt = performance.now();
  let sampledAt = startedAt;
  let sampledBytes = 0;
  let smoothedRate = 0;

  return (sample) => {
    const now = performance.now();
    const elapsedSinceSample = (now - sampledAt) / 1000;
    const byteDelta = Math.max(0, sample.transferredBytes - sampledBytes);

    if (byteDelta > 0 && (elapsedSinceSample >= 0.2 || sample.phase === "complete")) {
      const instantRate = byteDelta / Math.max(elapsedSinceSample, 0.001);
      smoothedRate = smoothedRate === 0 ? instantRate : (smoothedRate * 0.7) + (instantRate * 0.3);
      sampledAt = now;
      sampledBytes = sample.transferredBytes;
    } else if (smoothedRate === 0 && sample.transferredBytes > 0) {
      const elapsedTotal = (now - startedAt) / 1000;
      if (elapsedTotal >= 0.2) smoothedRate = sample.transferredBytes / elapsedTotal;
    }

    onChange({ ...sample, direction, bytesPerSecond: smoothedRate });
  };
}

function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const unitIndex = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / (1024 ** unitIndex);
  const precision = unitIndex === 0 || value >= 100 ? 0 : value >= 10 ? 1 : 2;
  return `${value.toFixed(precision)} ${units[unitIndex]}`;
}

function formatEta(seconds: number): string {
  if (seconds < 1) return "Less than a second";
  if (seconds < 60) return `${Math.ceil(seconds)} sec`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.ceil(seconds % 60);
  if (minutes < 60) return remainingSeconds > 0 ? `${minutes} min ${remainingSeconds} sec` : `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes > 0 ? `${hours} hr ${remainingMinutes} min` : `${hours} hr`;
}

export function TransferProgress({ progress }: { progress: TransferProgressState | null }) {
  if (!progress) return null;

  const byteProgress = progress.totalBytes > 0
    ? progress.transferredBytes / progress.totalBytes
    : 0;
  const itemProgress = progress.totalItems > 0
    ? progress.completedItems / progress.totalItems
    : 0;
  const ratio = progress.phase === "complete" ? 1 : Math.min(1, Math.max(byteProgress, itemProgress));
  const percent = Math.round(ratio * 100);
  const remainingBytes = Math.max(0, progress.totalBytes - progress.transferredBytes);
  const eta = progress.phase === "complete"
    ? "Done"
    : progress.phase === "preparing" || progress.totalBytes <= 0 || progress.bytesPerSecond <= 0
      ? "Calculating…"
      : progress.phase === "processing" && remainingBytes === 0
        ? "Finishing…"
        : formatEta(remainingBytes / progress.bytesPerSecond);
  const verb = progress.direction === "upload" ? "Uploaded" : "Downloaded";

  return (
    <div className="studio-transfer">
      <div className="studio-transfer__heading">
        <div>
          <strong aria-live="polite">{progress.label}</strong>
          {progress.currentName && <span title={progress.currentName}>{progress.currentName}</span>}
        </div>
        <b>{percent}%</b>
      </div>
      <div
        className="studio-transfer__track"
        role="progressbar"
        aria-label={progress.label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
        aria-valuetext={`${percent} percent, ${progress.completedItems} of ${progress.totalItems} files complete`}
      >
        <span style={{ transform: `scaleX(${ratio})` }} />
      </div>
      <dl className="studio-transfer__metrics">
        <div><dt>{verb}</dt><dd>{formatBytes(progress.transferredBytes)}{progress.totalBytes > 0 ? ` / ${formatBytes(progress.totalBytes)}` : ""}</dd></div>
        <div><dt>Speed</dt><dd>{progress.bytesPerSecond > 0 ? `${formatBytes(progress.bytesPerSecond)}/s` : "Measuring…"}</dd></div>
        <div><dt>Estimated time</dt><dd>{eta}</dd></div>
        <div><dt>Files</dt><dd>{progress.completedItems} / {progress.totalItems || "—"}</dd></div>
      </dl>
    </div>
  );
}

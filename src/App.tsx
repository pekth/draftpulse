import { useCallback, useEffect, useRef, useState } from "react";
import "./App.css";
import {
  CATEGORY_LABELS,
  DIMENSION_LABELS,
  type AnalyzeResult,
  type DimensionScores,
} from "./types";

const DEFAULT_DEBOUNCE_MS = 500;

function pct(n: number): string {
  return `${Math.round(n * 100)}%`;
}

function scoreTone(n: number): "low" | "mid" | "high" {
  if (n >= 0.7) return "high";
  if (n >= 0.4) return "mid";
  return "low";
}

export default function App() {
  const [text, setText] = useState("");
  const [debounceMs, setDebounceMs] = useState(DEFAULT_DEBOUNCE_MS);
  const [result, setResult] = useState<AnalyzeResult | null>(null);
  const [status, setStatus] = useState<"idle" | "waiting" | "loading" | "error">(
    "idle",
  );
  const [error, setError] = useState<string | null>(null);
  const [serverMode, setServerMode] = useState<"live" | "mock" | "unknown">(
    "unknown",
  );
  const abortRef = useRef<AbortController | null>(null);
  const reqId = useRef(0);

  useEffect(() => {
    fetch("/api/health")
      .then((r) => r.json())
      .then((d: { mode?: "live" | "mock" }) => {
        if (d.mode) setServerMode(d.mode);
      })
      .catch(() => setServerMode("unknown"));
  }, []);

  const runAnalyze = useCallback(async (draft: string) => {
    const trimmed = draft.trim();
    if (!trimmed) {
      setResult(null);
      setStatus("idle");
      setError(null);
      return;
    }

    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;
    const id = ++reqId.current;
    setStatus("loading");
    setError(null);

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: draft }),
        signal: ac.signal,
      });
      if (!res.ok) {
        throw new Error(`Analyze failed (${res.status})`);
      }
      const data = (await res.json()) as AnalyzeResult;
      if (id !== reqId.current) return;
      setResult(data);
      setStatus("idle");
    } catch (err) {
      if (ac.signal.aborted) return;
      if (id !== reqId.current) return;
      setStatus("error");
      setError(err instanceof Error ? err.message : "Analyze failed");
    }
  }, []);

  useEffect(() => {
    if (!text.trim()) {
      setResult(null);
      setStatus("idle");
      return;
    }
    setStatus("waiting");
    const t = window.setTimeout(() => {
      void runAnalyze(text);
    }, debounceMs);
    return () => {
      window.clearTimeout(t);
      abortRef.current?.abort();
    };
  }, [text, debounceMs, runAnalyze]);

  const dims = result?.dimensions;
  const composite = result?.composite ?? 0;

  return (
    <div className="shell">
      <header className="header">
        <div>
          <p className="eyebrow">DraftPulse · experimental · Jev</p>
          <h1>Viral post analyzer</h1>
          <p className="sub">
            Pause typing and get dimension scores. Heuristic until calibrated on
            real outcomes. Not production-ready.
          </p>
        </div>
        <div className="badges">
          <span className={`pill pill-${serverMode}`}>
            {serverMode === "live" ? "Jev live" : serverMode === "mock" ? "Mock mode" : "…"}
          </span>
          {result?.model ? <span className="pill">{result.model}</span> : null}
        </div>
      </header>

      <main className="grid">
        <section className="composer card">
          <label className="label" htmlFor="draft">
            Draft
          </label>
          <textarea
            id="draft"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Write the post. Stop typing — analysis runs after the debounce."
            rows={14}
            maxLength={8000}
          />
          <div className="composer-meta">
            <span>{text.length} chars</span>
            <label className="debounce">
              Debounce
              <input
                type="range"
                min={300}
                max={1200}
                step={100}
                value={debounceMs}
                onChange={(e) => setDebounceMs(Number(e.target.value))}
              />
              <span>{debounceMs}ms</span>
            </label>
            <span className="status" aria-live="polite">
              {status === "waiting" && "Waiting…"}
              {status === "loading" && "Analyzing…"}
              {status === "error" && (error ?? "Error")}
              {status === "idle" && result && "Updated"}
            </span>
          </div>
        </section>

        <aside className="results">
          <section className="card score-card">
            <div className="score-row">
              <div>
                <p className="label">Viral potential</p>
                <p className={`big-score tone-${scoreTone(composite)}`}>
                  {pct(composite)}
                </p>
              </div>
              {result ? (
                <div className="category">
                  <p className="label">Category</p>
                  <p className="category-value">
                    {CATEGORY_LABELS[result.category]}
                  </p>
                  <p className="muted">
                    confidence {pct(result.categoryConfidence)}
                  </p>
                </div>
              ) : (
                <p className="muted empty-hint">Scores appear after you pause.</p>
              )}
            </div>
            <div
              className="meter"
              role="meter"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(composite * 100)}
              aria-label="Viral potential"
            >
              <div
                className={`meter-fill tone-${scoreTone(composite)}`}
                style={{ width: pct(composite) }}
              />
            </div>
          </section>

          <section className="card">
            <p className="label">Dimensions</p>
            <ul className="dim-list">
              {(
                Object.keys(DIMENSION_LABELS) as (keyof DimensionScores)[]
              ).map((key) => {
                const v = dims?.[key] ?? 0;
                return (
                  <li key={key}>
                    <div className="dim-head">
                      <span>{DIMENSION_LABELS[key]}</span>
                      <span className={`tone-${scoreTone(v)}`}>{pct(v)}</span>
                    </div>
                    <div className="bar">
                      <div
                        className={`bar-fill tone-${scoreTone(v)}`}
                        style={{ width: pct(v) }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>

          <section className="card">
            <p className="label">Tips</p>
            {result?.tips?.length ? (
              <ul className="tips">
                {result.tips.map((tip) => (
                  <li key={tip}>{tip}</li>
                ))}
              </ul>
            ) : (
              <p className="muted">Keep writing — tips show with the first analysis.</p>
            )}
          </section>

          <section className="card stub">
            <p className="label">Similar posts</p>
            <p className="muted">
              Stub for inspiration once the calibration corpus exists (phase 2).
            </p>
          </section>
        </aside>
      </main>
    </div>
  );
}

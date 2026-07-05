"use client";

import { useState, useCallback, useRef } from "react";
import type { CitationFormat, CitationMetadata } from "@/types/citation";

const FORMATS: { value: CitationFormat; label: string; tag: string; sample: string }[] = [
  { value: "apa", label: "APA", tag: "7th", sample: "Santoso, B. (2023). Judul…" },
  { value: "mla", label: "MLA", tag: "9th", sample: "Santoso, Budi. \"Judul…\"" },
  { value: "chicago", label: "Chicago", tag: "17th", sample: "Santoso, Budi. 2023. \"Judul…\"" },
  { value: "apa_indonesia", label: "APA ID", tag: "lokal", sample: "Budi Santoso. (2023). Judul…" },
];

export type HistoryItem = {
  id: string;
  sourceLabel: string;
  citation: string;
  format: CitationFormat;
  metadata: CitationMetadata;
  createdAt: number;
};

export default function GenerateForm() {
  const [sourceType, setSourceType] = useState<"url" | "doi">("url");
  const [value, setValue] = useState("");
  const [format, setFormat] = useState<CitationFormat>("apa");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // History entri yang sudah di-generate (in-memory, hilang saat refresh)
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [allCopied, setAllCopied] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    if (!value.trim()) return;
    setError(null);
    setLoading(true);

    try {
      // Step 1: fetch metadata
      const metaRes = await fetch("/api/citations/fetch-metadata", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source_type: sourceType, value: value.trim() }),
      });
      const metaData = await metaRes.json();
      if (!metaData.success || !metaData.metadata) {
        setError(metaData.error ?? "Gagal mengambil metadata");
        return;
      }

      // Step 2: format
      const fmtRes = await fetch("/api/citations/format", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ metadata: metaData.metadata, format }),
      });
      const fmtData = await fmtRes.json();
      if (!fmtData.success) {
        setError(fmtData.error ?? "Gagal memformat sitasi");
        return;
      }

      // Tambah ke history
      const newItem: HistoryItem = {
        id: crypto.randomUUID(),
        sourceLabel: value.trim(),
        citation: fmtData.citation,
        format,
        metadata: metaData.metadata,
        createdAt: Date.now(),
      };
      setHistory((prev) => [newItem, ...prev]);

      // Reset input supaya siap untuk entri berikutnya
      setValue("");
      inputRef.current?.focus();
    } catch {
      setError("Terjadi kesalahan jaringan");
    } finally {
      setLoading(false);
    }
  }

  const handleCopy = useCallback(async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1800);
    } catch {
      setError("Gagal menyalin ke clipboard");
    }
  }, []);

  async function handleCopyAll() {
    if (history.length === 0) return;
    // Urutkan alfabetis seperti daftar pustaka
    const sorted = [...history].sort((a, b) =>
      a.citation.localeCompare(b.citation, "id")
    );
    const text = sorted.map((h) => h.citation).join("\n\n");
    try {
      await navigator.clipboard.writeText(text);
      setAllCopied(true);
      setTimeout(() => setAllCopied(false), 1800);
    } catch {
      setError("Gagal menyalin ke clipboard");
    }
  }

  function handleRemove(id: string) {
    setHistory((prev) => prev.filter((h) => h.id !== id));
  }

  function handleClearAll() {
    if (history.length === 0) return;
    if (confirm(`Hapus semua ${history.length} entri dari sesi ini?`)) {
      setHistory([]);
    }
  }

  return (
    <div>
      <form onSubmit={handleGenerate} className="space-y-8">
        {/* Tipe sumber */}
        <div>
          <div className="smallcaps mb-3">§ 1 — Sumber</div>
          <div className="flex border border-ink-rule">
            {(["url", "doi"] as const).map((t, i) => (
              <button
                key={t}
                type="button"
                onClick={() => setSourceType(t)}
                className={`flex-1 px-6 py-3 text-xs font-medium uppercase tracking-widest transition-colors ${
                  i > 0 ? "border-l border-ink-rule" : ""
                } ${
                  sourceType === t
                    ? "bg-ink text-paper"
                    : "bg-paper text-ink-soft hover:bg-paper-deep"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* URL/DOI */}
        <div>
          <label htmlFor="value" className="smallcaps block">
            § 2 — {sourceType === "url" ? "Tautan artikel" : "Digital Object Identifier"}
          </label>
          <div className="mt-2 flex items-center gap-3">
            <input
              ref={inputRef}
              id="value"
              type="text"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              required
              placeholder={
                sourceType === "url"
                  ? "https://journal.example.com/artikel"
                  : "10.1234/xyz"
              }
              className="field font-serif text-lg"
            />
            <button
              type="submit"
              disabled={loading || !value.trim()}
              className="btn-ink !py-3 !px-5 disabled:opacity-50"
            >
              {loading ? "..." : "+ Tambah"}
            </button>
          </div>
        </div>

        {/* Format pilihan */}
        <div>
          <div className="smallcaps mb-3">§ 3 — Gaya sitasi</div>
          <div className="grid grid-cols-2 gap-px bg-ink-rule md:grid-cols-4">
            {FORMATS.map((f) => (
              <button
                key={f.value}
                type="button"
                onClick={() => setFormat(f.value)}
                className={`flex flex-col items-start gap-0.5 p-3 text-left transition-colors ${
                  format === f.value
                    ? "bg-ink text-paper"
                    : "bg-paper text-ink hover:bg-paper-deep"
                }`}
              >
                <span className="font-display text-base font-semibold">
                  {f.label}
                </span>
                <span
                  className={`font-mono text-[10px] ${
                    format === f.value ? "text-paper/60" : "text-ink-muted"
                  }`}
                >
                  ed. {f.tag}
                </span>
              </button>
            ))}
          </div>
          <p className="mt-2 font-serif text-xs italic text-ink-muted">
            Preview: {FORMATS.find((f) => f.value === format)?.sample}
          </p>
        </div>
      </form>

      {error && (
        <div className="mt-6 border-l-2 border-accent bg-accent-dim/30 p-4">
          <div className="smallcaps text-accent">Errata</div>
          <p className="mt-1 font-serif text-sm text-ink">{error}</p>
        </div>
      )}

      {/* History / daftar pustaka sesi ini */}
      {history.length > 0 && (
        <section className="mt-12">
          <header className="flex flex-wrap items-baseline justify-between gap-3 border-b border-ink pb-3">
            <div>
              <div className="smallcaps text-accent">§ Daftar Pustaka · Sesi ini</div>
              <h2 className="mt-1 font-display text-2xl font-bold tracking-tightest text-ink">
                {history.length} entri
              </h2>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleCopyAll}
                className="btn-ink !py-2 !px-4 !text-sm"
              >
                {allCopied ? "✓ Tersalin semua" : "Salin semua ↓"}
              </button>
              <button
                onClick={handleClearAll}
                className="font-mono text-xs uppercase tracking-widest text-ink-muted underline-offset-4 transition-colors hover:text-accent hover:underline"
              >
                Hapus semua
              </button>
            </div>
          </header>

          <ol className="mt-6 space-y-5">
            {history.map((item, idx) => (
              <li
                key={item.id}
                className="group border-b border-ink-rule pb-5 last:border-b-0"
              >
                <div className="grid grid-cols-12 gap-3">
                  <div className="col-span-1">
                    <span className="ordinal text-2xl">
                      {String(history.length - idx).padStart(2, "0")}
                    </span>
                  </div>
                  <div className="col-span-11">
                    <div className="mb-1.5 flex flex-wrap items-center gap-2 font-mono text-[10px] uppercase tracking-widest">
                      <span className="border border-ink-rule px-1.5 py-0.5 text-ink-muted">
                        {item.format.replace("_", " ")}
                      </span>
                      <span className="truncate text-ink-muted">
                        {item.metadata.title}
                      </span>
                    </div>
                    <p className="font-serif text-base leading-relaxed text-ink hanging-indent">
                      {item.citation}
                    </p>
                    <div className="mt-2 flex items-center gap-3">
                      <button
                        onClick={() => handleCopy(item.citation, item.id)}
                        className="font-mono text-[10px] uppercase tracking-widest text-ink-soft underline-offset-4 transition-colors hover:text-accent hover:underline"
                      >
                        {copiedId === item.id ? "✓ Tersalin" : "Salin entri"}
                      </button>
                      <button
                        onClick={() => handleRemove(item.id)}
                        className="font-mono text-[10px] uppercase tracking-widest text-ink-muted opacity-0 transition-opacity hover:text-accent group-hover:opacity-100"
                      >
                        Hapus
                      </button>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </section>
      )}
    </div>
  );
}

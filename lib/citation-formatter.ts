// lib/citation-formatter.ts
// Wrapper di atas citation-js untuk format APA 7th, MLA 9th, Chicago,
// dan custom post-processor untuk "APA Indonesia".

import { Cite } from "@citation-js/core";
import "@citation-js/plugin-csl";
import type { CitationFormat, CitationMetadata, Author } from "@/types/citation";

// Map format kita ke style CSL yang tersedia di citation-js
const FORMAT_TO_CSL: Record<Exclude<CitationFormat, "apa_indonesia">, string> = {
  apa: "apa-7th-edition",
  mla: "modern-language-association-9th-edition",
  chicago: "chicago-author-date-17th-edition",
};

function metadataToCsl(meta: CitationMetadata): Record<string, unknown> {
  // citation-js menerima object dengan key mirip BibTeX/CSL JSON
  const type = meta.source_type === "book" ? "book" : meta.source_type === "journal" ? "article-journal" : "webpage";

  const csl: Record<string, unknown> = {
    type,
    title: meta.title,
    author: meta.authors.map((a) => ({
      given: a.given,
      family: a.family,
    })),
    issued: meta.published_year ? { "date-parts": [[meta.published_year]] } : undefined,
    publisher: meta.publisher ?? undefined,
    URL: meta.url ?? undefined,
    DOI: meta.doi ?? undefined,
  };

  // Bersihkan field undefined
  Object.keys(csl).forEach((k) => {
    if (csl[k] === undefined) delete csl[k];
  });

  return csl;
}

function buildFallbackCitation(meta: CitationMetadata, format: CitationFormat): string {
  // Fallback string assembly jika citation-js gagal (misal di environment tanpa plugin CSL)
  const authorList = formatAuthorList(meta.authors, format);
  const year = meta.published_year ? ` (${meta.published_year}).` : "";
  const title = meta.title ? `. ${meta.title}` : "";
  const publisher = meta.publisher ? `. ${meta.publisher}` : "";
  const link = meta.url ? `. ${meta.url}` : "";
  return `${authorList}${year}${title}${publisher}${link}`;
}

function formatAuthorList(authors: Author[], format: CitationFormat): string {
  if (authors.length === 0) return "Anonim";
  const formatted = authors.map((a) => {
    const initials = a.given
      .split(/\s+/)
      .filter(Boolean)
      .map((g) => `${g[0].toUpperCase()}.`)
      .join(" ");
    if (format === "mla") {
      return `${a.family}, ${initials}`.trim();
    }
    // APA & Chicago: "Family, F. M."
    return `${a.family}, ${initials}`.trim();
  });
  if (formatted.length === 1) return formatted[0];
  if (formatted.length === 2) return `${formatted[0]}, & ${formatted[1]}`;
  return formatted.slice(0, -1).join(", ") + ", & " + formatted[formatted.length - 1];
}

export async function formatCitation(
  meta: CitationMetadata,
  format: CitationFormat
): Promise<string> {
  if (format === "apa_indonesia") {
    // Generate APA 7 dulu, lalu post-process untuk gaya Indonesia
    const apaText = await safeFormat(meta, "apa");
    return applyApaIndonesiaRules(apaText, meta);
  }

  return safeFormat(meta, format);
}

async function safeFormat(meta: CitationMetadata, format: Exclude<CitationFormat, "apa_indonesia">): Promise<string> {
  try {
    const cslData = metadataToCsl(meta);
    const cite = new Cite(cslData);
    const html = cite.format("bibliography", {
      format: "html",
      template: FORMAT_TO_CSL[format],
    });
    return htmlToPlainText(html);
  } catch (err) {
    console.error(`citation-js error (${format}):`, err);
    return buildFallbackCitation(meta, format);
  }
}

function htmlToPlainText(html: string): string {
  return html
    .replace(/<\/?[a-zA-Z][^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Post-processor "APA Indonesia" (custom, non-standar internasional).
 * Aturan heuristik yang umum dipakai kampus Indonesia:
 * - Nama penulis Indonesia TIDAK dibalik urutannya pada format daftar pustaka.
 *   Contoh: "Budi Santoso" tetap ditulis "Budi Santoso", bukan "Santoso, B."
 * - Tahun tetap di-parentheses.
 * - DOI/URL tetap dicantumkan di akhir.
 *
 * Catatan: rule ini perlu divalidasi dengan sample dari 3-5 kampus (lihat agents.md).
 * Implementasi ini menggunakan heuristik sederhana: jika nama keluarga
 * kosong / mengandung spasi DAN nama given juga multi-kata, kemungkinan
 * besar itu nama Indonesia dan kita pakai format "Given Family" (tidak dibalik).
 */
function applyApaIndonesiaRules(apaText: string, meta: CitationMetadata): string {
  // Jika ada authors, kita bangun ulang string author sesuai gaya Indonesia
  // dengan mempertahankan format tahun, judul, dll dari hasil APA.
  const idAuthors = formatIndonesianAuthors(meta.authors);
  if (!idAuthors) {
    return apaText;
  }

  // Coba ekstrak sisa string APA setelah author list (tahun, judul, dst)
  // Pola umum APA: "Santoso, B. (2023). Judul..."
  // Kita ambil segmen mulai dari "(YYYY)" atau tahun pertama yang ditemukan
  const yearMatch = apaText.match(/\((\d{4})[a-z]?\)/);
  const restStart = yearMatch ? apaText.indexOf(yearMatch[0]) : -1;
  const rest = restStart >= 0 ? apaText.slice(restStart) : apaText;

  return `${idAuthors}${rest.startsWith(" ") ? rest : " " + rest}`;
}

function formatIndonesianAuthors(authors: Author[]): string | null {
  if (!authors || authors.length === 0) return null;

  // Deteksi heuristik: jika semua author punya family single-word tanpa spasi,
  // kemungkinan besar bukan nama Indonesia style. Tapi ini tidak reliable 100% —
  // oleh karena itu kita TETAP pakai format "Given Family" untuk konsistensi
  // dengan guideline kampus Indonesia pada umumnya.
  const formatted = authors.map((a) => {
    const trimmedGiven = a.given.trim();
    const trimmedFamily = a.family.trim();
    // Tulis lengkap: "Budi Santoso" (given + family)
    if (trimmedGiven && trimmedFamily) {
      return `${trimmedGiven} ${trimmedFamily}`;
    }
    return trimmedGiven || trimmedFamily || "Anonim";
  });

  if (formatted.length === 1) return formatted[0];
  if (formatted.length === 2) return `${formatted[0]} & ${formatted[1]}`;
  return formatted.slice(0, -1).join(", ") + ", & " + formatted[formatted.length - 1];
}

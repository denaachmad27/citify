// lib/citation-formatter.ts
// Edge-safe manual citation formatter untuk 4 format:
// - APA 7th Edition
// - MLA 9th Edition
// - Chicago Author-Date 17th Edition
// - APA Indonesia (custom — lihat README untuk heuristik)
//
// Tidak dependensi eksternal — pure TypeScript, berjalan di edge runtime.

import type { CitationFormat, CitationMetadata, Author } from "@/types/citation";

// === Helpers ===

function getInitials(given: string): string {
  // "Budi Santoso" -> "B. S."
  return given
    .split(/[\s.-]+/)
    .filter(Boolean)
    .map((part) => `${part[0].toUpperCase()}.`)
    .join(" ");
}

function getLastName(author: Author): string {
  return (author.family || author.given || "Anonim").trim();
}

/**
 * Format daftar author untuk APA & Chicago:
 * - 1 author: "Family, F."
 * - 2 authors: "Family, F., & Family, F."
 * - 3+ authors: "Family, F., Family, F., & Family, F."
 */
function formatAuthorsApaChicago(authors: Author[]): string {
  if (authors.length === 0) return "Anonim";
  const parts = authors.map((a) => {
    const family = getLastName(a);
    const initials = a.given ? getInitials(a.given) : "";
    return initials ? `${family}, ${initials}` : family;
  });
  if (parts.length === 1) return parts[0];
  if (parts.length === 2) return `${parts[0]}, & ${parts[1]}`;
  return `${parts.slice(0, -1).join(", ")}, & ${parts[parts.length - 1]}`;
}

/**
 * Format daftar author untuk MLA 9th:
 * - 1 author: "Family, Given"
 * - 2 authors: "Family, Given, and Given Family"
 * - 3+ authors: "Family, Given, et al."
 */
function formatAuthorsMla(authors: Author[]): string {
  if (authors.length === 0) return "Anonim";
  if (authors.length >= 3) {
    const first = authors[0];
    return `${getLastName(first)}, ${first.given}, et al.`;
  }
  if (authors.length === 2) {
    const a = authors[0];
    const b = authors[1];
    return `${getLastName(a)}, ${a.given}, and ${b.given} ${getLastName(b)}`;
  }
  const a = authors[0];
  return `${getLastName(a)}, ${a.given}`;
}

/**
 * Format daftar author untuk APA Indonesia (Given Family, tidak dibalik):
 * - 1 author: "Budi Santoso"
 * - 2 authors: "Budi Santoso & Siti Rahayu"
 * - 3+ authors: "Budi Santoso, Andi Wijaya, & Siti Rahayu"
 */
function formatAuthorsIndonesian(authors: Author[]): string {
  if (authors.length === 0) return "Anonim";
  const parts = authors.map((a) => {
    const given = a.given.trim();
    const family = a.family.trim();
    if (given && family) return `${given} ${family}`;
    return family || given || "Anonim";
  });
  if (parts.length === 1) return parts[0];
  if (parts.length === 2) return `${parts[0]} & ${parts[1]}`;
  return `${parts.slice(0, -1).join(", ")}, & ${parts[parts.length - 1]}`;
}

function formatTitle(meta: CitationMetadata, format: CitationFormat): string {
  const t = meta.title.trim();
  if (format === "apa" || format === "apa_indonesia") {
    // APA: sentence case untuk judul artikel/bab, title case untuk buku.
    // Untuk journal/webpage: sentence case + tanpa italic
    return t;
  }
  if (format === "mla") {
    // MLA: title dalam tanda kutip untuk artikel, italic untuk buku
    return `"${t}"`;
  }
  if (format === "chicago") {
    // Chicago: title dalam tanda kutip untuk artikel
    return `"${t}"`;
  }
  return t;
}

function formatPublisher(meta: CitationMetadata): string {
  return meta.publisher?.trim() || "";
}

function formatUrlOrDoi(meta: CitationMetadata): string {
  if (meta.doi) {
    return `https://doi.org/${meta.doi.replace(/^https?:\/\/(dx\.)?doi\.org\//, "")}`;
  }
  return meta.url || "";
}

// === Main formatters ===

function formatApa(meta: CitationMetadata): string {
  const authors = formatAuthorsApaChicago(meta.authors);
  const year = meta.published_year ? `(${meta.published_year})` : "(n.d.)";
  const title = formatTitle(meta, "apa");
  const publisher = formatPublisher(meta);
  const link = formatUrlOrDoi(meta);

  const parts = [`${authors} ${year}.`, `${title}.`];
  if (publisher) parts.push(`${publisher}.`);
  if (link) parts.push(`${link}`);
  return parts.join(" ").replace(/\s+\./g, ".").trim();
}

function formatMla(meta: CitationMetadata): string {
  const authors = formatAuthorsMla(meta.authors);
  const title = formatTitle(meta, "mla");
  const publisher = formatPublisher(meta);
  const year = meta.published_year ? `${meta.published_year}` : "";
  const link = formatUrlOrDoi(meta);

  const parts = [`${authors}.`, `${title}.`];
  if (publisher) parts.push(`${publisher},`);
  if (year) parts.push(`${year}.`);
  if (link) parts.push(link);
  return parts.join(" ").replace(/\s+,/g, ",").replace(/,\s*\./g, ".").trim();
}

function formatChicago(meta: CitationMetadata): string {
  const authors = formatAuthorsApaChicago(meta.authors);
  const year = meta.published_year ? `${meta.published_year}` : "n.d.";
  const title = formatTitle(meta, "chicago");
  const publisher = formatPublisher(meta);
  const link = formatUrlOrDoi(meta);

  const parts = [`${authors}.`, `${year}.`, `${title}.`];
  if (publisher) parts.push(`${publisher}.`);
  if (link) parts.push(link);
  return parts.join(" ").replace(/\s+\./g, ".").trim();
}

function formatApaIndonesia(meta: CitationMetadata): string {
  const authors = formatAuthorsIndonesian(meta.authors);
  const year = meta.published_year ? `(${meta.published_year})` : "(tanpa tahun)";
  const title = formatTitle(meta, "apa_indonesia");
  const publisher = formatPublisher(meta);
  const link = formatUrlOrDoi(meta);

  const parts = [`${authors} ${year}.`, `${title}.`];
  if (publisher) parts.push(`${publisher}.`);
  if (link) parts.push(link);
  return parts.join(" ").replace(/\s+\./g, ".").trim();
}

// === Public API ===

export async function formatCitation(
  meta: CitationMetadata,
  format: CitationFormat
): Promise<string> {
  switch (format) {
    case "apa":
      return formatApa(meta);
    case "mla":
      return formatMla(meta);
    case "chicago":
      return formatChicago(meta);
    case "apa_indonesia":
      return formatApaIndonesia(meta);
    default:
      return formatApa(meta);
  }
}

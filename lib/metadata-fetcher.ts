// lib/metadata-fetcher.ts
// Mengambil metadata publikasi dari DOI (CrossRef) atau URL (Cheerio meta-tag scraping).
import * as cheerio from "cheerio";
import type { CitationMetadata, SourceType, MetadataSourceType, Author } from "@/types/citation";

const CROSSREF_API = "https://api.crossref.org/works";

// Pattern DOI standar: 10.xxxx/yyyy
const DOI_PATTERN = /\b(10\.\d{4,9}\/[-._;()/:A-Z0-9]+)\b/i;

export function isDoi(input: string): boolean {
  return DOI_PATTERN.test(input);
}

/**
 * Extract DOI dari URL jika URL mengandung DOI di path-nya
 * (misal: https://doi.org/10.1234/abc, https://journal.example.com/article/10.1234/abc)
 */
export function extractDoiFromUrl(url: string): string | null {
  const match = url.match(DOI_PATTERN);
  return match ? match[1] : null;
}

interface CrossRefAuthor {
  given?: string;
  family?: string;
}

interface CrossRefWork {
  title?: string[];
  author?: CrossRefAuthor[];
  published_print?: { "date-parts"?: number[][] };
  published_online?: { "date-parts"?: number[][] };
  created?: { "date-parts"?: number[][] };
  publisher?: string;
  "container-title"?: string[];
  DOI?: string;
  URL?: string;
  type?: string;
}

function mapCrossRefType(type?: string): MetadataSourceType {
  if (!type) return "webpage";
  if (type.includes("journal")) return "journal";
  if (type.includes("book")) return "book";
  return "webpage";
}

function extractYear(work: CrossRefWork): number | null {
  const parts =
    work.published_print?.["date-parts"]?.[0] ??
    work.published_online?.["date-parts"]?.[0] ??
    work.created?.["date-parts"]?.[0];
  if (parts && parts[0]) return parts[0];
  return null;
}

function mapAuthors(raw?: CrossRefAuthor[]): Author[] {
  if (!raw || raw.length === 0) return [];
  return raw
    .filter((a) => a.given || a.family)
    .map((a) => ({
      given: a.given?.trim() ?? "",
      family: a.family?.trim() ?? "",
    }));
}

/**
 * Ambil metadata dari CrossRef API berdasarkan DOI.
 * Return null jika tidak ditemukan / request gagal.
 */
export async function fetchFromCrossRef(doi: string): Promise<CitationMetadata | null> {
  try {
    const cleanedDoi = doi.replace(/^https?:\/\/(dx\.)?doi\.org\//, "").trim();
    const url = `${CROSSREF_API}/${encodeURIComponent(cleanedDoi)}`;
    const res = await fetch(url, {
      headers: { "User-Agent": "Citify/0.1 (mailto:hello@citify.app)" },
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { message?: CrossRefWork };
    const work = json.message;
    if (!work || !work.title?.[0]) return null;

    const authors = mapAuthors(work.author);
    if (authors.length === 0) {
      // CrossRef selalu punya author; kalau tidak ada, skip
      return null;
    }

    return {
      title: work.title[0],
      authors,
      published_year: extractYear(work),
      publisher: work["container-title"]?.[0] ?? work.publisher ?? null,
      url: work.URL ?? `https://doi.org/${cleanedDoi}`,
      doi: work.DOI ?? cleanedDoi,
      source_type: mapCrossRefType(work.type),
    };
  } catch (err) {
    console.error("CrossRef fetch error:", err);
    return null;
  }
}

/**
 * Scraping meta tags dari URL generik.
 * Menggunakan: og:title, citation_author, citation_title, citation_publication_date,
 * citation_journal_title, citation_doi, og:url, dc.title
 */
export async function scrapeFromUrl(url: string): Promise<CitationMetadata | null> {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; CitifyBot/0.1; +https://citify.app)",
      },
      redirect: "follow",
    });
    if (!res.ok) return null;
    const html = await res.text();
    const $ = cheerio.load(html);

    // Title
    const title =
      $('meta[name="citation_title"]').attr("content") ??
      $('meta[property="og:title"]').attr("content") ??
      $("title").first().text() ??
      "";
    if (!title) return null;

    // Authors (citation_author bisa multiple)
    const authorEls = $('meta[name="citation_author"]').toArray();
    const authors: Author[] = authorEls
      .map((el) => $(el).attr("content") ?? "")
      .filter((s) => s.trim().length > 0)
      .map((full) => parseAuthorName(full));

    if (authors.length === 0) {
      // Fallback: dc.creator
      const dcCreator = $('meta[name="dc.creator"]').attr("content");
      if (dcCreator) authors.push(...dcCreator.split(",").map((s) => parseAuthorName(s.trim())));
    }
    if (authors.length === 0) {
      // Last resort: og:article:author
      const ogAuthor = $('meta[property="article:author"]').attr("content");
      if (ogAuthor) authors.push(parseAuthorName(ogAuthor));
    }
    if (authors.length === 0) return null;

    // Year
    const dateStr =
      $('meta[name="citation_publication_date"]').attr("content") ??
      $('meta[name="citation_date"]').attr("content") ??
      $('meta[property="article:published_time"]').attr("content") ??
      $('meta[name="dc.date"]').attr("content") ??
      "";
    const year = dateStr ? extractYearFromDate(dateStr) : null;

    // Publisher / journal
    const publisher =
      $('meta[name="citation_journal_title"]').attr("content") ??
      $('meta[name="citation_publisher"]').attr("content") ??
      $('meta[property="og:site_name"]').attr("content") ??
      null;

    // DOI
    const doi = $('meta[name="citation_doi"]').attr("content") ?? null;

    return {
      title: title.trim(),
      authors,
      published_year: year,
      publisher: publisher?.trim() ?? null,
      url,
      doi,
      source_type: doi ? "journal" : "webpage",
    };
  } catch (err) {
    console.error("Scrape error:", err);
    return null;
  }
}

function parseAuthorName(full: string): Author {
  const cleaned = full.trim();
  // Heuristik: jika ada koma, asumsikan "Family, Given"
  if (cleaned.includes(",")) {
    const [family, given] = cleaned.split(",").map((s) => s.trim());
    return { family: family || cleaned, given: given || "" };
  }
  // Jika spasi, ambil token terakhir sebagai family
  const parts = cleaned.split(/\s+/);
  if (parts.length === 1) return { given: "", family: parts[0] };
  const family = parts[parts.length - 1];
  const given = parts.slice(0, -1).join(" ");
  return { given, family };
}

function extractYearFromDate(dateStr: string): number | null {
  // Coba parse ISO date, lalu ambil tahun
  const d = new Date(dateStr);
  if (!isNaN(d.getTime())) return d.getFullYear();
  // Fallback: cari 4 digit tahun
  const m = dateStr.match(/\b(19|20)\d{2}\b/);
  return m ? parseInt(m[0], 10) : null;
}

/**
 * Fungsi utama: dispatch ke CrossRef atau Cheerio sesuai source_type.
 */
export async function fetchMetadata(
  sourceType: SourceType,
  value: string
): Promise<CitationMetadata | null> {
  if (sourceType === "doi") {
    return fetchFromCrossRef(value);
  }
  // URL
  const doiInUrl = extractDoiFromUrl(value);
  if (doiInUrl) {
    const fromCrossRef = await fetchFromCrossRef(doiInUrl);
    if (fromCrossRef) return fromCrossRef;
  }
  return scrapeFromUrl(value);
}

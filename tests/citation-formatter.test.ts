import { describe, it, expect } from "vitest";
import { formatCitation } from "@/lib/citation-formatter";
import type { CitationMetadata } from "@/types/citation";

const sample: CitationMetadata = {
  title: "Pengaruh Media Sosial terhadap Perilaku Remaja",
  authors: [{ given: "Budi", family: "Santoso" }],
  published_year: 2023,
  publisher: "Jurnal Komunikasi",
  url: "https://example.com/artikel",
  doi: "10.1234/xyz",
  source_type: "journal",
};

describe("citation-formatter: format output", () => {
  it("format APA menghasilkan string dengan author dan tahun", async () => {
    const result = await formatCitation(sample, "apa");
    expect(result).toContain("2023");
    expect(result.toLowerCase()).toContain("santoso");
  }, 15000);

  it("format MLA menghasilkan string dengan author", async () => {
    const result = await formatCitation(sample, "mla");
    expect(result.toLowerCase()).toContain("santoso");
  }, 15000);

  it("format Chicago menghasilkan string dengan author dan tahun", async () => {
    const result = await formatCitation(sample, "chicago");
    expect(result.toLowerCase()).toContain("santoso");
    expect(result).toContain("2023");
  }, 15000);

  it("format APA Indonesia tidak membalik nama (Budi Santoso, bukan Santoso, B.)", async () => {
    const result = await formatCitation(sample, "apa_indonesia");
    expect(result).toContain("Budi Santoso");
    expect(result).not.toMatch(/^Santoso,\s*B\./);
  }, 15000);

  it("format dengan multiple authors memuat semua nama", async () => {
    const multi: CitationMetadata = {
      ...sample,
      authors: [
        { given: "Andi", family: "Wijaya" },
        { given: "Siti", family: "Rahayu" },
      ],
    };
    const result = await formatCitation(multi, "apa");
    expect(result.toLowerCase()).toContain("wijaya");
    expect(result.toLowerCase()).toContain("rahayu");
  }, 15000);

  it("tidak error saat metadata minimal", async () => {
    const minimal: CitationMetadata = {
      title: "Artikel Minimal",
      authors: [{ given: "X", family: "Y" }],
      published_year: null,
      publisher: null,
      url: null,
      doi: null,
      source_type: "webpage",
    };
    const result = await formatCitation(minimal, "apa");
    expect(result.length).toBeGreaterThan(0);
  }, 15000);
});

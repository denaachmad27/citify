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

describe("citation-formatter: APA", () => {
  it("menghasilkan format APA 7 dengan author dibalik dan tahun di kurung", async () => {
    const result = await formatCitation(sample, "apa");
    expect(result).toContain("Santoso, B.");
    expect(result).toContain("(2023)");
    expect(result).toContain("https://doi.org/10.1234/xyz");
  });

  it("menggunakan 'n.d.' saat tahun tidak ada", async () => {
    const noYear = { ...sample, published_year: null };
    const result = await formatCitation(noYear, "apa");
    expect(result).toContain("(n.d.)");
  });
});

describe("citation-formatter: MLA", () => {
  it("menghasilkan format MLA dengan author 'Family, Given'", async () => {
    const result = await formatCitation(sample, "mla");
    expect(result).toContain("Santoso, Budi");
    expect(result).toContain("2023");
  });

  it("menggunakan 'et al.' untuk 3+ authors", async () => {
    const triple = {
      ...sample,
      authors: [
        { given: "Andi", family: "Wijaya" },
        { given: "Siti", family: "Rahayu" },
        { given: "Budi", family: "Santoso" },
      ],
    };
    const result = await formatCitation(triple, "mla");
    expect(result).toContain("et al.");
  });
});

describe("citation-formatter: Chicago", () => {
  it("menghasilkan format Chicago author-date", async () => {
    const result = await formatCitation(sample, "chicago");
    expect(result).toContain("Santoso, B.");
    expect(result).toContain("2023");
  });
});

describe("citation-formatter: APA Indonesia", () => {
  it("menulis nama lengkap 'Budi Santoso' (tidak dibalik)", async () => {
    const result = await formatCitation(sample, "apa_indonesia");
    expect(result).toContain("Budi Santoso");
    expect(result).not.toMatch(/^Santoso,\s*B\./);
  });

  it("memakai 'tanpa tahun' jika tahun null", async () => {
    const noYear = { ...sample, published_year: null };
    const result = await formatCitation(noYear, "apa_indonesia");
    expect(result).toContain("(tanpa tahun)");
  });
});

describe("citation-formatter: multiple authors", () => {
  it("menggunakan '&' untuk APA 2 authors", async () => {
    const two = {
      ...sample,
      authors: [
        { given: "Andi", family: "Wijaya" },
        { given: "Siti", family: "Rahayu" },
      ],
    };
    const result = await formatCitation(two, "apa");
    expect(result).toContain("Wijaya, A.");
    expect(result).toContain("Rahayu, S.");
    expect(result).toContain("&");
  });
});

describe("citation-formatter: edge cases", () => {
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
    expect(result).toContain("Y, X.");
  });

  it("prefers DOI over URL ketika keduanya ada", async () => {
    const result = await formatCitation(sample, "apa");
    expect(result).toContain("doi.org");
  });

  it("fallback ke URL ketika DOI tidak ada", async () => {
    const noDoi = { ...sample, doi: null };
    const result = await formatCitation(noDoi, "apa");
    expect(result).toContain("example.com/artikel");
  });
});

import { describe, it, expect } from "vitest";
import { isDoi, extractDoiFromUrl } from "@/lib/metadata-fetcher";

describe("metadata-fetcher: DOI detection", () => {
  it("mendeteksi DOI polos", () => {
    expect(isDoi("10.1234/abc")).toBe(true);
    expect(isDoi("10.1038/nature12373")).toBe(true);
    expect(isDoi("10.1000/xyz.123")).toBe(true);
  });

  it("menolak string non-DOI", () => {
    expect(isDoi("hello world")).toBe(false);
    expect(isDoi("1234.5678/abc")).toBe(false);
    expect(isDoi("")).toBe(false);
  });

  it("mengekstrak DOI dari URL doi.org", () => {
    expect(extractDoiFromUrl("https://doi.org/10.1234/abc")).toBe("10.1234/abc");
    expect(extractDoiFromUrl("http://dx.doi.org/10.1038/nature12373")).toBe("10.1038/nature12373");
  });

  it("mengekstrak DOI dari URL jurnal biasa", () => {
    expect(extractDoiFromUrl("https://journal.example.com/article/10.1000/xyz.123")).toBe("10.1000/xyz.123");
  });

  it("return null jika URL tidak mengandung DOI", () => {
    expect(extractDoiFromUrl("https://example.com/artikel")).toBeNull();
  });
});

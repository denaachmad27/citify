import { describe, it, expect } from "vitest";
import {
  fetchMetadataRequestSchema,
  formatCitationRequestSchema,
} from "@/lib/validations";

describe("validations: request schemas", () => {
  it("fetch-metadata request valid (url)", () => {
    const r = fetchMetadataRequestSchema.safeParse({
      source_type: "url",
      value: "https://example.com/artikel",
    });
    expect(r.success).toBe(true);
  });

  it("fetch-metadata request valid (doi)", () => {
    const r = fetchMetadataRequestSchema.safeParse({
      source_type: "doi",
      value: "10.1234/abc",
    });
    expect(r.success).toBe(true);
  });

  it("fetch-metadata request invalid (source_type salah)", () => {
    const r = fetchMetadataRequestSchema.safeParse({
      source_type: "invalid",
      value: "abc",
    });
    expect(r.success).toBe(false);
  });

  it("fetch-metadata request invalid (value kosong)", () => {
    const r = fetchMetadataRequestSchema.safeParse({
      source_type: "doi",
      value: "",
    });
    expect(r.success).toBe(false);
  });

  it("format request valid", () => {
    const r = formatCitationRequestSchema.safeParse({
      metadata: {
        title: "Test",
        authors: [{ given: "A", family: "B" }],
        published_year: 2024,
        publisher: "X",
        url: "https://x.com",
        doi: null,
        source_type: "journal",
      },
      format: "apa",
    });
    expect(r.success).toBe(true);
  });

  it("format request invalid (format tidak dikenal)", () => {
    const r = formatCitationRequestSchema.safeParse({
      metadata: {
        title: "T",
        authors: [{ given: "A", family: "B" }],
        published_year: 2024,
        publisher: null,
        url: null,
        doi: null,
        source_type: "webpage",
      },
      format: "harvard",
    });
    expect(r.success).toBe(false);
  });
});

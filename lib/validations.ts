import { z } from "zod";

// Author sub-schema
export const authorSchema = z.object({
  given: z.string().min(1),
  family: z.string().min(1),
});

export const citationFormatSchema = z.enum(["apa", "mla", "chicago", "apa_indonesia"]);

export const sourceTypeSchema = z.enum(["url", "doi"]);

export const metadataSourceTypeSchema = z.enum(["journal", "webpage", "book"]);

export const citationMetadataSchema = z.object({
  title: z.string().min(1),
  authors: z.array(authorSchema).min(1),
  published_year: z.number().int().nullable(),
  publisher: z.string().nullable(),
  url: z.string().url().nullable(),
  doi: z.string().nullable(),
  source_type: metadataSourceTypeSchema,
});

// Request schemas untuk API
export const fetchMetadataRequestSchema = z.object({
  source_type: sourceTypeSchema,
  value: z.string().min(3),
});

export type FetchMetadataRequest = z.infer<typeof fetchMetadataRequestSchema>;

export const formatCitationRequestSchema = z.object({
  metadata: citationMetadataSchema,
  format: citationFormatSchema,
});

export type FormatCitationRequest = z.infer<typeof formatCitationRequestSchema>;

// Domain types untuk Citify

export type CitationFormat = "apa" | "mla" | "chicago" | "apa_indonesia";

export type SourceType = "url" | "doi";

export type MetadataSourceType = "journal" | "webpage" | "book";

export interface Author {
  given: string;
  family: string;
}

export interface CitationMetadata {
  title: string;
  authors: Author[];
  published_year: number | null;
  publisher: string | null;
  url: string | null;
  doi: string | null;
  source_type: MetadataSourceType;
}

export interface FetchMetadataRequest {
  source_type: SourceType;
  value: string;
}

export interface FetchMetadataResponse {
  success: boolean;
  metadata?: CitationMetadata;
  error?: string;
  code?: string;
}

export interface FormatCitationRequest {
  metadata: CitationMetadata;
  format: CitationFormat;
}

export interface FormatCitationResponse {
  success: boolean;
  citation?: string;
  error?: string;
  code?: string;
}

export interface ProjectSummary {
  id: string;
  name: string;
  citation_count: number;
  updated_at: string;
}

export interface ProjectDetail {
  id: string;
  name: string;
  citations: CitationRecord[];
}

export interface CitationRecord {
  id: string;
  format: CitationFormat;
  text: string;
  created_at: string;
  metadata: CitationMetadata;
}

export interface UserPlan {
  type: "anonymous" | "free" | "premium";
  remaining: number; // sisa kuota bulan ini
}

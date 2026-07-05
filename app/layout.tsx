import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Citify — Daftar Pustaka Rapi, Otomatis",
  description:
    "Generator daftar pustaka otomatis untuk mahasiswa & siswa Indonesia. Format APA, MLA, Chicago, APA Indonesia — dari satu link.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body className="min-h-screen bg-paper text-ink antialiased">
        {children}
      </body>
    </html>
  );
}

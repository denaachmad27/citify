// Halaman utama: Generator sitasi SPA.
// Tidak butuh auth, tidak menyimpan data — pelajar input, pilih format, copy hasilnya.
import GenerateForm from "@/components/generate-form";

export default function HomePage() {
  return (
    <main className="relative min-h-screen">
      <div className="relative z-10 mx-auto max-w-[1320px] px-6 py-12 md:px-8 md:py-16">
        {/* Section header ala halaman koran */}
        <header className="mb-12 border-b border-ink pb-8">
          <div className="mb-6 flex items-center justify-between font-mono text-[10px] uppercase tracking-widest text-ink-muted">
            <div className="flex items-center gap-3">
              <span>edisi 01</span>
              <span>·</span>
              <span>2026</span>
              <span className="hidden sm:inline">·</span>
              <span className="hidden sm:inline">generator sitasi · untuk pelajar indonesia</span>
            </div>
            <span className="hidden md:inline">gratis · tanpa daftar</span>
          </div>

          <h1 className="font-display text-display-lg font-black tracking-tightest text-ink">
            Paste link,
            <br />
            dapat{" "}
            <em className="text-accent">sitasi</em>{" "}
            <span className="relative inline-block">
              rapi
              <svg
                className="absolute -bottom-2 left-0 w-full"
                viewBox="0 0 200 12"
                fill="none"
              >
                <path
                  d="M2 8 C 50 2, 150 2, 198 8"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="text-accent"
                />
              </svg>
            </span>
            .
          </h1>

          <p className="mt-5 max-w-2xl font-serif text-lg text-ink-soft">
            Tempel URL atau DOI jurnal, pilih format — kami kerjakan sisanya.
            Tinggal <em>copy</em> hasilnya. Gratis selamanya.
          </p>
        </header>

        {/* Generator + sidebar info */}
        <div className="grid grid-cols-12 gap-10">
          <section className="col-span-12 lg:col-span-8">
            <GenerateForm />
          </section>

          <aside className="col-span-12 lg:col-span-4">
            <div className="border-l border-ink-rule pl-8">
              <div className="smallcaps mb-3">Empat format, satu konsistensi</div>

              <dl className="space-y-5">
                {[
                  {
                    code: "APA",
                    full: "American Psychological Association",
                    note: "Standar paling umum untuk skripsi di Indonesia.",
                  },
                  {
                    code: "MLA",
                    full: "Modern Language Association",
                    note: "Dominan di bidang humaniora dan sastra.",
                  },
                  {
                    code: "CHI",
                    full: "Chicago Manual of Style",
                    note: "Pilihan untuk sejarah dan ilmu sosial.",
                  },
                  {
                    code: "ID",
                    full: "APA Indonesia",
                    note: "Modifikasi untuk kebiasaan kampus lokal.",
                  },
                ].map((item) => (
                  <div
                    key={item.code}
                    className="border-t border-ink-rule pt-3"
                  >
                    <div className="flex items-baseline gap-3">
                      <span className="ordinal text-xl">{item.code}</span>
                      <span className="font-display text-sm font-medium text-ink">
                        {item.full}
                      </span>
                    </div>
                    <p className="mt-1 font-serif text-sm text-ink-soft">
                      {item.note}
                    </p>
                  </div>
                ))}
              </dl>

              <div className="mt-10 border-t border-ink-rule pt-6">
                <div className="smallcaps mb-2">Cara pakai</div>
                <ol className="space-y-2 font-serif text-sm text-ink-soft">
                  <li>
                    <span className="ordinal mr-2">1.</span>
                    Tempel URL atau ketik DOI
                  </li>
                  <li>
                    <span className="ordinal mr-2">2.</span>
                    Pilih format
                  </li>
                  <li>
                    <span className="ordinal mr-2">3.</span>
                    Tekan <em>+ Tambah</em>
                  </li>
                  <li>
                    <span className="ordinal mr-2">4.</span>
                    Salin satu per satu atau semua sekaligus
                  </li>
                </ol>
              </div>

              <div className="mt-10 border-t border-ink-rule pt-6">
                <p className="font-serif text-xs italic text-ink-muted">
                  Data tidak disimpan ke server. Daftar pustaka ada di memori
                  sesi — refresh halaman berarti mulai ulang.
                </p>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}

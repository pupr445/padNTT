import "./globals.css";
import Link from "next/link";
import { getCurrentProfile } from "@/lib/auth";
import { ROLE_LABEL } from "@/lib/types";
import { signOutAction } from "@/lib/actions/auth";

export const metadata = {
  title: "Optimalisasi PAD — Dinas PUPR NTT",
  description: "Aplikasi Tim Terpadu Optimalisasi Pendapatan Asli Daerah, Dinas PUPR Provinsi NTT",
};

const navItems = [
  { href: "/", label: "Dashboard" },
  { href: "/objek-pad", label: "Objek PAD" },
  { href: "/tindak-lanjut", label: "Tindak lanjut" },
  { href: "/laporan", label: "Laporan" },
  { href: "/tim", label: "Struktur tim" },
];

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const profile = await getCurrentProfile();

  return (
    <html lang="id">
      <body>
        {!profile ? (
          // Halaman /login tidak pakai sidebar — middleware sudah mengarahkan
          // pengguna belum login ke sini, jadi cukup render children apa adanya.
          children
        ) : (
          <div style={{ display: "flex", minHeight: "100vh" }}>
            <aside
              style={{
                width: 220,
                borderRight: "1px solid var(--border)",
                padding: "1.25rem 1rem",
                flexShrink: 0,
                display: "flex",
                flexDirection: "column",
              }}
            >
              <div style={{ marginBottom: "1.5rem" }}>
                <p style={{ fontWeight: 600, fontSize: 15, margin: 0 }}>Optimalisasi PAD</p>
                <p style={{ fontSize: 12, color: "var(--text-secondary)", margin: "2px 0 0" }}>
                  Dinas PUPR — NTT
                </p>
              </div>
              <nav style={{ display: "flex", flexDirection: "column", gap: 2, flex: 1 }}>
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    style={{
                      color: "var(--text-primary)",
                      fontSize: 14,
                      padding: "8px 10px",
                      borderRadius: 8,
                    }}
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>

              <div style={{ borderTop: "1px solid var(--border)", paddingTop: 12, marginTop: 12 }}>
                <p style={{ fontSize: 13, fontWeight: 500, margin: 0 }}>{profile.nama_lengkap}</p>
                <p style={{ fontSize: 11, color: "var(--text-secondary)", margin: "2px 0 8px" }}>
                  {ROLE_LABEL[profile.role]}
                  {profile.pokja ? ` · Pokja ${profile.pokja}` : ""}
                </p>
                <form action={signOutAction}>
                  <button type="submit" className="btn" style={{ width: "100%", fontSize: 13 }}>
                    Keluar
                  </button>
                </form>
              </div>
            </aside>
            <main style={{ flex: 1, padding: "1.5rem 2rem", maxWidth: 1100 }}>{children}</main>
          </div>
        )}
      </body>
    </html>
  );
}

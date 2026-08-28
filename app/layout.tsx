import "./globals.css";
import { getCurrentProfile } from "@/lib/auth";
import { ROLE_LABEL } from "@/lib/types";
import { signOutAction } from "@/lib/actions/auth";
import { IconLogout } from "@/lib/icons";
import SidebarNav from "./nav-links";

export const metadata = {
  title: "OPTIMA PAD NTT",
  description: "Sistem Optimalisasi Pendapatan Asli Daerah -- Tim Terpadu, Dinas PUPR Provinsi NTT",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const profile = await getCurrentProfile();

  return (
    <html lang="id">
      <body>
        {!profile ? (
          // Halaman /login tidak pakai sidebar -- middleware sudah mengarahkan
          // pengguna belum login ke sini, jadi cukup render children apa adanya.
          children
        ) : (
          <div className="app-shell">
            <aside className="sidebar">
              <div className="brand">
                <div className="brand-mark">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 21s-7-6.3-7-11.5A7 7 0 0 1 19 9.5C19 14.7 12 21 12 21Z" />
                    <circle cx="12" cy="9.5" r="2.2" />
                  </svg>
                </div>
                <div>
                  <div className="brand-name">OPTIMA PAD</div>
                  <div className="brand-tag">NTT &middot; SK 272/2026</div>
                </div>
              </div>

              <SidebarNav role={profile.role} />

              <div className="sidebar-footer">
                <div className="user-card">
                  <div>
                    <p className="user-name">{profile.nama_lengkap}</p>
                    <p className="user-role">
                      {ROLE_LABEL[profile.role]}
                      {profile.pokja ? ` \u00b7 Pokja ${profile.pokja}` : ""}
                    </p>
                  </div>
                  <form action={signOutAction}>
                    <button type="submit" className="btn btn-ghost" style={{ width: "100%", justifyContent: "flex-start", color: "var(--text-on-ink-muted)" }}>
                      <IconLogout size={14} />
                      Keluar
                    </button>
                  </form>
                </div>
              </div>
            </aside>
            <main className="main">{children}</main>
          </div>
        )}
      </body>
    </html>
  );
}

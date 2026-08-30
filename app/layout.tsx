import "./globals.css";
import { getCurrentProfile } from "@/lib/auth";
import { ROLE_LABEL } from "@/lib/types";
import { signOutAction } from "@/lib/actions/auth";
import { IconLogout } from "@/lib/icons";
import SidebarNav from "./nav-links";
import OfflineStatusBadge from "./offline-status";
import ServiceWorkerRegister from "./sw-register";

export const metadata = {
  title: "OPTIMA PAD NTT",
  description: "Sistem Optimalisasi Pendapatan Asli Daerah -- Tim Terpadu, Dinas PUPR Provinsi NTT",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icons/icon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/icons/apple-touch-icon.png",
  },
};

export const viewport = {
  themeColor: "#0D1B2A",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const profile = await getCurrentProfile();

  return (
    <html lang="id">
      <body>
        <ServiceWorkerRegister />
        {!profile ? (
          // Halaman /login tidak pakai sidebar -- middleware sudah mengarahkan
          // pengguna belum login ke sini, jadi cukup render children apa adanya.
          children
        ) : (
          <div className="app-shell">
            <aside className="sidebar">
              <div className="brand">
                <img src="/brand/logo.png" alt="Logo OPTIMA PAD NTT" className="brand-mark" />
                <div>
                  <div className="brand-name">OPTIMA PAD</div>
                  <div className="brand-tag">NTT &middot; SK 272/2026</div>
                </div>
              </div>

              <SidebarNav role={profile.role} />
              <OfflineStatusBadge />

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

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { IconGrid, IconMapPin, IconLayers, IconFlag, IconFileText, IconUsers, IconShieldUser } from "@/lib/icons";
import type { Role } from "@/lib/types";

const navGroups = [
  {
    label: "Ringkasan",
    items: [{ href: "/", label: "Dashboard", icon: IconGrid }],
  },
  {
    label: "Pokja I \u2014 Inventarisasi",
    items: [
      { href: "/objek-pad", label: "Objek PAD", icon: IconLayers },
      { href: "/peta", label: "Peta potensi", icon: IconMapPin },
    ],
  },
  {
    label: "Pokja II \u2014 Intervensi",
    items: [{ href: "/tindak-lanjut", label: "Tindak lanjut", icon: IconFlag }],
  },
  {
    label: "Pokja III \u2014 Monev",
    items: [{ href: "/laporan", label: "Laporan berkala", icon: IconFileText }],
  },
  {
    label: "Tim terpadu",
    items: [{ href: "/tim", label: "Struktur tim", icon: IconUsers }],
  },
];

export default function SidebarNav({ role }: { role: Role }) {
  const pathname = usePathname();

  return (
    <nav style={{ flex: 1, overflowY: "auto" }}>
      {navGroups.map((group) => (
        <div key={group.label}>
          <div className="nav-group-label">{group.label}</div>
          {group.items.map((item) => {
            const Icon = item.icon;
            const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            return (
              <Link key={item.href} href={item.href} className={`nav-link${active ? " active" : ""}`}>
                <Icon size={15} />
                {item.label}
              </Link>
            );
          })}
        </div>
      ))}

      {role === "super_admin" && (
        <div>
          <div className="nav-group-label">Administrasi</div>
          <Link href="/admin" className={`nav-link${pathname.startsWith("/admin") ? " active" : ""}`}>
            <IconShieldUser size={15} />
            Kelola akun
          </Link>
        </div>
      )}
    </nav>
  );
}

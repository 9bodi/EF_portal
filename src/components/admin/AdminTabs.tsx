"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/admin", label: "E-learning" },
  { href: "/admin/formations", label: "Formations présentielles" },
];

export default function AdminTabs() {
  const pathname = usePathname();
  return (
    <div style={{ background: "#2e3280", padding: "0 24px", display: "flex", gap: 4 }}>
      {TABS.map((t) => {
        const active = t.href === "/admin" ? pathname === "/admin" : pathname.startsWith(t.href);
        return (
          <Link key={t.href} href={t.href} style={{
            padding: "12px 20px", fontSize: 14, fontWeight: 600, textDecoration: "none",
            color: active ? "#fff" : "#9aa5b8",
            borderBottom: active ? "3px solid #fff" : "3px solid transparent",
          }}>
            {t.label}
          </Link>
        );
      })}
    </div>
  );
}

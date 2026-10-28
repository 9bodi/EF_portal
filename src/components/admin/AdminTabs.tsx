"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const TABS = [
  { href: "/admin", label: "E-learning" },
  { href: "/admin/formations", label: "Formations présentielles" },
  { href: "/admin/leads", label: "Leads" },
];

export default function AdminTabs() {
  const pathname = usePathname();
  const [newCount, setNewCount] = useState(0);

  useEffect(() => {
    fetch("/api/admin/leads/count")
      .then((r) => r.json())
      .then((d) => setNewCount(d.count || 0))
      .catch(() => {});
  }, []);

  return (
    <div style={{ background: "#2e3280", padding: "0 24px", display: "flex", gap: 4 }}>
      {TABS.map((t) => {
        const active =
          t.href === "/admin"
            ? pathname === "/admin" || pathname.startsWith("/admin/learner")
            : pathname.startsWith(t.href);
        return (
          <Link
            key={t.href}
            href={t.href}
            style={{
              padding: "12px 20px",
              fontSize: 14,
              fontWeight: 600,
              textDecoration: "none",
              color: active ? "#fff" : "#9aa5b8",
              borderBottom: active ? "3px solid #fff" : "3px solid transparent",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            {t.label}
            {t.href === "/admin/leads" && newCount > 0 && (
              <span
                style={{
                  background: "#ef4444",
                  color: "#fff",
                  fontSize: 11,
                  fontWeight: 700,
                  borderRadius: 10,
                  padding: "2px 7px",
                  lineHeight: "16px",
                }}
              >
                {newCount}
              </span>
            )}
          </Link>
        );
      })}
    </div>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export const NAV_ITEMS = [
  { href: "/", label: "Hoy", icon: "📅" },
  { href: "/casos", label: "Casos", icon: "🛠️" },
  { href: "/clientes", label: "Clientes", icon: "👥" },
  { href: "/stock", label: "Stock", icon: "📦" },
  { href: "/finanzas", label: "Finanzas", icon: "💰" },
];

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

export function SideNav({ businessName }: { businessName: string }) {
  const pathname = usePathname();
  return (
    <aside className="fixed inset-y-0 left-0 z-10 hidden w-60 flex-col border-r border-border bg-surface md:flex">
      <div className="flex items-center gap-3 px-5 py-5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/icon.svg" alt="" className="h-9 w-9" />
        <div className="min-w-0">
          <p className="truncate font-bold leading-tight">{businessName}</p>
          <p className="text-xs text-muted">Servicio técnico</p>
        </div>
      </div>
      <nav className="flex-1 px-3">
        <Link href="/casos/nuevo" className="btn mb-4 w-full">＋ Nuevo caso</Link>
        <ul className="space-y-1">
          {NAV_ITEMS.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2.5 ${active ? "bg-accent-soft font-semibold text-accent" : "text-muted hover:bg-accent-soft/50"}`}
                >
                  <span aria-hidden>{item.icon}</span>
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <div className="space-y-1 px-3 pb-5">
        <Link
          href="/recordatorios"
          className={`flex items-center gap-3 rounded-xl px-3 py-2.5 ${isActive(pathname, "/recordatorios") ? "bg-accent-soft font-semibold text-accent" : "text-muted"}`}
        >
          <span aria-hidden>🔔</span> Recordatorios
        </Link>
        <Link
          href="/ajustes"
          className={`flex items-center gap-3 rounded-xl px-3 py-2.5 ${isActive(pathname, "/ajustes") ? "bg-accent-soft font-semibold text-accent" : "text-muted"}`}
        >
          <span aria-hidden>⚙️</span> Ajustes
        </Link>
      </div>
    </aside>
  );
}

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-10 border-t border-border bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
      <ul className="mx-auto grid max-w-lg grid-cols-5">
        {NAV_ITEMS.map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`flex flex-col items-center gap-0.5 py-2 text-xs ${active ? "font-semibold text-accent" : "text-muted"}`}
              >
                <span className="text-xl" aria-hidden>{item.icon}</span>
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

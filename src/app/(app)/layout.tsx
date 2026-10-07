import Link from "next/link";
import { getContext } from "@/lib/data";
import { BottomNav, SideNav } from "./nav";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const { business } = await getContext();
  return (
    <>
      <SideNav businessName={business.name} />
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-surface/95 px-4 py-3 backdrop-blur md:hidden">
        <Link href="/" className="flex items-center gap-2 font-bold">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icon.svg" alt="" className="h-7 w-7" />
          {business.name}
        </Link>
        <div className="flex items-center gap-2">
          <Link href="/ajustes" className="px-2 text-lg" aria-label="Ajustes">⚙️</Link>
          <Link href="/casos/nuevo" className="btn btn-sm">＋ Caso</Link>
        </div>
      </header>
      <div className="md:pl-60">
        <main className="mx-auto max-w-5xl px-4 pt-5 pb-28 md:px-8 md:pt-8 md:pb-10">{children}</main>
      </div>
      <BottomNav />
    </>
  );
}

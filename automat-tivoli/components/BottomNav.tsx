"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { IconCamera, IconClock, IconGrid, IconHome, IconList } from "./Icons";

const TABS = [
  { href: "/", label: "Start", Icon: IconHome },
  { href: "/plan", label: "Plan", Icon: IconGrid },
  { href: "/zaehlen", label: "Zählen", Icon: IconCamera, gross: true },
  { href: "/bestellung", label: "Bestellen", Icon: IconList },
  { href: "/verlauf", label: "Verlauf", Icon: IconClock },
];

export default function BottomNav() {
  const pfad = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-bg/90 backdrop-blur-xl pb-[env(safe-area-inset-bottom)]">
      <ul className="mx-auto grid max-w-xl grid-cols-5">
        {TABS.map(({ href, label, Icon, gross }) => {
          const aktiv = href === "/" ? pfad === "/" : pfad.startsWith(href);
          return (
            <li key={href}>
              <Link
                href={href}
                className={`flex h-[68px] flex-col items-center justify-center gap-1 text-[11px] font-medium ${aktiv ? "text-accent" : "text-muted"}`}
              >
                {gross ? (
                  <span className={`-mt-5 grid size-12 place-items-center rounded-2xl shadow-lg ${aktiv ? "bg-accent text-black" : "bg-zinc-100 text-black"}`}>
                    <Icon className="size-6" />
                  </span>
                ) : (
                  <Icon className="size-6" />
                )}
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

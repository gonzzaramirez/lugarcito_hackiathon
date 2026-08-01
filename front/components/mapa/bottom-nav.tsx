"use client";

import { Map, Star, User } from "lucide-react";

import { cn } from "@/lib/utils";

const ITEMS = [
  { icon: Map, label: "Mapa", active: true },
  { icon: Star, label: "Favoritos", active: false },
  { icon: User, label: "Perfil", active: false },
] as const;

export function BottomNav() {
  return (
    <nav className="shrink-0 border-t border-[#27272A] bg-[#09090B] pb-[env(safe-area-inset-bottom)]">
      <div className="flex h-[72px] items-stretch">
        {ITEMS.map((item) => (
          <button
            key={item.label}
            type="button"
            className={cn(
              "flex flex-1 flex-col items-center justify-center gap-1 text-[11px]",
              item.active ? "text-[#22C55E]" : "text-[#A1A1AA]"
            )}
          >
            <item.icon className="size-5" />
            {item.label}
          </button>
        ))}
      </div>
    </nav>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, KanbanSquare, BarChart3, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Analytics", href: "/", icon: BarChart3 },
  { name: "Projects", href: "/projects", icon: LayoutDashboard },
  { name: "Board", href: "/board", icon: KanbanSquare },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="flex w-64 flex-col bg-sidebar-bg text-gray-300 border-r border-hairline">
      <div className="flex h-16 items-center px-6 border-b border-white/10">
        <KanbanSquare className="h-6 w-6 text-primary-accent mr-2" />
        <span className="text-lg font-heading font-bold tracking-tight text-white">Trello</span>
      </div>
      <div className="flex flex-1 flex-col overflow-y-auto px-4 py-4">
        <nav className="flex-1 space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150 ease-in-out",
                  isActive
                    ? "bg-primary-accent/10 text-primary-accent"
                    : "text-gray-400 hover:bg-white/5 hover:text-gray-100"
                )}
              >
                <item.icon
                  className={cn(
                    "mr-3 h-5 w-5",
                    isActive ? "text-primary-accent" : "text-gray-500 group-hover:text-gray-300"
                  )}
                  aria-hidden="true"
                />
                {item.name}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto pt-4">
          <a
            href="#"
            className="group flex items-center rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors"
          >
            <Settings className="mr-3 h-5 w-5 shrink-0 text-gray-400 group-hover:text-gray-500" aria-hidden="true" />
            Settings
          </a>
        </div>
      </div>
    </div>
  );
}

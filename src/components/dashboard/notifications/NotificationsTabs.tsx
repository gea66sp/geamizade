"use client";

import { useState } from "react";

export type TabDefinition = {
  key: string;
  label: string;
  icon: string;
  badge?: number;
  content: React.ReactNode;
};

// Alterna as seções do módulo de notificações no cliente. As abas em si são
// montadas no Server Component de cada área, que já filtra o que aquele cargo
// pode ver — aqui é só apresentação.
export default function NotificationsTabs({ tabs }: { tabs: TabDefinition[] }) {
  const [active, setActive] = useState(tabs[0]?.key ?? "");

  const activeTab = tabs.find((t) => t.key === active) ?? tabs[0];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-1">
        {tabs.map((tab) => {
          const isActive = tab.key === activeTab?.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActive(tab.key)}
              className={`cursor-pointer px-4 py-2.5 rounded-t-xl text-sm font-bold border-b-3 transition-all flex items-center gap-2 ${
                isActive
                  ? "border-scout-green text-scout-green bg-scout-green/5"
                  : "border-transparent text-gray-500 hover:text-gray-800 hover:bg-gray-50"
              }`}
            >
              <i className={`fa-solid ${tab.icon}`}></i>
              {tab.label}
              {typeof tab.badge === "number" && tab.badge > 0 && (
                <span className="min-w-5 h-5 px-1.5 flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-black">
                  {tab.badge > 9 ? "9+" : tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div>{activeTab?.content}</div>
    </div>
  );
}

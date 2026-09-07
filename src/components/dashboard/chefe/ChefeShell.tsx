"use client";

import { useState } from "react";
import ChefeSidebar from "./ChefeSidebar";
import NotificationBell from "@/src/components/dashboard/NotificationBell";

interface ChefeShellProps {
  children: React.ReactNode;
  userName?: string | null;
  userRole?: string;
  userImage?: string | null;
}

export default function ChefeShell({ children, userName, userRole, userImage }: ChefeShellProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans text-gray-800">
      <ChefeSidebar
        userName={userName}
        userRole={userRole}
        userImage={userImage}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col overflow-hidden relative w-full">
        <header className="md:hidden flex items-center justify-between p-4 bg-scout-dark text-white shadow-md z-10 border-b border-scout-yellow/20">
          <div className="font-heading font-bold text-xl tracking-wide flex items-center gap-3">
            <i className="fa-solid fa-fire text-scout-yellow text-2xl"></i>
            GE Amizade
          </div>

          <div className="flex items-center gap-1">
            <NotificationBell basePath="/chefe" tone="dark" />

            <button
              onClick={() => setIsSidebarOpen(true)}
              aria-label="Abrir menu"
              aria-expanded={isSidebarOpen}
              className="p-2 w-10 h-10 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-scout-yellow transition-all"
            >
              <i className="fa-solid fa-bars text-xl"></i>
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 custom-scrollbar">
          <div className="max-w-7xl mx-auto w-full animate-fade-in-up">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

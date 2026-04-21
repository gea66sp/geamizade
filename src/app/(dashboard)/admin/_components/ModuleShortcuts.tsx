import Link from "next/link";

export function ModuleShortcuts() {
  const modules = [
    { 
      name: "Membros", 
      href: "/admin/usuarios", 
      icon: "fa-solid fa-users", 
      colorClass: "text-scout-green bg-scout-green/10 group-hover:bg-scout-green group-hover:text-white border-scout-green/20" 
    },
    { 
      name: "Financeiro", 
      href: "/admin/financeiro", 
      icon: "fa-solid fa-money-bill-trend-up", 
      colorClass: "text-amber-500 bg-amber-50 group-hover:bg-amber-500 group-hover:text-white border-amber-200" 
    },
    { 
      name: "Transparência", 
      href: "/admin/transparencia", 
      icon: "fa-solid fa-magnifying-glass-chart", 
      colorClass: "text-blue-500 bg-blue-50 group-hover:bg-blue-500 group-hover:text-white border-blue-200" 
    },
    { 
      name: "Personalizar Site", 
      href: "/admin/personalizar", 
      icon: "fa-solid fa-palette", 
      colorClass: "text-purple-500 bg-purple-50 group-hover:bg-purple-500 group-hover:text-white border-purple-200" 
    },
    { 
      name: "Calendário", 
      href: "/admin/calendario", 
      icon: "fa-solid fa-calendar-days", 
      colorClass: "text-rose-500 bg-rose-50 group-hover:bg-rose-500 group-hover:text-white border-rose-200" 
    },
    { 
      name: "Editar Perfil", 
      href: "/admin/perfil", 
      icon: "fa-solid fa-user-edit", 
      colorClass: "text-gray-500 bg-gray-100 group-hover:bg-gray-700 group-hover:text-white border-gray-200" 
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 md:gap-4">
      {modules.map((mod) => (
        <Link 
          key={mod.name} 
          href={mod.href}
          className="flex flex-col items-center justify-center p-4 md:p-5 rounded-2xl bg-white border border-gray-200 shadow-sm hover:shadow-md hover:border-gray-300 transition-all duration-300 group active:scale-95"
        >
          {/* Ícone com transição de cor e escala */}
          <div 
            className={`w-12 h-12 md:w-14 md:h-14 rounded-xl flex items-center justify-center text-xl md:text-2xl mb-3 transition-all duration-300 group-hover:scale-110 border ${mod.colorClass}`}
          >
            <i className={mod.icon}></i>
          </div>
          
          {/* Nome do Módulo */}
          <span className="text-xs md:text-sm font-bold text-gray-700 text-center group-hover:text-gray-900 leading-tight">
            {mod.name}
          </span>
        </Link>
      ))}
    </div>
  );
}
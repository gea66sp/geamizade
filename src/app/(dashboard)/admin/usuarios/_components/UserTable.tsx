"use client";

import { useState } from "react";
import { Role, Branch } from "@prisma/client";
import Image from "next/image";
import ModalNovoUsuario from "./ModalNovoUsuario";
import ModalVisualizarUsuario from "./ModalVisualizarUsuario";
import ModalEditarUsuario from "./ModalEditarUsuario"; // NOVO
import ModalExcluirUsuario from "./ModalExcluirUsuario"; // NOVO

interface User {
  id: string;
  name: string | null;
  email: string | null;
  role: Role;
  branch: Branch | null;
  image: string | null;
}

interface UserTableProps {
  users: User[];
  currentUserRole: Role;
}

export default function UserTable({ users, currentUserRole }: UserTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<Role | "ALL">("ALL");
  
  // Controle dos Modais
  const [isNewUserModalOpen, setIsNewUserModalOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Usuário Selecionado (Útil para extrair o Nome pro modal de exclusão)
  const selectedUser = users.find(u => u.id === selectedUserId);

  // Lógica de Filtro Instantâneo
  const filteredUsers = users.filter((user) => {
    const matchesSearch = 
      user.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = roleFilter === "ALL" || user.role === roleFilter;

    return matchesSearch && matchesRole;
  });

  const getRoleBadge = (role: Role) => {
    const styles: Record<Role, string> = {
      ADMIN: "bg-red-50 text-red-700 border-red-200",
      DEVELOPER: "bg-purple-50 text-purple-700 border-purple-200",
      FINANCEIRO: "bg-emerald-50 text-emerald-700 border-emerald-200",
      CHEFE: "bg-blue-50 text-blue-700 border-blue-200",
      RESPONSAVEL: "bg-amber-50 text-amber-700 border-amber-200",
      MEMBER: "bg-gray-50 text-gray-700 border-gray-200",
    };
    return (
      <span className={`inline-flex items-center px-2.5 py-1 text-[10px] sm:text-xs font-bold uppercase tracking-wider rounded-md border ${styles[role]}`}>
        {role}
      </span>
    );
  };

  const handleAction = (action: 'VIEW' | 'EDIT' | 'DELETE', userId: string) => {
    setSelectedUserId(userId);
    if (action === 'VIEW') setIsViewModalOpen(true);
    if (action === 'EDIT') setIsEditModalOpen(true);
    if (action === 'DELETE') setIsDeleteModalOpen(true);
  };

  return (
    <>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col min-h-0">
        
        {/* BARRA DE FERRAMENTAS */}
        <div className="p-4 md:p-5 border-b border-gray-200 bg-gray-50 flex flex-col md:flex-row gap-4 justify-between items-center shrink-0">
          <div className="flex flex-col sm:flex-row w-full md:w-auto gap-3 flex-1">
            <div className="relative w-full sm:max-w-sm">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <i className="fa-solid fa-magnifying-glass text-gray-400"></i>
              </div>
              <input type="text" className="block w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-scout-green/20 focus:border-scout-green sm:text-sm transition-all outline-none" placeholder="Buscar por nome ou e-mail..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>

            <div className="relative w-full sm:max-w-50">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <i className="fa-solid fa-filter text-gray-400"></i>
              </div>
              <select className="block w-full bg-white border border-gray-200 rounded-xl py-2.5 pl-10 pr-8 text-sm focus:ring-2 focus:ring-scout-green/20 focus:border-scout-green outline-none appearance-none cursor-pointer transition-all" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value as Role | "ALL")}>
                <option value="ALL">Todos os Cargos</option>
                <option value="ADMIN">Administradores</option>
                <option value="CHEFE">Chefes</option>
                <option value="DIRETORIA">Diretoria</option>
                <option value="FINANCEIRO">Financeiro</option>
                <option value="RESPONSAVEL">Responsáveis</option>
                <option value="MEMBER">Membros (Jovens)</option>
              </select>
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <i className="fa-solid fa-chevron-down text-gray-400 text-xs"></i>
              </div>
            </div>
          </div>

          <button onClick={() => setIsNewUserModalOpen(true)} className="cursor-pointer w-full md:w-auto flex items-center justify-center gap-2 bg-scout-green text-white px-6 py-2.5 rounded-xl hover:bg-green-700 transition-all font-bold shadow-sm active:scale-95 text-sm shrink-0">
            <i className="fa-solid fa-user-plus"></i> Novo Usuário
          </button>
        </div>

        {/* VERSÃO MOBILE (LISTA DE CARDS) */}
        <div className="md:hidden flex flex-col divide-y divide-gray-100 overflow-y-auto">
          {filteredUsers.length > 0 ? (
            filteredUsers.map((user) => (
              <div key={user.id} className="p-4 bg-white hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3 mb-3">
                  <div className="shrink-0 h-12 w-12 rounded-full border-2 border-gray-100 shadow-sm overflow-hidden bg-scout-green/10 flex items-center justify-center text-scout-green font-bold text-lg">
                    {user.image ? <Image className="h-full w-full object-cover" src={user.image} alt={user.name || "User"} width={48} height={48} /> : user.name?.charAt(0).toUpperCase() || "?"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-bold text-gray-900 truncate">{user.name || "Sem nome"}</h4>
                    <p className="text-xs text-gray-500 truncate mt-0.5">{user.email}</p>
                  </div>
                </div>
                
                <div className="flex items-center justify-between bg-gray-50 p-2.5 rounded-lg border border-gray-100 mb-3">
                  {getRoleBadge(user.role)}
                  <div className="text-xs font-bold text-gray-500 flex items-center gap-1.5">
                    <i className="fa-solid fa-people-group text-gray-400"></i>
                    {user.branch ? <span className="capitalize">{user.branch.toLowerCase()}</span> : <span className="italic opacity-50">S/ Ramo</span>}
                  </div>
                </div>

                {/* BOTÕES MOBILE */}
                <div className="grid grid-cols-3 gap-2">
                  <button onClick={() => handleAction('VIEW', user.id)} className="cursor-pointer flex items-center justify-center gap-1 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg text-xs font-bold transition-colors">
                    <i className="fa-solid fa-eye"></i> Ver
                  </button>
                  <button onClick={() => handleAction('EDIT', user.id)} className="cursor-pointer flex items-center justify-center gap-1 py-2 bg-amber-50 text-amber-600 hover:bg-amber-100 rounded-lg text-xs font-bold transition-colors">
                    <i className="fa-solid fa-pen"></i> Editar
                  </button>
                  <button onClick={() => handleAction('DELETE', user.id)} className="cursor-pointer flex items-center justify-center gap-1 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg text-xs font-bold transition-colors">
                    <i className="fa-solid fa-trash-can"></i> Excluir
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="p-10 text-center flex flex-col items-center">
              <i className="fa-solid fa-users-slash text-4xl text-gray-300 mb-3"></i>
              <p className="text-gray-500 font-medium">Nenhum usuário encontrado.</p>
            </div>
          )}
        </div>

        {/* VERSÃO DESKTOP (TABELA) */}
        <div className="hidden md:block overflow-y-auto flex-1 custom-scrollbar">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 sticky top-0 z-10 shadow-sm">
              <tr>
                <th scope="col" className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Usuário</th>
                <th scope="col" className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Cargo Principal</th>
                <th scope="col" className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Ramo de Atuação</th>
                <th scope="col" className="px-6 py-3.5 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50/80 transition-colors group">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-4">
                        <div className="shrink-0 h-10 w-10 rounded-full border border-gray-200 shadow-sm overflow-hidden bg-scout-green/10 flex items-center justify-center text-scout-green font-bold">
                          {user.image ? <Image className="h-full w-full object-cover" src={user.image} alt="" width={40} height={40} /> : user.name?.charAt(0).toUpperCase() || "?"}
                        </div>
                        <div>
                          <div className="text-sm font-bold text-gray-900">{user.name || "Sem nome"}</div>
                          <div className="text-xs text-gray-500 mt-0.5">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{getRoleBadge(user.role)}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {user.branch ? (
                        <span className="inline-flex items-center gap-2 text-sm font-semibold text-gray-700 capitalize">
                          <i className="fa-solid fa-people-group text-gray-400 text-xs"></i> {user.branch.toLowerCase()}
                        </span>
                      ) : <span className="text-gray-400 italic text-sm">Não atribuído</span>}
                    </td>
                    
                    {/* BOTÕES DESKTOP */}
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleAction('VIEW', user.id)} className="cursor-pointer w-8 h-8 inline-flex items-center justify-center bg-gray-50 hover:bg-blue-50 text-gray-400 hover:text-blue-600 rounded-lg transition-colors" title="Visualizar Ficha">
                          <i className="fa-solid fa-eye"></i>
                        </button>
                        <button onClick={() => handleAction('EDIT', user.id)} className="cursor-pointer w-8 h-8 inline-flex items-center justify-center bg-gray-50 hover:bg-amber-50 text-gray-400 hover:text-amber-600 rounded-lg transition-colors" title="Editar Usuário">
                          <i className="fa-solid fa-pen"></i>
                        </button>
                        <button onClick={() => handleAction('DELETE', user.id)} className="cursor-pointer w-8 h-8 inline-flex items-center justify-center bg-gray-50 hover:bg-red-50 text-gray-400 hover:text-red-600 rounded-lg transition-colors" title="Excluir Usuário">
                          <i className="fa-solid fa-trash-can"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center justify-center text-gray-400">
                      <i className="fa-solid fa-users-slash text-4xl mb-3"></i>
                      <p className="font-medium text-gray-500">Nenhum usuário corresponde aos filtros.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* RODAPÉ */}
        <div className="bg-gray-50 px-6 py-3.5 border-t border-gray-200 text-xs font-bold text-gray-500 uppercase tracking-widest shrink-0">
          Total de <span className="text-gray-800">{filteredUsers.length}</span> usuário(s)
        </div>
      </div>

      {/* MODAIS */}
      <ModalNovoUsuario 
        isOpen={isNewUserModalOpen}
        onClose={() => setIsNewUserModalOpen(false)}
        currentUserRole={currentUserRole}
        allUsers={users}
      />

      <ModalVisualizarUsuario 
        isOpen={isViewModalOpen}
        onClose={() => { setIsViewModalOpen(false); setSelectedUserId(null); }}
        userId={selectedUserId}
      />

      <ModalEditarUsuario 
        isOpen={isEditModalOpen}
        onClose={() => { setIsEditModalOpen(false); setSelectedUserId(null); }}
        userId={selectedUserId}
        currentUserRole={currentUserRole}
        allUsers={users}
      />

      <ModalExcluirUsuario 
        isOpen={isDeleteModalOpen}
        onClose={() => { setIsDeleteModalOpen(false); setSelectedUserId(null); }}
        userId={selectedUserId}
        userName={selectedUser?.name || null}
      />
    </>
  );
}
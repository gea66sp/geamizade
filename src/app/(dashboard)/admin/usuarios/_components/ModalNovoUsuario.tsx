"use client";

import { useState, useMemo } from "react";
import { createNewUser } from "../actions";
import { Role, Branch } from "@prisma/client";

interface UserCompact {
  id: string;
  name: string | null;
  email: string | null;
  role: Role;
}

interface ModalNovoUsuarioProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserRole: Role;
  allUsers: UserCompact[]; // Lista para o seletor de parentesco
}

export default function ModalNovoUsuario({ isOpen, onClose, currentUserRole, allUsers }: ModalNovoUsuarioProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Estados dos inputs dinâmicos
  const [selectedRole, setSelectedRole] = useState<Role>("MEMBER");
  const [selectedFamilyIds, setSelectedFamilyIds] = useState<string[]>([]);
  const [searchFamilyTerm, setSearchFamilyTerm] = useState("");

  const roleLabels: Record<string, string> = {
    ADMIN: "Diretoria",
    FINANCEIRO: "Financeiro",
    CHEFE: "Chefe",
    RESPONSAVEL: "Responsável",
    MEMBER: "Membro (Jovem)",
  };

  const allRoles: Role[] = ["ADMIN", "FINANCEIRO", "CHEFE", "RESPONSAVEL", "MEMBER"];
  const availableRoles = currentUserRole === "ADMIN" ? allRoles : ["CHEFE", "RESPONSAVEL", "MEMBER"];
  const allBranches: Branch[] = ["LOBINHO", "ESCOTEIRO", "SENIOR", "PIONEIRO", "DIRETORIA"];

  // ==========================================
  // LÓGICA DO MULTI-SELECT DE FAMÍLIA
  // ==========================================
  
  // Limpa as seleções se o cargo mudar
  const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedRole(e.target.value as Role);
    setSelectedFamilyIds([]); 
    setSearchFamilyTerm("");
  };

  // Usuários disponíveis para vincular (Exclui os que já foram selecionados)
  const availableToLink = useMemo(() => {
    return allUsers.filter(u => {
      // Regra: Jovem vincula Responsável. Responsável vincula Jovem.
      const correctRole = selectedRole === "MEMBER" ? u.role === "RESPONSAVEL" : u.role === "MEMBER";
      const notSelected = !selectedFamilyIds.includes(u.id);
      const matchesSearch = u.name?.toLowerCase().includes(searchFamilyTerm.toLowerCase()) || 
                            u.email?.toLowerCase().includes(searchFamilyTerm.toLowerCase());
      return correctRole && notSelected && matchesSearch;
    });
  }, [allUsers, selectedRole, selectedFamilyIds, searchFamilyTerm]);

  // Usuários que já estão selecionados como "Tags"
  const linkedUsers = useMemo(() => {
    return allUsers.filter(u => selectedFamilyIds.includes(u.id));
  }, [allUsers, selectedFamilyIds]);

  const addFamilyTie = (id: string) => {
    setSelectedFamilyIds(prev => [...prev, id]);
    setSearchFamilyTerm(""); // Reseta a busca após adicionar
  };

  const removeFamilyTie = (id: string) => {
    setSelectedFamilyIds(prev => prev.filter(fid => fid !== id));
  };

  // ==========================================

  if (!isOpen) return null;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setMessage(null);

    const formElement = event.currentTarget;
    const formData = new FormData(formElement);
    
    const data = {
      name: formData.get("name") as string,
      email: formData.get("email") as string,
      password: formData.get("password") as string,
      role: selectedRole,
      branch: (formData.get("branch") as Branch) || undefined,
      familyTieIds: selectedFamilyIds, // Envia o array pro backend
    };

    try {
      const response = await createNewUser(data);

      if (response.success) {
        setMessage({ text: "Usuário criado com sucesso! ⚜️", type: "success" });
        formElement.reset(); 
        setSelectedFamilyIds([]);
        
        setTimeout(() => {
          onClose();
          setMessage(null);
        }, 1500);
      } else {
        setMessage({ text: response.error || "Erro ao criar usuário.", type: "error" });
      }
    } catch (error) {
      setMessage({ text: "Ocorreu um erro inesperado ao conectar com o servidor.", type: "error" });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-gray-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl md:rounded-3xl p-6 md:p-8 w-full max-w-2xl shadow-2xl max-h-[95vh] overflow-y-auto custom-scrollbar relative">
        
        {/* Header do Modal */}
        <div className="flex justify-between items-start mb-6 md:mb-8 border-b border-gray-100 pb-5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-scout-green/10 text-scout-green rounded-xl flex items-center justify-center shrink-0">
              <i className="fa-solid fa-user-plus text-xl"></i>
            </div>
            <div>
              <h3 className="font-heading text-xl md:text-2xl font-bold text-gray-800 leading-tight">Novo Membro</h3>
              <p className="text-gray-500 text-xs md:text-sm mt-0.5">Cadastre um novo usuário no sistema.</p>
            </div>
          </div>
          <button onClick={onClose} className="cursor-pointer text-gray-400 hover:text-gray-700 bg-gray-50 hover:bg-gray-100 p-2.5 rounded-full transition-colors flex items-center justify-center shrink-0">
            <i className="fa-solid fa-xmark text-lg"></i>
          </button>
        </div>

        <form onSubmit={handleSubmit} autoComplete="off" className="space-y-6">
          
          {/* ARMADILHA PARA O NAVEGADOR (Prevenção de Auto-fill) */}
          <div style={{ position: "absolute", width: "1px", height: "1px", overflow: "hidden", opacity: 0 }}>
            <input type="email" name="fake_email_trap" tabIndex={-1} autoComplete="username" />
            <input type="password" name="fake_password_trap" tabIndex={-1} autoComplete="new-password" />
          </div>

          {/* Feedback de Mensagem */}
          {message && (
            <div className={`flex items-center gap-3 px-5 py-4 rounded-xl text-sm font-bold animate-fade-in-up ${message.type === "success" ? "bg-green-50 text-green-700 border border-green-100" : "bg-red-50 text-red-700 border border-red-100"}`}>
              <i className={`fa-solid text-lg ${message.type === "success" ? "fa-circle-check" : "fa-triangle-exclamation"}`}></i>
              {message.text}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
            
            {/* Nome */}
            <div className="space-y-1.5 md:col-span-2">
              <label className="block text-sm font-bold text-gray-700">Nome Completo <span className="text-red-500">*</span></label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <i className="fa-solid fa-address-card text-gray-400"></i>
                </div>
                <input type="text" name="name" required autoComplete="off" className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-scout-green/20 focus:border-scout-green text-gray-800 transition-all font-semibold" placeholder="Ex: Robert Baden-Powell" />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label className="block text-sm font-bold text-gray-700">E-mail <span className="text-red-500">*</span></label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <i className="fa-solid fa-envelope text-gray-400"></i>
                </div>
                <input type="email" name="email" required autoComplete="new-email" data-1p-ignore className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-scout-green/20 focus:border-scout-green text-gray-800 transition-all font-medium" placeholder="usuario@escoteiros.org" />
              </div>
            </div>

            {/* Senha */}
            <div className="space-y-1.5">
              <label className="block text-sm font-bold text-gray-700">Senha Temporária <span className="text-red-500">*</span></label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <i className="fa-solid fa-lock text-gray-400"></i>
                </div>
                <input type="password" name="password" required minLength={6} autoComplete="new-password" data-1p-ignore className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-scout-green/20 focus:border-scout-green text-gray-800 transition-all placeholder:text-gray-400" placeholder="Mínimo 6 caracteres" />
              </div>
            </div>

            {/* Cargo (Role) */}
            <div className="space-y-1.5">
              <label className="block text-sm font-bold text-gray-700">Cargo / Acesso <span className="text-red-500">*</span></label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <i className="fa-solid fa-shield-halved text-gray-400"></i>
                </div>
                <select name="role" required value={selectedRole} onChange={handleRoleChange} className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-scout-green/20 focus:border-scout-green text-gray-800 cursor-pointer appearance-none transition-all font-semibold">
                  {availableRoles.map((role) => (
                    <option key={role} value={role}>{roleLabels[role] || role}</option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                  <i className="fa-solid fa-chevron-down text-gray-400 text-xs"></i>
                </div>
              </div>
            </div>

            {/* Ramo (Branch) */}
            <div className="space-y-1.5">
              <label className="block text-sm font-bold text-gray-700">Ramo (Opcional)</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <i className="fa-solid fa-tent text-gray-400"></i>
                </div>
                <select name="branch" className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-scout-green/20 focus:border-scout-green text-gray-800 cursor-pointer appearance-none transition-all font-medium">
                  <option value="">Nenhum ramo...</option>
                  {allBranches.map((branch) => (
                    <option key={branch} value={branch} className="capitalize">{branch.toLowerCase()}</option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                  <i className="fa-solid fa-chevron-down text-gray-400 text-xs"></i>
                </div>
              </div>
            </div>

            {/* ÁREA DE SELEÇÃO DE VÍNCULOS (Renderiza só se for Membro ou Responsável) */}
            {(selectedRole === "MEMBER" || selectedRole === "RESPONSAVEL") && (
              <div className="md:col-span-2 space-y-4 p-5 md:p-6 bg-gray-50/50 border border-gray-200 rounded-2xl mt-2 relative">
                
                {/* Título do Bloco */}
                <div className="flex items-center gap-3 border-b border-gray-200 pb-3">
                  <div className="w-8 h-8 rounded-lg bg-white border border-gray-200 text-scout-green flex items-center justify-center shrink-0 shadow-sm">
                    <i className="fa-solid fa-people-arrows text-sm"></i>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-gray-800 leading-none">
                      {selectedRole === "MEMBER" ? "Responsáveis do Jovem" : "Jovens Dependentes"}
                    </h4>
                    <p className="text-xs text-gray-500 mt-1 font-medium">
                      {selectedRole === "MEMBER" ? "Pesquise e adicione os pais ou responsáveis." : "Pesquise e vincule os filhos escoteiros."}
                    </p>
                  </div>
                </div>

                {/* Usuários Já Vinculados (Pílulas Premium) */}
                {linkedUsers.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {linkedUsers.map(u => (
                      <div key={u.id} className="flex items-center gap-2 bg-white border border-gray-200 pl-3 pr-1 py-1.5 rounded-lg shadow-sm text-sm group">
                        <span className="font-bold text-gray-700 truncate max-w-37.5 sm:max-w-xs">{u.name}</span>
                        <button type="button" onClick={() => removeFamilyTie(u.id)} className="w-6 h-6 flex items-center justify-center cursor-pointer text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors" title="Remover Vínculo">
                          <i className="fa-solid fa-xmark"></i>
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Input de Busca com Dropdown Flutuante */}
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <i className="fa-solid fa-magnifying-glass text-gray-400"></i>
                  </div>
                  <input 
                    type="text" 
                    value={searchFamilyTerm}
                    onChange={(e) => setSearchFamilyTerm(e.target.value)}
                    placeholder={selectedRole === "MEMBER" ? "Nome ou e-mail do Responsável..." : "Nome ou e-mail do Jovem..."}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-white focus:border-scout-green focus:ring-2 focus:ring-scout-green/20 text-sm outline-none transition-all shadow-sm font-medium"
                  />
                  
                  {/* Dropdown de Resultados (z-50 para não ser cortado) */}
                  {searchFamilyTerm.length > 0 && (
                    <div className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-2xl max-h-56 overflow-y-auto custom-scrollbar">
                      {availableToLink.length > 0 ? (
                        availableToLink.map(u => (
                          <div 
                            key={u.id} 
                            onClick={() => addFamilyTie(u.id)}
                            className="px-5 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-0 flex flex-col group transition-colors"
                          >
                            <span className="font-bold text-gray-800 text-sm group-hover:text-scout-green transition-colors">{u.name || "Sem nome"}</span>
                            <span className="text-xs text-gray-500 font-medium">{u.email}</span>
                          </div>
                        ))
                      ) : (
                        <div className="px-5 py-4 text-sm font-medium text-gray-500 text-center flex flex-col items-center">
                          <i className="fa-regular fa-face-frown text-2xl text-gray-300 mb-2"></i>
                          Nenhum correspondente encontrado.<br/>(Ele já deve estar cadastrado no sistema).
                        </div>
                      )}
                    </div>
                  )}
                </div>

              </div>
            )}
          </div>

          {/* Botões de Ação */}
          <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-6 border-t border-gray-100">
            <button 
              type="button" 
              onClick={onClose}
              className="w-full sm:w-auto px-6 py-3 text-sm text-gray-600 font-bold hover:bg-gray-100 rounded-xl cursor-pointer transition-colors disabled:opacity-50"
              disabled={isLoading}
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full sm:w-auto px-8 py-3 text-sm bg-scout-green text-white font-bold rounded-xl hover:bg-green-700 shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed active:scale-95"
            >
              {isLoading ? (
                <><i className="fa-solid fa-circle-notch fa-spin"></i> Cadastrando...</>
              ) : (
                <><i className="fa-solid fa-check"></i> Cadastrar Usuário</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
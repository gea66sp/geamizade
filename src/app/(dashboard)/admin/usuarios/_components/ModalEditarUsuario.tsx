"use client";

import { useState, useEffect, useMemo } from "react";
import { getUserFullDetails, updateUser } from "../actions";
import { Role, Branch } from "@prisma/client";
import { useRouter } from "next/navigation";

interface UserCompact {
  id: string;
  name: string | null;
  email: string | null;
  role: Role;
}

interface ModalEditarUsuarioProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string | null;
  currentUserRole: Role;
  allUsers: UserCompact[];
}

export default function ModalEditarUsuario({ isOpen, onClose, userId, currentUserRole, allUsers }: ModalEditarUsuarioProps) {
  const router = useRouter();
  const [isFetching, setIsFetching] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState(""); 
  const [selectedRole, setSelectedRole] = useState<Role>("MEMBER");
  const [selectedBranch, setSelectedBranch] = useState<Branch | "">("");
  
  const [selectedFamilyIds, setSelectedFamilyIds] = useState<string[]>([]);
  const [searchFamilyTerm, setSearchFamilyTerm] = useState("");

  const roleLabels: Record<string, string> = {
    ADMIN: "Diretoria", FINANCEIRO: "Financeiro", CHEFE: "Chefe", RESPONSAVEL: "Responsável", MEMBER: "Membro (Jovem)",
  };
  const availableRoles = currentUserRole === "ADMIN" ? ["ADMIN", "FINANCEIRO", "CHEFE", "RESPONSAVEL", "MEMBER"] : ["CHEFE", "RESPONSAVEL", "MEMBER"];
  const allBranches: Branch[] = ["LOBINHO", "ESCOTEIRO", "SENIOR", "PIONEIRO", "DIRETORIA"];

  useEffect(() => {
    if (isOpen && userId) {
      setIsFetching(true);
      setMessage(null);
      setPassword(""); 
      
      getUserFullDetails(userId).then(res => {
        if (res.success && res.user) {
          setName(res.user.name || "");
          setEmail(res.user.email || "");
          setSelectedRole(res.user.role);
          setSelectedBranch(res.user.branch || "");
          
          if (res.user.role === "MEMBER") {
            setSelectedFamilyIds(res.user.guardianTies.map((t: any) => t.guardianId));
          } else if (res.user.role === "RESPONSAVEL") {
            setSelectedFamilyIds(res.user.dependentTies.map((t: any) => t.dependentId));
          } else {
            setSelectedFamilyIds([]);
          }
        } else {
          setMessage({ text: "Erro ao carregar dados do usuário.", type: "error" });
        }
        setIsFetching(false);
      });
    }
  }, [isOpen, userId]);

  const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedRole(e.target.value as Role);
    setSelectedFamilyIds([]); 
    setSearchFamilyTerm("");
  };

  const availableToLink = useMemo(() => {
    return allUsers.filter(u => {
      if (u.id === userId) return false; 
      const correctRole = selectedRole === "MEMBER" ? u.role === "RESPONSAVEL" : u.role === "MEMBER";
      const notSelected = !selectedFamilyIds.includes(u.id);
      const matchesSearch = u.name?.toLowerCase().includes(searchFamilyTerm.toLowerCase()) || u.email?.toLowerCase().includes(searchFamilyTerm.toLowerCase());
      return correctRole && notSelected && matchesSearch;
    });
  }, [allUsers, selectedRole, selectedFamilyIds, searchFamilyTerm, userId]);

  const linkedUsers = useMemo(() => allUsers.filter(u => selectedFamilyIds.includes(u.id)), [allUsers, selectedFamilyIds]);

  const addFamilyTie = (id: string) => { setSelectedFamilyIds(prev => [...prev, id]); setSearchFamilyTerm(""); };
  const removeFamilyTie = (id: string) => setSelectedFamilyIds(prev => prev.filter(fid => fid !== id));

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!userId) return;
    setIsSaving(true);
    setMessage(null);

    const data = {
      name, email,
      ...(password ? { password } : {}),
      role: selectedRole,
      branch: (selectedBranch as Branch) || undefined,
      familyTieIds: selectedFamilyIds,
    };

    try {
      const response = await updateUser(userId, data);
      if (response.success) {
        setMessage({ text: "Usuário atualizado com sucesso! ⚜️", type: "success" });
        setTimeout(() => {
          router.refresh();
          onClose();
        }, 1500);
      } else {
        setMessage({ text: response.error || "Erro ao salvar alterações.", type: "error" });
      }
    } catch (error) {
      setMessage({ text: "Erro de conexão. Verifique sua internet.", type: "error" });
    } finally {
      setIsSaving(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-900/60 z-100 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl md:rounded-3xl p-6 md:p-8 w-full max-w-2xl shadow-2xl max-h-[95vh] overflow-y-auto custom-scrollbar relative">
        
        <div className="flex justify-between items-start mb-6 md:mb-8 border-b border-gray-100 pb-5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-50 text-amber-500 rounded-xl flex items-center justify-center shrink-0">
              <i className="fa-solid fa-pen text-xl"></i>
            </div>
            <div>
              <h3 className="font-heading text-xl md:text-2xl font-bold text-gray-800 leading-tight">Editar Usuário</h3>
              <p className="text-gray-500 text-xs md:text-sm mt-0.5">Atualize os dados e acessos deste membro.</p>
            </div>
          </div>
          <button onClick={onClose} className="cursor-pointer text-gray-400 hover:text-gray-700 bg-gray-50 hover:bg-gray-100 p-2.5 rounded-full transition-colors flex items-center justify-center shrink-0">
            <i className="fa-solid fa-xmark text-lg"></i>
          </button>
        </div>

        {isFetching ? (
          <div className="py-20 flex flex-col items-center justify-center text-gray-400">
            <i className="fa-solid fa-circle-notch fa-spin text-4xl mb-4 text-amber-500"></i>
            <p className="font-bold">Carregando dados do usuário...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} autoComplete="off" className="space-y-6">
            
            <div style={{ position: "absolute", width: "1px", height: "1px", overflow: "hidden", opacity: 0 }}>
              <input type="email" name="fake_email_trap" tabIndex={-1} autoComplete="username" />
              <input type="password" name="fake_password_trap" tabIndex={-1} autoComplete="current-password" />
            </div>

            {message && (
              <div className={`flex items-center gap-3 px-5 py-4 rounded-xl text-sm font-bold animate-fade-in-up ${message.type === "success" ? "bg-green-50 text-green-700 border border-green-100" : "bg-red-50 text-red-700 border border-red-100"}`}>
                <i className={`fa-solid text-lg ${message.type === "success" ? "fa-circle-check" : "fa-triangle-exclamation"}`}></i>
                {message.text}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
              
              <div className="space-y-1.5 md:col-span-2">
                <label className="block text-sm font-bold text-gray-700">Nome Completo <span className="text-red-500">*</span></label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <i className="fa-solid fa-address-card text-gray-400"></i>
                  </div>
                  <input type="text" value={name} onChange={e => setName(e.target.value)} required className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-gray-800 transition-all font-semibold" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-sm font-bold text-gray-700">E-mail <span className="text-red-500">*</span></label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <i className="fa-solid fa-envelope text-gray-400"></i>
                  </div>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="new-email" data-1p-ignore className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-gray-800 transition-all font-medium" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-sm font-bold text-gray-700">Nova Senha <span className="text-gray-400 font-normal text-xs">(Opcional)</span></label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <i className="fa-solid fa-lock text-gray-400"></i>
                  </div>
                  <input type="password" value={password} onChange={e => setPassword(e.target.value)} minLength={6} autoComplete="new-password" data-1p-ignore className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-gray-800 transition-all placeholder:text-gray-400" placeholder="Digite para alterar" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-sm font-bold text-gray-700">Cargo / Acesso <span className="text-red-500">*</span></label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <i className="fa-solid fa-shield-halved text-gray-400"></i>
                  </div>
                  <select value={selectedRole} onChange={handleRoleChange} className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-gray-800 cursor-pointer appearance-none font-semibold transition-all">
                    {availableRoles.map(role => <option key={role} value={role}>{roleLabels[role] || role}</option>)}
                  </select>
                  <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                    <i className="fa-solid fa-chevron-down text-gray-400 text-xs"></i>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-sm font-bold text-gray-700">Ramo (Opcional)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <i className="fa-solid fa-tent text-gray-400"></i>
                  </div>
                  <select value={selectedBranch} onChange={e => setSelectedBranch(e.target.value as Branch | "")} className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-gray-800 cursor-pointer appearance-none transition-all font-medium">
                    <option value="">Nenhum ramo...</option>
                    {allBranches.map(branch => <option key={branch} value={branch} className="capitalize">{branch.toLowerCase()}</option>)}
                  </select>
                  <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                    <i className="fa-solid fa-chevron-down text-gray-400 text-xs"></i>
                  </div>
                </div>
              </div>

              {(selectedRole === "MEMBER" || selectedRole === "RESPONSAVEL") && (
                <div className="md:col-span-2 space-y-4 p-5 md:p-6 bg-amber-50/30 border border-amber-100 rounded-2xl mt-2 relative">
                  
                  <div className="flex items-center gap-3 border-b border-amber-200/50 pb-3">
                    <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
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
                  
                  {linkedUsers.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {linkedUsers.map(u => (
                        <div key={u.id} className="flex items-center gap-2 bg-white border border-amber-200 pl-3 pr-1 py-1.5 rounded-lg shadow-sm text-sm group">
                          <span className="font-bold text-gray-700 truncate max-w-37.5 sm:max-w-xs">{u.name}</span>
                          <button type="button" onClick={() => removeFamilyTie(u.id)} className="w-6 h-6 flex items-center justify-center cursor-pointer text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors" title="Remover Vínculo">
                            <i className="fa-solid fa-xmark"></i>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <i className="fa-solid fa-magnifying-glass text-amber-500"></i>
                    </div>
                    <input 
                      type="text" 
                      value={searchFamilyTerm} 
                      onChange={e => setSearchFamilyTerm(e.target.value)} 
                      placeholder="Buscar por nome ou e-mail..." 
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-white focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 text-sm outline-none transition-all shadow-sm font-medium" 
                    />
                    
                    {searchFamilyTerm.length > 0 && (
                      <div className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-2xl max-h-56 overflow-y-auto custom-scrollbar">
                        {availableToLink.length > 0 ? (
                          availableToLink.map(u => (
                            <div 
                              key={u.id} 
                              onClick={() => addFamilyTie(u.id)} 
                              className="px-5 py-3 hover:bg-amber-50 cursor-pointer border-b border-gray-100 last:border-0 flex flex-col group transition-colors"
                            >
                              <span className="font-bold text-gray-800 text-sm group-hover:text-amber-700 transition-colors">{u.name || "Sem nome"}</span>
                              <span className="text-xs text-gray-500 font-medium">{u.email}</span>
                            </div>
                          ))
                        ) : (
                          <div className="px-5 py-4 text-sm font-medium text-gray-500 text-center flex flex-col items-center">
                            <i className="fa-regular fa-face-frown text-2xl text-gray-300 mb-2"></i>
                            Nenhum usuário encontrado.<br/>(Verifique se o cargo está correto).
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-6 border-t border-gray-100">
              <button 
                type="button" 
                onClick={onClose} 
                disabled={isSaving} 
                className="w-full sm:w-auto px-6 py-3 text-sm text-gray-600 font-bold hover:bg-gray-100 rounded-xl cursor-pointer transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button 
                type="submit" 
                disabled={isSaving} 
                className="w-full sm:w-auto px-8 py-3 text-sm bg-amber-500 text-white font-bold rounded-xl hover:bg-amber-600 shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed active:scale-95"
              >
                {isSaving ? (
                  <><i className="fa-solid fa-circle-notch fa-spin"></i> Salvando...</>
                ) : (
                  <><i className="fa-solid fa-check"></i> Salvar Alterações</>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
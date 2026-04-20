"use client";

import { useEffect, useState } from "react";
import { getUserFullDetails } from "../actions";
import Image from "next/image";

interface ModalVisualizarUsuarioProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string | null;
}

export default function ModalVisualizarUsuario({ isOpen, onClose, userId }: ModalVisualizarUsuarioProps) {
  const [userData, setUserData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"GERAL" | "MEDICO" | "ESCOTEIRO">("GERAL");

  useEffect(() => {
    if (isOpen && userId) {
      setIsLoading(true);
      setActiveTab("GERAL"); // Reseta a aba ao abrir
      getUserFullDetails(userId).then((res) => {
        if (res.success) setUserData(res.user);
        setIsLoading(false);
      });
    }
  }, [isOpen, userId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl w-full max-w-3xl shadow-2xl flex flex-col max-h-[95vh] overflow-hidden relative">
        
        {/* CABEÇALHO DO MODAL (Perfil) */}
        <div className="relative p-6 md:p-8 bg-gray-50 border-b border-gray-100 shrink-0">
          {/* Botão Fechar */}
          <button onClick={onClose} className="absolute top-4 right-4 md:top-6 md:right-6 w-10 h-10 flex items-center justify-center text-gray-400 hover:text-gray-700 bg-white hover:bg-gray-100 border border-gray-200 rounded-full transition-colors cursor-pointer shadow-sm z-10">
            <i className="fa-solid fa-xmark text-lg"></i>
          </button>

          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 pt-2">
            <div className="w-20 h-20 md:w-24 md:h-24 bg-white border-4 border-white shadow-md text-scout-green rounded-full flex items-center justify-center shrink-0 overflow-hidden text-3xl font-black relative">
              {userData?.image ? (
                <Image className="h-full w-full object-cover" src={userData.image} alt="Foto" width={96} height={96} />
              ) : (
                userData?.name?.charAt(0).toUpperCase() || <i className="fa-solid fa-user"></i>
              )}
            </div>
            
            <div className="text-center sm:text-left flex-1 mt-1 sm:mt-0">
              <h3 className="font-heading text-2xl md:text-3xl font-black text-gray-800 leading-tight">
                {isLoading ? "Carregando..." : userData?.name}
              </h3>
              <p className="text-gray-500 font-medium text-sm mt-1">{userData?.email}</p>
              
              {!isLoading && userData && (
                <div className="flex flex-wrap justify-center sm:justify-start gap-2 mt-4">
                  <span className="bg-gray-800 text-white px-3 py-1 rounded-md text-[10px] md:text-xs font-bold uppercase tracking-widest flex items-center gap-1.5 shadow-sm">
                    <i className="fa-solid fa-shield-halved"></i> {userData.role}
                  </span>
                  {userData.branch && (
                    <span className="bg-scout-green text-white px-3 py-1 rounded-md text-[10px] md:text-xs font-bold uppercase tracking-widest flex items-center gap-1.5 shadow-sm">
                      <i className="fa-solid fa-tent"></i> {userData.branch}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* CORPO DO MODAL */}
        <div className="flex-1 overflow-y-auto bg-white custom-scrollbar">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-full min-h-75 text-gray-400">
              <i className="fa-solid fa-circle-notch fa-spin text-4xl mb-4 text-scout-green"></i>
              <p className="font-bold">Montando ficha do usuário...</p>
            </div>
          ) : !userData ? (
            <div className="flex flex-col items-center justify-center h-full min-h-75 text-red-500">
              <i className="fa-solid fa-triangle-exclamation text-4xl mb-3"></i>
              <p className="font-bold">Erro ao carregar dados.</p>
            </div>
          ) : (
            <div className="flex flex-col h-full">
              
              {/* NAVEGAÇÃO DAS ABAS (Pill Style) */}
              <div className="p-4 md:px-8 border-b border-gray-100 bg-white sticky top-0 z-10 shrink-0">
                <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-1">
                  <button onClick={() => setActiveTab("GERAL")} className={`cursor-pointer flex-1 min-w-30 px-4 py-2.5 rounded-xl text-xs md:text-sm font-bold transition-all whitespace-nowrap flex items-center justify-center gap-2 ${activeTab === "GERAL" ? "bg-scout-green text-white shadow-md" : "bg-gray-50 text-gray-500 hover:bg-gray-100 hover:text-gray-800"}`}>
                    <i className="fa-solid fa-address-card"></i> Visão Geral
                  </button>
                  <button onClick={() => setActiveTab("MEDICO")} className={`cursor-pointer flex-1 min-w-30 px-4 py-2.5 rounded-xl text-xs md:text-sm font-bold transition-all whitespace-nowrap flex items-center justify-center gap-2 ${activeTab === "MEDICO" ? "bg-scout-green text-white shadow-md" : "bg-gray-50 text-gray-500 hover:bg-gray-100 hover:text-gray-800"}`}>
                    <i className="fa-solid fa-notes-medical"></i> Saúde
                  </button>
                  <button onClick={() => setActiveTab("ESCOTEIRO")} className={`cursor-pointer flex-1 min-w-30 px-4 py-2.5 rounded-xl text-xs md:text-sm font-bold transition-all whitespace-nowrap flex items-center justify-center gap-2 ${activeTab === "ESCOTEIRO" ? "bg-scout-green text-white shadow-md" : "bg-gray-50 text-gray-500 hover:bg-gray-100 hover:text-gray-800"}`}>
                    <i className="fa-solid fa-medal"></i> Escotismo
                  </button>
                </div>
              </div>

              {/* ÁREA DE RENDERIZAÇÃO DAS ABAS */}
              <div className="p-6 md:p-8 flex-1">
                
                {/* =======================================
                    ABA: GERAL E FAMÍLIA
                ======================================= */}
                {activeTab === "GERAL" && (
                  <div className="space-y-8 animate-fade-in-up">
                    
                    {/* Infos Básicas */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50 border border-gray-100">
                        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-gray-400 shadow-sm shrink-0"><i className="fa-solid fa-phone"></i></div>
                        <div>
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Telefone Celular</p>
                          <p className="font-bold text-gray-800">{userData.phone || "Não informado"}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50 border border-gray-100">
                        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-gray-400 shadow-sm shrink-0"><i className="fa-solid fa-calendar-day"></i></div>
                        <div>
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Membro Desde</p>
                          <p className="font-bold text-gray-800">{new Date(userData.createdAt).toLocaleDateString('pt-BR')}</p>
                        </div>
                      </div>
                    </div>

                    {/* Vínculos Familiares */}
                    <div>
                      <h4 className="text-sm font-bold text-gray-800 uppercase tracking-widest mb-4 flex items-center gap-2 border-b border-gray-100 pb-2">
                        <i className="fa-solid fa-people-roof text-scout-green"></i> Rede Familiar
                      </h4>
                      
                      {userData.guardianTies.length === 0 && userData.dependentTies.length === 0 ? (
                        <div className="p-6 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                          <i className="fa-solid fa-users-slash text-2xl text-gray-300 mb-2"></i>
                          <p className="text-sm font-bold text-gray-500">Nenhum vínculo familiar registrado.</p>
                        </div>
                      ) : (
                        <div className="space-y-6">
                          
                          {/* Responsáveis do Jovem */}
                          {userData.guardianTies.length > 0 && (
                            <div>
                              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-3">Responsáveis Legais</label>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {userData.guardianTies.map((tie: any) => (
                                  <div key={tie.id} className="flex items-center gap-4 p-3 bg-white border border-gray-200 rounded-xl shadow-sm">
                                    <div className="w-10 h-10 bg-gray-100 text-gray-500 rounded-full flex items-center justify-center shrink-0">
                                      <i className="fa-solid fa-user-shield"></i>
                                    </div>
                                    <div className="min-w-0">
                                      <p className="text-sm font-bold text-gray-800 truncate">{tie.guardian.name}</p>
                                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider truncate">{tie.guardian.email}</p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Dependentes do Adulto */}
                          {userData.dependentTies.length > 0 && (
                            <div>
                              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-3">Jovens Sob Responsabilidade</label>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {userData.dependentTies.map((tie: any) => (
                                  <div key={tie.id} className="flex items-center gap-4 p-3 bg-white border border-gray-200 rounded-xl shadow-sm">
                                    <div className="w-10 h-10 bg-scout-green/10 text-scout-green rounded-full flex items-center justify-center shrink-0 font-bold">
                                      {tie.dependent.name?.charAt(0)}
                                    </div>
                                    <div className="min-w-0">
                                      <p className="text-sm font-bold text-gray-800 truncate">{tie.dependent.name}</p>
                                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider truncate">
                                        Ramo {tie.dependent.branch ? tie.dependent.branch.toLowerCase() : "Não info."}
                                      </p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* =======================================
                    ABA: FICHA MÉDICA
                ======================================= */}
                {activeTab === "MEDICO" && (
                  <div className="space-y-6 animate-fade-in-up">
                    {!userData.medicalRecord ? (
                      <div className="text-center py-16 bg-gray-50 rounded-3xl border border-gray-100">
                        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm border border-gray-200 text-gray-300">
                          <i className="fa-solid fa-file-medical text-2xl"></i>
                        </div>
                        <h4 className="font-bold text-gray-700 text-lg mb-1">Sem Histórico Médico</h4>
                        <p className="text-sm font-medium text-gray-500 max-w-sm mx-auto">A ficha médica deste usuário ainda não foi preenchida ou atualizada no sistema.</p>
                      </div>
                    ) : (
                      <div className="bg-white border border-gray-200 shadow-sm rounded-3xl overflow-hidden divide-y divide-gray-100">
                        
                        {/* Destaques Médicos */}
                        <div className="grid grid-cols-2 bg-gray-50/50 divide-x divide-gray-100">
                          <div className="p-5 md:p-6 text-center group">
                            <i className="fa-solid fa-droplet text-red-500 text-2xl mb-2 group-hover:scale-110 transition-transform"></i>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Sangue</p>
                            <p className="text-xl font-black text-gray-800">{userData.medicalRecord.bloodType || "N/I"}</p>
                          </div>
                          <div className="p-5 md:p-6 text-center group bg-amber-50/30">
                            <i className="fa-solid fa-triangle-exclamation text-amber-500 text-2xl mb-2 group-hover:scale-110 transition-transform"></i>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Alergias</p>
                            <p className="text-sm font-bold text-gray-800 truncate">{userData.medicalRecord.allergies || "Nenhuma"}</p>
                          </div>
                        </div>

                        {/* Detalhes Médicos Lista */}
                        <div className="p-5 md:p-8 space-y-5">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 hover:bg-gray-50 rounded-xl transition-colors">
                            <div className="flex items-center gap-3 text-sm font-bold text-gray-600">
                              <i className="fa-solid fa-pills w-5 text-center text-gray-400"></i> Uso Contínuo
                            </div>
                            <p className="text-sm font-medium text-gray-900 sm:text-right">{userData.medicalRecord.continuousMeds || "Nenhum medicamento"}</p>
                          </div>
                          
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 hover:bg-gray-50 rounded-xl transition-colors">
                            <div className="flex items-center gap-3 text-sm font-bold text-gray-600">
                              <i className="fa-solid fa-id-card w-5 text-center text-gray-400"></i> Plano de Saúde
                            </div>
                            <p className="text-sm font-medium text-gray-900 sm:text-right">{userData.medicalRecord.healthInsurance || "SUS / Não possui"}</p>
                          </div>

                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 hover:bg-gray-50 rounded-xl transition-colors">
                            <div className="flex items-center gap-3 text-sm font-bold text-gray-600">
                              <i className="fa-solid fa-truck-medical w-5 text-center text-gray-400"></i> SOS Contato
                            </div>
                            <p className="text-sm font-bold text-blue-600 sm:text-right">{userData.medicalRecord.emergencyContact || "Não informado"}</p>
                          </div>
                        </div>

                      </div>
                    )}
                  </div>
                )}

                {/* =======================================
                    ABA: VIDA ESCOTEIRA
                ======================================= */}
                {activeTab === "ESCOTEIRO" && (
                  <div className="space-y-8 animate-fade-in-up">
                    
                    {/* Tropa/Ramo */}
                    <div className="relative overflow-hidden p-6 rounded-3xl bg-scout-dark text-white shadow-lg flex items-center justify-between">
                      <div className="absolute right-0 top-0 w-32 h-32 bg-scout-green/30 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
                      
                      <div className="relative z-10">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Lotação Atual</p>
                        <h4 className="text-2xl md:text-3xl font-heading font-black text-white">
                          {userData.troop ? userData.troop.name : "Nenhuma Tropa"}
                        </h4>
                        {userData.branch && <p className="text-scout-yellow font-bold mt-1">Ramo {userData.branch}</p>}
                      </div>
                      
                      <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center text-3xl border border-white/20 shrink-0 z-10 sm:flex">
                        <i className="fa-solid fa-campground"></i>
                      </div>
                    </div>

                    {/* Progressões e Especialidades */}
                    <div>
                      <h4 className="text-sm font-bold text-gray-800 uppercase tracking-widest mb-4 flex items-center gap-2 border-b border-gray-100 pb-2">
                        <i className="fa-solid fa-award text-scout-green"></i> Conquistas e Insígnias
                      </h4>
                      
                      {userData.progressions.length === 0 ? (
                        <div className="p-6 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                          <i className="fa-solid fa-medal text-2xl text-gray-300 mb-2"></i>
                          <p className="text-sm font-bold text-gray-500">O livro de conquistas ainda está em branco.</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {userData.progressions.map((prog: any) => (
                            <div key={prog.id} className="p-4 bg-white border border-gray-200 rounded-2xl shadow-sm flex items-start gap-4 hover:border-scout-green hover:shadow-md transition-all group">
                              <div className="w-12 h-12 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center text-xl shrink-0 group-hover:scale-110 transition-transform">
                                <i className="fa-solid fa-medal"></i>
                              </div>
                              <div className="flex-1 min-w-0">
                                <h5 className="font-bold text-gray-800 truncate mb-1">{prog.title}</h5>
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] font-bold bg-gray-100 text-gray-600 px-2 py-0.5 rounded uppercase tracking-wider">{prog.category}</span>
                                  {prog.level && <span className="text-[10px] font-bold bg-scout-yellow/20 text-yellow-700 px-2 py-0.5 rounded">Nível {prog.level}</span>}
                                </div>
                                {prog.earnedDate && (
                                  <p className="text-[10px] font-bold text-gray-400 mt-2 uppercase tracking-widest"><i className="fa-regular fa-calendar mr-1"></i> {new Date(prog.earnedDate).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })}</p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
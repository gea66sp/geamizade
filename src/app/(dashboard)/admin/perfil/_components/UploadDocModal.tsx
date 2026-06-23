"use client";

import { useState } from "react";
import { uploadPersonalDocument } from "../actions"; // Ajuste o caminho se necessário

type UploadDocModalProps = {
  isOpen: boolean;
  onClose: () => void;
  // userId mantido nas props caso você use em outro lugar do modal, 
  // mas não será mais enviado para a action por segurança.
  userId: string; 
};

export default function UploadDocModal({ isOpen, onClose, userId }: UploadDocModalProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");

  const MAX_FILE_SIZE = 4.5 * 1024 * 1024; // 4.5 MB em bytes

  if (!isOpen) return null;

  // Validação em tempo real ao escolher o arquivo
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.size > MAX_FILE_SIZE) {
      const sizeInMB = (file.size / (1024 * 1024)).toFixed(2);
      setError(`O arquivo selecionado tem ${sizeInMB} MB. O limite máximo é 4.5 MB.`);
      e.target.value = ""; // Limpa o input imediatamente
    } else {
      setError(""); // Limpa os erros caso o arquivo seja válido
    }
  };

  async function handleUpload(formData: FormData) {
    setIsUploading(true);
    setError("");

    // Dupla checagem de segurança antes de enviar para o servidor
    const file = formData.get("file") as File;
    if (!file || file.size === 0) {
      setError("Por favor, selecione um arquivo.");
      setIsUploading(false);
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setError("O arquivo excede o limite de 4.5 MB. Tente comprimir a imagem ou PDF.");
      setIsUploading(false);
      return;
    }

    try {
      // O userId foi removido daqui para respeitar a segurança do backend atualizado
      const result = await uploadPersonalDocument(formData);
      
      if (result.success) {
        onClose(); // Fecha o modal em caso de sucesso
      } else {
        setError(result.error || "Erro ao fazer upload.");
      }
    } catch (err) {
      setError("Erro inesperado. Verifique sua conexão.");
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col animate-scale-in">
        
        {/* Cabeçalho do Modal */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-gray-50">
          <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2">
            <i className="fa-solid fa-cloud-arrow-up text-scout-green"></i>
            Novo Documento
          </h3>
          <button onClick={onClose} disabled={isUploading} className="text-gray-400 hover:text-red-500 transition-colors">
            <i className="fa-solid fa-xmark text-xl"></i>
          </button>
        </div>

        {/* Formulário */}
        <form action={handleUpload} className="p-5 space-y-5">
          {error && (
            <div className="p-3 bg-red-50 text-red-600 text-sm font-bold rounded-lg border border-red-100 flex items-center gap-2">
              <i className="fa-solid fa-triangle-exclamation"></i> {error}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="block text-sm font-bold text-gray-700">Nome do Documento</label>
            <input 
              name="title" 
              type="text" 
              placeholder="Ex: Ficha Médica 2026, Carteirinha..." 
              required 
              disabled={isUploading}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-scout-green/20 focus:border-scout-green outline-none transition-all text-gray-800"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="block text-sm font-bold text-gray-700">Arquivo (PDF ou Imagem)</label>
              {/* Etiqueta visual de limite em destaque */}
              <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-md">
                Máximo: 4.5 MB
              </span>
            </div>
            
            <input 
              name="file" 
              type="file" 
              accept=".pdf, image/jpeg, image/png, image/webp"
              required 
              disabled={isUploading}
              onChange={handleFileChange}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-scout-green/20 focus:border-scout-green outline-none transition-all text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-bold file:bg-scout-green/10 file:text-scout-green hover:file:bg-scout-green/20 cursor-pointer"
            />
            <p className="text-[11px] text-gray-400 font-medium">
              Arquivos aceitos: PDF, JPG, PNG e WebP.
            </p>
          </div>

          <div className="pt-2 flex gap-3">
            <button 
              type="button" 
              onClick={onClose} 
              disabled={isUploading}
              className="flex-1 px-4 py-3 bg-gray-100 text-gray-600 font-bold rounded-xl hover:bg-gray-200 transition-colors"
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              disabled={isUploading}
              className="flex-1 px-4 py-3 bg-scout-green text-white font-bold rounded-xl hover:bg-green-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {isUploading ? (
                <><i className="fa-solid fa-circle-notch fa-spin"></i> Enviando...</>
              ) : (
                <><i className="fa-solid fa-upload"></i> Salvar Arquivo</>
              )}
            </button>
          </div>
        </form>
        
      </div>
    </div>
  );
}
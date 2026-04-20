import type { Metadata } from "next";
import LoginClient from "./_component/LoginClient"; // Ajuste o caminho se necessário

// Aqui você coloca os metadados da página!
export const metadata: Metadata = {
  title: "Login | GE Amizade",
  description: "Acesso ao portal interno do Grupo Escoteiro Amizade 66° SP",
};

export default function LoginPage() {
  return <LoginClient />;
}
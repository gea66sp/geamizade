import type { Metadata } from 'next';
import '@/src/app/globals.css'; // Certifique-se de que o caminho do seu CSS global está correto

export const metadata: Metadata = {
  title: 'Grupo Escoteiro Amizade | Em Manutenção',
  description: 'Site do Grupo Escoteiro Amizade em construção. Sempre Alerta!',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className="bg-stone-50 text-stone-800 antialiased min-h-screen flex flex-col">
        {children}
      </body>
    </html>
  );
}
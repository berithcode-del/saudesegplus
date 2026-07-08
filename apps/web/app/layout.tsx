import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'SaúdeSeg+ | Plataforma de Telemedicina Ocupacional',
  description: 'Gestão de medicina do trabalho: check-in de pacientes, fila médica inteligente e emissão de ASO digital.',
  icons: {
    icon: '/favicon.svg',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}

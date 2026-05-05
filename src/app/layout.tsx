import type { Metadata } from "next";
import "./globals.css";
import AuthShell from "@/components/auth-shell";

export const metadata: Metadata = {
  title: "BitConverter — Controle de Ponto",
  description: "Plataforma web para controle de ponto com sync automático de relógios ControlID",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body suppressHydrationWarning>
        <AuthShell>{children}</AuthShell>
      </body>
    </html>
  );
}

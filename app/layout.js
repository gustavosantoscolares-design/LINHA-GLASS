
export const metadata = {
  title: "Orçamento Linha Glass",
  description: "Sistema de orçamento",
};

import "./globals.css";

export default function RootLayout({ children }) {
  return (
    <html lang="pt-br">
      <body>{children}</body>
    </html>
  );
}

import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "limetaxIQ - KI-Assistent für Steuerkanzleien",
  description: "Ihr intelligenter Assistent für steuerrechtliche Fragen, Mandantenvorbereitung und Fristenverwaltung",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import { Fredoka, Nunito } from "next/font/google";
import MagicBackground from "@/components/MagicBackground";
import Navbar from "@/components/Navbar";
import "./globals.css";

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
});

const fredoka = Fredoka({
  variable: "--font-fredoka",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Biblioteca Mágica",
  description: "Una biblioteca de autores y libros",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className={`${nunito.variable} ${fredoka.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans text-texto">
        <MagicBackground />
        <Navbar />
        <main className="relative z-10 flex-1 px-4 pt-28 pb-16">{children}</main>
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: {
    template: "%s | KeJepangDulu",
    default: "KeJepangDulu — Belajar Bahasa Jepang",
  },
  description:
    "Platform latihan soal JLPT dan JFT terlengkap. Persiapan ujian bahasa Jepang lebih mudah dan efisien.",
  keywords: ["JLPT", "JFT", "belajar bahasa Jepang", "latihan soal", "kanji", "hiragana"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body className="flex flex-col min-h-dvh">
        <AuthProvider>
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}

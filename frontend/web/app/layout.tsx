import type { Metadata } from 'next';
import { Navbar } from '@/components/navbar/Navbar';
import { Footer } from '@/components/Footer';
import { AuthProvider } from '@/providers/AuthProvider';
import './globals.css';

export const metadata: Metadata = {
  title: 'KeJepangDulu',
  description: 'Platform eLearning persiapan ujian bahasa Jepang (JLPT & JFT) dengan materi lengkap dan latihan soal interaktif.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id">
      <body>
        <AuthProvider>
          <div className="flex flex-col min-h-screen bg-slate-50 font-sans text-slate-900 overflow-hidden">
            <Navbar />
            <main className="flex-1 overflow-auto">{children}</main>
            <Footer />
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
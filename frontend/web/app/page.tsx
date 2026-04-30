'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'motion/react';
import { ArrowRight, Zap, Lock, Smartphone, CheckCircle } from 'lucide-react';
import { ProductCard } from '@/components/ProductCard';
import { Product } from '@/lib/types';
import { fetchProducts } from '@/lib/products';

export default function HomePage() {
  const [productItems, setProductItems] = useState<Product[]>([]);

  useEffect(() => {
    const controller = new AbortController();

    async function loadProducts() {
      const products = await fetchProducts({ signal: controller.signal });
      setProductItems(products);
    }

    loadProducts();

    return () => {
      controller.abort();
    };
  }, []);

  const featuredProducts = productItems.filter((product) => product.featuredProducts === true);

  return (
    <div className="overflow-hidden bg-white">
      <section className="relative pt-32 pb-28 md:pt-44 md:pb-36 px-4 bg-slate-950 overflow-hidden text-center flex flex-col items-center">
        <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, rgba(99,102,241,0.18) 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-slate-950 to-transparent pointer-events-none" />
        <div className="absolute -top-2 right-[-1rem] md:right-10 text-[220px] font-black text-white/[0.045] select-none pointer-events-none leading-none tracking-tighter">合格</div>
        <div className="absolute bottom-4 left-[-1rem] md:left-8 text-[220px] font-black text-white/[0.045] select-none pointer-events-none leading-none tracking-tighter">頑張</div>
        <div className="absolute top-0 left-1/2 w-[600px] h-[400px] bg-indigo-600/25 rounded-full blur-[130px] -translate-x-1/2 -translate-y-1/3 pointer-events-none" />
        <div className="absolute top-1/3 right-0 w-80 h-80 bg-rose-600/20 rounded-full blur-[110px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-violet-600/20 rounded-full blur-[110px] pointer-events-none" />

        <div className="max-w-4xl mx-auto flex flex-col items-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
            className="flex flex-col items-center w-full"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full text-xs font-bold text-white/90 uppercase tracking-widest mb-8">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" />
              Platform eLearning Bahasa Jepang
            </div>

            <h1 className="text-4xl md:text-6xl lg:text-7xl font-black text-white tracking-tighter leading-[1.05] mb-6">
              Kuasai Bahasa Jepang,{' '}
              <br className="hidden md:block" />
              <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-rose-400 bg-clip-text text-transparent">
                Raih Impianmu
              </span>
            </h1>

            <div className="flex items-center gap-3 mb-8">
              <div className="h-px w-12 bg-gradient-to-r from-transparent to-indigo-400/60" />
              <span className="text-indigo-400/80 text-sm font-bold tracking-[0.3em]">日本語マスター</span>
              <div className="h-px w-12 bg-gradient-to-l from-transparent to-indigo-400/60" />
            </div>

            <p className="text-lg md:text-xl text-slate-300 max-w-2xl mx-auto mb-10 leading-relaxed font-medium">
              Ribuan soal latihan JLPT &amp; JFT — kanji, kosakata, tata bahasa, dan listening. Didesain untuk mempersiapkan kamu lulus ujian dengan percaya diri.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center w-full max-w-xs sm:max-w-none">
              <Link
                href="/register"
                className="px-8 py-4 w-full sm:w-auto bg-gradient-to-r from-indigo-500 to-violet-500 text-white rounded-xl font-bold text-sm hover:from-indigo-400 hover:to-violet-400 transition-all shadow-xl shadow-indigo-500/30 flex items-center justify-center gap-2"
              >
                Mulai Gratis Sekarang <ArrowRight size={16} />
              </Link>
              <Link
                href="/products"
                className="px-8 py-4 w-full sm:w-auto border border-white/25 text-white/90 rounded-xl font-bold text-sm hover:bg-white/10 transition-all flex items-center justify-center gap-2 group backdrop-blur-sm"
              >
                Lihat Semua Produk
                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            <div className="mt-14 w-full max-w-2xl mx-auto border-t border-white/10 pt-10 grid grid-cols-2 sm:grid-cols-4 gap-x-8 gap-y-6">
              {[
                { value: '1,200+', label: 'Soal Tersedia' },
                { value: '500+', label: 'Pengguna Aktif' },
                { value: '6', label: 'Paket Belajar' },
                { value: '4.9★', label: 'Rating Rata-rata' },
              ].map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="text-2xl font-black text-white tracking-tight">{stat.value}</div>
                  <div className="text-xs text-slate-400 font-semibold mt-0.5">{stat.label}</div>
                </div>
              ))}
            </div>

            <div className="mt-8 flex flex-col items-center gap-3">
              <p className="text-xs text-slate-500 font-semibold uppercase tracking-widest">Dipercaya oleh pelajar yang mempersiapkan:</p>
              <div className="flex flex-wrap justify-center gap-2">
                {['JLPT N5', 'JLPT N4', 'JLPT N3', 'JFT Basic', 'JFT A2'].map((tag) => (
                  <span key={tag} className="px-3 py-1.5 bg-white/10 border border-white/20 text-white/80 rounded-full text-xs font-bold hover:bg-white/20 hover:text-white transition-colors cursor-default backdrop-blur-sm">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <div className="w-full bg-slate-950 leading-none overflow-hidden -mb-px">
        <svg viewBox="0 0 1440 64" xmlns="http://www.w3.org/2000/svg" className="w-full block" preserveAspectRatio="none">
          <path fill="#f8fafc" d="M0,42 C240,80 480,10 720,42 C960,74 1200,10 1440,42 L1440,64 L0,64 Z" />
        </svg>
      </div>

      <section className="py-24 px-4 bg-slate-50 border-b border-slate-100 relative overflow-hidden">
        <div className="absolute top-6 right-2 md:right-8 text-[160px] font-black text-slate-200 select-none pointer-events-none leading-none">練習</div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-rose-500 text-xs font-black tracking-[0.2em] uppercase">Produk Unggulan</span>
                <span className="text-rose-300 text-xs select-none">✦</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight mb-3">Paket Belajar Terpopuler</h2>
              <p className="text-slate-500 font-medium text-lg">Dipilih oleh ratusan pelajar untuk persiapan ujian JLPT dan JFT.</p>
            </div>
            <Link href="/products" className="px-6 py-3 bg-white border border-slate-200 rounded-xl font-bold text-sm text-slate-700 hover:bg-slate-50 transition-all shadow-sm flex items-center gap-2 shrink-0">
              Lihat semua <ArrowRight size={16} />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          <div className="mt-12 text-center">
            <Link href="/products" className="inline-flex items-center gap-2 text-indigo-600 font-bold hover:text-indigo-700 transition-colors">
              Lihat semua produk <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      <section className="py-24 px-4 bg-white border-b border-slate-100 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'linear-gradient(rgba(226,232,240,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(226,232,240,0.6) 1px, transparent 1px)', backgroundSize: '56px 56px' }} />

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-16">
            <div className="flex items-center justify-center gap-2 mb-4">
              <span className="text-rose-500 text-xs font-black tracking-[0.2em] uppercase">Cara Kerja</span>
              <span className="text-rose-300 text-xs select-none">✦</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">Mulai Belajar dalam 4 Langkah</h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-12 relative">
            <div className="absolute top-7 left-[12.5%] right-[12.5%] h-px bg-gradient-to-r from-indigo-200 via-violet-300 to-indigo-200 hidden lg:block pointer-events-none" />

            {[
              { num: '01', title: 'Buat Akun', desc: 'Daftar gratis dalam hitungan detik. Tidak perlu kartu kredit.' },
              { num: '02', title: 'Pilih Paket', desc: 'Temukan paket yang sesuai — JFT, JLPT, kanji, atau kosakata.' },
              { num: '03', title: 'Bayar & Akses', desc: 'Pembayaran aman via berbagai metode. Materi tersedia langsung setelah transaksi.' },
              { num: '04', title: 'Mulai Belajar', desc: 'Kerjakan soal, lacak progres, dan tingkatkan skor ujianmu.' },
            ].map((step, index) => (
              <div key={index} className="flex flex-col items-center text-center group">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center mb-6 shadow-lg shadow-indigo-200 group-hover:-translate-y-1 transition-transform duration-300 relative z-10">
                  <span className="text-lg font-black text-white">{step.num}</span>
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">{step.title}</h3>
                <p className="text-slate-500 font-medium leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 px-4 bg-slate-950 border-b border-white/10 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, rgba(99,102,241,0.13) 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
        <div className="absolute bottom-0 right-0 text-[200px] font-black text-white/[0.04] select-none pointer-events-none leading-none">特徴</div>
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-indigo-600/15 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-72 h-72 bg-rose-600/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="max-w-2xl mb-16">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-rose-400 text-xs font-black tracking-[0.2em] uppercase">Keunggulan</span>
              <span className="text-rose-700 text-xs select-none">✦</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight mb-4">Kenapa Pilih KeJepangDulu?</h2>
            <p className="text-slate-400 font-medium text-lg leading-relaxed">Kami membangun platform ini dengan satu tujuan — membantu kamu lulus ujian lebih cepat dan efisien.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 lg:gap-8">
            {[
              { icon: <Zap size={22} />, title: 'Akses Instan', desc: 'Setelah pembayaran berhasil, materi langsung tersedia tanpa perlu menunggu konfirmasi manual.' },
              { icon: <Lock size={22} />, title: 'Materi Terstruktur & Terpercaya', desc: 'Semua materi disusun secara sistematis dan mengikuti standar ujian terbaru, sehingga kamu belajar dengan arah yang jelas.' },
              { icon: <Smartphone size={22} />, title: 'Mobile-Friendly', desc: 'Tampilan dioptimalkan untuk semua perangkat. Belajar kapan saja dan di mana saja tanpa hambatan.' },
              { icon: <CheckCircle size={22} />, title: 'Akses Fleksibel', desc: 'Durasi akses disesuaikan dengan paket yang dipilih, sehingga kamu bisa belajar sesuai kebutuhan.' },
            ].map((feature, index) => (
              <div key={index} className="bg-white/5 backdrop-blur-sm p-8 rounded-3xl border border-white/10 hover:bg-white/10 hover:border-indigo-400/30 hover:-translate-y-1 transition-all duration-300">
                <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl text-white flex items-center justify-center mb-6 shadow-lg shadow-indigo-500/20">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-white mb-3 tracking-tight">{feature.title}</h3>
                <p className="text-slate-400 font-medium leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 px-4 bg-slate-50 relative overflow-hidden">
        <div className="absolute top-4 left-2 md:left-10 text-[180px] font-black text-slate-200 select-none pointer-events-none leading-none opacity-70">「</div>

        <div className="max-w-7xl w-full mx-auto relative z-10">
          <div className="text-center mb-16">
            <div className="flex items-center justify-center gap-2 mb-4">
              <span className="text-rose-500 text-xs font-black tracking-[0.2em] uppercase">Testimoni</span>
              <span className="text-rose-300 text-xs select-none">✦</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">Apa Kata Mereka?</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { name: 'Rizky A.', role: 'Lulus JFT A2', text: 'Soal-soalnya mirip banget sama ujian asli. Dalam 3 minggu intensif pakai KeJepangDulu, saya berhasil lulus JFT A2!' },
              { name: 'Dewi S.', role: 'JLPT N4', text: 'Antarmukanya bersih dan mudah dipakai. Saya bisa latihan di HP sambil commute. Sangat membantu persiapan JLPT saya.' },
              { name: 'Budi H.', role: 'JFT Basic', text: 'Harganya sangat terjangkau tapi kualitas soal tidak murahan. Worth it banget untuk persiapan kerja ke Jepang.' },
            ].map((testimonial, index) => (
              <div key={index} className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl hover:border-indigo-100 hover:-translate-y-1 transition-all duration-300 flex flex-col">
                <div className="flex gap-0.5 mb-5">
                  {Array.from({ length: 5 }).map((_, star) => (
                    <span key={star} className="text-amber-400 text-base">★</span>
                  ))}
                </div>
                <p className="mb-8 font-medium leading-relaxed text-slate-600 flex-1">"{testimonial.text}"</p>
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-white font-bold flex items-center justify-center shrink-0 shadow-md shadow-indigo-100 text-sm">
                    {testimonial.name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-bold text-slate-900">{testimonial.name}</div>
                    <div className="text-xs text-slate-500 font-semibold">{testimonial.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-32 px-4 bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 relative overflow-hidden flex justify-center">
        <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, rgba(99,102,241,0.13) 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
        <div className="absolute top-1/2 left-1/2 w-[700px] h-[700px] bg-indigo-600/20 rounded-full blur-[150px] -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-violet-600/15 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute top-0 left-0 w-[300px] h-[300px] bg-rose-600/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute top-4 right-6 md:right-16 text-[180px] font-black text-white/[0.04] select-none pointer-events-none leading-none">成功</div>

        <div className="max-w-3xl w-full relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 border border-white/20 rounded-full text-xs font-bold text-white/80 uppercase tracking-widest mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" />
            Bergabung Sekarang
          </div>
          <h2 className="text-3xl md:text-5xl font-black text-white mb-6 tracking-tight leading-tight">
            Siap Mewujudkan Mimpi<br className="hidden md:block" /> Bekerja &amp; Belajar di Jepang?
          </h2>
          <p className="text-indigo-200 text-lg md:text-xl mb-12 leading-relaxed font-medium">
            Bergabunglah dengan 500+ pelajar yang sudah mempercayakan persiapan ujian mereka ke KeJepangDulu.
          </p>
          <Link href="/register" className="inline-flex items-center gap-2 px-10 py-5 bg-white text-slate-900 rounded-xl font-bold transition-all shadow-2xl hover:bg-slate-50 text-lg hover:-translate-y-1">
            Buat Akun Gratis <ArrowRight size={20} />
          </Link>
          <p className="mt-4 text-indigo-300/70 text-sm font-medium">Gratis · Tidak perlu kartu kredit</p>
        </div>
      </section>
    </div>
  );
}
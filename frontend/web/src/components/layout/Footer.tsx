import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 mt-auto">
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 mb-8">
          {/* Brand */}
          <div>
            <p className="text-xl font-bold text-white mb-2">
              KeJepang<span className="text-accent-400">Dulu</span>
            </p>
            <p className="text-sm text-gray-400 leading-relaxed">
              Platform latihan soal JLPT dan JFT untuk membantu kamu sukses ujian bahasa Jepang.
            </p>
          </div>

          {/* Links */}
          <div>
            <p className="text-sm font-semibold text-white uppercase tracking-wide mb-3">
              Tautan
            </p>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/products" className="hover:text-white transition-colors">
                  Produk
                </Link>
              </li>
              <li>
                <Link href="/my-learning" className="hover:text-white transition-colors">
                  Belajarku
                </Link>
              </li>
              <li>
                <Link href="/profile" className="hover:text-white transition-colors">
                  Profil
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <p className="text-sm font-semibold text-white uppercase tracking-wide mb-3">
              Bantuan
            </p>
            <ul className="space-y-2 text-sm">
              <li>
                <a
                  href="mailto:support@kejepangdulu.com"
                  className="hover:text-white transition-colors"
                >
                  Kontak Kami
                </a>
              </li>
              <li>
                <a href="#faq" className="hover:text-white transition-colors">
                  FAQ
                </a>
              </li>
              <li>
                <a href="#terms" className="hover:text-white transition-colors">
                  Syarat & Ketentuan
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-6 text-sm text-gray-500 text-center">
          © {new Date().getFullYear()} KeJepangDulu. Hak cipta dilindungi.
        </div>
      </div>
    </footer>
  );
}

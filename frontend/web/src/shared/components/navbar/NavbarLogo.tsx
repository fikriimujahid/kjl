import Link from 'next/link';

export function NavbarLogo() {
  return (
    <Link href="/" className="flex items-center gap-2">
      <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">K</div>
      <span className="font-bold text-xl tracking-tight text-indigo-900 hidden sm:block">KeJepangDulu</span>
    </Link>
  );
}
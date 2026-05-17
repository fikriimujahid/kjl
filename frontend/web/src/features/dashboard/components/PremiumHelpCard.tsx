import { Mail } from 'lucide-react';

export function PremiumHelpCard() {
  return (
    <div className="bg-slate-900 rounded-2xl p-5 text-white relative overflow-hidden group hover:shadow-xl transition-all">
      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-1.5">
          <Mail size={13} className="text-indigo-400" />
          <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest">Bantuan Premium</p>
        </div>
        <h4 className="font-bold text-base mb-3 leading-tight">Punya Kendala Belajar?</h4>
        <button className="w-full py-2.5 bg-white text-slate-900 hover:bg-slate-100 rounded-xl text-xs font-bold transition-colors">
          Tanya Sensei Sekarang
        </button>
      </div>
      <div className="absolute -right-4 -bottom-4 grid grid-cols-4 gap-2 opacity-10 transform -rotate-12 group-hover:rotate-0 transition-transform duration-500">
        {Array.from({ length: 16 }).map((_, index) => (
          <div key={index} className="w-2 h-2 rounded-full bg-white" />
        ))}
      </div>
    </div>
  );
}
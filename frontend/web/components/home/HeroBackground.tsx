export function HeroBackground() {
  return (
    <>
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(99,102,241,0.18) 1px, transparent 1px)',
          backgroundSize: '30px 30px',
        }}
      />
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-slate-950 to-transparent pointer-events-none" />
      <div className="absolute -top-2 right-[-1rem] md:right-10 text-[220px] font-black text-white/[0.045] select-none pointer-events-none leading-none tracking-tighter">合格</div>
      <div className="absolute bottom-4 left-[-1rem] md:left-8 text-[220px] font-black text-white/[0.045] select-none pointer-events-none leading-none tracking-tighter">頑張</div>
      <div className="absolute top-0 left-1/2 w-[600px] h-[400px] bg-indigo-600/25 rounded-full blur-[130px] -translate-x-1/2 -translate-y-1/3 pointer-events-none" />
      <div className="absolute top-1/3 right-0 w-80 h-80 bg-rose-600/20 rounded-full blur-[110px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-72 h-72 bg-violet-600/20 rounded-full blur-[110px] pointer-events-none" />
    </>
  );
}

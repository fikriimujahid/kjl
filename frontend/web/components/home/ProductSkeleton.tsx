export function ProductSkeleton() {
  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm h-full flex flex-col animate-pulse">
      <div className="p-6 md:p-8 flex-grow flex flex-col">
        <div className="flex justify-between items-start mb-4">
          <div className="h-6 w-16 bg-slate-100 rounded-md" />
          <div className="w-10 h-10 bg-slate-100 rounded-2xl" />
        </div>
        <div className="h-6 w-3/4 bg-slate-200 rounded-md mb-2" />
        <div className="h-4 w-full bg-slate-100 rounded-md mb-1.5" />
        <div className="h-4 w-5/6 bg-slate-100 rounded-md mb-1.5" />
        <div className="h-4 w-2/3 bg-slate-100 rounded-md" />
        <div className="flex gap-3 mt-auto pt-6">
          <div className="h-4 w-20 bg-slate-100 rounded-md" />
          <div className="h-4 w-20 bg-slate-100 rounded-md" />
        </div>
        <div className="flex items-center justify-between pt-6 border-t border-slate-100 mt-6">
          <div>
            <div className="h-3 w-24 bg-slate-100 rounded mb-1.5" />
            <div className="h-5 w-20 bg-slate-200 rounded" />
          </div>
          <div className="h-9 w-20 bg-slate-200 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

export default function ProductDetailSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16 animate-pulse">
      <div className="h-5 w-40 bg-gray-200 rounded-full mb-10" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
        <div className="space-y-8">
          <div className="w-full aspect-[4/3] bg-gray-200 rounded-[3rem]" />

          <div className="space-y-3">
            <div className="flex items-center justify-between mb-6">
              <div className="h-7 w-36 bg-gray-200 rounded-full" />
              <div className="h-5 w-32 bg-gray-200 rounded-full" />
            </div>
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-white rounded-2xl border border-gray-100" />
            ))}
          </div>
        </div>

        <div className="space-y-8">
          <div className="space-y-4">
            <div className="h-6 w-20 bg-gray-200 rounded-full" />
            <div className="h-12 w-3/4 bg-gray-200 rounded-xl" />
            <div className="h-4 w-full bg-gray-200 rounded-full" />
            <div className="h-4 w-5/6 bg-gray-200 rounded-full" />
            <div className="h-4 w-2/3 bg-gray-200 rounded-full" />
          </div>

          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white p-4 rounded-3xl border border-gray-100 h-24" />
            ))}
          </div>

          <div className="bg-indigo-50 p-8 rounded-[2.5rem] border border-indigo-100 h-28" />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-14 bg-white rounded-2xl border border-gray-50 shadow-sm" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

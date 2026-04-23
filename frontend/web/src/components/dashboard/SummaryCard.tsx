interface SummaryCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  accent?: boolean;
}

export default function SummaryCard({ label, value, icon, accent = false }: SummaryCardProps) {
  return (
    <div
      className={`rounded-2xl p-5 flex items-center gap-4 ${
        accent ? "bg-primary-600 text-white" : "bg-white border border-gray-200"
      }`}
    >
      <div
        className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
          accent ? "bg-white/20" : "bg-primary-50"
        }`}
      >
        <span className={accent ? "text-white" : "text-primary-600"}>{icon}</span>
      </div>
      <div>
        <p className={`text-2xl font-bold ${accent ? "text-white" : "text-gray-900"}`}>{value}</p>
        <p className={`text-sm mt-0.5 ${accent ? "text-primary-100" : "text-gray-500"}`}>{label}</p>
      </div>
    </div>
  );
}

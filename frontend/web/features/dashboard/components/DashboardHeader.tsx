import { motion } from 'motion/react';

interface DashboardHeaderProps {
  userName?: string;
}

export function DashboardHeader({ userName }: DashboardHeaderProps) {
  return (
    <motion.header
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="px-1 py-2"
    >
      <h1 className="text-xl font-semibold text-slate-800">
        Selamat datang kembali, <span className="text-indigo-600">{userName ?? 'Pengguna'}</span>
      </h1>
    </motion.header>
  );
}
"use client";

import { useState, useEffect, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { mockPayments, formatIDR } from "@/lib/mock-data";
import Loader from "@/components/ui/Loader";

function StatusBadge({ status }: { status: "pending" | "success" | "failed" }) {
  const map = {
    success: "bg-green-50 text-green-700",
    failed: "bg-red-50 text-red-600",
    pending: "bg-yellow-50 text-yellow-700",
  };
  const label = { success: "Berhasil", failed: "Gagal", pending: "Menunggu" };
  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${map[status]}`}>
      {label[status]}
    </span>
  );
}

export default function ProfilePage() {
  const { user, isLoggedIn, isLoading, updateDisplayName, logout } = useAuth();
  const router = useRouter();

  const [displayName, setDisplayName] = useState("");
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && !isLoggedIn) router.replace("/login");
  }, [isLoading, isLoggedIn, router]);

  useEffect(() => {
    if (user) setDisplayName(user.displayName);
  }, [user]);

  if (isLoading) return <Loader message="Memuat profil..." />;
  if (!user) return null;

  async function handleSaveName(e: FormEvent) {
    e.preventDefault();
    if (!displayName.trim()) return;
    setSaving(true);
    await new Promise((r) => setTimeout(r, 600));
    updateDisplayName(displayName.trim());
    setSaving(false);
    setEditing(false);
    setSaveMsg("Nama berhasil diperbarui.");
    setTimeout(() => setSaveMsg(null), 3000);
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-10 flex flex-col gap-8">
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Profil Saya</h1>

      {/* User info card */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 flex flex-col gap-6">
        {/* Avatar + basic info */}
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-primary-600 flex items-center justify-center text-white text-2xl font-bold flex-shrink-0 select-none">
            {user.displayName[0]?.toUpperCase()}
          </div>
          <div>
            <p className="text-lg font-bold text-gray-900">{user.displayName}</p>
            <p className="text-sm text-gray-500">{user.email}</p>
            <p className="text-xs text-gray-400 mt-0.5">
              Bergabung sejak {new Date(user.createdAt).toLocaleDateString("id-ID", { year: "numeric", month: "long" })}
            </p>
          </div>
        </div>

        {/* Edit display name */}
        <div className="border-t border-gray-100 pt-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-gray-700">Nama Tampilan</p>
            {!editing && (
              <button
                onClick={() => setEditing(true)}
                className="text-xs text-primary-600 font-semibold hover:text-primary-700 focus:outline-none focus-visible:underline"
              >
                Edit
              </button>
            )}
          </div>

          {editing ? (
            <form onSubmit={handleSaveName} className="flex gap-3">
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                maxLength={50}
                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                autoFocus
                aria-label="Nama tampilan"
              />
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2.5 rounded-xl bg-primary-600 text-white text-sm font-semibold hover:bg-primary-700 disabled:opacity-60 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
              >
                {saving ? "..." : "Simpan"}
              </button>
              <button
                type="button"
                onClick={() => { setEditing(false); setDisplayName(user.displayName); }}
                className="px-4 py-2.5 rounded-xl border border-gray-300 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-400"
              >
                Batal
              </button>
            </form>
          ) : (
            <p className="text-sm text-gray-900 bg-gray-50 px-4 py-2.5 rounded-xl">{user.displayName}</p>
          )}

          {saveMsg && (
            <p className="text-xs text-green-600 mt-2 font-medium">{saveMsg}</p>
          )}
        </div>

        {/* Email (read-only) */}
        <div className="border-t border-gray-100 pt-5">
          <p className="text-sm font-semibold text-gray-700 mb-2">Email</p>
          <p className="text-sm text-gray-900 bg-gray-50 px-4 py-2.5 rounded-xl">{user.email}</p>
          <p className="text-xs text-gray-400 mt-1">Email tidak dapat diubah.</p>
        </div>

        {/* Logout */}
        <div className="border-t border-gray-100 pt-5">
          <button
            onClick={() => { logout(); router.push("/"); }}
            className="px-5 py-2.5 rounded-xl border border-red-200 text-red-600 text-sm font-semibold hover:bg-red-50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
          >
            Keluar dari Akun
          </button>
        </div>
      </div>

      {/* Payment history */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-5">Riwayat Pembayaran</h2>

        {mockPayments.length === 0 ? (
          <p className="text-sm text-gray-500">Belum ada transaksi.</p>
        ) : (
          <div className="flex flex-col divide-y divide-gray-100">
            {mockPayments.map((payment) => (
              <div key={payment.id} className="py-4 flex items-start sm:items-center justify-between gap-3 flex-col sm:flex-row">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 text-sm truncate">{payment.productName}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {new Date(payment.createdAt).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                    {" · "}
                    <span className="font-medium text-gray-700">{formatIDR(payment.amount)}</span>
                  </p>
                </div>
                <StatusBadge status={payment.status} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

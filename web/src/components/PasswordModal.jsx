import { useEffect, useState } from "react";

export default function PasswordModal({ open, title = "Confirme sua senha", onCancel, onConfirm }) {
  const [pwd, setPwd] = useState("");

  useEffect(() => {
    if (open) setPwd("");
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#0b0e16] p-4 shadow-[0_30px_80px_rgba(0,0,0,0.65)]">
        <div className="text-sm font-semibold">{title}</div>
        <div className="mt-2 text-xs text-zinc-400">
          Digite sua senha de login para continuar.
        </div>

        <input
          type="password"
          value={pwd}
          onChange={(e) => setPwd(e.target.value)}
          className="mt-3 w-full h-10 rounded-xl border border-white/10 bg-black/20 px-3 text-sm outline-none"
          placeholder="••••••••"
          autoFocus
        />

        <div className="mt-4 flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="h-10 rounded-xl border border-white/10 bg-white/5 px-3 text-sm hover:bg-white/10 transition"
          >
            Cancelar
          </button>
          <button
            onClick={() => onConfirm(pwd)}
            className="h-10 rounded-xl bg-indigo-500 px-3 text-sm font-semibold hover:bg-indigo-400 transition"
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
}
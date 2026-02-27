import { useEffect, useMemo, useState } from "react";
import { api } from "../api/client";
import PageHeader from "../components/PageHeader";
import { Plus, Pencil, Trash2, X } from "lucide-react";

function money(v) {
  if (v === null || v === undefined) return "—";
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(v));
}

const MONTHS = [
  { key: "01", label: "jan" }, { key: "02", label: "fev" }, { key: "03", label: "mar" },
  { key: "04", label: "abr" }, { key: "05", label: "mai" }, { key: "06", label: "jun" },
  { key: "07", label: "jul" }, { key: "08", label: "ago" }, { key: "09", label: "set" },
  { key: "10", label: "out" }, { key: "11", label: "nov" }, { key: "12", label: "dez" },
];

function yearsAroundNow(count = 8) {
  const y = new Date().getFullYear();
  const list = [];
  for (let i = 0; i < count; i++) list.push(String(y - i));
  return list;
}

/** Modal de senha */
function PasswordModal({
  open,
  title,
  subtitle,
  confirmLabel = "Confirmar",
  danger = false,
  password,
  setPassword,
  onClose,
  onConfirm,
  loading,
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#0b0e16] shadow-[0_20px_80px_rgba(0,0,0,0.6)]">
        <div className="flex items-start justify-between gap-3 p-4 border-b border-white/10">
          <div>
            <div className="text-sm font-semibold">{title}</div>
            {subtitle ? <div className="mt-1 text-xs text-zinc-400">{subtitle}</div> : null}
          </div>
          <button
            onClick={onClose}
            className="rounded-lg border border-white/10 bg-white/5 p-2 hover:bg-white/10 transition"
            title="Fechar"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-4 space-y-3">
          <div>
            <div className="text-xs text-zinc-400 mb-1">Senha do usuário</div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full h-10 rounded-xl border border-white/10 bg-black/20 px-3 text-sm outline-none"
              placeholder="Digite sua senha"
              autoFocus
            />
            <div className="mt-1 text-[11px] text-zinc-500">Mesma senha do login.</div>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              onClick={onClose}
              className="h-10 rounded-xl border border-white/10 bg-white/5 px-3 text-sm hover:bg-white/10 transition"
              disabled={loading}
            >
              Cancelar
            </button>

            <button
              onClick={onConfirm}
              disabled={loading || !password}
              className={[
                "h-10 rounded-xl px-3 text-sm font-semibold transition disabled:opacity-60",
                danger ? "bg-red-500 hover:bg-red-400 text-white" : "bg-indigo-500 hover:bg-indigo-400 text-white",
              ].join(" ")}
            >
              {loading ? "Aguarde..." : confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Card simples */
function StatCard({ label, value }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4 min-w-0">
      <div className="text-xs text-zinc-400">{label}</div>
      <div className="mt-1 text-lg font-semibold truncate">{value}</div>
    </div>
  );
}

export default function Entries({ token, companyId }) {
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const [competenceMonth, setCompetenceMonth] = useState(
    localStorage.getItem("competenceMonth") || new Date().toISOString().slice(0, 7)
  );

  const [selectedYear, selectedMM] = useMemo(() => {
    const [y, m] = String(competenceMonth || "").split("-");
    return [y || String(new Date().getFullYear()), m || "01"];
  }, [competenceMonth]);

  const availableYears = useMemo(() => yearsAroundNow(8), []);

  const [costCenters, setCostCenters] = useState([]);
  const [entries, setEntries] = useState([]);

  // form
  const [costCenterId, setCostCenterId] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");

  // senha (para delete OU para liberar edição)
  const [pwdOpen, setPwdOpen] = useState(false);
  const [pwdMode, setPwdMode] = useState(null); // "edit" | "delete"
  const [pwd, setPwd] = useState("");
  const [selectedEntry, setSelectedEntry] = useState(null);

  // ✅ modal de edição (abre só DEPOIS da senha)
  const [editOpen, setEditOpen] = useState(false);
  const [editPwd, setEditPwd] = useState(""); // senha salva após confirmação
  const [editCostCenterId, setEditCostCenterId] = useState("");
  const [editAmount, setEditAmount] = useState("");
  const [editDescription, setEditDescription] = useState("");

  function onChangeYear(y) {
    setCompetenceMonth(`${y}-${selectedMM}`);
  }

  function onPickMonth(mm) {
    setCompetenceMonth(`${selectedYear}-${mm}`);
  }

  async function loadAll() {
    setErr("");
    if (!companyId) return;

    setLoading(true);
    try {
      const [ccRes, enRes] = await Promise.all([
        api(`/cost-centers?companyId=${companyId}`, { token }),
        api(`/entries?companyId=${companyId}&competenceMonth=${competenceMonth}`, { token }),
      ]);

      const ccs = ccRes.costCenters || [];
      setCostCenters(ccs);

      const list = Array.isArray(enRes) ? enRes : (enRes.entries || []);
      setEntries(list);

      if (!costCenterId && ccs.length) setCostCenterId(ccs[0].id);
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    localStorage.setItem("competenceMonth", competenceMonth);
  }, [competenceMonth]);

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyId, competenceMonth]);

  const monthSummary = useMemo(() => {
    let total = 0;
    for (const e of entries) total += Number(e.amount || 0);
    return { total };
  }, [entries]);

  async function createEntry() {
    setErr("");
    if (!costCenterId) return setErr("Selecione um centro de custo.");
    if (!amount || Number(amount) <= 0) return setErr("Informe um valor maior que 0.");

    setLoading(true);
    try {
      await api("/entries", {
        method: "POST",
        token,
        body: {
          companyId,
          competenceMonth,
          costCenterId,
          amount: Number(amount),
          description: description.trim() || null,
        },
      });

      setAmount("");
      setDescription("");
      await loadAll();
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  // ✅ 1) clica em editar => pede senha ANTES de abrir o modal
  function startEdit(entry) {
    setSelectedEntry(entry);

    // prepara os campos (mas não abre modal ainda)
    setEditCostCenterId(entry?.costCenterId || entry?.costCenter?.id || "");
    setEditAmount(String(entry?.amount ?? ""));
    setEditDescription(entry?.description || "");

    setPwd("");
    setEditPwd("");
    setPwdMode("edit");
    setPwdOpen(true); // ✅ só senha agora
  }

  function startDelete(entry) {
    setSelectedEntry(entry);
    setPwd("");
    setPwdMode("delete");
    setPwdOpen(true);
  }

  function closePwdModal() {
    setPwdOpen(false);
    setPwdMode(null);
    setPwd("");
    setSelectedEntry(null);
  }

  // ✅ 2) confirma senha:
  // - delete: executa delete
  // - edit: FECHA senha e ABRE modal de edição
  async function confirmPwdAction() {
    if (!selectedEntry?.id) return;
    if (!pwd) return;

    setLoading(true);
    setErr("");

    try {
      if (pwdMode === "delete") {
        await api(`/entries/${selectedEntry.id}`, {
          method: "DELETE",
          token,
          body: { companyId, password: pwd },
        });

        closePwdModal();
        await loadAll();
        return;
      }

      if (pwdMode === "edit") {
        // ✅ só libera a edição
        setEditPwd(pwd);
        setPwdOpen(false);
        setPwdMode(null);
        setPwd("");
        setEditOpen(true); // ✅ agora abre a caixa de edição
        return;
      }
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  function closeEditModal() {
    setEditOpen(false);
    setEditPwd("");
    setSelectedEntry(null);
  }

  // ✅ 3) salva dentro do modal de edição
  async function saveEditFromModal() {
    if (!selectedEntry?.id) return;
    if (!editPwd) return setErr("Senha não informada. Clique em editar novamente.");
    if (!editCostCenterId) return setErr("Selecione um centro de custo.");
    if (!editAmount || Number(editAmount) <= 0) return setErr("Valor inválido.");

    setLoading(true);
    setErr("");

    try {
      await api(`/entries/${selectedEntry.id}`, {
        method: "PUT",
        token,
        body: {
          companyId,
          password: editPwd,
          costCenterId: editCostCenterId,
          amount: Number(editAmount),
          description: editDescription.trim() || null,
        },
      });

      closeEditModal();
      await loadAll();
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  const modalTitle = pwdMode === "delete" ? "Excluir lançamento" : "Confirmar senha";
  const modalSubtitle =
    pwdMode === "delete"
      ? "Digite sua senha para confirmar a exclusão."
      : "Digite sua senha para liberar a edição.";

  return (
    <div className="w-full min-h-full overflow-hidden">
      <div className="h-[calc(100vh-90px)] overflow-hidden flex flex-col gap-4">
        {/* Header fixo */}
        <div className="shrink-0">
          <PageHeader
            title="LANÇAMENTOS"
            subtitle="Selecione o ano e o mês. Lance valores por Centro de Custo."
            loading={loading}
            onRefresh={loadAll}
            right={
              <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/20 px-3 py-2">
                <div className="text-xs text-zinc-400">Ano:</div>
                <select
                  value={selectedYear}
                  onChange={(e) => onChangeYear(e.target.value)}
                  className="bg-transparent text-sm outline-none"
                >
                  {availableYears.map((y) => (
                    <option key={y} value={y} className="bg-[#0b0e16]">
                      {y}
                    </option>
                  ))}
                </select>
              </div>
            }
          >
            <div className="flex flex-wrap gap-2">
              {MONTHS.map((m) => {
                const active = m.key === selectedMM;
                return (
                  <button
                    key={m.key}
                    onClick={() => onPickMonth(m.key)}
                    className={[
                      "px-3 py-1.5 rounded-lg text-xs font-semibold uppercase border transition",
                      active
                        ? "border-white/30 bg-white/15 text-white shadow-[0_0_0_2px_rgba(99,102,241,0.25)]"
                        : "border-white/10 bg-white/5 text-zinc-300 hover:bg-white/10",
                    ].join(" ")}
                  >
                    {m.label}
                  </button>
                );
              })}
            </div>

            {err && (
              <div className="mt-3 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
                {err}
              </div>
            )}
          </PageHeader>
        </div>

        {/* KPIs fixos */}
        <div className="shrink-0 grid grid-cols-1 md:grid-cols-3 gap-3">
          <StatCard label="Competência" value={competenceMonth} />
          <StatCard label="Lançamentos" value={String(entries.length)} />
          <StatCard label="Total do mês" value={money(monthSummary.total)} />
        </div>

        {/* Área principal */}
        <div className="flex-1 min-h-0 grid grid-cols-1 xl:grid-cols-3 gap-3">
          {/* Form (fixo) */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 shrink-0">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold">Novo lançamento</div>
                <div className="text-xs text-zinc-400">Centro + valor (descrição opcional)</div>
              </div>
              <div className="h-9 w-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                <Plus size={16} />
              </div>
            </div>

            <div className="mt-3 space-y-3">
              <div>
                <div className="text-xs text-zinc-400 mb-1">Centro de custo</div>
                <select
                  value={costCenterId}
                  onChange={(e) => setCostCenterId(e.target.value)}
                  className="w-full h-10 rounded-xl border border-white/10 bg-black/20 px-3 text-sm outline-none"
                >
                  {(costCenters || []).map((c) => (
                    <option key={c.id} value={c.id} className="bg-[#0b0e16]">
                      {c.name}
                    </option>
                  ))}
                </select>
                {costCenters.length === 0 && (
                  <div className="mt-2 text-xs text-zinc-400">Cadastre centros de custo primeiro.</div>
                )}
              </div>

              <div>
                <div className="text-xs text-zinc-400 mb-1">Valor</div>
                <input
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full h-10 rounded-xl border border-white/10 bg-black/20 px-3 text-sm outline-none"
                  placeholder="0,00"
                />
              </div>

              <div>
                <div className="text-xs text-zinc-400 mb-1">Descrição (opcional)</div>
                <input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full h-10 rounded-xl border border-white/10 bg-black/20 px-3 text-sm outline-none"
                  placeholder="Ex: Venda balcão / Energia / Fornecedor..."
                />
              </div>

              <button
                onClick={createEntry}
                disabled={loading}
                className="w-full h-10 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-sm font-semibold disabled:opacity-60 transition"
              >
                {loading ? "Salvando..." : "Salvar lançamento"}
              </button>
            </div>
          </div>

          {/* Lista (ÚNICO SCROLL) */}
          <div className="xl:col-span-2 rounded-2xl border border-white/10 bg-white/[0.04] p-4 overflow-hidden flex flex-col min-h-0">
            <div className="shrink-0">
              <div className="text-sm font-semibold">Lançamentos do mês</div>
              <div className="text-xs text-zinc-400 mt-1">
                {entries.length} lançamentos • competência {competenceMonth}
              </div>
            </div>

            <div className="mt-3 flex-1 min-h-0 overflow-y-auto overflow-x-hidden rounded-xl border border-white/10">
              <table className="w-full text-sm table-fixed">
                <thead className="text-zinc-400 bg-[#0b0e16] sticky top-0 z-20 border-b border-white/10">
                  <tr>
                    <th className="text-left py-2 px-3 w-[42%]">Descrição</th>
                    <th className="text-left py-2 px-3 w-[32%]">Centro</th>
                    <th className="text-right py-2 px-3 w-[14%]">Valor</th>
                    <th className="text-right py-2 px-3 w-[12%]">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((e) => (
                    <tr key={e.id} className="border-t border-white/10">
                      <td className="py-2 px-3 truncate">{e.description || "—"}</td>
                      <td className="py-2 px-3 truncate">{e.costCenter?.name || "—"}</td>
                      <td className="py-2 px-3 text-right font-semibold">{money(e.amount)}</td>
                      <td className="py-2 px-3">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => startEdit(e)}
                            className="inline-flex items-center justify-center rounded-lg border border-white/10 bg-white/5 p-2 hover:bg-white/10 transition"
                            title="Editar"
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            onClick={() => startDelete(e)}
                            className="inline-flex items-center justify-center rounded-lg border border-red-500/30 bg-red-500/10 p-2 hover:bg-red-500/20 transition"
                            title="Excluir"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}

                  {entries.length === 0 && (
                    <tr>
                      <td className="py-6 px-3 text-zinc-400" colSpan={4}>
                        Nenhum lançamento ainda neste mês.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="mt-3 text-xs text-zinc-500 shrink-0">
              Editar/Excluir exigem senha do usuário.
            </div>
          </div>
        </div>

        {/* ✅ MODAL SENHA (antes de abrir a edição) */}
        <PasswordModal
          open={pwdOpen}
          title={modalTitle}
          subtitle={modalSubtitle}
          confirmLabel={pwdMode === "delete" ? "Excluir" : "Confirmar"}
          danger={pwdMode === "delete"}
          password={pwd}
          setPassword={setPwd}
          onClose={closePwdModal}
          onConfirm={confirmPwdAction}
          loading={loading}
        />

        {/* ✅ MODAL EDIÇÃO (com botão SALVAR dentro) */}
        {editOpen && (
          <div className="fixed inset-0 z-[55] flex items-center justify-center bg-black/60 p-4">
            <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#0b0e16] shadow-[0_20px_80px_rgba(0,0,0,0.6)] overflow-hidden">
              <div className="flex items-start justify-between gap-3 p-4 border-b border-white/10">
                <div>
                  <div className="text-sm font-semibold">Editar lançamento</div>
                  <div className="text-xs text-zinc-400 mt-1">
                    Ajuste centro, valor e descrição.
                  </div>
                </div>
                <button
                  onClick={closeEditModal}
                  className="rounded-lg border border-white/10 bg-white/5 p-2 hover:bg-white/10 transition"
                  title="Fechar"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="p-4 space-y-3">
                <div>
                  <div className="text-xs text-zinc-400 mb-1">Centro de custo</div>
                  <select
                    value={editCostCenterId}
                    onChange={(e) => setEditCostCenterId(e.target.value)}
                    className="w-full h-10 rounded-xl border border-white/10 bg-black/20 px-3 text-sm outline-none"
                  >
                    {(costCenters || []).map((c) => (
                      <option key={c.id} value={c.id} className="bg-[#0b0e16]">
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <div className="text-xs text-zinc-400 mb-1">Valor</div>
                  <input
                    value={editAmount}
                    onChange={(e) => setEditAmount(e.target.value)}
                    className="w-full h-10 rounded-xl border border-white/10 bg-black/20 px-3 text-sm outline-none"
                    placeholder="0,00"
                  />
                </div>

                <div>
                  <div className="text-xs text-zinc-400 mb-1">Descrição</div>
                  <input
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    className="w-full h-10 rounded-xl border border-white/10 bg-black/20 px-3 text-sm outline-none"
                    placeholder="Opcional"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    onClick={closeEditModal}
                    className="h-10 rounded-xl border border-white/10 bg-white/5 px-3 text-sm hover:bg-white/10 transition"
                    disabled={loading}
                  >
                    Cancelar
                  </button>

                  <button
                    onClick={saveEditFromModal}
                    disabled={loading}
                    className="h-10 rounded-xl bg-indigo-500 hover:bg-indigo-400 px-4 text-sm font-semibold disabled:opacity-60 transition"
                  >
                    {loading ? "Salvando..." : "Salvar"}
                  </button>
                </div>

                <div className="text-[11px] text-zinc-500">
                  A senha já foi confirmada e será usada para salvar.
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
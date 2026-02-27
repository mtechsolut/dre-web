import { useEffect, useState } from "react";
import { api } from "../api/client";
import PageHeader from "../components/PageHeader";
import { Plus, Pencil, Trash2, X } from "lucide-react";

function prettyClass(v) {
  if (v === "FIXED") return "Custo fixo";
  if (v === "VARIABLE") return "Custo variável";
  return "—";
}

export default function CostCenters({ token, companyId }) {
  const [items, setItems] = useState([]);
  const [name, setName] = useState("");
  const [type, setType] = useState("EXPENSE");

  // criação: classificação só pra despesa
  const [expenseCategory, setExpenseCategory] = useState("FIXED"); // FIXED | VARIABLE

  // modal editar
  const [editOpen, setEditOpen] = useState(false);
  const [editingId, setEditingId] = useState("");
  const [editName, setEditName] = useState("");
  const [editType, setEditType] = useState("EXPENSE");
  const [editExpenseCategory, setEditExpenseCategory] = useState("FIXED");

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");

  async function load() {
    setErr("");
    setMsg("");
    if (!companyId) return;

    setLoading(true);
    try {
      const res = await api(`/cost-centers?companyId=${companyId}`, { token });
      setItems(res.costCenters || []);
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyId]);

  async function create() {
    setErr("");
    setMsg("");

    const n = name.trim();
    if (!n) return setErr("Informe o nome.");

    setLoading(true);
    try {
      await api("/cost-centers", {
        method: "POST",
        token,
        body: {
          companyId,
          name: n,
          type,
          expenseClass: type === "EXPENSE" ? expenseCategory : null, // ✅ salva no campo do prisma
        },
      });

      setName("");
      setType("EXPENSE");
      setExpenseCategory("FIXED");
      setMsg("Centro de custo criado!");
      await load();
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  function startEdit(c) {
    setErr("");
    setMsg("");
    setEditingId(c.id);
    setEditName(c.name || "");
    setEditType(c.type || "EXPENSE");

    // ✅ suporte aos dois nomes (caso backend esteja retornando um ou outro)
    const currentClass = c.expenseClass || c.expenseCategory || "FIXED";
    setEditExpenseCategory(currentClass);

    setEditOpen(true);
  }

  function closeEdit() {
    setEditOpen(false);
    setEditingId("");
    setEditName("");
    setEditType("EXPENSE");
    setEditExpenseCategory("FIXED");
  }

  async function saveEdit() {
    setErr("");
    setMsg("");

    const n = editName.trim();
    if (!n) return setErr("Nome inválido.");

    setLoading(true);
    try {
      await api(`/cost-centers/${editingId}`, {
        method: "PUT",
        token,
        body: {
          companyId,
          name: n,
          type: editType,
          expenseClass: editType === "EXPENSE" ? editExpenseCategory : null, // ✅ idem
        },
      });

      setMsg("Atualizado!");
      closeEdit();
      await load();
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function remove(id) {
    setErr("");
    setMsg("");

    if (!confirm("Tem certeza que deseja excluir este centro de custo?")) return;

    setLoading(true);
    try {
      await api(`/cost-centers/${id}`, {
        method: "DELETE",
        token,
        body: { companyId },
      });
      setMsg("Excluído!");
      await load();
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full min-h-full space-y-4 overflow-x-hidden">
      <PageHeader
        title="CENTRO DE CUSTO"
        subtitle="Cadastre e classifique como Receita ou Despesa. (ex: Vendas Dinheiro, Pix, Fornecedor...)"
        loading={loading}
        onRefresh={load}
      >
        {(err || msg) && (
          <div className="mt-3 space-y-2">
            {err && (
              <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
                {err}
              </div>
            )}
            {msg && (
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-200">
                {msg}
              </div>
            )}
          </div>
        )}
      </PageHeader>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-3">
        {/* Form */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold">Novo centro</div>
              <div className="text-xs text-zinc-400">Nome + tipo</div>
            </div>
            <div className="h-9 w-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
              <Plus size={16} />
            </div>
          </div>

          <div className="mt-3 space-y-3">
            <div>
              <div className="text-xs text-zinc-400 mb-1">Nome</div>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full h-10 rounded-xl border border-white/10 bg-black/20 px-3 text-sm outline-none"
                placeholder="Ex: Vendas em Dinheiro"
              />
            </div>

            <div>
              <div className="text-xs text-zinc-400 mb-1">Tipo</div>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full h-10 rounded-xl border border-white/10 bg-black/20 px-3 text-sm outline-none"
              >
                <option value="REVENUE" className="bg-[#0b0e16]">
                  Receita
                </option>
                <option value="EXPENSE" className="bg-[#0b0e16]">
                  Despesa
                </option>
              </select>
            </div>

            {/* aparece só se for despesa */}
            {type === "EXPENSE" && (
              <div>
                <div className="text-xs text-zinc-400 mb-1">Classificação</div>
                <select
                  value={expenseCategory}
                  onChange={(e) => setExpenseCategory(e.target.value)}
                  className="w-full h-10 rounded-xl border border-white/10 bg-black/20 px-3 text-sm outline-none"
                >
                  <option value="FIXED" className="bg-[#0b0e16]">
                    Custo fixo
                  </option>
                  <option value="VARIABLE" className="bg-[#0b0e16]">
                    Custo variável
                  </option>
                </select>
              </div>
            )}

            <button
              onClick={create}
              disabled={loading}
              className="w-full h-10 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-sm font-semibold disabled:opacity-60 transition"
            >
              {loading ? "Salvando..." : "Criar"}
            </button>
          </div>
        </div>

        {/* List (com scroll + sticky header) */}
        <div className="xl:col-span-2 rounded-2xl border border-white/10 bg-white/[0.04] p-4 overflow-hidden">
          <div className="text-sm font-semibold">Lista</div>
          <div className="text-xs text-zinc-400 mt-1">{items.length} centros</div>

          <div className="mt-3 rounded-xl border border-white/10 overflow-hidden">
            <div className="max-h-[420px] overflow-y-auto overflow-x-auto">
              <table className="w-full text-sm table-fixed">
                {/* ✅ STICKY: impede passar por trás */}
                <thead className="text-zinc-400 bg-[#0b0e16] sticky top-0 z-20 border-b border-white/10">
                  <tr>
                    <th className="text-left py-2 px-3 w-[45%]">Nome</th>
                    <th className="text-left py-2 px-3 w-[15%]">Tipo</th>
                    <th className="text-left py-2 px-3 w-[20%]">Classificação</th>
                    <th className="text-right py-2 px-3 w-[20%]">Ações</th>
                  </tr>
                </thead>

                <tbody>
                  {items.map((c) => {
                    const isExpense = c.type !== "REVENUE";
                    const cls = c.expenseClass || c.expenseCategory; // ✅ compat
                    return (
                      <tr key={c.id} className="border-t border-white/10">
                        <td className="py-2 px-3">
                          <div className="truncate">{c.name}</div>
                        </td>

                        <td className="py-2 px-3">
                          {c.type === "REVENUE" ? "Receita" : "Despesa"}
                        </td>

                        {/* ✅ nova coluna */}
                        <td className="py-2 px-3">
                          {isExpense ? prettyClass(cls) : "—"}
                        </td>

                        <td className="py-2 px-3">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => startEdit(c)}
                              className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm hover:bg-white/10 transition"
                            >
                              <Pencil size={16} /> Editar
                            </button>
                            <button
                              onClick={() => remove(c.id)}
                              className="inline-flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm hover:bg-red-500/20 transition"
                            >
                              <Trash2 size={16} /> Excluir
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                  {items.length === 0 && (
                    <tr>
                      <td className="py-4 px-3 text-zinc-400" colSpan={4}>
                        Nenhum centro de custo cadastrado ainda.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-3 text-xs text-zinc-500">
            Obs: não dá pra excluir se já tiver lançamentos usando o centro.
          </div>
        </div>
      </div>

      {/* MODAL EDITAR */}
      {editOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#0b0e16] shadow-[0_20px_80px_rgba(0,0,0,0.6)] overflow-hidden">
            <div className="flex items-start justify-between gap-3 p-4 border-b border-white/10">
              <div>
                <div className="text-sm font-semibold">Editar centro de custo</div>
                <div className="mt-1 text-xs text-zinc-400">
                  Ajuste nome, tipo e classificação (se for despesa).
                </div>
              </div>
              <button
                onClick={closeEdit}
                className="rounded-lg border border-white/10 bg-white/5 p-2 hover:bg-white/10 transition"
                title="Fechar"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-4 space-y-3">
              <div>
                <div className="text-xs text-zinc-400 mb-1">Nome</div>
                <input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full h-10 rounded-xl border border-white/10 bg-black/20 px-3 text-sm outline-none"
                  placeholder="Nome do centro"
                  autoFocus
                />
              </div>

              <div>
                <div className="text-xs text-zinc-400 mb-1">Tipo</div>
                <select
                  value={editType}
                  onChange={(e) => setEditType(e.target.value)}
                  className="w-full h-10 rounded-xl border border-white/10 bg-black/20 px-3 text-sm outline-none"
                >
                  <option value="REVENUE" className="bg-[#0b0e16]">
                    Receita
                  </option>
                  <option value="EXPENSE" className="bg-[#0b0e16]">
                    Despesa
                  </option>
                </select>
              </div>

              {editType === "EXPENSE" && (
                <div>
                  <div className="text-xs text-zinc-400 mb-1">Classificação</div>
                  <select
                    value={editExpenseCategory}
                    onChange={(e) => setEditExpenseCategory(e.target.value)}
                    className="w-full h-10 rounded-xl border border-white/10 bg-black/20 px-3 text-sm outline-none"
                  >
                    <option value="FIXED" className="bg-[#0b0e16]">
                      Custo fixo
                    </option>
                    <option value="VARIABLE" className="bg-[#0b0e16]">
                      Custo variável
                    </option>
                  </select>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={closeEdit}
                  className="h-10 rounded-xl border border-white/10 bg-white/5 px-3 text-sm hover:bg-white/10 transition"
                  disabled={loading}
                >
                  Cancelar
                </button>

                <button
                  onClick={saveEdit}
                  disabled={loading}
                  className="h-10 rounded-xl bg-indigo-500 hover:bg-indigo-400 px-4 text-sm font-semibold disabled:opacity-60 transition"
                >
                  {loading ? "Salvando..." : "Salvar"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
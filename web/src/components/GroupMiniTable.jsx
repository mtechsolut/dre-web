function money(v) {
  if (v === null || v === undefined) return "—";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(v));
}

function sumAbs(groups) {
  return Object.values(groups || {}).reduce((acc, v) => acc + Math.abs(Number(v || 0)), 0);
}

export default function GroupMiniTable({ groups }) {
  const entries = Object.entries(groups || {})
    .map(([name, value]) => ({
      name,
      value: Math.abs(Number(value || 0)),
    }))
    .filter((x) => x.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

  const total = sumAbs(groups || {});
  const has = entries.length > 0;

  return (
    <div className="w-full h-full">
      {has ? (
        <div className="space-y-2">
          <div className="text-xs text-zinc-400">
            Top 8 grupos (participação por valor absoluto)
          </div>

          <div className="rounded-xl border border-white/10 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-black/20 text-zinc-400">
                <tr>
                  <th className="text-left py-2 px-3">Grupo</th>
                  <th className="text-right py-2 px-3 w-[140px]">Valor</th>
                  <th className="text-right py-2 px-3 w-[120px]">% </th>
                </tr>
              </thead>
              <tbody>
                {entries.map((row) => {
                  const p = total > 0 ? (row.value / total) * 100 : 0;
                  return (
                    <tr key={row.name} className="border-t border-white/10">
                      <td className="py-2 px-3">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-violet-400/80" />
                          <div className="truncate">{row.name}</div>
                        </div>
                        <div className="mt-1 h-2 w-full rounded bg-white/5 overflow-hidden">
                          <div
                            className="h-2 rounded bg-violet-400/70"
                            style={{ width: `${Math.min(100, p)}%` }}
                          />
                        </div>
                      </td>
                      <td className="py-2 px-3 text-right">{money(row.value)}</td>
                      <td className="py-2 px-3 text-right">{p.toFixed(1)}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="text-xs text-zinc-500">
            Dica: depois podemos colocar “drill-down” ao clicar no grupo.
          </div>
        </div>
      ) : (
        <div className="h-full flex items-center justify-center text-sm text-zinc-400">
          Sem dados por grupo ainda.
        </div>
      )}
    </div>
  );
}
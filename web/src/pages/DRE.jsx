import { useEffect, useState } from "react";
import { api } from "../api/client";

export default function DRE({ token, companyId }) {
  const [competenceMonth, setCompetenceMonth] = useState("2026-01");
  const [dre, setDre] = useState(null);
  const [err, setErr] = useState("");

  async function load() {
    setErr("");
    try {
      const data = await api(`/reports/dre?companyId=${companyId}&competenceMonth=${competenceMonth}`, { token });
      setDre(data);
    } catch (e) {
      setErr(e.message);
    }
  }

  useEffect(() => { load(); }, [competenceMonth]);

  return (
    <div style={{ maxWidth: 800, margin: "40px auto" }}>
      <h2>DRE</h2>

      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 12 }}>
        <label>Competência:</label>
        <input value={competenceMonth} onChange={(e)=>setCompetenceMonth(e.target.value)} placeholder="YYYY-MM" />
        <button onClick={load}>Atualizar</button>
      </div>

      {err && <p style={{ color: "crimson" }}>{err}</p>}

      {dre && (
        <>
          <h3>Totais</h3>
          <pre>{JSON.stringify(dre.totais, null, 2)}</pre>

          <h3>Por grupo</h3>
          <pre>{JSON.stringify(dre.grupos, null, 2)}</pre>
        </>
      )}
    </div>
  );
}
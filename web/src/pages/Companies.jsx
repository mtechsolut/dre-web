import { useEffect, useState } from "react";
import { api } from "../api/client";

export default function Companies({ token, onSelectCompany }) {
  const [companies, setCompanies] = useState([]);
  const [name, setName] = useState("");
  const [err, setErr] = useState("");

  async function load() {
    setErr("");
    try {
      const data = await api("/companies", { token });
      setCompanies(data.companies || []);
    } catch (e) {
      setErr(e.message);
    }
  }

  async function create() {
    setErr("");
    try {
      await api("/companies", { method: "POST", token, body: { name } });
      setName("");
      await load();
    } catch (e) {
      setErr(e.message);
    }
  }

  useEffect(() => { load(); }, []);

  return (
    <div style={{ maxWidth: 600, margin: "40px auto" }}>
      <h2>Minhas empresas</h2>

      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <input placeholder="Nova empresa" value={name} onChange={(e)=>setName(e.target.value)} style={{ flex: 1 }} />
        <button onClick={create}>Criar</button>
      </div>

      {err && <p style={{ color: "crimson" }}>{err}</p>}

      <ul>
        {companies.map(c => (
          <li key={c.id} style={{ marginBottom: 8 }}>
            <b>{c.name}</b> ({c.role}){" "}
            <button onClick={() => onSelectCompany(c.id)}>Abrir</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
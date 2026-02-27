import { useEffect, useState } from "react";
import { api } from "../api/client";
import { getCompanyId, setCompanyId } from "../state/appState";

export default function CompanySwitcher() {
  const [companies, setCompanies] = useState([]);
  const [current, setCurrent] = useState(getCompanyId());
  const token = localStorage.getItem("token") || "";

  async function load() {
    if (!token) return;
    const data = await api("/companies", { token });
    setCompanies(data.companies || []);
    if (!current && data.companies?.[0]?.id) {
      setCurrent(data.companies[0].id);
      setCompanyId(data.companies[0].id);
    }
  }

  useEffect(() => { load(); }, []);

  function onChange(e) {
    const id = e.target.value;
    setCurrent(id);
    setCompanyId(id);
    window.dispatchEvent(new Event("appstate:changed"));
  }

  return (
    <div className="flex items-center gap-2">
      <label className="text-xs text-zinc-400 dark:text-zinc-400 text-zinc-600">Empresa</label>
      <select
        value={current}
        onChange={onChange}
        className="h-9 px-2 rounded-md border border-zinc-800 dark:border-zinc-800 border-zinc-200 dark:bg-zinc-950 bg-white text-sm"
      >
        {companies.map(c => (
          <option key={c.id} value={c.id}>{c.name}</option>
        ))}
      </select>
    </div>
  );
}
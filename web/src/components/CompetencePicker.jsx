import { useEffect, useState } from "react";
import { getCompetenceMonth, setCompetenceMonth } from "../state/appState";

export default function CompetencePicker() {
  const [value, setValue] = useState(getCompetenceMonth());

  useEffect(() => {
    const handler = () => setValue(getCompetenceMonth());
    window.addEventListener("appstate:changed", handler);
    return () => window.removeEventListener("appstate:changed", handler);
  }, []);

  function onChange(e) {
    const v = e.target.value;
    setValue(v);
    setCompetenceMonth(v);
    window.dispatchEvent(new Event("appstate:changed"));
  }

  return (
    <div className="flex items-center gap-2">
      <label className="text-xs text-zinc-400 dark:text-zinc-400 text-zinc-600">Competência</label>
      <input
        value={value}
        onChange={onChange}
        placeholder="YYYY-MM"
        className="h-9 w-28 px-2 rounded-md border border-zinc-800 dark:border-zinc-800 border-zinc-200 dark:bg-zinc-950 bg-white text-sm"
      />
    </div>
  );
}
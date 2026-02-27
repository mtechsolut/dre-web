import { useEffect, useState } from "react";
import { applyTheme, getTheme, setTheme } from "./theme";

export function useTheme() {
  const [theme, setThemeState] = useState(getTheme());

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  function toggleTheme() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    setThemeState(next);
  }

  return { theme, toggleTheme };
}
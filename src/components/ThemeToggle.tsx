"use client";

import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const [theme, setTheme] = useState<string>("light");

  useEffect(() => {
    const saved = localStorage.getItem("theme")
      ?? (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    // eslint-disable-next-line react-hooks/set-state-in-effect -- idratazione client da localStorage dopo il mount (pattern SSR-safe)
    setTheme(saved);
    document.documentElement.dataset.theme = saved;
  }, []);

  const toggle = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.dataset.theme = next;
    localStorage.setItem("theme", next);
  };

  return (
    <button
      onClick={toggle}
      aria-label="Cambia tema"
      className="rounded-lg border border-bordr px-2.5 py-1.5 text-sm hover:bg-surface-2"
    >
      {theme === "dark" ? "☀️" : "🌙"}
    </button>
  );
}

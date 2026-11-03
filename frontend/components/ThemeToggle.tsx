"use client";

import { useSyncExternalStore } from "react";
import { MoonIcon, SunIcon } from "./icons";

function subscribe(callback: () => void) {
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  const sync = () => {
    let preference: string | null = null;
    try {
      preference = localStorage.getItem("catapult-theme");
    } catch {}
    document.documentElement.dataset.theme =
      preference === "light" || preference === "dark"
        ? preference
        : media.matches
          ? "dark"
          : "light";
    callback();
  };
  window.addEventListener("catapult-theme-change", callback);
  window.addEventListener("storage", sync);
  media.addEventListener("change", sync);
  return () => {
    window.removeEventListener("catapult-theme-change", callback);
    window.removeEventListener("storage", sync);
    media.removeEventListener("change", sync);
  };
}

export function ThemeToggle({ className = "" }: { className?: string }) {
  const dark = useSyncExternalStore(
    subscribe,
    () => document.documentElement.dataset.theme === "dark",
    () => false,
  );

  function toggle() {
    const theme = dark ? "light" : "dark";
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem("catapult-theme", theme);
    } catch {}
    window.dispatchEvent(new Event("catapult-theme-change"));
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={dark ? "Ativar modo claro" : "Ativar modo escuro"}
      aria-pressed={dark}
      title={dark ? "Modo claro" : "Modo escuro"}
      className={`theme-toggle inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-line bg-surface text-ink ${className}`}
    >
      <SunIcon className="theme-sun h-[18px] w-[18px]" />
      <MoonIcon className="theme-moon h-[18px] w-[18px]" />
    </button>
  );
}

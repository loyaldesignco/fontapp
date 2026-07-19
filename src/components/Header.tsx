import { Sparkles, Moon, Sun, Settings, LayoutGrid } from "lucide-react";
import { PreviewMode } from "@/types";
import { cn } from "@/lib/utils";

const MODES: { key: PreviewMode; label: string }[] = [
  { key: "custom", label: "Aa" },
  { key: "sentence", label: "Sen" },
  { key: "alphabet", label: "Abc" },
  { key: "numbers", label: "123" },
];

interface Props {
  search: string;
  onSearch: (v: string) => void;
  size: number;
  onSize: (v: number) => void;
  globalMode: PreviewMode;
  onGlobalMode: (m: PreviewMode) => void;
  theme: "dark" | "light";
  onToggleTheme: () => void;
  onAutoOrganize: () => void;
  onSettings: () => void;
}

export function Header({
  search, onSearch, size, onSize, globalMode, onGlobalMode,
  theme, onToggleTheme, onAutoOrganize, onSettings,
}: Props) {
  return (
    <header className="flex shrink-0 items-center gap-3 border-b border-border bg-card/80 px-5 py-3 backdrop-blur">
      {/* Logo */}
      <div className="flex items-center gap-2.5 shrink-0">
        <span className="grid h-7 w-7 place-items-center rounded-[5px] bg-primary text-[16px] font-extrabold text-primary-foreground">
          F
        </span>
        <div className="micro text-[14px] tracking-[0.18em]">
          FontVault
          <div className="text-[9px] tracking-[0.22em] text-muted-foreground">font manager</div>
        </div>
      </div>

      {/* Search */}
      <input
        value={search}
        onChange={e => onSearch(e.target.value)}
        placeholder="Search fonts…"
        className="w-[260px] rounded-md border border-input bg-secondary px-3.5 py-2 text-[13.5px] outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary/25"
      />

      {/* Size slider */}
      <label className="flex items-center gap-2 text-[12px] font-medium text-muted-foreground shrink-0">
        <span className="hidden sm:inline">Size</span>
        <input
          type="range" min={12} max={96} value={size}
          onChange={e => onSize(+e.target.value)}
          className="w-20 accent-[hsl(var(--primary))]"
        />
        <span className="w-8 tabular-nums">{size}</span>
      </label>

      {/* Global mode toggle */}
      <div className="flex items-center rounded-md border border-border bg-secondary shrink-0">
        {MODES.map(m => (
          <button
            key={m.key}
            onClick={() => onGlobalMode(m.key)}
            className={cn(
              "px-2.5 py-1.5 text-[11px] font-semibold uppercase tracking-wide transition-colors rounded-sm",
              globalMode === m.key
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {m.label}
          </button>
        ))}
      </div>

      <div className="flex-1" />

      {/* Actions */}
      <button
        onClick={onAutoOrganize}
        className="flex items-center gap-2 rounded-md border border-primary bg-primary px-3.5 py-2 text-[11px] font-bold uppercase tracking-wide text-primary-foreground hover:brightness-105 transition-all shrink-0"
        title="Auto-organize into smart collections"
      >
        <Sparkles size={13} /> Auto-organize
      </button>

      <button
        onClick={onToggleTheme}
        title="Toggle theme"
        className="grid h-8 w-8 place-items-center rounded-md border border-border text-muted-foreground transition-colors hover:border-foreground hover:text-foreground shrink-0"
      >
        {theme === "dark" ? <Moon size={14} /> : <Sun size={14} />}
      </button>

      <button
        onClick={onSettings}
        title="Settings / Google Fonts API"
        className="grid h-8 w-8 place-items-center rounded-md border border-border text-muted-foreground transition-colors hover:border-foreground hover:text-foreground shrink-0"
      >
        <Settings size={14} />
      </button>
    </header>
  );
}

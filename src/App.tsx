import { useEffect, useMemo, useState, useCallback } from "react";
import { Header } from "@/components/Header";
import { Sidebar } from "@/components/Sidebar";
import { FontCard } from "@/components/FontCard";
import { CompareDialog } from "@/components/CompareDialog";
import { CustomizerDialog } from "@/components/CustomizerDialog";
import { SettingsDialog } from "@/components/SettingsDialog";
import { STARTER_FONTS, Font, AUTO_ORGANIZE_RULES } from "@/lib/fonts";
import { View, PreviewMode, Collections, Presets, Preset } from "@/types";
import { useLocalFonts } from "@/hooks/useLocalFonts";

const LS = "fontvault.app.v1";

interface Persisted {
  favorites: string[];
  theme: "dark" | "light";
  apiKey: string;
  collections: Collections;
  presets: Presets;
}

function loadState(): Persisted {
  try {
    return {
      favorites: [], theme: "dark", apiKey: "", collections: {}, presets: {},
      ...JSON.parse(localStorage.getItem(LS) || "{}"),
    };
  } catch {
    return { favorites: [], theme: "dark", apiKey: "", collections: {}, presets: {} };
  }
}

function saveState(s: Persisted) {
  localStorage.setItem(LS, JSON.stringify(s));
}

export default function App() {
  const initial = loadState();

  const [cloudFonts, setCloudFonts] = useState<Font[]>(STARTER_FONTS);
  const [localScanEnabled, setLocalScanEnabled] = useState(false);
  const localFonts = useLocalFonts(localScanEnabled);
  const [search, setSearch] = useState("");
  const [previewText, setPreviewText] = useState("");
  const [globalMode, setGlobalMode] = useState<PreviewMode>("custom");
  const [size, setSize] = useState(34);
  const [view, setView] = useState<View>({ type: "all" });
  const [favorites, setFavorites] = useState<Set<string>>(new Set(initial.favorites));
  const [compare, setCompare] = useState<Set<string>>(new Set());
  const [theme, setTheme] = useState<"dark" | "light">(initial.theme);
  const [collections, setCollections] = useState<Collections>(initial.collections);
  const [presets, setPresets] = useState<Presets>(initial.presets);
  const [apiKey, setApiKey] = useState(initial.apiKey);
  const [statusMsg, setStatusMsg] = useState("");

  // Dialogs
  const [showCompare, setShowCompare] = useState(false);
  const [custFont, setCustFont] = useState<Font | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  // Persist
  useEffect(() => {
    saveState({ favorites: [...favorites], theme, apiKey, collections, presets });
  }, [favorites, theme, apiKey, collections, presets]);

  // Apply theme
  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  // Merge cloud + local fonts (local wins on family name match)
  const fonts = useMemo(() => {
    if (!localScanEnabled || localFonts.fonts.length === 0) return cloudFonts;
    const localFamilies = new Set(localFonts.fonts.map(f => f.family));
    const deduped = cloudFonts.filter(f => !localFamilies.has(f.family));
    return [...deduped, ...localFonts.fonts].sort((a, b) => a.family.localeCompare(b.family));
  }, [cloudFonts, localFonts.fonts, localScanEnabled]);

  // Filtered list
  const filtered = useMemo(() => {
    let list = fonts;
    const q = search.trim().toLowerCase();
    if (q) list = list.filter(f => f.family.toLowerCase().includes(q));
    if (view.type === "favorites") {
      list = list.filter(f => favorites.has(f.family));
    } else if (view.type === "category") {
      list = list.filter(f => f.category === (view as Extract<View, { type: "category" }>).name);
    } else if (view.type === "collection") {
      const name = (view as Extract<View, { type: "collection" }>).name;
      const members = new Set(collections[name] || []);
      list = list.filter(f => members.has(f.family));
    }
    return list;
  }, [fonts, search, view, favorites, collections]);

  const toggleFavorite = useCallback((family: string) => {
    setFavorites(s => {
      const n = new Set(s);
      n.has(family) ? n.delete(family) : n.add(family);
      return n;
    });
  }, []);

  const toggleCompare = useCallback((family: string) => {
    setCompare(s => {
      const n = new Set(s);
      if (n.has(family)) { n.delete(family); return n; }
      if (n.size >= 6) { alert("Compare up to 6 fonts at once."); return s; }
      n.add(family);
      return n;
    });
  }, []);

  const addToCollection = useCallback((family: string, collName: string) => {
    setCollections(c => {
      const members = c[collName] || [];
      if (members.includes(family)) return c;
      return { ...c, [collName]: [...members, family] };
    });
  }, []);

  const createCollection = useCallback((name: string) => {
    setCollections(c => ({ ...c, [name]: c[name] || [] }));
  }, []);

  const deleteCollection = useCallback((name: string) => {
    setCollections(c => {
      const n = { ...c }; delete n[name]; return n;
    });
    setView(v => (v.type === "collection" && (v as Extract<View, { type: "collection" }>).name === name)
      ? { type: "all" } : v);
  }, []);

  const autoOrganize = useCallback(() => {
    setCloudFonts(prev => prev.map(f => {
      let cat = f.category;
      for (const [re, newCat] of AUTO_ORGANIZE_RULES) {
        if (re.test(f.family)) { cat = newCat; break; }
      }
      return { ...f, category: cat };
    }));
    setCollections(c => {
      const updated = { ...c };
      const groups: [string, (f: Font) => boolean][] = [
        ["Headlines & Impact", f => f.category === "display"],
        ["Elegant / Editorial", f => f.category === "serif"],
        ["Clean UI / Body", f => f.category === "sans-serif"],
        ["Code & Technical", f => f.category === "monospace"],
        ["Handwriting & Script", f => f.category === "handwriting"],
      ];
      groups.forEach(([name, pred]) => {
        const members = fonts.filter(pred).map(f => f.family).slice(0, 24);
        if (members.length) updated[name] = members;
      });
      return updated;
    });
    setStatusMsg("Auto-organized into smart collections.");
    setTimeout(() => setStatusMsg(""), 3000);
  }, [fonts]);

  const loadCatalog = useCallback(async (key: string) => {
    setStatusMsg("Fetching Google Fonts catalog…");
    try {
      const r = await fetch(
        `https://www.googleapis.com/webfonts/v1/webfonts?capability=VF&sort=popularity&key=${encodeURIComponent(key)}`
      );
      if (!r.ok) throw new Error("HTTP " + r.status);
      const data = await r.json();
      const mapped: Font[] = data.items.map((it: { family: string; category: string; variants: string[]; axes?: { tag: string; start: number; end: number }[] }) => ({
        family: it.family,
        category: it.category as Font["category"],
        weights: [...new Set(
          it.variants.map((v: string) => (v === "regular" || v === "italic") ? 400 : parseInt(v)).filter(Boolean)
        )].sort((a: number, b: number) => a - b),
        axes: it.axes?.length ? it.axes.map((a: { tag: string; start: number; end: number }) => ({ tag: a.tag, start: a.start, end: a.end })) : null,
      }));
      setCloudFonts(mapped);
      setApiKey(key);
      setStatusMsg(`Loaded ${mapped.length} fonts from Google Fonts.`);
      setTimeout(() => setStatusMsg(""), 4000);
    } catch (err) {
      setStatusMsg("Failed to load catalog — check your API key.");
      setTimeout(() => setStatusMsg(""), 4000);
    }
  }, []);

  const viewTitle = useMemo(() => {
    if (view.type === "all") return "All Fonts";
    if (view.type === "favorites") return "Favorites";
    if (view.type === "category") return (view as Extract<View, { type: "category" }>).name.replace("-", " ");
    return (view as Extract<View, { type: "collection" }>).name;
  }, [view]);

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <Header
        search={search} onSearch={setSearch}
        size={size} onSize={setSize}
        globalMode={globalMode} onGlobalMode={setGlobalMode}
        theme={theme} onToggleTheme={() => setTheme(t => t === "dark" ? "light" : "dark")}
        onAutoOrganize={autoOrganize}
        onSettings={() => setShowSettings(true)}
        localScanEnabled={localScanEnabled}
        localScanning={localFonts.scanning}
        localCount={localFonts.count}
        onToggleLocalScan={() => setLocalScanEnabled(e => !e)}
      />

      <div className="flex min-h-0 flex-1">
        <Sidebar
          fonts={fonts}
          favorites={favorites}
          collections={collections}
          view={view}
          onSelect={setView}
          onCreateCollection={createCollection}
          onDeleteCollection={deleteCollection}
        />

        <main className="flex-1 overflow-y-auto px-6 py-5">
          {/* Toolbar */}
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <div className="text-[22px] font-bold tracking-tight capitalize">{viewTitle}</div>
            <div className="text-[13px] text-muted-foreground">{filtered.length} fonts</div>
            <div className="flex-1" />
            {globalMode === "custom" && (
              <input
                value={previewText}
                onChange={e => setPreviewText(e.target.value)}
                placeholder="Type preview text…"
                className="max-w-[260px] rounded-md border border-input bg-secondary px-3.5 py-2 text-[13.5px] outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary/25"
              />
            )}
          </div>

          {filtered.length === 0 ? (
            <div className="py-20 text-center text-muted-foreground">
              <div className="mb-3 text-5xl opacity-30">◉</div>
              No fonts match here yet.
            </div>
          ) : (
            <div className="grid gap-4 [grid-template-columns:repeat(auto-fill,minmax(340px,1fr))]">
              {filtered.map(f => (
                <FontCard
                  key={f.family}
                  font={f}
                  previewText={previewText}
                  globalMode={globalMode}
                  size={size}
                  starred={favorites.has(f.family)}
                  selected={compare.has(f.family)}
                  presetCount={(presets[f.family] || []).length}
                  collections={collections}
                  onToggleStar={() => toggleFavorite(f.family)}
                  onToggleCompare={() => toggleCompare(f.family)}
                  onCustomize={() => setCustFont(f)}
                  onAddToCollection={n => addToCollection(f.family, n)}
                />
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Compare bar */}
      {compare.size > 0 && (
        <div className="flex shrink-0 items-center gap-3 border-t border-border bg-card/80 px-5 py-2.5 text-sm backdrop-blur">
          <span className="font-semibold">{compare.size} selected</span>
          <div className="flex gap-2 overflow-hidden">
            {[...compare].map(f => (
              <span key={f} className="rounded-full border border-border bg-secondary px-3 py-0.5 text-[12px]">{f}</span>
            ))}
          </div>
          <div className="flex-1" />
          <button
            onClick={() => setShowCompare(true)}
            className="rounded-md border border-primary bg-primary px-4 py-1.5 text-[11px] font-bold uppercase tracking-wide text-primary-foreground hover:brightness-105 transition-all"
          >
            Compare
          </button>
          <button
            onClick={() => setCompare(new Set())}
            className="rounded-md border border-border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide hover:border-foreground transition-colors"
          >
            Clear
          </button>
        </div>
      )}

      {/* Status bar */}
      <div className="flex shrink-0 items-center gap-3 border-t border-border bg-card/60 px-5 py-1.5 text-[11px] text-muted-foreground">
        <span>{statusMsg || `${fonts.length} fonts · ${apiKey ? "Google Fonts connected" : "Starter set · Connect Google Fonts in ⚙"}`}</span>
        {localFonts.error && (
          <span className="text-destructive">{localFonts.error}</span>
        )}
        {localScanEnabled && !localFonts.scanning && localFonts.count > 0 && (
          <span className="text-primary">{localFonts.count} local fonts merged</span>
        )}
      </div>

      {/* Dialogs */}
      {showCompare && (
        <CompareDialog
          fonts={fonts}
          selected={compare}
          onClose={() => setShowCompare(false)}
        />
      )}

      {custFont && (
        <CustomizerDialog
          font={custFont}
          presets={presets[custFont.family] || []}
          onSave={(preset: Preset) => {
            setPresets(p => ({
              ...p,
              [custFont.family]: [...(p[custFont.family] || []), preset],
            }));
          }}
          onDelete={(i: number) => {
            setPresets(p => ({
              ...p,
              [custFont.family]: (p[custFont.family] || []).filter((_: Preset, idx: number) => idx !== i),
            }));
          }}
          onClose={() => setCustFont(null)}
        />
      )}

      {showSettings && (
        <SettingsDialog
          apiKey={apiKey}
          onSave={setApiKey}
          onClose={() => setShowSettings(false)}
          onLoadCatalog={loadCatalog}
        />
      )}
    </div>
  );
}

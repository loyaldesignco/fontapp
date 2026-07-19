import { useState, useEffect, useCallback } from "react";
import { Font, FontCategory } from "@/lib/fonts";

interface LocalFontRaw {
  family: string;
  style: string;
  weight: number;
  path: string;
}

// Injected @font-face rules — tracked to avoid duplicates
const injected = new Set<string>();

function injectFontFace(family: string, weight: number, path: string) {
  const key = `${family}::${weight}::${path}`;
  if (injected.has(key)) return;
  injected.add(key);

  // Tauri's asset:// protocol serves local files to the webview.
  // On Windows paths look like C:\..., which we convert to forward slashes.
  const normalized = path.replace(/\\/g, "/");
  const url = `asset://localhost/${encodeURI(normalized.startsWith("/") ? normalized.slice(1) : normalized)}`;

  const style = document.createElement("style");
  style.textContent = `@font-face {
  font-family: '${family.replace(/'/g, "\\'")}';
  font-weight: ${weight};
  font-style: normal;
  src: url('${url}') format('truetype');
  font-display: swap;
}`;
  document.head.appendChild(style);
}

function guessCategory(family: string, style: string): FontCategory {
  const name = (family + " " + style).toLowerCase();
  if (/mono|code|console|courier|terminal|typewriter/.test(name)) return "monospace";
  if (/script|hand|brush|marker|italic|casual|comic|shadow|pacifico|dancing|caveat|satisfy|kalam/.test(name)) return "handwriting";
  if (/serif|garamond|baskerville|palatino|georgia|times|caslon|bodoni|didot|trajan|minion/.test(name)) return "serif";
  if (/display|poster|headline|decorative|ornamental|blackletter|slab|impact|black|condensed/.test(name)) return "display";
  return "sans-serif";
}

export interface LocalFontScanResult {
  fonts: Font[];
  count: number;
  scanning: boolean;
  error: string | null;
  rescan: () => void;
}

export function useLocalFonts(enabled: boolean): LocalFontScanResult {
  const [fonts, setFonts] = useState<Font[]>([]);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const scan = useCallback(async () => {
    // Only works inside Tauri — bail gracefully in browser preview
    if (typeof (window as Window & { __TAURI_INTERNALS__?: unknown }).__TAURI_INTERNALS__ === "undefined") {
      setError("Local font scanning requires the Tauri desktop app.");
      return;
    }

    setScanning(true);
    setError(null);

    try {
      const { invoke } = await import("@tauri-apps/api/core");

      // Raw list: one entry per font file face
      const raw: LocalFontRaw[] = await invoke("scan_local_fonts");

      // Group into families
      const familyMap = new Map<string, { weights: Set<number>; category: FontCategory }>();

      for (const f of raw) {
        if (!familyMap.has(f.family)) {
          familyMap.set(f.family, {
            weights: new Set(),
            category: guessCategory(f.family, f.style),
          });
        }
        const entry = familyMap.get(f.family)!;
        entry.weights.add(f.weight || 400);

        // Inject the @font-face rule so the browser can render it
        injectFontFace(f.family, f.weight || 400, f.path);
      }

      const result: Font[] = Array.from(familyMap.entries()).map(([family, { weights, category }]) => ({
        family,
        category,
        weights: Array.from(weights).sort((a, b) => a - b),
        axes: null,
        local: true,
      }));

      result.sort((a, b) => a.family.localeCompare(b.family));
      setFonts(result);
    } catch (err) {
      setError(String(err));
    } finally {
      setScanning(false);
    }
  }, [tick]);

  useEffect(() => {
    if (enabled) scan();
  }, [enabled, scan]);

  return {
    fonts,
    count: fonts.length,
    scanning,
    error,
    rescan: () => setTick(t => t + 1),
  };
}

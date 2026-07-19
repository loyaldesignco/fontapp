import { useEffect, useState } from "react";
import { Star, SlidersHorizontal, ArrowLeftRight, ChevronDown } from "lucide-react";
import { Font, WEIGHT_NAME, loadFont, sampleFor } from "@/lib/fonts";
import { PreviewMode, Collections } from "@/types";
import { cn } from "@/lib/utils";

interface Props {
  font: Font;
  previewText: string;
  globalMode: PreviewMode;
  size: number;
  starred: boolean;
  selected: boolean;
  presetCount: number;
  collections: Collections;
  onToggleStar: () => void;
  onToggleCompare: () => void;
  onCustomize: () => void;
  onAddToCollection: (name: string) => void;
}

const MODES: { key: PreviewMode; label: string }[] = [
  { key: "custom", label: "Aa" },
  { key: "sentence", label: "Sen" },
  { key: "alphabet", label: "Abc" },
  { key: "numbers", label: "123" },
];

export function FontCard({
  font, previewText, globalMode, size, starred, selected, presetCount,
  collections, onToggleStar, onToggleCompare, onCustomize, onAddToCollection,
}: Props) {
  const [cardMode, setCardMode] = useState<PreviewMode | null>(null);
  const [showCollMenu, setShowCollMenu] = useState(false);

  useEffect(() => {
    loadFont(font.family, font.weights);
  }, [font.family]);

  const activeMode = cardMode ?? globalMode;
  const preview = sampleFor(activeMode, previewText);
  const collNames = Object.keys(collections);

  return (
    <div
      className={cn(
        "group relative flex min-h-[160px] flex-col gap-3 rounded-lg border bg-card p-4 transition-colors",
        selected
          ? "border-primary shadow-[inset_0_0_0_1px_hsl(var(--primary))]"
          : "border-border hover:border-border/60"
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div
            className="truncate text-[15px] font-semibold tracking-tight transition-colors group-hover:text-primary cursor-pointer"
            onClick={onCustomize}
            title={font.family}
          >
            {font.family}
          </div>
          <div className="mt-1 flex items-center gap-2">
            <span className="micro rounded-sm border border-border/70 px-1.5 py-0.5 text-[9px] text-muted-foreground">
              {font.category}
            </span>
            {presetCount > 0 && (
              <span className="rounded-full border border-primary/40 bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                {presetCount} preset{presetCount === 1 ? "" : "s"}
              </span>
            )}
          </div>
        </div>

        <div className="flex shrink-0 gap-1.5">
          <button
            title="Open customizer"
            onClick={onCustomize}
            className="grid h-8 w-8 place-items-center rounded-md border border-border text-muted-foreground transition-colors hover:border-muted-foreground/60 hover:text-foreground"
          >
            <SlidersHorizontal size={14} />
          </button>
          <button
            title="Add to compare"
            onClick={onToggleCompare}
            className={cn(
              "grid h-8 w-8 place-items-center rounded-md border transition-colors",
              selected
                ? "border-primary bg-primary/10 text-primary"
                : "border-border text-muted-foreground hover:border-muted-foreground/60 hover:text-foreground"
            )}
          >
            <ArrowLeftRight size={14} />
          </button>
          <button
            title={starred ? "Remove favorite" : "Add to favorites"}
            onClick={onToggleStar}
            className={cn(
              "grid h-8 w-8 place-items-center rounded-md border transition-colors",
              starred
                ? "border-yellow-400/50 text-yellow-400"
                : "border-border text-muted-foreground hover:border-muted-foreground/60 hover:text-foreground"
            )}
          >
            <Star size={14} fill={starred ? "currentColor" : "none"} />
          </button>
        </div>
      </div>

      {/* Preview */}
      <div
        className="min-h-[46px] flex-1 break-words leading-tight text-foreground"
        style={{ fontFamily: `'${font.family}', ${font.category}`, fontSize: size }}
      >
        {preview}
      </div>

      {/* Footer */}
      <div className="mt-auto flex items-center gap-2">
        <div className="flex min-w-0 flex-1 flex-wrap gap-1">
          {font.weights.slice(0, 6).map(w => (
            <span
              key={w}
              title={WEIGHT_NAME[w] || String(w)}
              className="rounded border border-border bg-secondary px-1.5 py-0.5 text-[10px] tabular-nums text-muted-foreground"
            >
              {w}
            </span>
          ))}
        </div>

        {collNames.length > 0 && (
          <div className="relative">
            <button
              onClick={() => setShowCollMenu(s => !s)}
              className="flex items-center gap-1 rounded border border-border bg-secondary px-2 py-1 text-[11px] text-muted-foreground hover:border-muted-foreground/60 hover:text-foreground transition-colors"
              title="Add to collection"
            >
              +Coll <ChevronDown size={10} />
            </button>
            {showCollMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowCollMenu(false)} />
                <div className="absolute bottom-full right-0 z-20 mb-1 min-w-[160px] rounded-md border border-border bg-card shadow-xl">
                  {collNames.map(n => (
                    <button
                      key={n}
                      onClick={() => { onAddToCollection(n); setShowCollMenu(false); }}
                      className="flex w-full items-center justify-between px-3 py-2 text-[12px] text-left hover:bg-secondary transition-colors"
                    >
                      <span className="truncate">{n}</span>
                      {collections[n].includes(font.family) && (
                        <span className="ml-2 text-[10px] text-primary">✓</span>
                      )}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        <div className="flex items-center rounded border border-border bg-secondary">
          {MODES.map(m => (
            <button
              key={m.key}
              onClick={() => setCardMode(prev => prev === m.key ? null : m.key)}
              title={m.key}
              className={cn(
                "px-2 py-1 text-[10px] font-semibold transition-colors rounded-sm",
                activeMode === m.key && (cardMode !== null || m.key === globalMode)
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

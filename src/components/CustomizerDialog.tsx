import { useState, useEffect } from "react";
import { X, Plus, Trash2 } from "lucide-react";
import { Font, PANGRAM, AXN, loadFont, loadVariableFont } from "@/lib/fonts";
import { Preset } from "@/types";
import { cn } from "@/lib/utils";

interface Props {
  font: Font;
  presets: Preset[];
  onSave: (preset: Preset) => void;
  onDelete: (index: number) => void;
  onClose: () => void;
}

function clamp(v: number, a: number, b: number) { return Math.max(a, Math.min(b, v)); }
function fmt(v: number) { return (Math.round(v * 100) / 100).toString(); }

interface CustState {
  size: number;
  tracking: number;
  leading: number;
  italic: boolean;
  weight: number;
  ax: Record<string, number>;
}

function RangeRow({
  label, min, max, step, value, unit, onChange,
}: {
  label: string; min: number; max: number; step: number; value: number; unit?: string; onChange: (v: number) => void;
}) {
  return (
    <div className="mb-4">
      <div className="mb-1.5 flex items-center justify-between">
        <label className="text-[12px] font-semibold text-muted-foreground">{label}</label>
        <span className="text-[12px] font-semibold tabular-nums text-primary">
          {fmt(value)}{unit || ""}
        </span>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
        className="w-full accent-[hsl(var(--primary))]"
      />
    </div>
  );
}

export function CustomizerDialog({ font, presets, onSave, onDelete, onClose }: Props) {
  const isVariable = !!(font.axes && font.axes.length);

  const initAx = () => {
    const ax: Record<string, number> = {};
    if (font.axes) {
      font.axes.forEach(a => {
        ax[a.tag] = a.tag === "wght"
          ? clamp(400, a.start, a.end)
          : a.tag === "opsz" ? a.end : a.start;
      });
    }
    return ax;
  };

  const [st, setSt] = useState<CustState>({
    size: 76,
    tracking: 0,
    leading: 1.15,
    italic: false,
    weight: font.weights.includes(400) ? 400 : (font.weights[0] || 400),
    ax: initAx(),
  });
  const [text, setText] = useState("");
  const [presetName, setPresetName] = useState("");

  useEffect(() => {
    if (isVariable && font.axes) {
      loadVariableFont(font.family, font.axes);
    } else {
      loadFont(font.family, font.weights);
    }
  }, [font.family]);

  const set = (patch: Partial<CustState>) => setSt(s => ({ ...s, ...patch }));

  const fontStyle: React.CSSProperties = {
    fontFamily: `'${font.family}', ${font.category}`,
    fontStyle: st.italic ? "italic" : "normal",
    fontSize: st.size,
    letterSpacing: st.tracking + "px",
    lineHeight: st.leading,
    ...(isVariable
      ? { fontVariationSettings: Object.entries(st.ax).map(([t, v]) => `'${t}' ${v}`).join(",") }
      : { fontWeight: st.weight }),
  };

  const handleSave = () => {
    const name = presetName.trim() || `Preset ${presets.length + 1}`;
    const p: Preset = { name, size: st.size, tracking: st.tracking, leading: st.leading, italic: st.italic };
    if (isVariable) p.ax = { ...st.ax };
    else p.weight = st.weight;
    onSave(p);
    setPresetName("");
  };

  const applyPreset = (p: Preset) => {
    const patch: Partial<CustState> = {
      size: p.size, tracking: p.tracking, leading: p.leading, italic: p.italic,
    };
    if (isVariable && p.ax) patch.ax = { ...p.ax };
    else if (p.weight) patch.weight = p.weight;
    setSt(s => ({ ...s, ...patch }));
  };

  return (
    <div className="fixed inset-0 z-80 flex flex-col bg-background">
      {/* Header */}
      <div className="flex shrink-0 items-center gap-3 border-b border-border px-6 py-3.5">
        <div>
          <span className="text-[17px] font-bold">{font.family}</span>
          <span className="ml-3 text-[12px] text-muted-foreground">
            {isVariable ? `Variable · ${font.axes!.length} axes` : `${font.weights.length} weights`}
          </span>
        </div>
        <div className="flex-1" />
        <button
          onClick={onClose}
          className="grid h-8 w-8 place-items-center rounded-md border border-border text-muted-foreground hover:border-foreground hover:text-foreground"
        >
          <X size={15} />
        </button>
      </div>

      <div className="flex min-h-0 flex-1">
        {/* Controls panel */}
        <div className="w-[300px] shrink-0 overflow-y-auto border-r border-border px-5 py-5">
          {/* Variable axes or weight picker */}
          {isVariable && font.axes
            ? font.axes.map(a => (
                <RangeRow
                  key={a.tag}
                  label={AXN[a.tag] || a.tag}
                  min={a.start} max={a.end}
                  step={(a.end - a.start) > 50 ? 1 : 0.1}
                  value={st.ax[a.tag] ?? a.start}
                  onChange={v => set({ ax: { ...st.ax, [a.tag]: v } })}
                />
              ))
            : (
              <RangeRow
                label={`Weight (${font.weights.find(w => Math.abs(w - st.weight) < 10) ? st.weight : st.weight})`}
                min={Math.min(...font.weights)}
                max={Math.max(...font.weights)}
                step={100}
                value={st.weight}
                onChange={v => {
                  const snapped = font.weights.reduce((p, c) => Math.abs(c - v) < Math.abs(p - v) ? c : p);
                  set({ weight: snapped });
                }}
              />
            )
          }

          <div className="my-4 border-t border-border" />

          <RangeRow label="Size" min={12} max={200} step={1} value={st.size} unit="px"
            onChange={v => set({ size: v })} />
          <RangeRow label="Letter spacing" min={-5} max={24} step={0.5} value={st.tracking} unit="px"
            onChange={v => set({ tracking: v })} />
          <RangeRow label="Line height" min={0.8} max={2.4} step={0.05} value={st.leading}
            onChange={v => set({ leading: v })} />

          <label className="mt-1 flex cursor-pointer items-center gap-2 text-[13px] text-muted-foreground">
            <input
              type="checkbox" checked={st.italic}
              onChange={e => set({ italic: e.target.checked })}
              className="h-4 w-4 accent-[hsl(var(--primary))]"
            />
            Italic
          </label>

          <div className="my-5 border-t border-border" />

          {/* Save preset */}
          <div className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">
            Save Preset
          </div>
          <div className="flex gap-2">
            <input
              value={presetName}
              onChange={e => setPresetName(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSave()}
              placeholder="Preset name…"
              className="flex-1 rounded-md border border-border bg-secondary px-3 py-2 text-[13px] outline-none placeholder:text-muted-foreground focus:border-primary"
            />
            <button
              onClick={handleSave}
              className="grid h-9 w-9 shrink-0 place-items-center rounded-md border border-border text-muted-foreground hover:border-primary hover:text-primary"
            >
              <Plus size={15} />
            </button>
          </div>

          {/* Preset list */}
          {presets.length > 0 && (
            <div className="mt-4 flex flex-col gap-2">
              {presets.map((p, i) => (
                <div
                  key={i}
                  onClick={() => applyPreset(p)}
                  className="group flex cursor-pointer items-center gap-2 rounded-md border border-border bg-secondary px-3 py-2.5 text-[13px] transition-colors hover:border-primary/50"
                >
                  <span className="flex-1 font-medium">{p.name}</span>
                  <button
                    onClick={e => { e.stopPropagation(); onDelete(i); }}
                    className="opacity-0 text-muted-foreground hover:text-destructive group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {presets.length === 0 && (
            <p className="mt-3 text-[12px] text-muted-foreground">No saved presets yet.</p>
          )}
        </div>

        {/* Stage */}
        <div
          className="flex flex-1 items-center justify-center overflow-auto p-12"
          style={{
            backgroundImage: "repeating-linear-gradient(45deg,transparent,transparent 12px,hsl(var(--card)) 12px,hsl(var(--card)) 24px)",
          }}
        >
          <div className="w-full text-center">
            <div style={fontStyle} className="max-w-full break-words text-foreground">
              {text || PANGRAM}
            </div>
            <input
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder="Type preview text…"
              className="mt-8 w-full max-w-sm rounded-md border border-border bg-background/80 px-4 py-2.5 text-[13px] text-center outline-none placeholder:text-muted-foreground focus:border-primary backdrop-blur-sm"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

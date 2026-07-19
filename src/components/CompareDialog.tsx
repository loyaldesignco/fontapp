import { useState } from "react";
import { X } from "lucide-react";
import { Font, PANGRAM, loadFont } from "@/lib/fonts";
import { cn } from "@/lib/utils";

interface Props {
  fonts: Font[];
  selected: Set<string>;
  onClose: () => void;
}

export function CompareDialog({ fonts, selected, onClose }: Props) {
  const [text, setText] = useState("");
  const [size, setSize] = useState(52);

  const items = [...selected].map(fam => fonts.find(f => f.family === fam)).filter(Boolean) as Font[];
  items.forEach(f => loadFont(f.family, f.weights));

  return (
    <div className="fixed inset-0 z-80 flex flex-col bg-background">
      {/* Top bar */}
      <div className="flex shrink-0 items-center gap-4 border-b border-border px-6 py-3.5">
        <span className="text-[18px] font-bold tracking-tight">Compare</span>
        <span className="text-[13px] text-muted-foreground">{items.length} fonts</span>
        <div className="flex-1" />
        <div className="flex items-center gap-3">
          <input
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Type preview text…"
            className="w-[260px] rounded-md border border-input bg-secondary px-3.5 py-2 text-[13px] outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary/30"
          />
          <div className="flex items-center gap-2 text-[12px] text-muted-foreground">
            <span>Size</span>
            <input
              type="range" min={16} max={120} value={size}
              onChange={e => setSize(+e.target.value)}
              className="w-24 accent-[hsl(var(--primary))]"
            />
            <span className="w-8 tabular-nums">{size}px</span>
          </div>
        </div>
        <button
          onClick={onClose}
          className="grid h-8 w-8 place-items-center rounded-md border border-border text-muted-foreground hover:border-foreground hover:text-foreground"
        >
          <X size={15} />
        </button>
      </div>

      {/* Font rows */}
      <div className="flex-1 overflow-y-auto">
        {items.map(f => (
          <div key={f.family} className="border-b border-border px-7 py-6">
            <div className="mb-2 flex items-baseline gap-3">
              <span className="text-[15px] font-semibold">{f.family}</span>
              <span className={cn(
                "micro rounded-sm border px-1.5 py-0.5 text-[9px] text-muted-foreground"
              )}>
                {f.category}
              </span>
              <span className="text-[12px] text-muted-foreground">{f.weights.length} weights</span>
            </div>
            <div
              className="break-words leading-snug text-foreground"
              style={{
                fontFamily: `'${f.family}', ${f.category}`,
                fontSize: size,
                lineHeight: 1.2,
              }}
            >
              {text || PANGRAM}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

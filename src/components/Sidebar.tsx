import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Font, FontCategory, CATEGORIES } from "@/lib/fonts";
import { Collections, View } from "@/types";
import { cn } from "@/lib/utils";

interface Props {
  fonts: Font[];
  favorites: Set<string>;
  collections: Collections;
  view: View;
  onSelect: (v: View) => void;
  onCreateCollection: (name: string) => void;
  onDeleteCollection: (name: string) => void;
}

export function Sidebar({
  fonts, favorites, collections, view, onSelect,
  onCreateCollection, onDeleteCollection,
}: Props) {
  const [newColl, setNewColl] = useState("");
  const [adding, setAdding] = useState(false);

  const catCount = (c: FontCategory) => fonts.filter(f => f.category === c).length;

  const Item = ({
    label, count, active, onClick, onDelete, dot,
  }: {
    label: string; count: number; active: boolean; onClick: () => void;
    onDelete?: () => void; dot?: string;
  }) => (
    <div
      className={cn(
        "group flex w-full cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm capitalize transition-colors relative",
        active
          ? "bg-secondary font-semibold text-foreground"
          : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
      )}
      onClick={onClick}
    >
      {active && (
        <span className="absolute left-0 top-2 bottom-2 w-0.5 rounded-full bg-primary" />
      )}
      {dot && (
        <span className="h-2 w-2 shrink-0 rounded-sm" style={{ background: dot }} />
      )}
      <span className="flex-1 truncate">{label}</span>
      <span className="text-xs tabular-nums text-muted-foreground/70">{count}</span>
      {onDelete && (
        <button
          onClick={e => { e.stopPropagation(); onDelete(); }}
          className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity ml-1"
        >
          <Trash2 size={12} />
        </button>
      )}
    </div>
  );

  const CAT_COLORS: Record<string, string> = {
    "sans-serif": "#6ea8fe",
    "serif": "#a78bfa",
    "display": "#f9a8d4",
    "handwriting": "#86efac",
    "monospace": "#fcd34d",
  };

  const submitNewColl = () => {
    const n = newColl.trim();
    if (n) { onCreateCollection(n); setNewColl(""); }
    setAdding(false);
  };

  return (
    <aside className="w-[250px] shrink-0 overflow-y-auto border-r border-border bg-card/40 p-3">
      {/* Library */}
      <div className="mb-5">
        <h4 className="micro mb-2 px-2 text-muted-foreground">Library</h4>
        <Item
          label="All Fonts" count={fonts.length}
          active={view.type === "all"} onClick={() => onSelect({ type: "all" })}
        />
        <Item
          label="Favorites" count={favorites.size}
          active={view.type === "favorites"} onClick={() => onSelect({ type: "favorites" })}
        />
      </div>

      {/* Categories */}
      <div className="mb-5">
        <h4 className="micro mb-2 px-2 text-muted-foreground">Categories</h4>
        {CATEGORIES.map(c => (
          <Item
            key={c}
            label={c.replace("-", " ")}
            count={catCount(c)}
            dot={CAT_COLORS[c]}
            active={view.type === "category" && (view as { type: "category"; name: FontCategory }).name === c}
            onClick={() => onSelect({ type: "category", name: c })}
          />
        ))}
      </div>

      {/* Collections */}
      <div>
        <div className="micro mb-2 flex items-center px-2 text-muted-foreground">
          <span className="flex-1">Collections</span>
          <button
            onClick={() => setAdding(true)}
            className="rounded-sm p-0.5 text-muted-foreground hover:text-primary transition-colors"
            title="New collection"
          >
            <Plus size={14} />
          </button>
        </div>

        {adding && (
          <div className="mb-2 flex gap-1 px-1">
            <input
              autoFocus
              value={newColl}
              onChange={e => setNewColl(e.target.value)}
              onKeyDown={e => {
                if (e.key === "Enter") submitNewColl();
                if (e.key === "Escape") { setAdding(false); setNewColl(""); }
              }}
              placeholder="Collection name…"
              className="flex-1 rounded border border-border bg-secondary px-2 py-1.5 text-[12px] outline-none placeholder:text-muted-foreground focus:border-primary"
            />
            <button
              onClick={submitNewColl}
              className="rounded border border-border bg-secondary px-2 text-[11px] font-bold text-muted-foreground hover:border-primary hover:text-primary"
            >
              Add
            </button>
          </div>
        )}

        {Object.entries(collections).length === 0 && !adding && (
          <p className="px-3 text-[12px] text-muted-foreground">No collections yet.</p>
        )}

        {Object.entries(collections).map(([name, members]) => (
          <Item
            key={name}
            label={name}
            count={members.length}
            active={view.type === "collection" && (view as { type: "collection"; name: string }).name === name}
            onClick={() => onSelect({ type: "collection", name })}
            onDelete={() => {
              if (confirm(`Delete collection "${name}"?`)) onDeleteCollection(name);
            }}
          />
        ))}
      </div>
    </aside>
  );
}

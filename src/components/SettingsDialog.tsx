import { useState } from "react";
import { X, Key, RefreshCw } from "lucide-react";

interface Props {
  apiKey: string;
  onSave: (key: string) => void;
  onClose: () => void;
  onLoadCatalog: (key: string) => void;
}

export function SettingsDialog({ apiKey, onSave, onClose, onLoadCatalog }: Props) {
  const [key, setKey] = useState(apiKey);

  const handleSave = () => {
    onSave(key.trim());
    if (key.trim()) onLoadCatalog(key.trim());
    onClose();
  };

  return (
    <div className="fixed inset-0 z-90 grid place-items-center bg-black/50 backdrop-blur-sm">
      <div className="w-[460px] max-w-[92vw] rounded-xl border border-border bg-card p-7 shadow-2xl">
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-[18px] font-bold">Settings</h3>
          <button
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-md border border-border text-muted-foreground hover:border-foreground hover:text-foreground"
          >
            <X size={15} />
          </button>
        </div>

        <div className="mb-2 flex items-center gap-2 text-[13px] font-semibold text-muted-foreground">
          <Key size={13} />
          Google Fonts API Key
        </div>
        <p className="mb-3 text-[12px] text-muted-foreground leading-relaxed">
          Connect to the full Google Fonts catalog (~1,500 fonts including variable fonts).
          Your key is stored locally only.
        </p>
        <input
          value={key}
          onChange={e => setKey(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleSave()}
          placeholder="AIza…"
          className="mb-5 w-full rounded-md border border-border bg-secondary px-3.5 py-2.5 text-[13.5px] outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary/30"
        />

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="rounded-md border border-border px-4 py-2 text-[12px] font-semibold uppercase tracking-wide text-muted-foreground hover:border-foreground hover:text-foreground transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-2 rounded-md bg-primary px-5 py-2 text-[12px] font-bold uppercase tracking-wide text-primary-foreground hover:brightness-105 transition-all"
          >
            <RefreshCw size={13} />
            Save & Load
          </button>
        </div>
      </div>
    </div>
  );
}

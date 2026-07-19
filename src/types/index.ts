export type FontCategory = "sans-serif" | "serif" | "display" | "handwriting" | "monospace";

export interface Font {
  family: string;
  category: FontCategory;
  weights: number[];
  axes?: { tag: string; start: number; end: number }[] | null;
  local?: boolean;
}

export type FontSource = "all" | "cloud" | "local";

export type PreviewMode = "custom" | "sentence" | "alphabet" | "numbers";

export interface Preset {
  name: string;
  size: number;
  tracking: number;
  leading: number;
  italic: boolean;
  weight?: number;
  ax?: Record<string, number>;
}

export interface Collections {
  [name: string]: string[];
}

export interface Presets {
  [family: string]: Preset[];
}

export type View =
  | { type: "all" }
  | { type: "favorites" }
  | { type: "category"; name: FontCategory }
  | { type: "collection"; name: string };

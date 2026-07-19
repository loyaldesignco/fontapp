export type FontCategory =
  | "sans-serif"
  | "serif"
  | "display"
  | "handwriting"
  | "monospace";

export interface Font {
  family: string;
  category: FontCategory;
  weights: number[];
  axes?: { tag: string; start: number; end: number }[] | null;
}

export const AXN: Record<string, string> = {
  wght: "Weight", wdth: "Width", slnt: "Slant", opsz: "Optical size",
  ital: "Italic", GRAD: "Grade", YTLC: "Lowercase height",
};

export const AUTO_ORGANIZE_RULES: [RegExp, FontCategory][] = [
  [/mono|code/i, "monospace"],
  [/script|hand|marker|caveat|vibes|pacifico|dancing|satisfy|kalam|flower|amatic|courgette|sacramento|shadows/i, "handwriting"],
  [/slab|black|fatface|bebas|anton|bungee|titan|righteous|lobster|passion|archivo|alfa/i, "display"],
  [/serif|garamond|baskerville|playfair|lora|merriweather|cardo|spectral|domine|bitter|crimson/i, "serif"],
];

export const WEIGHT_NAME: Record<number, string> = {
  100: "Thin", 200: "ExtraLight", 300: "Light", 400: "Regular",
  500: "Medium", 600: "SemiBold", 700: "Bold", 800: "ExtraBold", 900: "Black",
};

export const CATEGORIES: FontCategory[] = [
  "sans-serif", "serif", "display", "handwriting", "monospace",
];

export const PANGRAM = "The quick brown fox jumps over the lazy dog";
export const SENTENCE = "Almost before we knew it, we had left the ground.";
export const ALPHA = "AaBbCcDdEeFfGgHhIiJjKkLlMmNnOoPpQqRrSsTtUuVvWwXxYyZz";
export const NUMS = "0123456789 !@#$%^&*() — the quick brown fox";

export function sampleFor(mode: string, customText: string): string {
  if (mode === "sentence") return SENTENCE;
  if (mode === "alphabet") return ALPHA;
  if (mode === "numbers") return NUMS;
  return customText || PANGRAM;
}

/** Curated starter catalog — works offline with zero setup. */
const RAW: [string, FontCategory, string][] = [
  ["Roboto", "sans-serif", "100,300,400,500,700,900"],
  ["Open Sans", "sans-serif", "300,400,600,700,800"],
  ["Lato", "sans-serif", "100,300,400,700,900"],
  ["Montserrat", "sans-serif", "100,300,400,500,700,900"],
  ["Poppins", "sans-serif", "100,300,400,500,600,700,900"],
  ["Inter", "sans-serif", "100,400,500,700,900"],
  ["Work Sans", "sans-serif", "300,400,500,600,700"],
  ["Nunito", "sans-serif", "300,400,600,700,800"],
  ["Raleway", "sans-serif", "100,300,400,600,700,900"],
  ["Rubik", "sans-serif", "300,400,500,700,900"],
  ["DM Sans", "sans-serif", "400,500,700"],
  ["Manrope", "sans-serif", "300,400,600,700,800"],
  ["Mulish", "sans-serif", "300,400,600,700,900"],
  ["Karla", "sans-serif", "300,400,600,700"],
  ["Quicksand", "sans-serif", "300,400,500,700"],
  ["Josefin Sans", "sans-serif", "300,400,600,700"],
  ["Oswald", "sans-serif", "300,400,500,600,700"],
  ["Barlow", "sans-serif", "300,400,500,600,700"],
  ["Cabin", "sans-serif", "400,500,600,700"],
  ["Assistant", "sans-serif", "300,400,600,700,800"],
  ["Playfair Display", "serif", "400,500,700,900"],
  ["Merriweather", "serif", "300,400,700,900"],
  ["Lora", "serif", "400,500,600,700"],
  ["PT Serif", "serif", "400,700"],
  ["Noto Serif", "serif", "400,700"],
  ["Cormorant Garamond", "serif", "300,400,500,600,700"],
  ["EB Garamond", "serif", "400,500,600,700,800"],
  ["Bitter", "serif", "300,400,600,700,900"],
  ["Crimson Text", "serif", "400,600,700"],
  ["Libre Baskerville", "serif", "400,700"],
  ["Source Serif 4", "serif", "300,400,600,700,900"],
  ["Spectral", "serif", "300,400,500,600,700,800"],
  ["Zilla Slab", "serif", "300,400,500,600,700"],
  ["Domine", "serif", "400,500,600,700"],
  ["Frank Ruhl Libre", "serif", "300,400,500,700,900"],
  ["Cardo", "serif", "400,700"],
  ["Bebas Neue", "display", "400"],
  ["Anton", "display", "400"],
  ["Righteous", "display", "400"],
  ["Alfa Slab One", "display", "400"],
  ["Abril Fatface", "display", "400"],
  ["Lobster", "display", "400"],
  ["Comfortaa", "display", "300,400,500,700"],
  ["Fredoka", "display", "400,500,600,700"],
  ["Archivo Black", "display", "400"],
  ["Bungee", "display", "400"],
  ["Passion One", "display", "400,700,900"],
  ["Titan One", "display", "400"],
  ["Pacifico", "handwriting", "400"],
  ["Dancing Script", "handwriting", "400,500,600,700"],
  ["Caveat", "handwriting", "400,500,600,700"],
  ["Satisfy", "handwriting", "400"],
  ["Great Vibes", "handwriting", "400"],
  ["Sacramento", "handwriting", "400"],
  ["Shadows Into Light", "handwriting", "400"],
  ["Kalam", "handwriting", "300,400,700"],
  ["Permanent Marker", "handwriting", "400"],
  ["Indie Flower", "handwriting", "400"],
  ["Amatic SC", "handwriting", "400,700"],
  ["Courgette", "handwriting", "400"],
  ["Roboto Mono", "monospace", "300,400,500,700"],
  ["JetBrains Mono", "monospace", "400,500,700,800"],
  ["Source Code Pro", "monospace", "300,400,500,700,900"],
  ["Fira Code", "monospace", "300,400,500,700"],
  ["IBM Plex Mono", "monospace", "300,400,500,600,700"],
  ["Space Mono", "monospace", "400,700"],
  ["Inconsolata", "monospace", "300,400,600,700,900"],
  ["Ubuntu Mono", "monospace", "400,700"],
];

export const STARTER_FONTS: Font[] = RAW.map(([family, category, w]) => ({
  family,
  category,
  weights: w.split(",").map(Number),
  axes: null,
}));

const loaded = new Set<string>();

export function loadFont(family: string, weights: number[] = [400, 700]) {
  const key = family + ":static";
  if (loaded.has(key)) return;
  loaded.add(key);
  const ws = (weights.length ? weights : [400, 700]).slice(0, 6).join(";");
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href =
    "https://fonts.googleapis.com/css2?family=" +
    encodeURIComponent(family) +
    ":wght@" + ws + "&display=swap";
  document.head.appendChild(link);
}

export function loadVariableFont(family: string, axes: { tag: string; start: number; end: number }[]) {
  const key = "VF::" + family;
  if (loaded.has(key)) return;
  loaded.add(key);
  const sorted = [...axes].sort((a, b) => a.tag < b.tag ? -1 : a.tag > b.tag ? 1 : 0);
  const tags = sorted.map(a => a.tag).join(",");
  const ranges = sorted.map(a => `${a.start}..${a.end}`).join(",");
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href =
    "https://fonts.googleapis.com/css2?family=" +
    encodeURIComponent(family) + ":" + tags + "@" + ranges + "&display=swap";
  document.head.appendChild(link);
}

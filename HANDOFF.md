# FontVault — Handoff & Build Plan (for Claude Code)

You are picking up a scaffolded Tauri + React + Tailwind desktop app. This document is
the source of truth for finishing it. The user (Brian) is **new to the terminal**, so run
all commands yourself, explain what you're doing in plain language, and confirm before any
destructive or irreversible step (especially `git push`).

---

## 0. The reference prototype = the spec

`prototype/FontVault.html` is a **complete, working single-file version** of this app
(browse, search, favorites, collections, compare, preview modes, weights, and a variable
customizer with saveable presets). When in doubt about how a feature should behave or look,
open that file and match it. The React app should reach feature parity, then exceed it with
native powers (Phase 3) and shadcn/ui polish.

## 1. Design language (do not drift)

- **Aesthetic:** sleek, minimalist, edgy. Near-black canvas, hairline borders, sharp ~6px
  corners, flat surfaces (no gradients/glows), uppercase tracked micro-labels.
- **Accent:** a single electric lime `hsl(73 100% 63%)` (`#d6ff43`), used only for active /
  primary states so it stays punchy. Light theme flips to warm paper + ink-black accent.
- Tokens live in `src/index.css` as shadcn HSL variables (`:root` = light, `.dark` = dark).
  Change colors there once and everything follows. Keep category tags monochrome.

## 2. First run (verify the scaffold)

```bash
npm install
npm run tauri dev
```

If Tauri complains about missing icons, generate them from the included mark (or any square
PNG/SVG) and re-run:

```bash
npm run tauri icon path/to/logo.png   # writes into src-tauri/icons/
```

Confirm: window opens, 70 fonts render live, search / size / theme toggle / favorites work.

## 3. Add shadcn/ui (do this before building new UI)

```bash
npx shadcn@latest init      # accept defaults; components.json is already present
npx shadcn@latest add button input slider dialog tabs badge scroll-area \
  dropdown-menu tooltip switch toggle-group card
```

Then **refactor** the existing hand-rolled elements in `src/components/*` to use these
primitives (Button, Input, Slider, Dialog, Tabs, Badge, DropdownMenu, ToggleGroup). Keep the
exact look from the tokens — shadcn should inherit the theme automatically.

## 4. Build plan (ordered)

### Phase 1 — reach parity with the prototype
1. **Preview modes** — global ToggleGroup (Custom / Sentence / Abc / 123) + per-card override.
2. **Compare overlay** — Dialog listing selected fonts stacked at large size, shared editable
   text + size slider. (Selection state already exists in `App.tsx`.)
3. **Collections** — create/rename/delete; add fonts via a DropdownMenu on each card; a
   Collections group in the sidebar. Persist to localStorage (see `LS` key in `App.tsx`).
4. **Variable customizer + presets** — a Dialog per font with sliders for weight and any
   variable axes (width/slant/optical), plus size/tracking/leading and italic. Save named
   presets per font (persist locally); show a preset-count badge on the card (already stubbed
   as `presetCount`). Match `openCustomizer` / `savePreset` logic in the prototype.
5. **Auto-organize** — heuristic categorizer + smart collections (see `autoOrganize` in the
   prototype).

### Phase 2 — Google Fonts sync
- Add a settings Dialog to store a Google Fonts API key (localStorage only).
- Fetch `https://www.googleapis.com/webfonts/v1/webfonts?capability=VF&sort=popularity&key=…`
  and map into the `Font` type, including `axes` for variable fonts (see prototype `loadCatalog`).
- Variable axes load via CSS2 tuple syntax: `family=Name:opsz,wght@8..144,100..900`.

### Phase 3 — native powers (the reason it's a desktop app)
Implement as `#[tauri::command]` functions in `src-tauri/src/lib.rs`, register in
`invoke_handler`, and call from React via `@tauri-apps/api/core` `invoke`.
- **Scan local/system fonts** — enumerate `C:\Windows\Fonts` and the per-user fonts dir; parse
  family/style/weight (crate suggestion: `font-kit` or `ttf-parser`). Merge into the library.
- **Preview cache** — cache rendered previews / parsed metadata to disk for instant reloads.
- **Adobe / installed detection** — **Reality check:** Adobe Fonts (Typekit) has *no public API*
  to list or download font files; they're licensed to Creative Cloud. So do **not** promise
  Adobe "sync." Instead, detect Adobe fonts already *installed locally* (via the system-font
  scan) and preview those. Same for other commercial foundries: browse/preview only unless a
  foundry offers a real download API.

### Phase 4 — extras (nice-to-have)
- Font pairing suggestions; tag/mood filtering; export a preset as CSS `@font-face` / `font-variation-settings` snippet.

## 5. Push to GitHub

The user has a repo ready but has **not** shared the URL here. Ask Brian for the repo URL
(e.g. `https://github.com/<owner>/<repo>.git`), then:

```bash
git init
git add .
git commit -m "FontVault: initial Tauri + React scaffold with prototype spec"
git branch -M main
git remote add origin <REPO_URL>
git push -u origin main
```

If the repo already has commits, use `git pull --rebase origin main` first (or force only with
explicit confirmation). Confirm with Brian before pushing.

## 6. Guardrails
- Keep everything in the established design tokens — no ad-hoc colors.
- Prefer editing tokens in `src/index.css` over hardcoding.
- Explain each terminal step in plain English; pause before `git push`.
- The prototype is the behavior spec; parity first, then enhance.

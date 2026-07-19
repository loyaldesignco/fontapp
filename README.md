# FontVault

The ultimate font manager — browse, preview, compare, organize, and customize fonts,
with variable-font presets and (soon) sync from Google Fonts and local system fonts.

Built as a native Windows desktop app with **Tauri 2 + React + TypeScript + Tailwind**,
designed for **shadcn/ui** components, in a sleek near-black / electric-lime theme.

## Quick start

> Requires Node.js and Rust (already installed on this machine).

```bash
npm install
npm run tauri dev
```

The app window opens with the starter catalog (70 curated Google Fonts) rendering live.

To build an installable `.exe`:

```bash
npm run tauri build
```

## What's here now

- Themed shell: header, sidebar (Library / Categories), searchable font grid
- Live font previews, adjustable size, custom preview text
- Favorites (saved locally), category filtering, dark/light theme toggle
- Compare selection (overlay to be wired — see HANDOFF.md)

## What's next

See **HANDOFF.md** — it's the build plan Claude Code follows to finish the port
(compare overlay, variable customizer + presets, collections, Google Fonts API,
and native local-font scanning). The full working reference is in `prototype/FontVault.html`.

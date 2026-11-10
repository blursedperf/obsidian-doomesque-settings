# DoomEsque Settings for Obsidian

A dedicated companion plugin to customize palettes, layout spacing, retro text cursors, typography, and sticky hover previews in the **[DoomEsque](https://github.com/blursedperf/obsidian-theme-doomesque)** theme.

---

## ✨ Core Features

- **🎨 Dynamic Palette Switcher**:
  - Instant dark (8 schemes) and light (6 schemes) Doom Emacs palette switching.
  - Multi-window synchronization keeps main workspace, popouts, and settings in sync.
- **🔲 Retro Cursor Engine**:
  - Five cursor styles: Modern Bar, Retro Block, Phosphor Glow, Hollow Box, and Underline.
  - Custom CodeMirror 6 extension maintains a solid, fixed `1ch` block cursor on empty lines and line boundaries.
- **🔍 Enhanced Sticky Hover Previews**:
  - Unconstrained preview windows (configurable width & height) with contained scrolling.
  - Floating modeline header with drag handle, Open in New Tab (`↗`), Pop to Right Sidebar (`⇥`), Maximize (`⤢`), Pin (`P`), and Close (`✕`).
  - Super key (`Cmd`/`Ctrl`/`Win`) shortcut to pop any hovered note directly into the right sidebar.
  - Optional frontmatter properties (`:PROPERTIES:` drawer) at the top of preview windows.
- **📜 Org-Mode & Typography Controls**:
  - Toggle full monospace note buffer while keeping system UI chrome.
  - Toggle Org-mode `TODO` and `DONE` task badges.
  - Rainbow indentation guides with customizable line styles (solid, dashed, dotted, double).
  - Legal outline numbering (`I.` → `A.` → `1.` → `a.` → `i.`) for nested ordered lists.
- **📐 Layout & Spacing Rhythm**:
  - Fine-tune readable line width, line height, paragraph spacing, heading scale, and editor margins.
  - Sidebar density options: Compact, Normal, and Comfortable.
- **🔒 100% Offline & Secure**:
  - Zero external network requests, zero telemetry, and zero dynamic code evaluation (`eval`).
  - Safe native DOM operations adhering strictly to Obsidian developer guidelines.

---

## ⚡ Key Commands

Access these actions via `Ctrl/Cmd + P` or bind them to hotkeys:

| Command | Action |
| :--- | :--- |
| `DoomEsque: Cycle dark theme palette` | Cycle through Doom dark color schemes |
| `DoomEsque: Cycle light theme palette` | Cycle through Doom light color schemes |
| `DoomEsque: Cycle text cursor style` | Cycle between bar, block, glow, hollow, and underline |
| `DoomEsque: Toggle sticky hover preview windows` | Keep preview popovers pinned open |
| `DoomEsque: Open active preview in right sidebar` | Pop active preview to right sidebar |
| `DoomEsque: Close all hover previews` | Dismiss all open preview windows |
| `DoomEsque: Toggle monospace note editor` | Switch editor between monospace and default font |
| `DoomEsque: Cycle indentation guide style` | Cycle solid, dashed, dotted, double, or none |
| `DoomEsque: Toggle rainbow indentation guides` | Toggle rainbow indent guides on/off |

---

## 📦 Installation

### From Obsidian Community Plugins
1. Open **Settings → Community plugins → Browse**.
2. Search for **DoomEsque Settings**, install, and enable.

### Manual Installation
Copy `manifest.json`, `main.js`, and `styles.css` into your vault:

```bash
mkdir -p "/path/to/vault/.obsidian/plugins/doomesque-settings"
cp manifest.json main.js styles.css "/path/to/vault/.obsidian/plugins/doomesque-settings/"
```

---

## 🛠️ Development

```bash
npm install        # Install dependencies
npm run build      # Build production bundle
npm test           # Run 22 unit test assertions
npm run dev        # Development watch mode
```

---

## 📄 License

[MIT License](./LICENSE) © 2026 blursedperf

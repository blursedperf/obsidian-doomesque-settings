# DoomEsque Settings for Obsidian

A dedicated companion plugin to customize and manipulate style settings, layout spacing, indentation styles, typography, and sticky hover previews in the **[DoomEsque](https://github.com/jasongunst/obsidian-doomesque-theme)** theme for Obsidian.

---

## ✨ Features

### 🎨 Color Palettes & Faces
- **Authentic Doom Dark Palettes**: Seamlessly switch between official Doom schemes:
  - `doom-one` (Default Atom One Dark inspired background `#282c34`)
  - `doom-vibrant` (Deeper `#242730` canvas with punchy syntax accents)
  - `doom-dracula` (Iconic purple/pink/cyan Dracula adaptation)
  - `doom-tokyo-night` (Midnight indigo storm palette `#1a1b26`)
  - `doom-gruvbox` (Warm retro medium dark `#282828`)
- **Org-Mode Task Badges**: Toggle explicit `TODO` and `DONE` prefix badges beside checkboxes.
- **Monochrome Headings**: Switch between Org rainbow headings and a clean, uniform Doom blue accent.
- **H1 Accent Border**: Toggle the subtle bottom border under Level 1 headings.
- **Active Line Highlight**: Toggle `hl-line-mode` editor line highlighting.
- **Settings Layout Style**: Choose between refined rounded cards (with generous 18px padding) or clean border-delimited flat rows.

### 📐 Spacing & Layout Rhythm
- **Readable Line Width**: Adjust max buffer line width (`30rem` to `80rem`, default `46rem`).
- **Editor Line Height**: Fine-tune reading and editing line height (`1.20` to `2.20`, default `1.65`).
- **Paragraph Spacing**: Set custom vertical margin between paragraphs (`0.40rem` to `2.50rem`, default `1.15rem`).
- **Heading Vertical Spacing**: Multiplier for top and bottom breathing room around headings (`0.50x` to `2.00x`).
- **List Item Spacing**: Vertical gap between list items and task lines (`0.00em` to `0.80em`, default `0.22em`).
- **Editor Margins**: Top/bottom (`8px` to `80px`) and left/right (`12px` to `120px`) buffer page padding.
- **Sidebar Item Density**: Switch between `Compact` (dense list), `Normal` (default), and `Comfortable` (spacious touch).
- **Header Bar Height**: Adjust workspace tab header height (`28px` to `48px`, default `36px`).

### 📏 Indentation & Indent Guides
- **List & Outline Indentation**: Adjust nested list indent step (`1.00em` to `3.50em`, default `1.75em`).
- **Guide Stroke Styles**: Choose from `Solid`, `Dashed` (like Emacs `indent-bars`), `Dotted`, `Double`, or `None` (hidden).
- **Guide Line Width**: Set guide stroke thickness (`1.0px` to `4.0px`, default `1.0px`).
- **Rainbow Indent Guides**: Alternates Doom palette colors (`Blue`, `Magenta`, `Violet`, `Orange`, `Green`, `Teal`) per nesting depth in both Live Preview and Reading Mode (like Emacs `highlight-indent-guides`).
- **File Explorer Tree Indent**: Custom indent offset per folder depth level (`6px` to `32px`, default `14px`).

### 🔤 Typography & Buffer Settings
- **Force Monospace Note Editor**: Renders the markdown note buffer in full Doom monospace font for an authentic Emacs buffer experience.
- **System Sans-Serif UI Chrome**: Keeps sidebars, tabs, menus, and modals in system UI font while preserving monospace in editor buffers.
- **Custom Monospace Font Stack**: Safely prepend your favorite monospace font (e.g., `JetBrains Mono`, `Iosevka`, `Fira Code`) with CSS injection protection.
- **Heading Size Scale**: Proportional scale factor across all heading levels (`0.80x` to `1.40x`).

### 🔍 Hover Preview & Sidebar Pop-Open
- **Customizable Preview Window Size**: Freely adjust hover popover width (`320px` to `1200px`, default `550px`) and height (`220px` to `1000px`, default `420px`).
- **Full Content Width & Height Expansion**: Overrides Obsidian's narrow column limits (`--file-line-width` and `.markdown-preview-sizer`), ensuring text, tables, and media expand to 100% of the resized window.
- **Adjustable Text Scale**: Fine-tune the font scale (`0.80x` to `1.60x`) of headings, paragraphs, and code inside hover previews.
- **Sticky Hover Previews**: Keep hover preview popovers open until explicitly closed, allowing you to scroll, edit, and navigate the rest of your vault completely unimpeded.
- **Floating Modeline Header**: Draggable top bar with note title, Maximize/Restore button (`⤢`), quick pin/unpin toggle (`📌`), "Dock to Right Sidebar" button (`⇥`), and close button (`✕`).
- **Super Key Right Sidebar Pop-Open**: Press the **Super** (`Meta` / `Win` / `Cmd`) key while hovering over any internal link or active preview to instantly pop open the target note in the right sidebar. Pressing `Escape` closes active sticky previews.

---

## 🔒 100% Offline & Private

- **Zero Network Calls**: No telemetry, no analytics, no external CDN calls, and no remote requests of any kind.
- **Pure Local Execution**: All settings, layout modifications, and preview enhancements execute entirely within your local Obsidian environment.

---

## ⚡ Command Palette Actions

The plugin provides quick keyboard commands accessible via `Ctrl/Cmd + P`:

| Command | Action |
| :--- | :--- |
| `DoomEsque: Cycle dark theme palette` | Instantly cycles through all 5 Doom dark color schemes with a notice badge |
| `DoomEsque: Toggle monospace note editor` | Switches editor body between monospace buffer and default font |
| `DoomEsque: Toggle Org-mode TODO/DONE task badges` | Toggles explicit `TODO` / `DONE` badges next to checkboxes |
| `DoomEsque: Toggle rainbow indentation guides` | Turns rainbow nested indent guides on/off |
| `DoomEsque: Cycle indentation guide style` | Cycles through `solid` → `dashed` → `dotted` → `double` → `none` |
| `DoomEsque: Toggle monochrome headings` | Toggles between Org rainbow headings and monochrome blue |
| `DoomEsque: Toggle flat settings items style` | Toggles between rounded card containers and border-delimited flat rows |
| `DoomEsque: Open active preview in right sidebar` | Pops open the currently active hover preview in the right sidebar |
| `DoomEsque: Toggle sticky hover preview windows` | Toggles sticky hover preview behavior on/off |
| `DoomEsque: Close active hover preview` | Closes the active hover preview window |
| `DoomEsque: Close all hover previews` | Closes all sticky hover preview windows |

---

## 📦 Installation

### From Obsidian Community Plugins
1. Open **Settings → Community plugins → Browse**.
2. Search for **DoomEsque Settings** and click **Install**, then **Enable**.

### Manual Installation
1. Create a folder named `doomesque-settings` inside your vault's `.obsidian/plugins/` directory:
   ```bash
   mkdir -p "/path/to/your/vault/.obsidian/plugins/doomesque-settings"
   ```
2. Copy `manifest.json`, `main.js`, and `styles.css` into that directory:
   ```bash
   cp manifest.json main.js styles.css "/path/to/your/vault/.obsidian/plugins/doomesque-settings/"
   ```
3. In Obsidian, open **Settings → Community plugins** and toggle on **DoomEsque Settings**.

---

## 🛠️ Building & Testing

```bash
# Build production bundle
npm run build

# Run unit test suite
npm test

# Development watch mode
npm run dev
```

---

## 📄 License

[MIT License](./LICENSE) © 2026 Jason Gunst

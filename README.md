# DoomEsque Settings for Obsidian

A dedicated companion plugin to customize and manipulate style settings, layout spacing, indentation styles, retro text cursors, typography, and sticky hover previews in the **[DoomEsque](https://github.com/blursedperf/obsidian-theme-doomesque)** theme for Obsidian.

---

## ✨ Features

### 🎨 Color Palettes & Themes

Seamlessly switch between authentic Doom Emacs dark and light color palettes via plugin settings, Style Settings, or Command Palette hotkeys:

#### Dark Mode Palettes (7 Schemes)
- **`doom-one` (Default)**: Flagship Atom One Dark inspired Doom palette (`#282c34` background, `#51afef` blue, `#c678dd` magenta, `#98be65` green).
- **`doom-vibrant`**: Deeper `#242730` canvas with high-saturation syntax accents.
- **`doom-dracula`**: Classic Dracula purple/pink/cyan adaptation for Doom.
- **`doom-tokyo-night`**: Clean Tokyo Night storm/midnight indigo palette (`#1a1b26`).
- **`doom-gruvbox`**: Warm retro Gruvbox dark medium palette (`#282828`).
- **`doom-cyberpunk`**: High-contrast Night City neon aesthetic featuring electric cyan (`#00ffff`), signature yellow (`#fee801`), and Samurai crimson (`#ff003c`) on deep dark slate (`#0d1117`).
- **`doom-retro-terminal`**: Authentic monochrome VT220 green phosphor CRT terminal aesthetic (`#080d08` deep phosphor background, `#33ff33` vibrant glowing green text).

#### Light Mode Palettes (5 Schemes)
- **`doom-one-light` (Default)**: Clean Atom One Light port (`#fafafa` base) with vivid syntax accents.
- **`doom-nord-light`**: Arctic pastel light scheme (`#e5e9f0` base) with cool slate and pine accents.
- **`doom-gruvbox-light`**: Warm retro Gruvbox light medium palette (`#fbf1c7` base) with earthy tones.
- **`doom-solarized-light`**: Classic Ethan Schoonover solarized light palette (`#fdf6e3` base).
- **`doom-tomorrow-day`**: Crisp white Chris Kempson Tomorrow Day palette (`#ffffff` base).

---

### 🔲 Retro Text Cursor Styles

Choose from five distinct editor text cursor styles designed to recreate classic CRT and terminal workflows:

- **Modern Bar (Default)**: Clean 2px vertical bar cursor with standard smooth blink.
- **Retro Block**: Solid character block cursor with difference-blend glyph inversion and hard CRT 1s step blink.
- **Retro Phosphor**: Glowing translucent character block cursor with CRT neon bloom effect.
- **Retro Hollow**: Wireframe CRT character box with phosphor border.
- **Retro Underline**: Classic VT100 / terminal prompt underline cursor.

> [!NOTE]
> **Constant 1ch Width Engine (`DoomCursorPlugin`)**:
> Modern Chromium browsers collapse CSS block carets to a 1px sliver at the beginning of empty lines. DoomEsque Settings includes a custom CodeMirror 6 `ViewPlugin` that tracks cursor coordinates and renders a rock-solid, fixed `1ch` width cursor across empty lines, line beginnings, line ends, and active typing.

---

### 🔍 Hover Preview Popovers & Modeline Controls

Supercharge Obsidian page preview popovers (`.popover.hover-popover`) into flexible floating workspaces:

- **Custom Dimensions**: Independently configure preview popover width (`320px` to `1200px`, default `550px`) and height (`220px` to `1000px`, default `420px`).
- **Full Viewport Expansion**: Unconstrains child preview elements (`.markdown-preview-sizer`, `.markdown-embed`, `.cm-scroller`, `.bases-embed`) to fill 100% of the resized window without clipping or artificial column caps.
- **Note Properties in Popovers**: Option to display frontmatter YAML properties (`:PROPERTIES:` drawer) at the top of note preview popover windows. Automatically unfolds properties on mount, suppresses empty states (`data-property-count="0"`), and hides the `+ Add property` button in non-editing preview mode.
- **Sticky Hover Previews**: Keep hover preview popovers open until explicitly closed (via `✕` button or `Escape`), allowing you to scroll, edit, and navigate the rest of your vault freely.
- **Floating Modeline Header**: Draggable top bar with note title, Open in New Tab (`↗`), Pop to Right Sidebar (`⇥`), Maximize/Restore toggle (`⤢`), Pin/Unpin toggle (`📌`), and Close button (`✕`).
- **Super Key Right Sidebar Pop-Open**: Press the **Super** (`Meta` / `Win` / `Cmd`) key while hovering over any link or active preview popover to immediately pop the note open in the right sidebar.
- **Contained Scrolling**: Traps mouse wheel scroll events inside preview windows, preventing disruptive scroll chaining to the underlying editor.

---

### 📏 Indentation, Outlines & Indent Guides

- **Indentation Line Styles**: Choose from `Solid`, `Dashed` (like Emacs `indent-bars`), `Dotted`, `Double`, or `None` (hidden).
- **Guide Width & Step**: Fine-tune indentation guide line width (`1.0px` to `4.0px`) and nested list indent step (`1.00em` to `3.50em`).
- **Rainbow Indentation Guides**: Alternates Doom palette colors (`Blue`, `Magenta`, `Violet`, `Orange`, `Green`, `Teal`) per nesting depth in both Live Preview and Reading View (like Emacs `highlight-indent-guides`).
- **Legal / Hornbook Outline Numbering**: Formal legal outline numbering (`I.` → `A.` → `1.` → `a.` → `i.`) for nested ordered lists.
- **File Explorer Tree Indentation**: Configurable folder tree indent per depth level (`6px` to `32px`).

---

### 📐 Spacing & Layout Rhythm

- **Readable Line Width**: Adjust max buffer line width (`30rem` to `80rem`, default `46rem`).
- **Editor Line Height**: Fine-tune reading and editing line height (`1.20` to `2.20`, default `1.65`).
- **Paragraph Spacing**: Set custom vertical margin between paragraphs (`0.40rem` to `2.50rem`, default `1.15rem`).
- **Heading Vertical Spacing**: Multiplier for top and bottom spacing around headings (`0.50x` to `2.00x`).
- **List Item Spacing**: Vertical spacing between list items and task lines (`0.00em` to `0.80em`, default `0.22em`).
- **Editor Margins**: Top/bottom (`8px` to `80px`) and left/right (`12px` to `120px`) buffer page padding.
- **Sidebar Item Density**: Switch between `Compact` (dense list), `Normal` (default), and `Comfortable` (spacious touch).
- **Header Bar Height**: Adjust workspace tab header height (`28px` to `48px`, default `36px`).

---

### 🔤 Typography & Faces

- **Force Monospace Note Editor**: Renders the markdown note buffer in full Doom monospace font for an authentic Emacs buffer experience.
- **System Sans-Serif UI Chrome**: Keeps sidebars, tabs, menus, and modals in system UI font while preserving monospace in editor buffers.
- **Custom Monospace Font Stack**: Safely prepend your favorite monospace font (e.g., `JetBrains Mono`, `Iosevka`, `Fira Code`) with CSS injection protection.
- **Heading Size Scale**: Proportional scale factor across all heading levels (`0.80x` to `1.40x`).
- **Monochrome Headings**: Switch between Org rainbow headings and a clean, uniform Doom blue accent.
- **H1 Accent Border**: Toggle the subtle bottom border under Level 1 headings.
- **Active Block Highlight**: Optional subtle background highlight on the cursor's active block / line (`hl-line-mode`, defaults to off).
- **Org-Mode Task Badges**: Toggle explicit `TODO` and `DONE` prefix badges beside checkboxes.
- **Editorial Emphasis**: High-contrast neutral text colors for bold and italic emphasis instead of syntax accents.

---

### ⚙️ Settings Window Appearance

- **Rounded Card Containers**: Generous 18px horizontal padding with subtle borders and 6px rounded geometry.
- **Flat Settings Rows**: Option to use clean border-delimited flat rows instead of card boxes.
- **Square Toggles**: Rectangular track switches with square sliding thumbs and glowing active accents, designed to harmonize with Doom's crisp buffer geometry.

---

## 🔒 Security & Privacy Guarantees

This plugin adheres strictly to the **Obsidian Community Plugin Guidelines** and security best practices:

- **100% Offline**: Zero external network calls. No `fetch()`, `requestUrl()`, `XMLHttpRequest`, `WebSocket`, or analytics of any kind.
- **Zero Dynamic Code Evaluation**: No `eval()` or `new Function()` invocations.
- **Safe DOM Manipulation**: Built exclusively with Obsidian's native DOM helpers (`createDiv`, `createSpan`, `setText`, `setAttribute`). Zero usage of `innerHTML`, `outerHTML`, or `insertAdjacentHTML`.
- **CSS Injection Protection**: Custom font names are sanitized against CSS delimiter injection (`;`, `{`, `}`, `\`, `<`, `>`).
- **Clean Teardown**: Upon plugin unload (`onunload`), all CodeMirror extensions, DOM observers, keyboard handlers, body classes, and CSS variables are completely removed without lingering side-effects.

---

## ⚡ Command Palette Actions

All features are accessible via keyboard shortcuts or `Ctrl/Cmd + P`:

| Command | Action |
| :--- | :--- |
| `DoomEsque: Cycle dark theme palette` | Cycles through all 7 Doom dark color schemes with notice badge |
| `DoomEsque: Cycle light theme palette` | Cycles through all 5 Doom light color schemes with notice badge |
| `DoomEsque: Cycle text cursor style` | Cycles through `bar` → `block` → `glow` → `hollow` → `underline` |
| `DoomEsque: Toggle note properties in hover previews` | Toggles frontmatter YAML properties in hover preview popovers |
| `DoomEsque: Toggle sticky hover preview windows` | Toggles sticky hover preview behavior on/off |
| `DoomEsque: Open active preview in right sidebar` | Pops open the currently active hover preview in the right sidebar |
| `DoomEsque: Close active hover preview` | Closes the topmost active hover preview window |
| `DoomEsque: Close all hover previews` | Closes all open hover preview windows |
| `DoomEsque: Toggle monospace note editor` | Switches editor body between monospace buffer and default font |
| `DoomEsque: Toggle Org-mode TODO/DONE task badges` | Toggles explicit `TODO` / `DONE` badges next to checkboxes |
| `DoomEsque: Toggle rainbow indentation guides` | Turns rainbow nested indent guides on/off |
| `DoomEsque: Cycle indentation guide style` | Cycles through `solid` → `dashed` → `dotted` → `double` → `none` |
| `DoomEsque: Toggle legal / hornbook outline numbering (I, A, 1, a, i)` | Toggles legal outline numbering for ordered lists |
| `DoomEsque: Toggle editorial bold & italic colors` | Toggles high-contrast editorial bold/italic colors |
| `DoomEsque: Toggle monochrome headings` | Toggles between Org rainbow headings and monochrome blue |
| `DoomEsque: Toggle flat settings items style` | Toggles between rounded card containers and border-delimited flat rows |

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
# Install dependencies
npm install

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

# DoomEsque Settings for Obsidian

Companion plugin for the **[DoomEsque](https://github.com/blursedperf/obsidian-theme-doomesque)** theme: palettes, spacing, typography, cursors and sticky hover previews from one settings tab.

## Features

- **Palettes.** Switch between 8 dark and 6 light Doom palettes; popout windows stay in sync.
- **Cursors.** Bar, block, glow, hollow and underline, with a fixed `1ch` block on empty lines.
- **Hover previews.** Resizable, draggable, maximizable and sticky preview windows with open-in-new-tab, pop-to-right-sidebar, pin and close buttons. Press the Super key (`Cmd`/`Ctrl`/`Win`) over a link to open it in the right sidebar. Optional properties drawer.
- **Typography.** Monospace note buffer, `TODO`/`DONE` badges, monochrome headings, heading scale, custom monospace font and legal outline numbering.
- **Layout.** Line width, line height, paragraph and heading spacing, editor margins, header height and sidebar density.
- **Indent guides.** Rainbow or single colour; solid, dashed, dotted, double or none.
- **Tables and Bases.** Density, gridlines, zebra striping, Bases toolbar labels and uppercase Bases headers.
- **Offline.** No network requests, telemetry or `eval`.

## Style Settings and other themes

- **Style Settings enabled:** the theme exposes most of these options through [Style Settings](https://github.com/mgmeyers/obsidian-style-settings) too. While it is enabled it controls the shared options, so their rows here are disabled and their commands show a notice. Options only this plugin has still apply.
- **Another theme active:** the plugin removes its classes and variables, so that theme is untouched. Enhanced hover previews keep working under any theme.

## Commands

Run from the command palette (`Ctrl/Cmd + P`) or bind to hotkeys. They include cycling the dark and light palettes, cursor style and indent guide style; toggling monospace, task badges, rainbow guides, monochrome headings, the active block highlight, legal numbering, editorial emphasis and flat settings items; and hover preview actions (sticky previews, properties, open in right sidebar, close active, close all).

## Installation

From Obsidian: **Settings → Community plugins → Browse**, search for **DoomEsque Settings**, install and enable.

Manually: copy `manifest.json`, `main.js` and `styles.css` into `<vault>/.obsidian/plugins/doomesque-settings/`.

## Development

```bash
npm install     # install dependencies
npm run build   # production build
npm test        # unit tests
npm run dev     # watch mode
```

## License

[MIT](./LICENSE) © 2026 blursedperf

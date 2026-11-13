# DoomEsque Settings for Obsidian

Companion plugin for the **[DoomEsque](https://github.com/blursedperf/obsidian-theme-doomesque)** theme: palettes, spacing, typography, cursors and sticky hover previews from one settings tab.

## Why this suite exists

I created this suite of Obsidian plugins and the DoomEsque theme so that I can be 100 percent certain there are no network calls or traffic: everything runs 100 percent offline, so I can use Obsidian for my notes in open-book law exams.

- Nothing in the suite makes a network request. Every test run checks the source, built bundle and styles with `scripts/offline-audit.mjs`, which fails on any network API (`fetch`, `XMLHttpRequest`, WebSocket, `requestUrl`, ...).
- Obsidian itself has separate online features. For a fully offline setup, also turn off automatic updates, Sync and Publish, and don't browse community plugins during the exam.

The suite:

- [DoomEsque](https://github.com/blursedperf/obsidian-theme-doomesque) (theme)
- **DoomEsque Settings**
- [Filetypes](https://github.com/blursedperf/obsidian-filetypes-plugin)
- [Inline Autocomplete](https://github.com/blursedperf/obsidian-inline-autocomplete)
- [Inline Schema Expander](https://github.com/blursedperf/obsidian-inline-schema-expander)
- [Links in New Tabs](https://github.com/blursedperf/obsidian-links-in-new-tabs)
- [Pomodoro Flashcards](https://github.com/blursedperf/obsidian-pomodoro-flashcards)
- [Whole-Tree Search](https://github.com/blursedperf/obsidian-whole-tree-search)

## Features

- **Palettes.** Switch between 8 dark and 7 light Doom palettes; popout windows stay in sync.
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

## Privacy

The plugin makes no network requests. Every test run checks the source, built bundle and styles with `scripts/offline-audit.mjs`, which fails on any network API, dynamic code, raw HTML injection or remote CSS.

## License

[MIT](./LICENSE) © 2026 blursedperf

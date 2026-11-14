/**
 * Single description of every setting in the DoomEsque Settings tab.
 *
 * Obsidian 1.13+ renders the tab declaratively from `getSettingDefinitions()` (which also makes the
 * settings searchable); older versions call `display()`. Both are built from this schema so the two
 * paths can never drift apart. Kept free of the `obsidian` runtime import so it can be unit tested.
 */
import {
	DOOM_CURSOR_STYLES,
	DOOM_LIGHT_PALETTES,
	DOOM_PALETTES,
	DoomEsqueStyleSettings,
	STYLE_SETTINGS_SHARED_KEYS,
	sanitizeFontFamily,
} from "./settings";

export type SettingKey = keyof DoomEsqueStyleSettings;

export type SettingControlSpec =
	| { type: "toggle" }
	| { type: "dropdown"; options: Record<string, string> }
	| { type: "slider"; min: number; max: number; step: number; format: (value: number) => string; integer?: boolean }
	| { type: "text"; placeholder?: string };

export interface SettingSpec {
	key: SettingKey;
	name: string;
	desc: string;
	control: SettingControlSpec;
}

export interface SettingSectionSpec {
	heading: string;
	items: SettingSpec[];
}

const px = (v: number) => `${Math.round(v)} px`;
const times = (v: number) => `${v.toFixed(2)}x`;
const optionsOf = (list: readonly { id: string; label: string }[]): Record<string, string> =>
	Object.fromEntries(list.map((o) => [o.id, o.label]));

export const SETTINGS_SECTIONS: readonly SettingSectionSpec[] = [
	{
		heading: "Color palette & theme faces",
		items: [
			{ key: "darkPalette", name: "Dark theme palette", desc: "Choose which authentic Doom color scheme to apply in Dark Mode.", control: { type: "dropdown", options: optionsOf(DOOM_PALETTES) } },
			{ key: "lightPalette", name: "Light theme palette", desc: "Choose which authentic Doom color scheme to apply in Light Mode.", control: { type: "dropdown", options: optionsOf(DOOM_LIGHT_PALETTES) } },
			{ key: "disableOrgTodoBadges", name: "Disable Org-mode TODO / DONE task badges", desc: "Hide the explicit TODO and DONE badges displayed alongside task checkboxes.", control: { type: "toggle" } },
			{ key: "monochromeHeadings", name: "Monochrome headings", desc: "Use a uniform Doom blue for all headings instead of Org-mode rainbow colors (Blue, Magenta, Violet, Orange, Green, Teal).", control: { type: "toggle" } },
			{ key: "disableH1Border", name: "Disable H1 underline border", desc: "Hide the subtle bottom accent underline under Level 1 headings.", control: { type: "toggle" } },
			{ key: "activeBlockHighlight", name: "Active block highlight (hl-line-mode)", desc: "Display a subtle horizontal background highlight on the cursor's active block / line (defaults to off).", control: { type: "toggle" } },
			{ key: "flatSettingsItems", name: "Flat settings items style", desc: "Use clean border-delimited flat rows instead of rounded card boxes for settings items.", control: { type: "toggle" } },
		],
	},
	{
		heading: "Spacing & layout rhythm",
		items: [
			{ key: "fileLineWidthRem", name: "Readable line width", desc: "Max width of readable note buffers in rem units (Default: 46 rem).", control: { type: "slider", min: 30, max: 80, step: 1, format: (v) => `${v} rem` } },
			{ key: "lineHeightNormal", name: "Editor line height", desc: "Line height for reading and editing note buffers (Default: 1.65).", control: { type: "slider", min: 1.2, max: 2.2, step: 0.05, format: (v) => v.toFixed(2) } },
			{ key: "paragraphSpacingRem", name: "Paragraph spacing", desc: "Vertical spacing between markdown paragraphs in rem units (Default: 1.15 rem).", control: { type: "slider", min: 0.4, max: 2.5, step: 0.05, format: (v) => `${v.toFixed(2)} rem` } },
			{ key: "headingSpacingScale", name: "Heading spacing scale", desc: "Multiplier for top and bottom breathing room around headings (Default: 1.00x).", control: { type: "slider", min: 0.5, max: 2.0, step: 0.05, format: times } },
			{ key: "listSpacingEm", name: "List item vertical spacing", desc: "Vertical gap between list items and task list checkboxes in em units (Default: 0.22 em).", control: { type: "slider", min: 0, max: 0.8, step: 0.02, format: (v) => `${v.toFixed(2)} em` } },
			{ key: "editorMarginVerticalPx", name: "Editor vertical page margins", desc: "Top and bottom padding inside note views in px (Default: 28 px).", control: { type: "slider", min: 8, max: 80, step: 2, format: px, integer: true } },
			{ key: "editorMarginHorizontalPx", name: "Editor horizontal page margins", desc: "Left and right padding inside note views in px (Default: 36 px).", control: { type: "slider", min: 12, max: 120, step: 2, format: px, integer: true } },
			{ key: "sidebarDensity", name: "Sidebar item density", desc: "Vertical padding and compactness for the file explorer, outline, and sidebars.", control: { type: "dropdown", options: { compact: "Compact (Dense list)", normal: "Normal (Default)", comfortable: "Comfortable (Spacious touch)" } } },
			{ key: "headerHeightPx", name: "Desktop header bar height", desc: "Height of the top tab and workspace header bar in px (Default: 36 px).", control: { type: "slider", min: 28, max: 48, step: 1, format: px, integer: true } },
		],
	},
	{
		heading: "Tables & Bases",
		items: [
			{ key: "tableDensity", name: "Table & Bases density", desc: "Row height, cell padding and Bases text size. Normal keeps native Markdown table spacing. Open Bases views pick up row height on next render.", control: { type: "dropdown", options: { compact: "Compact", normal: "Normal (Default)", comfortable: "Comfortable" } } },
			{ key: "tableGrid", name: "Table gridlines", desc: "Which cell borders to draw in Markdown tables and Bases.", control: { type: "dropdown", options: { full: "Full grid (Default)", horizontal: "Horizontal rules only", none: "None" } } },
			{ key: "disableTableZebra", name: "Disable zebra striping", desc: "Remove alternating row shading in Markdown tables. (Bases tables are not striped because their rows are virtualized.)", control: { type: "toggle" } },
			{ key: "basesToolbarLabels", name: "Bases toolbar text labels", desc: "Show text labels (Sort, Group, Filter, Properties, Search, New) next to the Bases toolbar icons. Off by default for a compact icon-only toolbar.", control: { type: "toggle" } },
			{ key: "basesHeaderCaps", name: "Org-style uppercase Bases headers", desc: "Render Bases column headers in uppercase monospace instead of the interface font.", control: { type: "toggle" } },
		],
	},
	{
		heading: "Indentation & indent guides",
		items: [
			{ key: "listIndentEm", name: "List & outline indentation", desc: "Width of each nesting indentation step in lists and outlines (Default: 1.75 em).", control: { type: "slider", min: 1, max: 3.5, step: 0.05, format: (v) => `${v.toFixed(2)} em` } },
			{ key: "indentGuideStyle", name: "Indentation guide line style", desc: "Visual stroke style of vertical indent guides (inspired by Emacs highlight-indent-guides / indent-bars).", control: { type: "dropdown", options: { solid: "Solid line (Default)", dashed: "Dashed line", dotted: "Dotted line", double: "Double line", none: "None (Hide guides)" } } },
			{ key: "indentGuideWidthPx", name: "Indentation guide line width", desc: "Thickness of vertical indentation guide lines in px (Default: 1.0 px).", control: { type: "slider", min: 1, max: 4, step: 0.5, format: (v) => `${v.toFixed(1)} px` } },
			{ key: "rainbowIndentGuides", name: "Rainbow indent guides", desc: "Color nested indentation depth guides using alternating Doom palette colors (Blue, Magenta, Violet, Orange, Green, Teal).", control: { type: "toggle" } },
			{ key: "outlineNumbering", name: "Outline numbering", desc: "How nested numbered lists are numbered. A note can choose its own with a cssclass: outline-standard, outline-hornbook, outline-decimal or outline-statutory.", control: { type: "dropdown", options: { standard: "Standard (1, a, i, A)", hornbook: "Legal / hornbook (I, A, 1, a, i)", decimal: "Decimal (1, 1.1, 1.1.1)", statutory: "Statutory ((1), (a), (i), (A))" } } },
			{ key: "livePreviewOutlineNumbers", name: "Outline numbers in Live Preview", desc: "Show the same numbers while editing as in Reading view. The note keeps the numbers as typed; put the cursor on a number to edit it.", control: { type: "toggle" } },
			{ key: "fileTreeIndentPx", name: "File tree folder indentation", desc: "Indentation offset per nested directory level in the file explorer (Default: 14 px).", control: { type: "slider", min: 6, max: 32, step: 2, format: px, integer: true } },
		],
	},
	{
		heading: "Typography & heading scale",
		items: [
			{ key: "editorialEmphasis", name: "Editorial bold & italic colors", desc: "Use high-contrast neutral text colors for bold and italic emphasis instead of orange/green syntax accents during long-form legal or academic reading.", control: { type: "toggle" } },
			{ key: "monospaceEditor", name: "Force monospace note editor", desc: "Display note buffer body text in Doom monospace font for an authentic Emacs buffer feel.", control: { type: "toggle" } },
			{ key: "disableMonospaceUi", name: "System sans-serif UI chrome", desc: "Revert sidebars, tabs, menus, and modals to system sans-serif font instead of monospace.", control: { type: "toggle" } },
			{ key: "cursorStyle", name: "Text cursor style", desc: "Choose the text cursor style in the note editor (modern 2px bar, or retro terminal block, glow, hollow, and underline; mobile devices use the native OS caret styled with theme accent).", control: { type: "dropdown", options: optionsOf(DOOM_CURSOR_STYLES) } },
			{ key: "customMonospaceFont", name: "Custom monospace font family", desc: "Custom font family prepended to the Doom monospace stack (e.g. 'JetBrains Mono', 'Iosevka', 'Fira Code'). Leave blank for default.", control: { type: "text", placeholder: "e.g. JetBrains Mono" } },
			{ key: "headingScale", name: "Heading size scale", desc: "Proportional scale factor applied across all H1-H6 heading sizes (Default: 1.00x).", control: { type: "slider", min: 0.8, max: 1.4, step: 0.05, format: times } },
		],
	},
	{
		heading: "Hover preview & sidebar pop-open (Desktop)",
		items: [
			{ key: "hoverPopoverWidthPx", name: "Hover preview width", desc: "Width of page preview popover windows in px (Default: 550 px).", control: { type: "slider", min: 320, max: 1200, step: 20, format: px, integer: true } },
			{ key: "hoverPopoverHeightPx", name: "Hover preview height", desc: "Height of page preview popover windows in px (Default: 420 px).", control: { type: "slider", min: 220, max: 1000, step: 20, format: px, integer: true } },
			{ key: "hoverPopoverFontScale", name: "Hover preview text scale", desc: "Scale factor for note content, headings, and code inside hover preview windows (Default: 1.00x).", control: { type: "slider", min: 0.8, max: 1.6, step: 0.05, format: times } },
			{ key: "stickyHoverPreviews", name: "Sticky hover preview windows", desc: "Keep hover preview windows open until explicitly closed (via ✕ button or Esc), allowing you to scroll, edit, and navigate the rest of the vault freely.", control: { type: "toggle" } },
			{ key: "superKeyOpensRightSidebar", name: "Pop open in right sidebar with Super key", desc: "Pressing the Super (Meta/Win/Cmd) key while hovering over a link or an active preview pops the note open in the right sidebar.", control: { type: "toggle" } },
			{ key: "showPopoverProperties", name: "Show note properties in hover previews", desc: "Display frontmatter YAML properties (:PROPERTIES: drawer) at the top of note preview popover windows.", control: { type: "toggle" } },
		],
	},
];

/** True when Style Settings (if enabled) owns this setting, so the plugin's control is disabled. */
export function isSharedSetting(key: SettingKey): boolean {
	return (STYLE_SETTINGS_SHARED_KEYS as readonly string[]).includes(key);
}

/** Normalises a value from a control before it is stored (rounding, sanitising). */
export function normalizeSettingValue(spec: SettingSpec, value: unknown): unknown {
	const c = spec.control;
	if (c.type === "slider") {
		const n = typeof value === "number" ? value : Number(value);
		return c.integer ? Math.round(n) : n;
	}
	if (c.type === "text") {
		const text = typeof value === "string" ? value : "";
		return spec.key === "customMonospaceFont" ? sanitizeFontFamily(text) : text;
	}
	return value;
}

/** Finds the spec for a settings key. */
export function findSettingSpec(key: string): SettingSpec | undefined {
	for (const section of SETTINGS_SECTIONS) {
		const found = section.items.find((item) => item.key === key);
		if (found) return found;
	}
	return undefined;
}

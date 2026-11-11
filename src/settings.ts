export type DoomDarkPalette =
	| "doom-palette-one"
	| "doom-palette-vibrant"
	| "doom-palette-dracula"
	| "doom-palette-tokyo-night"
	| "doom-palette-gruvbox"
	| "doom-palette-cyberpunk"
	| "doom-palette-retro-terminal"
	| "doom-palette-suit-and-tie";

export type DoomLightPalette =
	| "doom-palette-one-light"
	| "doom-palette-nord-light"
	| "doom-palette-gruvbox-light"
	| "doom-palette-solarized-light"
	| "doom-palette-tomorrow-day"
	| "doom-palette-suit-and-tie-light";

export type DoomIndentGuideStyle = "solid" | "dashed" | "dotted" | "double" | "none";

export type DoomSidebarDensity = "compact" | "normal" | "comfortable";

export interface DoomPaletteOption {
	id: DoomDarkPalette;
	label: string;
	description: string;
}

export interface DoomLightPaletteOption {
	id: DoomLightPalette;
	label: string;
	description: string;
}

export const DOOM_PALETTES: readonly DoomPaletteOption[] = [
	{
		id: "doom-palette-one",
		label: "doom-one (Default)",
		description: "Flagship Atom One Dark inspired Doom color scheme (#282c34).",
	},
	{
		id: "doom-palette-vibrant",
		label: "doom-vibrant",
		description: "Deeper backgrounds (#242730) with higher-saturation syntax accents.",
	},
	{
		id: "doom-palette-dracula",
		label: "doom-dracula",
		description: "Classic Dracula purple/pink/cyan palette adapted for DoomEsque.",
	},
	{
		id: "doom-palette-tokyo-night",
		label: "doom-tokyo-night",
		description: "Clean Tokyo Night storm/night indigo palette (#1a1b26).",
	},
	{
		id: "doom-palette-gruvbox",
		label: "doom-gruvbox",
		description: "Warm retro Gruvbox dark medium palette (#282828).",
	},
	{
		id: "doom-palette-cyberpunk",
		label: "doom-cyberpunk (Cyberpunk 2077)",
		description: "High-contrast Night City neon aesthetic: electric cyan, signature yellow, and Samurai crimson on deep dark slate.",
	},
	{
		id: "doom-palette-retro-terminal",
		label: "doom-retro-terminal (VT220 Green Screen)",
		description: "Authentic monochrome green phosphor CRT terminal (#080d08 / #33ff33).",
	},
	{
		id: "doom-palette-suit-and-tie",
		label: "doom-suit-and-tie (Modern Sartorial)",
		description: "Clean modern bespoke suiting palette: tailored charcoal slate with crisp white shirt contrast, silk crimson tie, and steel blue accents.",
	},
];

export const DOOM_LIGHT_PALETTES: readonly DoomLightPaletteOption[] = [
	{
		id: "doom-palette-one-light",
		label: "doom-one-light (Default)",
		description: "Clean Atom One Light port (#fafafa) with bright Doom syntax accents.",
	},
	{
		id: "doom-palette-nord-light",
		label: "doom-nord-light",
		description: "Arctic pastel light palette (#e5e9f0) with cool slate and pine accents.",
	},
	{
		id: "doom-palette-gruvbox-light",
		label: "doom-gruvbox-light",
		description: "Warm retro Gruvbox light medium palette (#fbf1c7) with earthy tones.",
	},
	{
		id: "doom-palette-solarized-light",
		label: "doom-solarized-light",
		description: "Classic Ethan Schoonover solarized light palette (#fdf6e3).",
	},
	{
		id: "doom-palette-tomorrow-day",
		label: "doom-tomorrow-day",
		description: "Crisp white Chris Kempson Tomorrow Day palette (#ffffff).",
	},
	{
		id: "doom-palette-suit-and-tie-light",
		label: "doom-suit-and-tie-light (Linen & Silk)",
		description: "Crisp modern light sartorial palette: warm off-white linen shirt background with tailored navy and silk burgundy accents.",
	},
];

export const INDENT_GUIDE_STYLE_CLASSES: Record<DoomIndentGuideStyle, string> = {
	solid: "doom-indent-style-solid",
	dashed: "doom-indent-style-dashed",
	dotted: "doom-indent-style-dotted",
	double: "doom-indent-style-double",
	none: "doom-indent-style-none",
};

export const SIDEBAR_DENSITY_CLASSES: Record<DoomSidebarDensity, string> = {
	compact: "doom-sidebar-compact",
	normal: "doom-sidebar-normal",
	comfortable: "doom-sidebar-comfortable",
};

export type DoomCursorStyle = "bar" | "block" | "glow" | "hollow" | "underline";

export interface DoomCursorStyleOption {
	id: DoomCursorStyle;
	label: string;
	description: string;
}

export const DOOM_CURSOR_STYLES: readonly DoomCursorStyleOption[] = [
	{
		id: "bar",
		label: "Modern Bar (Default 2px)",
		description: "Clean modern 2px vertical bar with standard smooth blink.",
	},
	{
		id: "block",
		label: "Retro Block (Solid Inverted CRT Block)",
		description: "Solid character block cursor with difference-blend glyph inversion and hard CRT 1s step blink.",
	},
	{
		id: "glow",
		label: "Retro Phosphor (Glowing Translucent Block)",
		description: "Phosphor CRT glowing translucent block with neon bloom effect.",
	},
	{
		id: "hollow",
		label: "Retro Hollow (CRT Wireframe Box)",
		description: "Hollow wireframe character box with CRT phosphor border.",
	},
	{
		id: "underline",
		label: "Retro Underline (Classic Terminal Prompt)",
		description: "Classic VT100 / terminal prompt underline cursor.",
	},
];

export const CURSOR_STYLE_CLASSES: Record<DoomCursorStyle, string> = {
	bar: "doom-cursor-bar",
	block: "doom-cursor-block",
	glow: "doom-cursor-glow",
	hollow: "doom-cursor-hollow",
	underline: "doom-cursor-underline",
};

export const CURSOR_STYLES: readonly DoomCursorStyle[] = [
	"bar",
	"block",
	"glow",
	"hollow",
	"underline",
];

export function getNextCursorStyle(current: DoomCursorStyle): DoomCursorStyle {
	const idx = CURSOR_STYLES.indexOf(current);
	if (idx === -1) return CURSOR_STYLES[0];
	return CURSOR_STYLES[(idx + 1) % CURSOR_STYLES.length];
}

export const ALL_MANAGED_BODY_CLASSES: readonly string[] = [
	"doom-palette-one",
	"doom-palette-vibrant",
	"doom-palette-dracula",
	"doom-palette-tokyo-night",
	"doom-palette-gruvbox",
	"doom-palette-cyberpunk",
	"doom-palette-retro-terminal",
	"doom-palette-suit-and-tie",
	"doom-palette-one-light",
	"doom-palette-nord-light",
	"doom-palette-gruvbox-light",
	"doom-palette-solarized-light",
	"doom-palette-tomorrow-day",
	"doom-palette-suit-and-tie-light",
	"doom-no-org-todo",
	"doom-monospace-editor",
	"doom-disable-monospace-ui",
	"doom-monochrome-headings",
	"doom-no-h1-border",
	"doom-active-block-highlight",
	"doom-active-line-highlight",
	"doom-no-active-line-highlight",
	"doom-rainbow-indent-guides",
	"doom-indent-style-solid",
	"doom-indent-style-dashed",
	"doom-indent-style-dotted",
	"doom-indent-style-double",
	"doom-indent-style-none",
	"doom-sidebar-compact",
	"doom-sidebar-normal",
	"doom-sidebar-comfortable",
	"doom-cursor-bar",
	"doom-cursor-block",
	"doom-cursor-glow",
	"doom-cursor-hollow",
	"doom-cursor-underline",
	"doom-sticky-hover-enabled",
	"doom-popover-properties",
	"doom-settings-flat",
	"doom-legal-outline",
	"doom-editorial-emphasis",
];

export const ALL_MANAGED_CSS_VARS: readonly string[] = [
	"--font-monospace-doom",
	"--font-monospace-theme",
	"--file-line-width",
	"--line-height-normal",
	"--p-spacing",
	"--heading-spacing",
	"--doom-heading-spacing-scale",
	"--list-spacing",
	"--list-indent",
	"--list-indent-editing",
	"--indentation-guide-width",
	"--indentation-guide-reading-indent",
	"--doom-tree-indent",
	"--file-margins",
	"--header-height",
	"--h1-size",
	"--h2-size",
	"--h3-size",
	"--h4-size",
	"--h5-size",
	"--h6-size",
	"--doom-popover-width",
	"--doom-popover-height",
	"--doom-popover-font-scale",
	"--popover-width",
	"--popover-height",
	"--popover-font-size",
];

export const DEFAULT_DOOM_MONOSPACE_STACK =
	'"JetBrains Mono", "Iosevka", "Fira Code", "Source Code Pro", "Cascadia Code", ui-monospace, "SF Mono", "Menlo", "Monaco", monospace';

/** Plugin id of the Style Settings community plugin, which also exposes the theme's `@settings` block. */
export const STYLE_SETTINGS_PLUGIN_ID = "obsidian-style-settings";

/** Name of the companion theme as it appears in Obsidian's appearance settings. */
export const DOOMESQUE_THEME_NAME = "DoomEsque";

/**
 * Body classes that the theme's Style Settings block also controls. When Style Settings is
 * enabled it owns these, and this plugin neither adds nor removes them.
 */
export const STYLE_SETTINGS_SHARED_CLASSES: readonly string[] = [
	"doom-palette-one",
	"doom-palette-vibrant",
	"doom-palette-dracula",
	"doom-palette-tokyo-night",
	"doom-palette-gruvbox",
	"doom-palette-cyberpunk",
	"doom-palette-retro-terminal",
	"doom-palette-suit-and-tie",
	"doom-palette-one-light",
	"doom-palette-nord-light",
	"doom-palette-gruvbox-light",
	"doom-palette-solarized-light",
	"doom-palette-tomorrow-day",
	"doom-palette-suit-and-tie-light",
	"doom-no-org-todo",
	"doom-monochrome-headings",
	"doom-no-h1-border",
	"doom-active-block-highlight",
	"doom-sidebar-compact",
	"doom-sidebar-normal",
	"doom-sidebar-comfortable",
	"doom-indent-style-solid",
	"doom-indent-style-dashed",
	"doom-indent-style-dotted",
	"doom-indent-style-double",
	"doom-indent-style-none",
	"doom-rainbow-indent-guides",
	"doom-legal-outline",
	"doom-editorial-emphasis",
	"doom-monospace-editor",
	"doom-disable-monospace-ui",
	"doom-cursor-bar",
	"doom-cursor-block",
	"doom-cursor-glow",
	"doom-cursor-hollow",
	"doom-cursor-underline",
	"doom-sticky-hover-enabled",
	"doom-popover-properties",
	"doom-settings-flat",
];

/** CSS variables that Style Settings also controls (plus values this plugin derives from them). */
export const STYLE_SETTINGS_SHARED_CSS_VARS: readonly string[] = [
	"--file-line-width",
	"--line-height-normal",
	"--p-spacing",
	"--heading-spacing",
	"--doom-heading-spacing-scale",
	"--list-spacing",
	"--list-indent",
	"--indentation-guide-width",
	"--indentation-guide-reading-indent",
	"--doom-tree-indent",
	"--popover-width",
	"--popover-height",
	"--doom-popover-width",
	"--doom-popover-height",
];

/** Plugin settings whose controls are disabled in the settings tab while Style Settings owns them. */
export const STYLE_SETTINGS_SHARED_KEYS: readonly (keyof DoomEsqueStyleSettings)[] = [
	"darkPalette",
	"lightPalette",
	"disableOrgTodoBadges",
	"monochromeHeadings",
	"disableH1Border",
	"activeBlockHighlight",
	"flatSettingsItems",
	"fileLineWidthRem",
	"lineHeightNormal",
	"paragraphSpacingRem",
	"headingSpacingScale",
	"listSpacingEm",
	"sidebarDensity",
	"listIndentEm",
	"indentGuideStyle",
	"indentGuideWidthPx",
	"rainbowIndentGuides",
	"legalOutlineNumbering",
	"fileTreeIndentPx",
	"editorialEmphasis",
	"monospaceEditor",
	"disableMonospaceUi",
	"cursorStyle",
	"hoverPopoverWidthPx",
	"hoverPopoverHeightPx",
	"stickyHoverPreviews",
	"showPopoverProperties",
];

export interface DoomDomOptions {
	/** Leave options shared with Style Settings untouched (Style Settings is enabled). */
	deferToStyleSettings?: boolean;
}

export interface DoomEsqueStyleSettings {
	// --- Palette & Style ---
	/** Active Dark Mode Doom palette class (`doom-palette-*`). */
	darkPalette: DoomDarkPalette;
	/** Active Light Mode Doom palette class (`doom-palette-*`). */
	lightPalette: DoomLightPalette;
	/** Hide explicit `TODO` / `DONE` badges on task items (`doom-no-org-todo`). */
	disableOrgTodoBadges: boolean;
	/** Use single accent color for all headings instead of Org rainbow (`doom-monochrome-headings`). */
	monochromeHeadings: boolean;
	/** Hide bottom underline border under H1 headings (`doom-no-h1-border`). */
	disableH1Border: boolean;
	/** Optional active editor block/line highlight (`hl-line-mode`) (`doom-active-block-highlight`). Defaults to false (off). */
	activeBlockHighlight: boolean;
	/** Backward compatibility alias for activeBlockHighlight. */
	disableActiveLineHighlight?: boolean;

	// --- Typography ---
	/** Force monospace font in the note editor (`doom-monospace-editor`). */
	monospaceEditor: boolean;
	/** Use system sans-serif font for UI chrome (`doom-disable-monospace-ui`). */
	disableMonospaceUi: boolean;
	/** Use high-contrast neutral text colors for bold/italic instead of orange/magenta syntax accents (`doom-editorial-emphasis`). */
	editorialEmphasis: boolean;
	/** Optional custom monospace font family prepended to `--font-monospace-doom`. */
	customMonospaceFont: string;
	/** Scale factor for Org-mode headings (1.0 = default). */
	headingScale: number;
	/** Text cursor style in the note editor (`bar` | `block` | `glow` | `hollow` | `underline`). Default: `bar`. */
	cursorStyle: DoomCursorStyle;

	// --- Spacing & Layout ---
	/** Editor readable line width in `rem` (`--file-line-width`). Default: 46. */
	fileLineWidthRem: number;
	/** Editor normal line height (`--line-height-normal`). Default: 1.65. */
	lineHeightNormal: number;
	/** Paragraph spacing in `rem` (`--p-spacing`). Default: 1.15. */
	paragraphSpacingRem: number;
	/** Heading vertical spacing multiplier (`1.0` = default `1.85rem`). */
	headingSpacingScale: number;
	/** List item vertical spacing in `em` (`--list-spacing`). Default: 0.22. */
	listSpacingEm: number;
	/** Editor vertical page margin in `px` (top/bottom of `--file-margins`). Default: 28. */
	editorMarginVerticalPx: number;
	/** Editor horizontal page margin in `px` (left/right of `--file-margins`). Default: 36. */
	editorMarginHorizontalPx: number;
	/** Sidebar file explorer & outline item density (`compact` | `normal` | `comfortable`). */
	sidebarDensity: DoomSidebarDensity;
	/** Desktop header bar height in `px` (`--header-height`). Default: 36. */
	headerHeightPx: number;

	// --- Indentation & Guides (`highlight-indent-guides`) ---
	/** List & outline indentation width in `em` (`--list-indent`). Default: 1.75. */
	listIndentEm: number;
	/** Indentation guide line style (`solid` | `dashed` | `dotted` | `double` | `none`). Default: `solid`. */
	indentGuideStyle: DoomIndentGuideStyle;
	/** Indentation guide width in `px` (`--indentation-guide-width`). Default: 1. */
	indentGuideWidthPx: number;
	/** Color nested indentation guides with Doom rainbow level colors (`doom-rainbow-indent-guides`). */
	rainbowIndentGuides: boolean;
	/** Use formal legal / hornbook outline numbering (`I.` -> `A.` -> `1.` -> `a.` -> `i.`) for nested ordered lists (`doom-legal-outline`). */
	legalOutlineNumbering: boolean;
	/** File explorer tree indentation per folder level in `px` (`--doom-tree-indent`). Default: 14. */
	fileTreeIndentPx: number;

	// --- Hover Preview & Popovers ---
	/** Width of hover preview popovers in `px` (`--doom-popover-width`). Default: 550. */
	hoverPopoverWidthPx: number;
	/** Height of hover preview popovers in `px` (`--doom-popover-height`). Default: 420. */
	hoverPopoverHeightPx: number;
	/** Content font size scale factor inside hover preview popovers (1.0 = normal). Default: 1.0. */
	hoverPopoverFontScale: number;
	/** Whether hover preview windows remain sticky until explicitly closed. Default: false. */
	stickyHoverPreviews: boolean;
	/** Show note frontmatter YAML properties (:PROPERTIES: drawer) at the top of hover preview popovers (`doom-popover-properties`). Default: false. */
	showPopoverProperties: boolean;
	/** Whether pressing the Super (Meta/Win) key pops open the previewed link in the right sidebar. Default: true. */
	superKeyOpensRightSidebar: boolean;
	/** Use clean border-delimited flat rows instead of rounded card boxes for settings items. Default: false. */
	flatSettingsItems: boolean;
}

/** Backward-compatibility type alias */
export type DoomEmacsStyleSettings = DoomEsqueStyleSettings;

export const DEFAULT_DOOMESQUE_SETTINGS: DoomEsqueStyleSettings = {
	darkPalette: "doom-palette-one",
	lightPalette: "doom-palette-one-light",
	disableOrgTodoBadges: false,
	monochromeHeadings: false,
	disableH1Border: false,
	activeBlockHighlight: false,
	disableActiveLineHighlight: false,

	monospaceEditor: false,
	disableMonospaceUi: false,
	editorialEmphasis: false,
	customMonospaceFont: "",
	headingScale: 1.0,
	cursorStyle: "bar",

	fileLineWidthRem: 46,
	lineHeightNormal: 1.65,
	paragraphSpacingRem: 1.15,
	headingSpacingScale: 1.0,
	listSpacingEm: 0.22,
	editorMarginVerticalPx: 28,
	editorMarginHorizontalPx: 36,
	sidebarDensity: "normal",
	headerHeightPx: 36,

	listIndentEm: 1.75,
	indentGuideStyle: "solid",
	indentGuideWidthPx: 1,
	rainbowIndentGuides: false,
	legalOutlineNumbering: false,
	fileTreeIndentPx: 14,

	hoverPopoverWidthPx: 550,
	hoverPopoverHeightPx: 420,
	hoverPopoverFontScale: 1.0,
	stickyHoverPreviews: false,
	showPopoverProperties: false,
	superKeyOpensRightSidebar: true,
	flatSettingsItems: false,
};

/** Backward-compatibility constant alias */
export const DEFAULT_DOOM_SETTINGS = DEFAULT_DOOMESQUE_SETTINGS;

/**
 * Sanitizes a user-provided font family name so it cannot inject arbitrary CSS tokens (`;`, `{`, `}`, `\`).
 */
export function sanitizeFontFamily(raw: string): string {
	return raw.replace(/[;{}<>\\"`']/g, "").trim();
}

export interface ComputedDoomDomState {
	activeClasses: string[];
	/** Classes this state is allowed to add or remove. Defaults to every managed class. */
	managedClasses?: readonly string[];
	cssVariables: Record<string, string | null>;
}

function clampNumber(value: unknown, min: number, max: number, fallback: number): number {
	const num = typeof value === "number" ? value : Number(value);
	if (!Number.isFinite(num)) {
		return fallback;
	}
	return Math.min(max, Math.max(min, num));
}

function roundTo(value: number, decimals: number): number {
	const factor = 10 ** decimals;
	return Math.round(value * factor) / factor;
}

/**
 * Pure function that computes the exact `document.body` classes and inline CSS variables
 * for a given `DoomEmacsStyleSettings` object.
 */
export function computeDoomDomState(
	settings: DoomEmacsStyleSettings,
	options: DoomDomOptions = {}
): ComputedDoomDomState {
	const validPalette: DoomDarkPalette = DOOM_PALETTES.some((p) => p.id === settings.darkPalette)
		? settings.darkPalette
		: DEFAULT_DOOM_SETTINGS.darkPalette;

	const validLightPalette: DoomLightPalette = DOOM_LIGHT_PALETTES.some(
		(p) => p.id === settings.lightPalette
	)
		? settings.lightPalette
		: DEFAULT_DOOM_SETTINGS.lightPalette;

	const activeClasses: string[] = [validPalette, validLightPalette];

	if (settings.disableOrgTodoBadges) {
		activeClasses.push("doom-no-org-todo");
	}
	if (settings.monospaceEditor) {
		activeClasses.push("doom-monospace-editor");
	}
	if (settings.disableMonospaceUi) {
		activeClasses.push("doom-disable-monospace-ui");
	}
	if (settings.monochromeHeadings) {
		activeClasses.push("doom-monochrome-headings");
	}
	if (settings.disableH1Border) {
		activeClasses.push("doom-no-h1-border");
	}
	if (settings.activeBlockHighlight) {
		activeClasses.push("doom-active-block-highlight");
	}
	if (settings.disableActiveLineHighlight) {
		activeClasses.push("doom-no-active-line-highlight");
	}
	if (settings.rainbowIndentGuides) {
		activeClasses.push("doom-rainbow-indent-guides");
	}
	if (settings.legalOutlineNumbering) {
		activeClasses.push("doom-legal-outline");
	}
	if (settings.editorialEmphasis) {
		activeClasses.push("doom-editorial-emphasis");
	}
	if (settings.stickyHoverPreviews) {
		activeClasses.push("doom-sticky-hover-enabled");
	}
	if (settings.showPopoverProperties) {
		activeClasses.push("doom-popover-properties");
	}
	if (settings.flatSettingsItems) {
		activeClasses.push("doom-settings-flat");
	}

	const indentStyle: DoomIndentGuideStyle =
		settings.indentGuideStyle in INDENT_GUIDE_STYLE_CLASSES
			? settings.indentGuideStyle
			: DEFAULT_DOOM_SETTINGS.indentGuideStyle;
	activeClasses.push(INDENT_GUIDE_STYLE_CLASSES[indentStyle]);

	const density: DoomSidebarDensity =
		settings.sidebarDensity in SIDEBAR_DENSITY_CLASSES
			? settings.sidebarDensity
			: DEFAULT_DOOM_SETTINGS.sidebarDensity;
	activeClasses.push(SIDEBAR_DENSITY_CLASSES[density]);

	const cursorStyle: DoomCursorStyle =
		settings.cursorStyle in CURSOR_STYLE_CLASSES
			? settings.cursorStyle
			: DEFAULT_DOOM_SETTINGS.cursorStyle;
	activeClasses.push(CURSOR_STYLE_CLASSES[cursorStyle]);

	const sanitizedFont = sanitizeFontFamily(settings.customMonospaceFont ?? "");
	const fontVar = sanitizedFont
		? `"${sanitizedFont}", ${DEFAULT_DOOM_MONOSPACE_STACK}`
		: null;

	const clampedWidth = roundTo(
		clampNumber(settings.fileLineWidthRem, 30, 80, DEFAULT_DOOM_SETTINGS.fileLineWidthRem),
		1
	);
	const clampedLineHeight = roundTo(
		clampNumber(settings.lineHeightNormal, 1.2, 2.2, DEFAULT_DOOM_SETTINGS.lineHeightNormal),
		2
	);
	const clampedParagraphSpacing = roundTo(
		clampNumber(
			settings.paragraphSpacingRem,
			0.4,
			2.5,
			DEFAULT_DOOM_SETTINGS.paragraphSpacingRem
		),
		2
	);
	const clampedHeadingSpacingScale = roundTo(
		clampNumber(
			settings.headingSpacingScale,
			0.5,
			2.0,
			DEFAULT_DOOM_SETTINGS.headingSpacingScale
		),
		2
	);
	const clampedListSpacing = roundTo(
		clampNumber(settings.listSpacingEm, 0, 0.8, DEFAULT_DOOM_SETTINGS.listSpacingEm),
		2
	);
	const clampedMarginY = Math.round(
		clampNumber(
			settings.editorMarginVerticalPx,
			8,
			80,
			DEFAULT_DOOM_SETTINGS.editorMarginVerticalPx
		)
	);
	const clampedMarginX = Math.round(
		clampNumber(
			settings.editorMarginHorizontalPx,
			12,
			120,
			DEFAULT_DOOM_SETTINGS.editorMarginHorizontalPx
		)
	);
	const clampedHeaderHeight = Math.round(
		clampNumber(settings.headerHeightPx, 28, 48, DEFAULT_DOOM_SETTINGS.headerHeightPx)
	);
	const clampedScale = roundTo(
		clampNumber(settings.headingScale, 0.8, 1.4, DEFAULT_DOOM_SETTINGS.headingScale),
		2
	);

	const clampedListIndent = roundTo(
		clampNumber(settings.listIndentEm, 1.0, 3.5, DEFAULT_DOOM_SETTINGS.listIndentEm),
		2
	);
	const clampedIndentGuideWidth = roundTo(
		clampNumber(
			settings.indentGuideWidthPx,
			1,
			4,
			DEFAULT_DOOM_SETTINGS.indentGuideWidthPx
		),
		1
	);
	const clampedTreeIndent = Math.round(
		clampNumber(settings.fileTreeIndentPx, 6, 32, DEFAULT_DOOM_SETTINGS.fileTreeIndentPx)
	);
	const clampedPopoverWidth = Math.round(
		clampNumber(
			settings.hoverPopoverWidthPx,
			320,
			1200,
			DEFAULT_DOOM_SETTINGS.hoverPopoverWidthPx
		)
	);
	const clampedPopoverHeight = Math.round(
		clampNumber(
			settings.hoverPopoverHeightPx,
			220,
			1000,
			DEFAULT_DOOM_SETTINGS.hoverPopoverHeightPx
		)
	);
	const clampedFontScale = roundTo(
		clampNumber(
			settings.hoverPopoverFontScale,
			0.8,
			1.6,
			DEFAULT_DOOM_SETTINGS.hoverPopoverFontScale
		),
		2
	);

	const scaleHeading = (baseEm: number): string | null =>
		clampedScale === 1.0 ? null : `${(baseEm * clampedScale).toFixed(2)}em`;

	const isDefaultMargins =
		clampedMarginY === DEFAULT_DOOM_SETTINGS.editorMarginVerticalPx &&
		clampedMarginX === DEFAULT_DOOM_SETTINGS.editorMarginHorizontalPx;

	const isDefaultPopover =
		clampedPopoverWidth === DEFAULT_DOOM_SETTINGS.hoverPopoverWidthPx &&
		clampedPopoverHeight === DEFAULT_DOOM_SETTINGS.hoverPopoverHeightPx;

	const isDefaultFontScale =
		clampedFontScale === DEFAULT_DOOM_SETTINGS.hoverPopoverFontScale;

	const cssVariables: Record<string, string | null> = {
		"--font-monospace-doom": fontVar,
		"--font-monospace-theme": fontVar,
		"--file-line-width":
			clampedWidth === DEFAULT_DOOM_SETTINGS.fileLineWidthRem ? null : `${clampedWidth}rem`,
		"--line-height-normal":
			clampedLineHeight === DEFAULT_DOOM_SETTINGS.lineHeightNormal
				? null
				: String(clampedLineHeight),
		"--p-spacing":
			clampedParagraphSpacing === DEFAULT_DOOM_SETTINGS.paragraphSpacingRem
				? null
				: `${clampedParagraphSpacing}rem`,
		"--heading-spacing":
			clampedHeadingSpacingScale === DEFAULT_DOOM_SETTINGS.headingSpacingScale
				? null
				: `${roundTo(1.85 * clampedHeadingSpacingScale, 2)}rem`,
		"--doom-heading-spacing-scale":
			clampedHeadingSpacingScale === DEFAULT_DOOM_SETTINGS.headingSpacingScale
				? null
				: String(clampedHeadingSpacingScale),
		"--list-spacing":
			clampedListSpacing === DEFAULT_DOOM_SETTINGS.listSpacingEm
				? null
				: `${clampedListSpacing}em`,
		"--list-indent":
			clampedListIndent === DEFAULT_DOOM_SETTINGS.listIndentEm
				? null
				: `${clampedListIndent}em`,
		// Obsidian uses --list-indent-editing for list bullet padding-inline-start (.75em).
		// Overriding it with list indent offset breaks bullet alignment with indent guidelines.
		"--list-indent-editing": null,
		"--indentation-guide-width":
			clampedIndentGuideWidth === DEFAULT_DOOM_SETTINGS.indentGuideWidthPx
				? null
				: `${clampedIndentGuideWidth}px`,
		"--indentation-guide-reading-indent":
			clampedListIndent === DEFAULT_DOOM_SETTINGS.listIndentEm
				? null
				: `-0.85em`,
		"--doom-tree-indent":
			clampedTreeIndent === DEFAULT_DOOM_SETTINGS.fileTreeIndentPx
				? null
				: `${clampedTreeIndent}px`,
		"--file-margins": isDefaultMargins ? null : `${clampedMarginY}px ${clampedMarginX}px`,
		"--header-height":
			clampedHeaderHeight === DEFAULT_DOOM_SETTINGS.headerHeightPx
				? null
				: `${clampedHeaderHeight}px`,
		"--h1-size": scaleHeading(1.48),
		"--h2-size": scaleHeading(1.3),
		"--h3-size": scaleHeading(1.16),
		"--h4-size": scaleHeading(1.06),
		"--h5-size": scaleHeading(1.0),
		"--h6-size": scaleHeading(0.94),
		"--doom-popover-width": isDefaultPopover ? null : `${clampedPopoverWidth}px`,
		"--doom-popover-height": isDefaultPopover ? null : `${clampedPopoverHeight}px`,
		"--doom-popover-font-scale": isDefaultFontScale ? null : String(clampedFontScale),
		"--popover-width": isDefaultPopover ? null : `${clampedPopoverWidth}px`,
		"--popover-height": isDefaultPopover ? null : `${clampedPopoverHeight}px`,
		"--popover-font-size":
			isDefaultFontScale ? null : `${roundTo(16 * clampedFontScale, 1)}px`,
	};

	if (options.deferToStyleSettings) {
		const sharedClasses = new Set(STYLE_SETTINGS_SHARED_CLASSES);
		for (const varName of STYLE_SETTINGS_SHARED_CSS_VARS) {
			delete cssVariables[varName];
		}
		return {
			activeClasses: activeClasses.filter((cls) => !sharedClasses.has(cls)),
			managedClasses: getManagedClasses(options),
			cssVariables,
		};
	}

	return { activeClasses, managedClasses: ALL_MANAGED_BODY_CLASSES, cssVariables };
}

/** Body classes this plugin owns under the given options. */
export function getManagedClasses(options: DoomDomOptions = {}): readonly string[] {
	if (!options.deferToStyleSettings) {
		return ALL_MANAGED_BODY_CLASSES;
	}
	const shared = new Set(STYLE_SETTINGS_SHARED_CLASSES);
	return ALL_MANAGED_BODY_CLASSES.filter((cls) => !shared.has(cls));
}

/** CSS variables this plugin owns under the given options. */
export function getManagedCssVars(options: DoomDomOptions = {}): readonly string[] {
	if (!options.deferToStyleSettings) {
		return ALL_MANAGED_CSS_VARS;
	}
	const shared = new Set(STYLE_SETTINGS_SHARED_CSS_VARS);
	return ALL_MANAGED_CSS_VARS.filter((v) => !shared.has(v));
}

export const INDENT_GUIDE_STYLES: readonly DoomIndentGuideStyle[] = [
	"solid",
	"dashed",
	"dotted",
	"double",
	"none",
];

export function getNextDarkPalette(current: DoomDarkPalette): DoomDarkPalette {
	const idx = DOOM_PALETTES.findIndex((p) => p.id === current);
	if (idx === -1) return DOOM_PALETTES[0].id;
	return DOOM_PALETTES[(idx + 1) % DOOM_PALETTES.length].id;
}

export function getNextLightPalette(current: DoomLightPalette): DoomLightPalette {
	const idx = DOOM_LIGHT_PALETTES.findIndex((p) => p.id === current);
	if (idx === -1) return DOOM_LIGHT_PALETTES[0].id;
	return DOOM_LIGHT_PALETTES[(idx + 1) % DOOM_LIGHT_PALETTES.length].id;
}

export function getNextIndentStyle(current: DoomIndentGuideStyle): DoomIndentGuideStyle {
	const idx = INDENT_GUIDE_STYLES.indexOf(current);
	if (idx === -1) return INDENT_GUIDE_STYLES[0];
	return INDENT_GUIDE_STYLES[(idx + 1) % INDENT_GUIDE_STYLES.length];
}

/**
 * Applies computed body classes and inline CSS custom properties to a Document.
 */
export function applyDoomDomState(doc: Document, state: ComputedDoomDomState): void {
	if (!doc || !doc.body) {
		return;
	}
	const body = doc.body;
	const active = new Set(state.activeClasses);

	// Toggle only what differs so unchanged classes never trigger a style recalculation.
	for (const cls of state.managedClasses ?? ALL_MANAGED_BODY_CLASSES) {
		const want = active.has(cls);
		if (body.classList.contains(cls) !== want) {
			if (want) {
				body.classList.add(cls);
			} else {
				body.classList.remove(cls);
			}
		}
	}
	for (const cls of active) {
		if (!body.classList.contains(cls)) {
			body.classList.add(cls);
		}
	}

	for (const [varName, value] of Object.entries(state.cssVariables)) {
		const current = body.style.getPropertyValue(varName);
		if (value === null || value === undefined || value === "") {
			if (current !== "") {
				body.style.removeProperty(varName);
			}
		} else if (current !== value) {
			body.style.setProperty(varName, value);
		}
	}
}

/**
 * Reverts all managed classes and CSS custom properties on a Document back to clean theme defaults.
 */
export function clearDoomDomState(doc: Document, options: DoomDomOptions = {}): void {
	if (!doc || !doc.body) {
		return;
	}
	const body = doc.body;

	for (const cls of getManagedClasses(options)) {
		body.classList.remove(cls);
	}
	for (const varName of getManagedCssVars(options)) {
		body.style.removeProperty(varName);
	}
}


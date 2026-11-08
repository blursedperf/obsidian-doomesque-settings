export type DoomDarkPalette =
	| "doom-palette-one"
	| "doom-palette-vibrant"
	| "doom-palette-dracula"
	| "doom-palette-tokyo-night"
	| "doom-palette-gruvbox"
	| "doom-palette-cyberpunk";

export type DoomLightPalette =
	| "doom-palette-one-light"
	| "doom-palette-nord-light"
	| "doom-palette-gruvbox-light"
	| "doom-palette-solarized-light"
	| "doom-palette-tomorrow-day";

export type DoomIndentGuideStyle = "solid" | "dashed" | "dotted" | "double" | "none";

export type DoomSidebarDensity = "compact" | "normal" | "comfortable";

export type DoomCursorStyle = "bar" | "block" | "underline";

export type DoomCursorBlink = "blink" | "solid";

export type DoomCursorColor = "blue" | "teal" | "magenta" | "cyan" | "yellow" | "green";

export type DoomUiCornerRadius = "sharp" | "subtle" | "rounded";

export type DoomMathAlignment = "center" | "left";

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

export const DOOM_CURSOR_STYLES: readonly { id: DoomCursorStyle; label: string; description: string }[] = [
	{ id: "bar", label: "Thin Bar (Default)", description: "Modern 2px vertical caret line." },
	{ id: "block", label: "Full Block", description: "Authentic Emacs / Evil normal state block cursor." },
	{ id: "underline", label: "Underline", description: "Horizontal rule cursor underneath character." },
];

export const DOOM_CURSOR_BLINKS: readonly { id: DoomCursorBlink; label: string; description: string }[] = [
	{ id: "blink", label: "Animated Blink (Default)", description: "Standard smooth blinking cursor animation." },
	{ id: "solid", label: "Solid Steady (No Blink)", description: "Terminal-style solid non-blinking cursor." },
];

export const DOOM_CURSOR_COLORS: readonly { id: DoomCursorColor; label: string; hex: string }[] = [
	{ id: "blue", label: "Doom Blue (Default)", hex: "#51afef" },
	{ id: "teal", label: "Doom Teal", hex: "#4db5bd" },
	{ id: "magenta", label: "Doom Magenta", hex: "#c678dd" },
	{ id: "cyan", label: "Doom Cyan", hex: "#46d9ff" },
	{ id: "yellow", label: "Doom Yellow", hex: "#ecbe7b" },
	{ id: "green", label: "Doom Green", hex: "#98be65" },
];

export const DOOM_UI_CORNER_RADII: readonly { id: DoomUiCornerRadius; label: string; description: string }[] = [
	{ id: "sharp", label: "Sharp (0px)", description: "Hard terminal Emacs geometry with zero rounded corners." },
	{ id: "subtle", label: "Subtle (3px - Default)", description: "Crisp, refined DoomEsque subtle rounding." },
	{ id: "rounded", label: "Rounded (8px)", description: "Modern soft cards with larger rounded corners." },
];

export const DOOM_MATH_ALIGNMENTS: readonly { id: DoomMathAlignment; label: string; description: string }[] = [
	{ id: "center", label: "Centered (Default)", description: "Standard centered display math equations." },
	{ id: "left", label: "Left Aligned", description: "Org-mode LaTeX preview left-aligned with indent." },
];

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

export const ALL_MANAGED_BODY_CLASSES: readonly string[] = [
	"doom-palette-one",
	"doom-palette-vibrant",
	"doom-palette-dracula",
	"doom-palette-tokyo-night",
	"doom-palette-gruvbox",
	"doom-palette-cyberpunk",
	"doom-palette-one-light",
	"doom-palette-nord-light",
	"doom-palette-gruvbox-light",
	"doom-palette-solarized-light",
	"doom-palette-tomorrow-day",
	"doom-no-org-todo",
	"doom-monospace-editor",
	"doom-disable-monospace-ui",
	"doom-monochrome-headings",
	"doom-no-h1-border",
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
	"doom-sticky-hover-enabled",
	"doom-settings-flat",
	// Cursor & Caret Faces
	"doom-cursor-bar",
	"doom-cursor-block",
	"doom-cursor-underline",
	"doom-cursor-solid",
	"doom-cursor-color-blue",
	"doom-cursor-color-teal",
	"doom-cursor-color-magenta",
	"doom-cursor-color-cyan",
	"doom-cursor-color-yellow",
	"doom-cursor-color-green",
	// Buffer Splitting & Solaire Dimming
	"doom-dim-inactive-panes",
	"doom-active-pane-border",
	// Modeline & Status Bar
	"doom-hide-status-bar",
	"doom-no-modeline-bar",
	// Code Blocks & Syntax
	"doom-code-accent-border",
	// Tables & Data
	"doom-no-table-zebra",
	"doom-table-compact",
	// File Tree
	"doom-filetree-accent",
	"doom-filetree-bold-folders",
	// UI Geometry & Alignment
	"doom-radius-sharp",
	"doom-radius-rounded",
	"doom-math-left",
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
	"--status-bar-height",
	"--doom-modeline-height",
	"--doom-code-font-scale",
	"--doom-cursor-color",
];

export const DEFAULT_DOOM_MONOSPACE_STACK =
	'"JetBrains Mono", "Iosevka", "Fira Code", "Source Code Pro", "Cascadia Code", ui-monospace, "SF Mono", "Menlo", "Monaco", monospace';

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
	/** Disable active editor line highlight (`hl-line-mode`) (`doom-no-active-line-highlight`). */
	disableActiveLineHighlight: boolean;

	// --- Cursor & Caret Faces ---
	/** Cursor shape style (`bar` | `block` | `underline`). Default: `bar`. */
	cursorStyle: DoomCursorStyle;
	/** Cursor blinking animation (`blink` | `solid`). Default: `blink`. */
	cursorBlink: DoomCursorBlink;
	/** Accent color for the editor caret/cursor. Default: `blue`. */
	cursorColor: DoomCursorColor;

	// --- Buffer Splitting & Solaire Dimming ---
	/** Dim inactive editor splits and panes to highlight the active buffer (`doom-dim-inactive-panes`). */
	dimInactivePanes: boolean;
	/** Display an accent border outline around the focused editor leaf (`doom-active-pane-border`). */
	activePaneBorder: boolean;

	// --- Modeline & Status Bar ---
	/** Hide status bar / modeline for a clean distraction-free view (`doom-hide-status-bar`). */
	hideStatusBar: boolean;
	/** Custom height for status bar modeline in px (20-44px). Default: 26. */
	statusBarHeightPx: number;
	/** Hide the 3px accent indicator bar on the left edge of the status bar (`doom-no-modeline-bar`). */
	disableModelineBar: boolean;

	// --- Code Blocks (Org Babel) ---
	/** Display an Org-mode left accent border on code blocks (`doom-code-accent-border`). */
	codeBlockAccentBorder: boolean;
	/** Font size scale multiplier for code blocks (0.8 - 1.3). Default: 1.0. */
	codeBlockFontScale: number;

	// --- Tables & Data (Org Table) ---
	/** Disable alternating zebra striping on tables (`doom-no-table-zebra`). */
	disableTableZebra: boolean;
	/** Use compact padding for dense data tables and databases (`doom-table-compact`). */
	compactTables: boolean;

	// --- File Explorer (Treemacs) ---
	/** Show active note indicator accent bar in the file tree (`doom-filetree-accent`). */
	fileTreeAccentBar: boolean;
	/** Make folder names in file tree bold for rapid scanning (`doom-filetree-bold-folders`). */
	fileTreeFolderBold: boolean;

	// --- UI Geometry & Alignment ---
	/** UI element corner rounding geometry (`sharp` | `subtle` | `rounded`). Default: `subtle`. */
	uiCornerRadius: DoomUiCornerRadius;
	/** Alignment of display math / LaTeX blocks (`center` | `left`). Default: `center`. */
	mathBlockAlignment: DoomMathAlignment;

	// --- Typography ---
	/** Force monospace font in the note editor (`doom-monospace-editor`). */
	monospaceEditor: boolean;
	/** Use system sans-serif font for UI chrome (`doom-disable-monospace-ui`). */
	disableMonospaceUi: boolean;
	/** Optional custom monospace font family prepended to `--font-monospace-doom`. */
	customMonospaceFont: string;
	/** Scale factor for Org-mode headings (1.0 = default). */
	headingScale: number;

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
	disableActiveLineHighlight: false,

	cursorStyle: "bar",
	cursorBlink: "blink",
	cursorColor: "blue",

	dimInactivePanes: false,
	activePaneBorder: false,

	hideStatusBar: false,
	statusBarHeightPx: 26,
	disableModelineBar: false,

	codeBlockAccentBorder: false,
	codeBlockFontScale: 1.0,

	disableTableZebra: false,
	compactTables: false,

	fileTreeAccentBar: false,
	fileTreeFolderBold: false,

	uiCornerRadius: "subtle",
	mathBlockAlignment: "center",

	monospaceEditor: false,
	disableMonospaceUi: false,
	customMonospaceFont: "",
	headingScale: 1.0,

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
	fileTreeIndentPx: 14,

	hoverPopoverWidthPx: 550,
	hoverPopoverHeightPx: 420,
	hoverPopoverFontScale: 1.0,
	stickyHoverPreviews: false,
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
export function computeDoomDomState(settings: DoomEmacsStyleSettings): ComputedDoomDomState {
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
	if (settings.disableActiveLineHighlight) {
		activeClasses.push("doom-no-active-line-highlight");
	}
	if (settings.rainbowIndentGuides) {
		activeClasses.push("doom-rainbow-indent-guides");
	}
	if (settings.stickyHoverPreviews) {
		activeClasses.push("doom-sticky-hover-enabled");
	}
	if (settings.flatSettingsItems) {
		activeClasses.push("doom-settings-flat");
	}

	// Cursor & Caret Faces
	if (settings.cursorStyle === "block") {
		activeClasses.push("doom-cursor-block");
	} else if (settings.cursorStyle === "underline") {
		activeClasses.push("doom-cursor-underline");
	}

	if (settings.cursorBlink === "solid") {
		activeClasses.push("doom-cursor-solid");
	}

	if (settings.cursorColor && settings.cursorColor !== "blue") {
		activeClasses.push(`doom-cursor-color-${settings.cursorColor}`);
	}

	// Buffer Splitting & Solaire Dimming
	if (settings.dimInactivePanes) {
		activeClasses.push("doom-dim-inactive-panes");
	}
	if (settings.activePaneBorder) {
		activeClasses.push("doom-active-pane-border");
	}

	// Modeline & Status Bar
	if (settings.hideStatusBar) {
		activeClasses.push("doom-hide-status-bar");
	}
	if (settings.disableModelineBar) {
		activeClasses.push("doom-no-modeline-bar");
	}

	// Code Blocks & Syntax
	if (settings.codeBlockAccentBorder) {
		activeClasses.push("doom-code-accent-border");
	}

	// Tables & Data
	if (settings.disableTableZebra) {
		activeClasses.push("doom-no-table-zebra");
	}
	if (settings.compactTables) {
		activeClasses.push("doom-table-compact");
	}

	// File Tree
	if (settings.fileTreeAccentBar) {
		activeClasses.push("doom-filetree-accent");
	}
	if (settings.fileTreeFolderBold) {
		activeClasses.push("doom-filetree-bold-folders");
	}

	// UI Geometry & Alignment
	if (settings.uiCornerRadius === "sharp") {
		activeClasses.push("doom-radius-sharp");
	} else if (settings.uiCornerRadius === "rounded") {
		activeClasses.push("doom-radius-rounded");
	}

	if (settings.mathBlockAlignment === "left") {
		activeClasses.push("doom-math-left");
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

	const clampedStatusBarHeight = Math.round(
		clampNumber(
			settings.statusBarHeightPx,
			20,
			44,
			DEFAULT_DOOM_SETTINGS.statusBarHeightPx
		)
	);
	const clampedCodeFontScale = roundTo(
		clampNumber(
			settings.codeBlockFontScale,
			0.8,
			1.3,
			DEFAULT_DOOM_SETTINGS.codeBlockFontScale
		),
		2
	);

	const cursorColorMap: Record<DoomCursorColor, string> = {
		blue: "var(--doom-blue, #51afef)",
		teal: "var(--doom-teal, #4db5bd)",
		magenta: "var(--doom-magenta, #c678dd)",
		cyan: "var(--doom-cyan, #46d9ff)",
		yellow: "var(--doom-yellow, #ecbe7b)",
		green: "var(--doom-green, #98be65)",
	};

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
		"--status-bar-height":
			clampedStatusBarHeight === DEFAULT_DOOM_SETTINGS.statusBarHeightPx
				? null
				: `${clampedStatusBarHeight}px`,
		"--doom-modeline-height":
			clampedStatusBarHeight === DEFAULT_DOOM_SETTINGS.statusBarHeightPx
				? null
				: `${clampedStatusBarHeight}px`,
		"--doom-code-font-scale":
			clampedCodeFontScale === DEFAULT_DOOM_SETTINGS.codeBlockFontScale
				? null
				: String(clampedCodeFontScale),
		"--doom-cursor-color":
			settings.cursorColor && settings.cursorColor !== "blue"
				? cursorColorMap[settings.cursorColor]
				: null,
	};

	return { activeClasses, cssVariables };
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

export function getNextCursorStyle(current: DoomCursorStyle): DoomCursorStyle {
	const styles: DoomCursorStyle[] = ["bar", "block", "underline"];
	const idx = styles.indexOf(current);
	return styles[(idx + 1) % styles.length];
}

export function getNextUiCornerRadius(current: DoomUiCornerRadius): DoomUiCornerRadius {
	const radii: DoomUiCornerRadius[] = ["subtle", "sharp", "rounded"];
	const idx = radii.indexOf(current);
	return radii[(idx + 1) % radii.length];
}

/**
 * Applies computed body classes and inline CSS custom properties to a Document.
 */
export function applyDoomDomState(doc: Document, state: ComputedDoomDomState): void {
	if (!doc || !doc.body) {
		return;
	}
	const body = doc.body;

	for (const cls of ALL_MANAGED_BODY_CLASSES) {
		body.classList.remove(cls);
	}
	for (const cls of state.activeClasses) {
		body.classList.add(cls);
	}

	for (const [varName, value] of Object.entries(state.cssVariables)) {
		if (value === null || value === undefined || value === "") {
			body.style.removeProperty(varName);
		} else {
			body.style.setProperty(varName, value);
		}
	}
}

/**
 * Reverts all managed classes and CSS custom properties on a Document back to clean theme defaults.
 */
export function clearDoomDomState(doc: Document): void {
	if (!doc || !doc.body) {
		return;
	}
	const body = doc.body;

	for (const cls of ALL_MANAGED_BODY_CLASSES) {
		body.classList.remove(cls);
	}
	for (const varName of ALL_MANAGED_CSS_VARS) {
		body.style.removeProperty(varName);
	}
}


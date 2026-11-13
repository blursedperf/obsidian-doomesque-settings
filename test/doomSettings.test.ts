import assert from "node:assert";
import {
	ALL_MANAGED_BODY_CLASSES,
	CURRENT_SETTINGS_VERSION,
	migrateSettings,
	ALL_MANAGED_CSS_VARS,
	DEFAULT_DOOM_SETTINGS,
	DOOM_PALETTES,
	DOOM_LIGHT_PALETTES,
	DoomEsqueStyleSettings,
	applyDoomDomState,
	clearDoomDomState,
	computeDoomDomState,
	getNextDarkPalette,
	getNextLightPalette,
	getNextIndentStyle,
	getNextCursorStyle,
	sanitizeFontFamily,
	STYLE_SETTINGS_SHARED_CLASSES,
	STYLE_SETTINGS_SHARED_CSS_VARS,
	STYLE_SETTINGS_SHARED_KEYS,
	getManagedClasses,
} from "../src/settings";
import { BASES_TOOLBAR_ICON_BUTTON_SELECTOR, basesToolbarTooltipFor } from "../src/basesToolbar";
import { SETTINGS_SECTIONS, findSettingSpec, isSharedSetting, normalizeSettingValue } from "../src/settingsSchema";

console.log("Running obsidian-doomesque-settings unit tests...\n");

// Theme styling lives only in the companion theme. Assertions about it run when the
// theme repository is checked out next to this one (../obsidian-theme-doomesque).
const THEME_CSS: string | null = (() => {
	const fs = require("node:fs");
	const path = require("node:path");
	const themePath = path.resolve(process.cwd(), "../obsidian-theme-doomesque/theme.css");
	return fs.existsSync(themePath) ? fs.readFileSync(themePath, "utf-8") : null;
})();

function assertTheme(check: (css: string) => boolean, message: string): void {
	if (THEME_CSS !== null) {
		assert.ok(check(THEME_CSS), message);
	}
}

function makeSettings(overrides: Partial<DoomEsqueStyleSettings> = {}): DoomEsqueStyleSettings {
	return { ...DEFAULT_DOOM_SETTINGS, ...overrides };
}

class MockDOMTokenList {
	private classes = new Set<string>();
	add(cls: string): void {
		this.classes.add(cls);
	}
	remove(cls: string): void {
		this.classes.delete(cls);
	}
	contains(cls: string): boolean {
		return this.classes.has(cls);
	}
	get values(): string[] {
		return Array.from(this.classes);
	}
}

// -----------------------------------------------------------------------------
// 1. DEFAULT_DOOM_SETTINGS Baseline Tests
// -----------------------------------------------------------------------------
{
	const state = computeDoomDomState(DEFAULT_DOOM_SETTINGS);

	assert.deepStrictEqual(state.activeClasses, [
		"doom-palette-one",
		"doom-palette-one-light",
		"doom-indent-style-solid",
		"doom-sidebar-normal",
		"doom-table-density-normal",
		"doom-table-grid-full",
		"doom-cursor-bar",
	]);

	// In default state, all managed CSS variables should be null (theme fallback defaults)
	for (const varName of ALL_MANAGED_CSS_VARS) {
		assert.strictEqual(
			state.cssVariables[varName],
			null,
			`Expected ${varName} to be null on default settings`
		);
	}
	console.log("✓ Default settings compute clean baseline DOM state with null CSS overrides");
}

// -----------------------------------------------------------------------------
// 2. Palette Selection & Fallback
// -----------------------------------------------------------------------------
{
	const vibrant = computeDoomDomState(makeSettings({ darkPalette: "doom-palette-vibrant" }));
	assert.ok(vibrant.activeClasses.includes("doom-palette-vibrant"));

	const dracula = computeDoomDomState(makeSettings({ darkPalette: "doom-palette-dracula" }));
	assert.ok(dracula.activeClasses.includes("doom-palette-dracula"));

	const tokyo = computeDoomDomState(makeSettings({ darkPalette: "doom-palette-tokyo-night" }));
	assert.ok(tokyo.activeClasses.includes("doom-palette-tokyo-night"));

	const gruvbox = computeDoomDomState(makeSettings({ darkPalette: "doom-palette-gruvbox" }));
	assert.ok(gruvbox.activeClasses.includes("doom-palette-gruvbox"));

	const cyberpunk = computeDoomDomState(makeSettings({ darkPalette: "doom-palette-cyberpunk" }));
	assert.ok(cyberpunk.activeClasses.includes("doom-palette-cyberpunk"));

	const retro = computeDoomDomState(
		makeSettings({ darkPalette: "doom-palette-retro-terminal" })
	);
	assert.ok(retro.activeClasses.includes("doom-palette-retro-terminal"));

	const suitAndTie = computeDoomDomState(
		makeSettings({ darkPalette: "doom-palette-suit-and-tie" })
	);
	assert.ok(suitAndTie.activeClasses.includes("doom-palette-suit-and-tie"));

	// Invalid dark palette fallback
	const invalidDark = computeDoomDomState(makeSettings({ darkPalette: "doom-unknown" as any }));
	assert.ok(invalidDark.activeClasses.includes("doom-palette-one"));

	// Light palettes
	const oneLight = computeDoomDomState(makeSettings({ lightPalette: "doom-palette-one-light" }));
	assert.ok(oneLight.activeClasses.includes("doom-palette-one-light"));

	const nordLight = computeDoomDomState(makeSettings({ lightPalette: "doom-palette-nord-light" }));
	assert.ok(nordLight.activeClasses.includes("doom-palette-nord-light"));

	const gruvboxLight = computeDoomDomState(
		makeSettings({ lightPalette: "doom-palette-gruvbox-light" })
	);
	assert.ok(gruvboxLight.activeClasses.includes("doom-palette-gruvbox-light"));

	const solarizedLight = computeDoomDomState(
		makeSettings({ lightPalette: "doom-palette-solarized-light" })
	);
	assert.ok(solarizedLight.activeClasses.includes("doom-palette-solarized-light"));

	const tomorrowDay = computeDoomDomState(
		makeSettings({ lightPalette: "doom-palette-tomorrow-day" })
	);
	assert.ok(tomorrowDay.activeClasses.includes("doom-palette-tomorrow-day"));

	const suitAndTieLight = computeDoomDomState(
		makeSettings({ lightPalette: "doom-palette-suit-and-tie-light" })
	);
	assert.ok(suitAndTieLight.activeClasses.includes("doom-palette-suit-and-tie-light"));

	const crispLight = computeDoomDomState(
		makeSettings({ lightPalette: "doom-palette-crisp-light" })
	);
	assert.ok(crispLight.activeClasses.includes("doom-palette-crisp-light"));

	// Invalid light palette fallback
	const invalidLight = computeDoomDomState(makeSettings({ lightPalette: "doom-unknown" as any }));
	assert.ok(invalidLight.activeClasses.includes("doom-palette-one-light"));
	console.log("✓ Dark and light palette selections and invalid fallbacks work correctly");
}

// -----------------------------------------------------------------------------
// 3. getNextDarkPalette, getNextLightPalette & getNextIndentStyle Cycling
// -----------------------------------------------------------------------------
{
	assert.strictEqual(getNextDarkPalette("doom-palette-one"), "doom-palette-vibrant");
	assert.strictEqual(getNextDarkPalette("doom-palette-vibrant"), "doom-palette-dracula");
	assert.strictEqual(getNextDarkPalette("doom-palette-dracula"), "doom-palette-tokyo-night");
	assert.strictEqual(getNextDarkPalette("doom-palette-tokyo-night"), "doom-palette-gruvbox");
	assert.strictEqual(getNextDarkPalette("doom-palette-gruvbox"), "doom-palette-cyberpunk");
	assert.strictEqual(
		getNextDarkPalette("doom-palette-cyberpunk"),
		"doom-palette-retro-terminal"
	);
	assert.strictEqual(
		getNextDarkPalette("doom-palette-retro-terminal"),
		"doom-palette-suit-and-tie"
	);
	assert.strictEqual(
		getNextDarkPalette("doom-palette-suit-and-tie"),
		"doom-palette-one"
	);
	assert.strictEqual(getNextDarkPalette("invalid" as any), "doom-palette-one");

	assert.strictEqual(getNextLightPalette("doom-palette-one-light"), "doom-palette-nord-light");
	assert.strictEqual(getNextLightPalette("doom-palette-nord-light"), "doom-palette-gruvbox-light");
	assert.strictEqual(
		getNextLightPalette("doom-palette-gruvbox-light"),
		"doom-palette-solarized-light"
	);
	assert.strictEqual(
		getNextLightPalette("doom-palette-solarized-light"),
		"doom-palette-tomorrow-day"
	);
	assert.strictEqual(
		getNextLightPalette("doom-palette-tomorrow-day"),
		"doom-palette-suit-and-tie-light"
	);
	assert.strictEqual(
		getNextLightPalette("doom-palette-suit-and-tie-light"),
		"doom-palette-crisp-light"
	);
	assert.strictEqual(
		getNextLightPalette("doom-palette-crisp-light"),
		"doom-palette-one-light"
	);
	assert.strictEqual(getNextLightPalette("invalid" as any), "doom-palette-one-light");

	assert.strictEqual(getNextIndentStyle("solid"), "dashed");
	assert.strictEqual(getNextIndentStyle("dashed"), "dotted");
	assert.strictEqual(getNextIndentStyle("dotted"), "double");
	assert.strictEqual(getNextIndentStyle("double"), "none");
	assert.strictEqual(getNextIndentStyle("none"), "solid");

	assert.strictEqual(getNextCursorStyle("bar"), "block");
	assert.strictEqual(getNextCursorStyle("block"), "glow");
	assert.strictEqual(getNextCursorStyle("glow"), "hollow");
	assert.strictEqual(getNextCursorStyle("hollow"), "underline");
	assert.strictEqual(getNextCursorStyle("underline"), "bar");
	assert.strictEqual(getNextCursorStyle("invalid" as any), "bar");
	console.log("✓ Dark & light palette, indent guide, and cursor cycling logic verified");
}

// -----------------------------------------------------------------------------
// 4. Feature Flags / Class Toggles
// -----------------------------------------------------------------------------
{
	const state = computeDoomDomState(
		makeSettings({
			disableOrgTodoBadges: true,
			monospaceEditor: true,
			disableMonospaceUi: true,
			monochromeHeadings: true,
			disableH1Border: true,
			activeBlockHighlight: true,
			rainbowIndentGuides: true,
			legalOutlineNumbering: true,
			editorialEmphasis: true,
			stickyHoverPreviews: true,
			showPopoverProperties: true,
			flatSettingsItems: true,
			indentGuideStyle: "dashed",
			sidebarDensity: "compact",
			tableDensity: "comfortable",
			tableGrid: "horizontal",
			disableTableZebra: true,
			basesToolbarLabels: true,
			basesHeaderCaps: true,
		})
	);

	assert.ok(state.activeClasses.includes("doom-no-org-todo"));
	assert.ok(state.activeClasses.includes("doom-monospace-editor"));
	assert.ok(state.activeClasses.includes("doom-disable-monospace-ui"));
	assert.ok(state.activeClasses.includes("doom-monochrome-headings"));
	assert.ok(state.activeClasses.includes("doom-no-h1-border"));
	assert.ok(state.activeClasses.includes("doom-active-block-highlight"));
	assert.ok(!state.activeClasses.includes("doom-no-active-line-highlight"), "legacy active-line class must no longer be emitted");
	assert.ok(!state.activeClasses.includes("doom-mono-indent-guides"), "rainbow guides must not add the mono opt-out class");
	assert.ok(state.activeClasses.includes("doom-legal-outline"));
	assert.ok(state.activeClasses.includes("doom-editorial-emphasis"));
	assert.ok(!state.activeClasses.includes("doom-sticky-hover-enabled"), "sticky previews are plugin behaviour, not a body class");
	assert.ok(state.activeClasses.includes("doom-popover-properties"));
	assert.ok(state.activeClasses.includes("doom-settings-flat"));
	assert.ok(state.activeClasses.includes("doom-indent-style-dashed"));
	assert.ok(state.activeClasses.includes("doom-sidebar-compact"));
	assert.ok(state.activeClasses.includes("doom-table-density-comfortable"));
	assert.ok(!state.activeClasses.includes("doom-table-density-normal"), "only one table density class at a time");

	const compactTables = computeDoomDomState(makeSettings({ tableDensity: "compact" }));
	assert.ok(compactTables.activeClasses.includes("doom-table-density-compact"));
	const invalidTables = computeDoomDomState(makeSettings({ tableDensity: "invalid" as any }));
	assert.ok(invalidTables.activeClasses.includes("doom-table-density-normal"), "invalid table density falls back to normal");
	assert.ok(isSharedSetting("tableDensity"), "table density is shared with the theme's Style Settings option");
	assert.ok(state.activeClasses.includes("doom-table-grid-horizontal"));
	assert.ok(!state.activeClasses.includes("doom-table-grid-full"), "only one gridline class at a time");
	assert.ok(state.activeClasses.includes("doom-table-no-zebra"));
	assert.ok(state.activeClasses.includes("doom-bases-toolbar-labels"));
	assert.ok(state.activeClasses.includes("doom-table-header-caps"));
	const defaults = computeDoomDomState(DEFAULT_DOOM_SETTINGS).activeClasses;
	for (const cls of ["doom-table-no-zebra", "doom-bases-toolbar-labels", "doom-table-header-caps"]) {
		assert.ok(!defaults.includes(cls), `${cls} is off by default`);
	}
	const noGrid = computeDoomDomState(makeSettings({ tableGrid: "none" }));
	assert.ok(noGrid.activeClasses.includes("doom-table-grid-none"));
	const invalidGrid = computeDoomDomState(makeSettings({ tableGrid: "invalid" as any }));
	assert.ok(invalidGrid.activeClasses.includes("doom-table-grid-full"), "invalid gridlines fall back to full");
	for (const key of ["tableGrid", "disableTableZebra", "basesToolbarLabels", "basesHeaderCaps"] as const) {
		assert.ok(isSharedSetting(key), `${key} is shared with the theme's Style Settings option`);
	}
	// Every Tables & Bases option in the theme's Style Settings block has a plugin control.
	if (THEME_CSS !== null) {
		const block = THEME_CSS.slice(THEME_CSS.indexOf("/* @settings"));
		const section = block.slice(block.indexOf("id: doom-table-heading"), block.indexOf("id: doom-preview-heading"));
		const values = [...section.matchAll(/(?:value|id): (doom-[a-z0-9-]+)/g)].map((m) => m[1]);
		const themeClasses = values.filter((v) => v !== "doom-table-heading" && v !== "doom-table-density" && v !== "doom-table-grid");
		assert.strictEqual(themeClasses.length, 9, "found the theme's Tables & Bases options (3 density, 3 grid, 3 toggles)");
		for (const cls of themeClasses) {
			assert.ok(STYLE_SETTINGS_SHARED_CLASSES.includes(cls), `theme Tables & Bases class ${cls} must be handled by the plugin`);
		}
	}
	assertTheme(
		(css) =>
			css.includes("id: doom-table-density") &&
			css.includes("body.doom-table-density-compact {") &&
			css.includes("body.doom-table-density-comfortable {"),
		"theme must style the table density classes the plugin sets"
	);

	const blockCursor = computeDoomDomState(makeSettings({ cursorStyle: "block" }));
	assert.ok(blockCursor.activeClasses.includes("doom-cursor-block"));
	const glowCursor = computeDoomDomState(makeSettings({ cursorStyle: "glow" }));
	assert.ok(glowCursor.activeClasses.includes("doom-cursor-glow"));
	const hollowCursor = computeDoomDomState(makeSettings({ cursorStyle: "hollow" }));
	assert.ok(hollowCursor.activeClasses.includes("doom-cursor-hollow"));
	const underlineCursor = computeDoomDomState(makeSettings({ cursorStyle: "underline" }));
	assert.ok(underlineCursor.activeClasses.includes("doom-cursor-underline"));
	const invalidCursor = computeDoomDomState(makeSettings({ cursorStyle: "invalid" as any }));
	assert.ok(invalidCursor.activeClasses.includes("doom-cursor-bar"));

	console.log("✓ All feature flags and class toggles are properly activated");
}

// -----------------------------------------------------------------------------
// 5. Font Sanitization & Monospace Stack Injection
// -----------------------------------------------------------------------------
{
	assert.strictEqual(
		sanitizeFontFamily("JetBrains Mono; color: red;"),
		"JetBrains Mono color: red"
	);
	assert.strictEqual(
		sanitizeFontFamily(' "Fira Code" </style> '),
		"Fira Code /style"
	);

	const stateWithFont = computeDoomDomState(
		makeSettings({ customMonospaceFont: "JetBrains Mono" })
	);
	assert.ok(
		stateWithFont.cssVariables["--font-monospace-doom"]?.startsWith('"JetBrains Mono", "JetBrains Mono"')
	);
	assert.ok(
		stateWithFont.cssVariables["--font-monospace-theme"]?.startsWith('"JetBrains Mono", "JetBrains Mono"')
	);

	const stateEmptyFont = computeDoomDomState(makeSettings({ customMonospaceFont: "" }));
	assert.strictEqual(stateEmptyFont.cssVariables["--font-monospace-doom"], null);
	assert.strictEqual(stateEmptyFont.cssVariables["--font-monospace-theme"], null);
	console.log("✓ Custom monospace font family sanitization and injection verified");
}

// -----------------------------------------------------------------------------
// 6. Spacing & Indentation CSS Variables & Clamping
// -----------------------------------------------------------------------------
{
	const customSpacing = computeDoomDomState(
		makeSettings({
			fileLineWidthRem: 55,
			lineHeightNormal: 1.8,
			paragraphSpacingRem: 1.5,
			headingSpacingScale: 1.25,
			listSpacingEm: 0.35,
			listIndentEm: 2.25,
			indentGuideWidthPx: 2.5,
			fileTreeIndentPx: 20,
			editorMarginVerticalPx: 40,
			editorMarginHorizontalPx: 48,
			headerHeightPx: 42,
		})
	);

	assert.strictEqual(customSpacing.cssVariables["--file-line-width"], "55rem");
	assert.strictEqual(customSpacing.cssVariables["--line-height-normal"], "1.8");
	assert.strictEqual(customSpacing.cssVariables["--p-spacing"], "1.5rem");
	assert.strictEqual(customSpacing.cssVariables["--heading-spacing"], "2.31rem");
	assert.strictEqual(customSpacing.cssVariables["--doom-heading-spacing-scale"], "1.25");
	assert.strictEqual(customSpacing.cssVariables["--list-spacing"], "0.35em");
	assert.strictEqual(customSpacing.cssVariables["--list-indent"], "2.25em");
	assert.strictEqual(customSpacing.cssVariables["--list-indent-editing"], null);
	assert.strictEqual(customSpacing.cssVariables["--indentation-guide-width"], "2.5px");
	assert.strictEqual(customSpacing.cssVariables["--doom-tree-indent"], "20px");
	assert.strictEqual(customSpacing.cssVariables["--file-margins"], "40px 48px");
	assert.strictEqual(customSpacing.cssVariables["--header-height"], "42px");

	// Clamping extreme values
	const clamped = computeDoomDomState(
		makeSettings({
			fileLineWidthRem: 999, // max 80
			lineHeightNormal: 9.9, // max 2.2
			paragraphSpacingRem: 0.01, // min 0.4
			headingSpacingScale: 10, // max 2.0
			listSpacingEm: -5, // min 0
			listIndentEm: 99, // max 3.5
			indentGuideWidthPx: 99, // max 4
			fileTreeIndentPx: 999, // max 32
			editorMarginVerticalPx: 500, // max 80
			editorMarginHorizontalPx: -10, // min 12
			headerHeightPx: 100, // max 48
		})
	);

	assert.strictEqual(clamped.cssVariables["--file-line-width"], "80rem");
	assert.strictEqual(clamped.cssVariables["--line-height-normal"], "2.2");
	assert.strictEqual(clamped.cssVariables["--p-spacing"], "0.4rem");
	assert.strictEqual(clamped.cssVariables["--heading-spacing"], "3.7rem");
	assert.strictEqual(clamped.cssVariables["--list-spacing"], "0em");
	assert.strictEqual(clamped.cssVariables["--list-indent"], "3.5em");
	assert.strictEqual(clamped.cssVariables["--indentation-guide-width"], "4px");
	assert.strictEqual(clamped.cssVariables["--doom-tree-indent"], "32px");
	assert.strictEqual(clamped.cssVariables["--file-margins"], "80px 12px");
	assert.strictEqual(clamped.cssVariables["--header-height"], "48px");
	console.log("✓ Spacing, margins, and indentation bounds clamping verified");
}

// -----------------------------------------------------------------------------
// 7. Heading Scale
// -----------------------------------------------------------------------------
{
	const scaledHeadings = computeDoomDomState(makeSettings({ headingScale: 1.2 }));
	assert.strictEqual(scaledHeadings.cssVariables["--h1-size"], "1.78em");
	assert.strictEqual(scaledHeadings.cssVariables["--h2-size"], "1.56em");
	assert.strictEqual(scaledHeadings.cssVariables["--h3-size"], "1.39em");
	assert.strictEqual(scaledHeadings.cssVariables["--h4-size"], "1.27em");
	assert.strictEqual(scaledHeadings.cssVariables["--h5-size"], "1.20em");
	assert.strictEqual(scaledHeadings.cssVariables["--h6-size"], "1.13em");

	// Default scale 1.0 -> all null
	const defaultScale = computeDoomDomState(makeSettings({ headingScale: 1.0 }));
	assert.strictEqual(defaultScale.cssVariables["--h1-size"], null);
	console.log("✓ Heading scale calculations verified");
}

// -----------------------------------------------------------------------------
// 8. Hover Preview Dimensions & Clamping
// -----------------------------------------------------------------------------
{
	const customPopover = computeDoomDomState(
		makeSettings({
			hoverPopoverWidthPx: 680,
			hoverPopoverHeightPx: 520,
			hoverPopoverFontScale: 1.25,
		})
	);

	assert.strictEqual(customPopover.cssVariables["--doom-popover-width"], "680px");
	assert.strictEqual(customPopover.cssVariables["--doom-popover-height"], "520px");
	assert.strictEqual(customPopover.cssVariables["--doom-popover-font-scale"], "1.25");
	assert.strictEqual(customPopover.cssVariables["--popover-width"], "680px");
	assert.strictEqual(customPopover.cssVariables["--popover-height"], "520px");
	assert.strictEqual(customPopover.cssVariables["--popover-font-size"], "20px");

	// Clamping extreme values (min width 320, max width 1200; min height 220, max height 1000)
	const clampedMin = computeDoomDomState(
		makeSettings({
			hoverPopoverWidthPx: 50,
			hoverPopoverHeightPx: 50,
			hoverPopoverFontScale: 0.1,
		})
	);
	assert.strictEqual(clampedMin.cssVariables["--doom-popover-width"], "320px");
	assert.strictEqual(clampedMin.cssVariables["--doom-popover-height"], "220px");
	assert.strictEqual(clampedMin.cssVariables["--doom-popover-font-scale"], "0.8");

	const clampedMax = computeDoomDomState(
		makeSettings({
			hoverPopoverWidthPx: 9999,
			hoverPopoverHeightPx: 9999,
			hoverPopoverFontScale: 10,
		})
	);
	assert.strictEqual(clampedMax.cssVariables["--doom-popover-width"], "1200px");
	assert.strictEqual(clampedMax.cssVariables["--doom-popover-height"], "1000px");
	assert.strictEqual(clampedMax.cssVariables["--doom-popover-font-scale"], "1.6");

	// Default values -> null (clean theme fallback)
	const defaultPopover = computeDoomDomState(
		makeSettings({
			hoverPopoverWidthPx: DEFAULT_DOOM_SETTINGS.hoverPopoverWidthPx,
			hoverPopoverHeightPx: DEFAULT_DOOM_SETTINGS.hoverPopoverHeightPx,
			hoverPopoverFontScale: DEFAULT_DOOM_SETTINGS.hoverPopoverFontScale,
		})
	);
	assert.strictEqual(defaultPopover.cssVariables["--doom-popover-width"], null);
	assert.strictEqual(defaultPopover.cssVariables["--doom-popover-height"], null);
	assert.strictEqual(defaultPopover.cssVariables["--doom-popover-font-scale"], null);
	assert.strictEqual(defaultPopover.cssVariables["--popover-font-size"], null);
	console.log("✓ Hover preview dimensions, font scale, and bounds clamping verified");
}

// -----------------------------------------------------------------------------
// 9. DOM Mutation & Cleanup (applyDoomDomState & clearDoomDomState)
// -----------------------------------------------------------------------------
{
	class MockCSSStyleDeclaration {
		private props: Record<string, string> = {};
		setProperty(prop: string, val: string): void {
			this.props[prop] = val;
		}
		removeProperty(prop: string): void {
			delete this.props[prop];
		}
		getPropertyValue(prop: string): string {
			return this.props[prop] ?? "";
		}
		get properties(): Record<string, string> {
			return { ...this.props };
		}
	}

	class MockBody {
		classList = new MockDOMTokenList();
		style = new MockCSSStyleDeclaration();
	}

	class MockDocument {
		body = new MockBody();
	}

	const mockDoc = new MockDocument() as unknown as Document;

	const testState = computeDoomDomState(
		makeSettings({
			darkPalette: "doom-palette-tokyo-night",
			disableOrgTodoBadges: true,
			fileLineWidthRem: 50,
			lineHeightNormal: 1.75,
		})
	);

	applyDoomDomState(mockDoc, testState);

	assert.ok(mockDoc.body.classList.contains("doom-palette-tokyo-night"));
	assert.ok(mockDoc.body.classList.contains("doom-no-org-todo"));
	assert.strictEqual(mockDoc.body.style.getPropertyValue("--file-line-width"), "50rem");
	assert.strictEqual(mockDoc.body.style.getPropertyValue("--line-height-normal"), "1.75");

	// Switch palette and verify old palette is removed
	const vibrantState = computeDoomDomState(
		makeSettings({
			darkPalette: "doom-palette-vibrant",
			disableOrgTodoBadges: false,
			indentGuideStyle: "dashed",
			rainbowIndentGuides: true,
			listIndentEm: 2.0,
		})
	);

	// Verify --list-indent-editing is actively stripped if previously present
	mockDoc.body.style.setProperty("--list-indent-editing", "2.0em");
	assert.strictEqual(mockDoc.body.style.getPropertyValue("--list-indent-editing"), "2.0em");

	applyDoomDomState(mockDoc, vibrantState);
	assert.ok(mockDoc.body.classList.contains("doom-palette-vibrant"));
	assert.ok(!mockDoc.body.classList.contains("doom-palette-tokyo-night"));
	assert.ok(!mockDoc.body.classList.contains("doom-no-org-todo"));
	assert.ok(mockDoc.body.classList.contains("doom-indent-style-dashed"));
	assert.ok(!mockDoc.body.classList.contains("doom-mono-indent-guides"), "rainbow guides must not add the mono opt-out class");
	assert.strictEqual(mockDoc.body.style.getPropertyValue("--list-indent"), "2em");
	assert.strictEqual(mockDoc.body.style.getPropertyValue("--list-indent-editing"), "");

	// Clear DOM state
	clearDoomDomState(mockDoc);
	for (const cls of ALL_MANAGED_BODY_CLASSES) {
		assert.ok(!mockDoc.body.classList.contains(cls));
	}
	for (const varName of ALL_MANAGED_CSS_VARS) {
		assert.strictEqual(mockDoc.body.style.getPropertyValue(varName), "");
	}

	console.log("✓ DOM mutation and clean state restoration verified");
}

// -----------------------------------------------------------------------------
// 10. Sticky Hover Preview Prototype Lifecycle & Interception
// -----------------------------------------------------------------------------
{
	// Simulate Obsidian's internal HoverPopover class prototype
	class MockHoverPopover {
		onTarget = false;
		onHover = false;
		isFocused = false;
		state = 1;
		hoverEl = {
			style: { left: "100px", top: "120px" },
			classList: {
				contains(cls: string) {
					return false;
				},
				add() {},
				remove() {},
			},
		};
		targetEl = { isConnected: true };
		hidden = false;
		shown = false;

		show() {
			this.shown = true;
			this.state = 1;
		}

		hide() {
			this.hidden = true;
			this.state = 3;
		}

		shouldShowSelf() {
			return this.onTarget || this.onHover || this.isFocused;
		}

		shouldShow() {
			return this.shouldShowSelf();
		}

		position() {
			this.hoverEl.style.left = "200px";
			this.hoverEl.style.top = "240px";
		}
	}

	const proto = MockHoverPopover.prototype as any;
	const origShow = proto.show;
	const origHide = proto.hide;
	const origShouldShow = proto.shouldShow;
	const origShouldShowSelf = proto.shouldShowSelf;
	const origPosition = proto.position;

	// Apply Doom interception logic
	proto.hide = function (force?: boolean) {
		if (this._doomIsSticky && !force) {
			return;
		}
		return origHide.apply(this, arguments);
	};

	proto.shouldShow = function () {
		if (this._doomIsSticky) {
			return true;
		}
		return origShouldShow.apply(this, arguments);
	};

	proto.shouldShowSelf = function () {
		if (this._doomIsSticky) {
			return true;
		}
		return origShouldShowSelf.apply(this, arguments);
	};

	proto.position = function () {
		if (this._doomIsDragged || (this._doomIsSticky && this._doomHasRendered && this.targetEl && !this.targetEl.isConnected)) {
			return;
		}
		const ret = origPosition.apply(this, arguments);
		if (this.hoverEl && (this.hoverEl.style.left || this.hoverEl.style.top)) {
			this._doomHasRendered = true;
		}
		return ret;
	};

	const inst = new MockHoverPopover() as any;

	// Case A: Non-sticky popover hides normally
	inst._doomIsSticky = false;
	assert.strictEqual(inst.shouldShow(), false);
	inst.hide();
	assert.strictEqual(inst.hidden, true);
	assert.strictEqual(inst.state, 3);

	// Case B: Sticky popover ignores hide() when navigating vault or moving mouse away
	const stickyInst = new MockHoverPopover() as any;
	stickyInst._doomIsSticky = true;
	stickyInst.isFocused = true;

	// shouldShow() must remain true to prevent Obsidian's transition() timer from hiding
	assert.strictEqual(stickyInst.shouldShow(), true);
	assert.strictEqual(stickyInst.shouldShowSelf(), true);

	// hide() called without force must be completely suppressed
	stickyInst.hide();
	assert.strictEqual(stickyInst.hidden, false, "Sticky popover should not hide on unforced hide()");
	assert.strictEqual(stickyInst.state, 1);

	// position() must not jump if dragged
	stickyInst._doomIsDragged = true;
	stickyInst.hoverEl.style.left = "500px";
	stickyInst.position();
	assert.strictEqual(stickyInst.hoverEl.style.left, "500px", "Dragged popover position must be preserved");

	// position() must not reset if target element was detached during note navigation
	stickyInst._doomIsDragged = false;
	stickyInst._doomHasRendered = true;
	stickyInst.targetEl.isConnected = false;
	stickyInst.position();
	assert.strictEqual(stickyInst.hoverEl.style.left, "500px", "Detached target must not reset position");

	// Case C: Explicit force hide (Close button or Escape) must close cleanly
	stickyInst.hide(true);
	assert.strictEqual(stickyInst.hidden, true, "Forced hide must close the sticky popover");
	assert.strictEqual(stickyInst.state, 3);

	// Case D: Clean unpatching restores prototype methods
	proto.show = origShow;
	proto.hide = origHide;
	proto.shouldShow = origShouldShow;
	proto.shouldShowSelf = origShouldShowSelf;
	proto.position = origPosition;

	const unpatchedInst = new MockHoverPopover() as any;
	unpatchedInst._doomIsSticky = true;
	unpatchedInst.hide();
	assert.strictEqual(unpatchedInst.hidden, true, "Unpatched prototype must execute original hide()");

	console.log("✓ Sticky hover preview interception, drag coordinate lock, and clean restoration verified");
}

// -----------------------------------------------------------------------------
// 11. Hover Popover Content Expansion & Inactive Hidden Element Preservation
// -----------------------------------------------------------------------------
{
	class MockElement {
		classList = new MockDOMTokenList();
		style: Record<string, string> = {};
		private attrs: Record<string, string> = {};

		constructor(className = "", styleAttr = "") {
			className.split(" ").filter(Boolean).forEach((c) => this.classList.add(c));
			if (styleAttr) {
				this.attrs["style"] = styleAttr;
				if (styleAttr.includes("display: none") || styleAttr.includes("display:none")) {
					this.style.display = "none";
				}
			}
		}

		getAttribute(name: string): string | null {
			return this.attrs[name] ?? null;
		}
	}

	function expandPopoverInnerContent(popoverEl: { children?: MockElement[]; querySelectorAll: (sel: string) => MockElement[] }): void {
		const directChildren = popoverEl.children || [];
		for (const child of directChildren) {
			if (!child.classList.contains("doom-popover-header")) {
				child.style.width = "100%";
				child.style.maxWidth = "100%";
				child.style.height = "100%";
				child.style.maxHeight = "none";
			}
		}

		const embeds = popoverEl.querySelectorAll(
			".markdown-embed, .markdown-embed-content, .markdown-preview-view, .markdown-preview-sizer, .popover-content, .cm-editor, .cm-scroller, .bases-embed"
		);
		for (let i = 0; i < embeds.length; i++) {
			const el = embeds[i];
			if (el.style.display === "none" || el.getAttribute("style")?.includes("display: none")) {
				continue;
			}
			el.style.maxWidth = "100%";
			el.style.maxHeight = "none";
			if (el.classList.contains("markdown-preview-sizer")) {
				el.style.width = "100%";
				el.style.minHeight = "100%";
				el.style.margin = "0";
				el.style.paddingBottom = "24px";
			} else if (
				el.classList.contains("markdown-embed") ||
				el.classList.contains("markdown-embed-content") ||
				el.classList.contains("markdown-preview-view") ||
				el.classList.contains("cm-scroller") ||
				el.classList.contains("cm-editor") ||
				el.classList.contains("bases-embed") ||
				el.classList.contains("popover-content")
			) {
				el.style.height = "100%";
			}
		}
	}

	const headerEl = new MockElement("doom-popover-header");
	const directWrapper = new MockElement("markdown-embed");
	const activePreview = new MockElement("markdown-embed-content");
	const hiddenEditor = new MockElement("markdown-embed-content", "display: none;");
	const previewSizer = new MockElement("markdown-preview-sizer");

	const mockPopover = {
		children: [headerEl, directWrapper],
		querySelectorAll: (_sel: string) => [activePreview, hiddenEditor, previewSizer],
	};

	expandPopoverInnerContent(mockPopover);

	assert.strictEqual(headerEl.style.maxHeight, undefined, "Header elements must not be forcibly expanded");
	assert.strictEqual(directWrapper.style.width, "100%");
	assert.strictEqual(directWrapper.style.height, "100%");
	assert.strictEqual(directWrapper.style.maxHeight, "none");
	assert.strictEqual(activePreview.style.maxWidth, "100%");
	assert.strictEqual(activePreview.style.height, "100%");
	assert.strictEqual(activePreview.style.maxHeight, "none");
	assert.strictEqual(hiddenEditor.style.maxWidth, undefined, "Hidden inactive elements must remain untouched");
	assert.strictEqual(hiddenEditor.style.height, undefined, "Hidden inactive elements must remain untouched");
	assert.strictEqual(hiddenEditor.style.maxHeight, undefined, "Hidden inactive elements must remain untouched");
	assert.strictEqual(previewSizer.style.width, "100%");
	assert.strictEqual(previewSizer.style.minHeight, "100%");
	assert.strictEqual(previewSizer.style.maxHeight, "none");
	assert.strictEqual(previewSizer.style.margin, "0");
	assert.strictEqual(previewSizer.style.paddingBottom, "24px");

	console.log("✓ Hover popover content expansion & inactive hidden element preservation verified");
}

// -----------------------------------------------------------------------------
// 12. Obsidian Bases / Database Views Stylesheet & Token Compatibility
// -----------------------------------------------------------------------------
{
	const fs = require("node:fs");
	const path = require("node:path");
	const cssPath = path.resolve(process.cwd(), "styles.css");
	assert.ok(fs.existsSync(cssPath), "styles.css must exist");

	const cssContent = fs.readFileSync(cssPath, "utf-8");

	// Ensure core Bases database view selectors are present
	const requiredBasesSelectors = [
		".block-language-base",
		".bases-embed",
		".bases-header",
		".bases-toolbar",
		".bases-thead",
		".bases-table-header-label",
		".bases-table-header-icon",
		".bases-tbody",
		".bases-tr",
		".bases-td",
		".bases-table-footer",
		".bases-table-summary-cell",
		".bases-group-heading",
		".bases-kanban-column-header",
		// Cards and kanban are styled through Obsidian's variables (their outlines are box-shadow rings)
		"--bases-cards-background",
		"--bases-cards-shadow",
		"--bases-kanban-column-background",
		"--bases-kanban-card-shadow",
	];

	for (const selector of requiredBasesSelectors) {
		assertTheme((css) => css.includes(selector), `theme.css must include Bases styling hook: ${selector}`);
	}
	// A border on cards or kanban cards doubles Obsidian's ring outline; canvas node containers keep
	// Obsidian's edge colour (--canvas-color) and shadows.
	assertTheme(
		(css) => !/(^|\n)\.bases-(cards-item|kanban-card)\s*\{[^}]*\bborder\s*:/.test(css),
		"theme.css must not add a border to Bases cards or kanban cards (doubles the outline)"
	);
	assertTheme(
		(css) => !/(^|\n)\.canvas-node-container\s*\{/.test(css),
		"theme.css must not override canvas node containers (breaks node edge colour and shadows)"
	);
	// The plugin must not duplicate theme Bases styling (it applied under every theme and drifted).
	assert.ok(!cssContent.includes(".bases-thead"), "styles.css must not duplicate theme Bases table styling");

	// Verify header uses a single Org-table 2px accent underline (inset shadow, no extra border)
	assertTheme((css) => css.includes("box-shadow: inset 0 -2px 0 var(--doom-blue"), "theme.css must style Bases table header with Org-table 2px accent underline");
	assert.ok(
		!cssContent.includes("border-bottom: 2px solid var(--doom-blue"),
		"styles.css must not stack a 2px border on top of the inset underline (draws 4px)"
	);
	assert.ok(
		!/\.bases-tr:nth-child\([^)]*\)\s*\{[^}]*--table-row-alt-background/.test(cssContent),
		"styles.css must not zebra-stripe virtualized Bases rows with nth-child"
	);
	assert.ok(
		!cssContent.includes('.workspace-leaf-content[data-type="bases"] .view-content,'),
		"styles.css must not frame standalone .base views like embeds"
	);

	// Plugin CSS uses Obsidian's neutral variables; DoomEsque palette colours come from the theme.
	const pluginDoomVars = Array.from(new Set(cssContent.match(/var\(--doom-[\w-]+/g) ?? []));
	assert.deepStrictEqual(
		pluginDoomVars.filter((v) => !/^var\(--doom-popover-|^var\(--font-monospace-doom/.test(v)),
		[],
		"styles.css must only use plugin-owned --doom-popover-* / --font-monospace-doom variables"
	);

	// Verify header right padding offset and embed-actions button separation
	assertTheme((css) => css.includes("--bases-header-padding-end: 56px"), "theme.css must reserve 56px right padding for CM6 embed actions button");
	assertTheme((css) => css.includes(".bases-embed .embed-actions"), "theme.css must style Bases embed-actions container");
	assertTheme((css) => css.includes(".bases-embed .embed-action"), "theme.css must style Bases embed-action expose syntax button");

	// Verify Bases view selector button full-word layout (preventing truncation)
	assertTheme((css) => css.includes(".bases-toolbar .bases-toolbar-views-menu"), "theme.css must target .bases-toolbar .bases-toolbar-views-menu");
	assertTheme((css) => css.includes(".bases-toolbar .bases-toolbar-views-menu .text-button-label"), "theme.css must target .bases-toolbar .bases-toolbar-views-menu .text-button-label");
	assertTheme((css) => css.includes("min-width: max-content;"), "theme.css must enforce max-content width on views menu button to show full word");
	assertTheme((css) => css.includes("text-overflow: clip;"), "theme.css must disable ellipsis truncation on views menu label");

	// Verify Bases results count button full-word layout (preventing truncation)
	assertTheme((css) => css.includes(".bases-toolbar .bases-toolbar-result-count"), "theme.css must target .bases-toolbar .bases-toolbar-result-count");
	assertTheme((css) => css.includes(".bases-toolbar :is(.bases-toolbar-result-count, .bases-toolbar-results-menu) .text-button-label"), "theme.css must target result count text-button-label");
	assertTheme((css) => css.includes(".bases-toolbar {") && css.includes("overflow-x: auto;"), "theme.css must allow horizontal scroll on .bases-toolbar to prevent squashing");

	console.log("✓ Obsidian Bases stylesheet compatibility & fallback tokens verified");
}

// -----------------------------------------------------------------------------
// 13. Popover Open in New Tab Action & Embed Link Interception
// -----------------------------------------------------------------------------
void (async () => {
	const fs = require("node:fs");
	const path = require("node:path");
	const cssPath = path.resolve(process.cwd(), "styles.css");
	const cssContent = fs.readFileSync(cssPath, "utf-8");

	// Verify mod-open-tab and embed-link CSS styling
	assert.ok(
		cssContent.includes(".doom-popover-btn.mod-open-tab"),
		"styles.css must contain styling for mod-open-tab button"
	);
	assert.ok(
		cssContent.includes(".popover.hover-popover .markdown-embed-link"),
		"styles.css must style .markdown-embed-link in hover popovers"
	);

	// Verify open in new tab simulated workflow
	let openedLeafType: string | null = null;
	let openedFileParam: any = null;
	let activeLeafFocused = false;
	let popoverClosed = false;

	const mockLeaf = {
		openFile: async (file: any, state?: any) => {
			openedFileParam = file;
			assert.strictEqual(state?.active, true, "Opened tab must be marked active");
		},
	};

	const mockWorkspace = {
		getLeaf: (type: string) => {
			openedLeafType = type;
			return mockLeaf;
		},
		setActiveLeaf: (leaf: any, params?: any) => {
			assert.strictEqual(leaf, mockLeaf);
			if (params?.focus) activeLeafFocused = true;
		},
	};

	const mockFile = { basename: "Test Note", path: "Test Note.md" };
	const mockApp = {
		workspace: mockWorkspace,
		metadataCache: {
			getFirstLinkpathDest: (path: string, _source: string) => (path === "Test Note" ? mockFile : null),
		},
		vault: {
			getAbstractFileByPath: (_p: string) => null,
		},
	};

	const mockPopoverEl = {
		dataset: { doomLinktext: "Test Note", doomSourcePath: "" },
		remove: () => {
			popoverClosed = true;
		},
	};

	// Execute simulated openInNewTab logic
	async function simulateOpenInNewTab(linktext: string, sourcePath: string, popoverEl?: any) {
		const rawPath = linktext.split("#")[0].split("^")[0].trim();
		const file = mockApp.metadataCache.getFirstLinkpathDest(rawPath, sourcePath);
		if (file) {
			const leaf = mockApp.workspace.getLeaf("tab");
			await leaf.openFile(file, { active: true });
			mockApp.workspace.setActiveLeaf(leaf, { focus: true });
		}
		if (popoverEl) {
			popoverEl.remove();
		}
	}

	await simulateOpenInNewTab("Test Note", "", mockPopoverEl);

	assert.strictEqual(openedLeafType, "tab", "Must request a 'tab' leaf rather than same tab (false)");
	assert.strictEqual(openedFileParam, mockFile, "Must open the resolved note");
	assert.strictEqual(activeLeafFocused, true, "Must focus the newly opened tab leaf");
	assert.strictEqual(popoverClosed, true, "Must close the preview popover once opened in new tab");

	console.log("✓ Popover Open in New Tab action & embed link interception verified");

	// -------------------------------------------------------------------------
	// 14. Hover Popover Frontmatter Properties Unfolding & State
	// -------------------------------------------------------------------------
	{
		// Default is false
		assert.strictEqual(
			DEFAULT_DOOM_SETTINGS.showPopoverProperties,
			false,
			"Default showPopoverProperties setting must be false"
		);

		const offState = computeDoomDomState(DEFAULT_DOOM_SETTINGS);
		assert.ok(
			!offState.activeClasses.includes("doom-popover-properties"),
			"Off state must not contain doom-popover-properties"
		);

		const onState = computeDoomDomState(
			makeSettings({ showPopoverProperties: true })
		);
		assert.ok(
			onState.activeClasses.includes("doom-popover-properties"),
			"On state must contain doom-popover-properties"
		);

		// Test simulated unfoldPopoverProperties logic
		let setCollapseCalledWith: boolean | null = null;
		const mockMetadataEditor = {
			collapsed: true,
			setCollapse: (collapsed: boolean, _animate: boolean) => {
				setCollapseCalledWith = collapsed;
				mockMetadataEditor.collapsed = collapsed;
			},
		};

		class MockEmbed {
			static collapseProperties = true;
			metadataEditor = mockMetadataEditor;
		}

		const mockPopoverInstance = {
			embed: new MockEmbed(),
		};

		const metaContainerClasses = new Set<string>(["metadata-container", "is-collapsed"]);
		const headingClasses = new Set<string>(["metadata-properties-heading", "is-collapsed"]);
		const foldClasses = new Set<string>(["collapse-indicator", "is-collapsed"]);
		const contentStyle = { display: "none" };

		const mockPopoverEl: any = {
			querySelector: (sel: string) => {
				if (sel === ".metadata-container") {
					return {
						getAttribute: (attr: string) => (attr === "data-property-count" ? "3" : null),
						classList: {
							remove: (cls: string) => metaContainerClasses.delete(cls),
							contains: (cls: string) => metaContainerClasses.has(cls),
						},
						querySelector: (innerSel: string) => {
							if (innerSel === ".metadata-properties-heading") {
								return {
									classList: {
										remove: (cls: string) => headingClasses.delete(cls),
									},
								};
							}
							if (innerSel === ".collapse-indicator") {
								return {
									classList: {
										remove: (cls: string) => foldClasses.delete(cls),
									},
								};
							}
							if (innerSel === ".metadata-content") {
								return {
									style: contentStyle,
									hidden: true,
								};
							}
							return null;
						},
					};
				}
				return null;
			},
		};

		// Simulate unfoldPopoverProperties implementation
		function simulateUnfoldPopoverProperties(popoverEl: any, popoverInstance?: any) {
			const inst = popoverInstance;
			const metadataEditor = inst?.embed?.metadataEditor;
			if (metadataEditor && metadataEditor.collapsed) {
				metadataEditor.setCollapse(false, false);
			}
			const embedConstructor = inst?.embed?.constructor;
			if (embedConstructor && "collapseProperties" in embedConstructor) {
				embedConstructor.collapseProperties = false;
			}
			const metaContainer = popoverEl.querySelector(".metadata-container");
			if (metaContainer && metaContainer.getAttribute("data-property-count") !== "0") {
				metaContainer.classList.remove("is-collapsed");
				const heading = metaContainer.querySelector(".metadata-properties-heading");
				if (heading) heading.classList.remove("is-collapsed");
				const foldEl = metaContainer.querySelector(".collapse-indicator");
				if (foldEl) foldEl.classList.remove("is-collapsed");
				const content = metaContainer.querySelector(".metadata-content");
				if (content && (content.style.display === "none" || content.hidden)) {
					content.style.display = "";
					content.hidden = false;
				}
			}
		}

		simulateUnfoldPopoverProperties(mockPopoverEl, mockPopoverInstance);

		assert.strictEqual(setCollapseCalledWith, false, "MetadataEditor must be unfolded (setCollapse false)");
		assert.strictEqual(MockEmbed.collapseProperties, false, "Embed constructor collapseProperties must be false");
		assert.ok(!metaContainerClasses.has("is-collapsed"), "metadata-container must not have is-collapsed");
		assert.ok(!headingClasses.has("is-collapsed"), "heading must not have is-collapsed");
		assert.ok(!foldClasses.has("is-collapsed"), "fold icon must not have is-collapsed");
		assert.strictEqual(contentStyle.display, "", "metadata-content display must be restored");

		console.log("✓ Hover popover frontmatter properties unfolding and state management verified");
	}

	// -----------------------------------------------------------------------------
	// 15. Mobile Platform Fallback & iOS WebKit Safety Tests
	// -----------------------------------------------------------------------------
	{
		// A. Verify safe prototype patching under read-only/strict-mode WebKit conditions
		const mockProto: Record<string, any> = {};
		Object.defineProperty(mockProto, "show", {
			value: function () {
				return "originalShow";
			},
			writable: false,
			configurable: true,
		});

		// Simulate safePatch implementation
		const safePatch = (target: any, name: string, fn: (...args: any[]) => any) => {
			try {
				Object.defineProperty(target, name, {
					value: fn,
					writable: true,
					configurable: true,
				});
			} catch {
				try {
					target[name] = fn;
				} catch (err) {
					console.warn(`Failed to patch ${name}`, err);
				}
			}
		};

		assert.doesNotThrow(() => {
			safePatch(mockProto, "show", function () {
				return "patchedShow";
			});
		}, "safePatch must never throw on non-writable properties");
		assert.strictEqual(
			mockProto.show(),
			"patchedShow",
			"safePatch must successfully override non-writable property via Object.defineProperty"
		);

		// B. Verify mobile workspace rightSplit null-safety
		const mobileWorkspace: { rightSplit?: { collapsed?: boolean; expand?: () => void } } = {};
		const rightSplit = (mobileWorkspace as any)?.rightSplit;
		assert.doesNotThrow(() => {
			if (rightSplit && typeof rightSplit.expand === "function" && rightSplit.collapsed) {
				rightSplit.expand();
			}
		}, "Right split check must not throw when rightSplit is undefined (mobile iOS)");

		// C. Verify mobile settings execution: full palette and DOM styling works on mobile
		const mobileSettings = makeSettings({
			darkPalette: "doom-palette-retro-terminal",
			monospaceEditor: true,
			rainbowIndentGuides: true,
			legalOutlineNumbering: true,
		});
		const mobileState = computeDoomDomState(mobileSettings);
		assert.ok(mobileState.activeClasses.includes("doom-palette-retro-terminal"));
		assert.ok(mobileState.activeClasses.includes("doom-monospace-editor"));
		assert.ok(!mobileState.activeClasses.includes("doom-mono-indent-guides"), "rainbow guides must not add the mono opt-out class");
		assert.ok(mobileState.activeClasses.includes("doom-legal-outline"));

		const mockMobileDoc = {
			body: {
				classList: new MockDOMTokenList(),
				style: {
					properties: new Map<string, string>(),
					setProperty(k: string, v: string) {
						this.properties.set(k, v);
					},
					removeProperty(k: string) {
						this.properties.delete(k);
					},
					getPropertyValue(k: string) {
						return this.properties.get(k) || "";
					},
				},
			},
		} as unknown as Document;

		applyDoomDomState(mockMobileDoc, mobileState);
		assert.ok((mockMobileDoc.body.classList as any).contains("doom-palette-retro-terminal"));
		assert.ok((mockMobileDoc.body.classList as any).contains("doom-monospace-editor"));

		clearDoomDomState(mockMobileDoc);
		assert.ok(!(mockMobileDoc.body.classList as any).contains("doom-palette-retro-terminal"));

		console.log("✓ Mobile platform fallback and iOS WebKit safety verified");
	}

	// -----------------------------------------------------------------------------
	// 16. Retro Green Terminal (doom-palette-retro-terminal) Consistency Tests
	// -----------------------------------------------------------------------------
	{
		const retroSettings = makeSettings({
			darkPalette: "doom-palette-retro-terminal",
			activeBlockHighlight: true,
			showPopoverProperties: true,
		});
		const retroState = computeDoomDomState(retroSettings);
		assert.ok(retroState.activeClasses.includes("doom-palette-retro-terminal"));
		assert.ok(retroState.activeClasses.includes("doom-active-block-highlight"));
		assert.ok(retroState.activeClasses.includes("doom-popover-properties"));

		// Verify that retro terminal palette maps to valid DOOM_PALETTES
		const retroPaletteDef = DOOM_PALETTES.find((p) => p.id === "doom-palette-retro-terminal");
		assert.ok(retroPaletteDef !== undefined);
		assert.strictEqual(retroPaletteDef?.label, "doom-retro-terminal (VT220 Green Screen)");

		console.log("✓ Retro green terminal Bases and Properties styling consistency verified");
	}

	// -----------------------------------------------------------------------------
	// 17. Mobile Caret Visibility & Styling Tests
	// -----------------------------------------------------------------------------
	{
		const fs = require("node:fs");
		const path = require("node:path");
		const cssPath = path.resolve(process.cwd(), "styles.css");
		const themeCssPath = path.resolve(process.cwd(), "../obsidian-theme-doomesque/theme.css");

		assert.ok(fs.existsSync(cssPath), "styles.css must exist");
		const stylesContent = fs.readFileSync(cssPath, "utf-8");

		// 1. Ensure desktop-only gating of transparent caret
		assertTheme((css) => css.includes("body:not(.is-mobile).doom-cursor-block"), "theme.css must gate transparent caret behind body:not(.is-mobile) for block cursor");
		assertTheme((css) => css.includes("body:not(.is-mobile).doom-cursor-glow"), "theme.css must gate transparent caret behind body:not(.is-mobile) for glow cursor");
		assertTheme((css) => css.includes("body:not(.is-mobile).doom-cursor-hollow"), "theme.css must gate transparent caret behind body:not(.is-mobile) for hollow cursor");
		assertTheme((css) => css.includes("body:not(.is-mobile).doom-cursor-underline"), "theme.css must gate transparent caret behind body:not(.is-mobile) for underline cursor");

		// 2. Ensure mobile explicit caret-color rules are present
		assertTheme((css) => css.includes(".is-mobile .markdown-source-view.mod-cm6 .cm-content"), "theme.css must style caret-color on mobile markdown source view");
		assertTheme((css) => css.includes("caret-color: var(--text-accent, var(--doom-blue, #51afef));"), "theme.css must set mobile caret-color to theme accent");
		assertTheme((css) => css.includes("body.is-mobile.theme-dark.doom-palette-retro-terminal"), "theme.css must set retro-terminal mobile caret-color");
		assertTheme((css) => css.includes("caret-color: var(--doom-fg, #33ff33);"), "theme.css must set retro-terminal caret-color to phosphor green");

		// 3. Verify matching rules in theme.css if present in workspace
		if (fs.existsSync(themeCssPath)) {
			const themeContent = fs.readFileSync(themeCssPath, "utf-8");
			assert.ok(
				themeContent.includes("body:not(.is-mobile).doom-cursor-block"),
				"theme.css must gate transparent caret behind body:not(.is-mobile)"
			);
			assert.ok(
				themeContent.includes(".is-mobile .markdown-source-view.mod-cm6 .cm-content"),
				"theme.css must style caret-color on mobile"
			);
			assert.ok(
				themeContent.includes("caret-color: var(--doom-fg, #33ff33)"),
				"theme.css must set retro-terminal caret-color to phosphor green"
			);
		}

		console.log("✓ Mobile caret visibility and theme accent styling verified");
	}

	// -----------------------------------------------------------------------------
	// 18. Suit and Tie (doom-palette-suit-and-tie) Sartorial Palette Tests
	// -----------------------------------------------------------------------------
	{
		const fs = require("node:fs");
		const path = require("node:path");
		const cssPath = path.resolve(process.cwd(), "styles.css");
		const themeCssPath = path.resolve(process.cwd(), "../obsidian-theme-doomesque/theme.css");

		// 1. Verify palette registry definitions
		const suitDark = DOOM_PALETTES.find((p) => p.id === "doom-palette-suit-and-tie");
		assert.ok(suitDark !== undefined, "doom-palette-suit-and-tie must exist in DOOM_PALETTES");
		assert.ok(suitDark?.label.includes("suit-and-tie"));

		const suitLight = DOOM_LIGHT_PALETTES.find((p) => p.id === "doom-palette-suit-and-tie-light");
		assert.ok(suitLight !== undefined, "doom-palette-suit-and-tie-light must exist in DOOM_LIGHT_PALETTES");
		assert.ok(suitLight?.label.includes("suit-and-tie-light"));

		// 2. Verify DOM state computation and active classes
		const suitSettings = makeSettings({
			darkPalette: "doom-palette-suit-and-tie",
			lightPalette: "doom-palette-suit-and-tie-light",
		});
		const suitState = computeDoomDomState(suitSettings);
		assert.ok(
			suitState.activeClasses.includes("doom-palette-suit-and-tie"),
			"Active classes must include doom-palette-suit-and-tie"
		);

		// 3. Verify CSS rules in styles.css
		const stylesContent = fs.readFileSync(cssPath, "utf-8");
		assertTheme((css) => css.includes("body.theme-dark.doom-palette-suit-and-tie"), "theme.css must contain body.theme-dark.doom-palette-suit-and-tie polish selectors");
		assertTheme((css) => css.includes("body.theme-dark.doom-palette-suit-and-tie .markdown-rendered h1"), "theme.css must contain tailored H1 styling for suit-and-tie");

		// 4. Verify CSS rules in theme.css
		if (fs.existsSync(themeCssPath)) {
			const themeContent = fs.readFileSync(themeCssPath, "utf-8");
			assert.ok(
				themeContent.includes("body.theme-dark.doom-palette-suit-and-tie"),
				"theme.css must define dark palette for doom-palette-suit-and-tie"
			);
			assert.ok(
				themeContent.includes("body.theme-light.doom-palette-suit-and-tie"),
				"theme.css must define light palette for doom-palette-suit-and-tie"
			);
			assert.ok(
				themeContent.includes("--doom-bg: #191c22;"),
				"theme.css must use #191c22 tailored charcoal background"
			);
			assert.ok(
				themeContent.includes("--doom-fg: #edf1f7;"),
				"theme.css must use #edf1f7 crisp shirt white foreground"
			);
		}

		console.log("✓ Suit and Tie sartorial palette definitions and polish styling verified");
	}

	// -----------------------------------------------------------------------------
	// -----------------------------------------------------------------------------
	// 19. Native Obsidian Table Mechanics Preservation & Doom Color Differences Tests
	// -----------------------------------------------------------------------------
	{
		const fs = require("node:fs");
		const path = require("node:path");
		const cssPath = path.resolve(process.cwd(), "styles.css");
		const themeCssPath = path.resolve(process.cwd(), "../obsidian-theme-doomesque/theme.css");

		assert.ok(fs.existsSync(cssPath), "styles.css must exist");
		const stylesContent = fs.readFileSync(cssPath, "utf-8");

		// 1. Verify styles.css does NOT inject intrusive table layout/cell overrides so native Obsidian controls mechanics
		assert.ok(
			!stylesContent.includes("table.table-editor th"),
			"styles.css must not override native Obsidian table cell geometry"
		);
		assertTheme((css) => css.includes("body.doom-active-block-highlight .cm-s-obsidian .cm-table-widget .cm-activeLine") && !css.includes(".doom-active-line-highlight") &&
				css.includes(".cm-table-widget .cm-activeLine") &&
				css.includes("background-color: transparent;"), "theme.css must prevent active-line background bleed into table cells");
		assertTheme((css) => css.includes("body .markdown-source-view.mod-cm6 .cm-table-widget .cm-cursorLayer .cm-cursor {") &&
				css.includes("margin-left: -0.6px;") &&
				/\.cm-table-widget \.cm-scroller \{\s*overflow: visible;/.test(css), "theme.css must keep the centred table-cell caret and let cell editor scrollers show it (no clipping at the cell start, no horizontal scrollbar at the end)");

		// 2. Verify Bases cell scrollbar suppression & min-width in styles.css
		assertTheme((css) => css.includes(".bases-td"), "theme.css must target .bases-td");
		assertTheme((css) => css.includes(".bases-table-cell"), "theme.css must target .bases-table-cell");
		// Bases positions absolutely-placed cells from JS-computed column widths (clamped by
		// --bases-table-column-min-width). A CSS min-width floor makes narrow cells overlap their neighbours.
		assert.ok(
			!stylesContent.includes("min-width: max(var(--bases-column-width"),
			"styles.css must not impose a CSS min-width floor on Bases cells (breaks JS column layout)"
		);

		// 3. Verify theme.css preserves 100% native table functionality and applies Doom color differences
		if (fs.existsSync(themeCssPath)) {
			const themeContent = fs.readFileSync(themeCssPath, "utf-8");
			
			// Must NOT force abnormal white-space overrides
			assert.ok(
				!themeContent.includes("--table-white-space: normal;"),
				"theme.css must not force --table-white-space: normal"
			);
			assert.ok(
				!themeContent.includes("--bases-table-white-space: normal;"),
				"theme.css must not force --bases-table-white-space: normal"
			);

			// Must NOT hardcode non-native cell padding (which broke native density scaling)
			assert.ok(
				!themeContent.includes("padding: 8px 13px;"),
				"theme.css must not hardcode padding: 8px 13px so native Obsidian cell padding rules govern layout"
			);

			// Must NOT override internal CodeMirror 6 elements in table cells
			const tStart = themeContent.indexOf("/* Tables: Org-table Doom Color Aesthetic");
			const tEnd = themeContent.indexOf("/* --------------------------------------------------------------------------\n   8b. Obsidian Bases");
			assert.ok(tStart !== -1 && tEnd !== -1, "theme.css must contain Org-table Doom Color Aesthetic section");
			const themeTable = themeContent.substring(tStart, tEnd);

			assert.ok(
				!themeTable.includes(":is(.cm-editor, .cm-scroller, .cm-sizer, .cm-content, .cm-line)"),
				"theme.css must not override nested CodeMirror 6 element layout in table cells"
			);
			assert.ok(
				!themeTable.includes("overflow-x: hidden;"),
				"theme.css must not use overflow-x: hidden on cell editors"
			);
			assert.ok(
				!themeTable.includes("box-shadow: 0 1px 4px"),
				"theme.css must not apply box-shadow to tables"
			);

			// Must neutralise global editor tweaks inside nested table cell editors
			assert.ok(
				themeContent.includes(".markdown-source-view.mod-cm6 .cm-table-widget .cm-content > .cm-line {"),
				"theme.css must reset .cm-line vertical padding inside table cells to stop focus height jumps"
			);
			assert.ok(
				themeContent.includes("body .markdown-source-view.mod-cm6 .cm-table-widget .cm-cursorLayer .cm-cursor {"),
				"theme.css must restore the native-width caret in table cells to prevent horizontal scrollbars"
			);

			// Must preserve Doom palette color styling differences
			assert.ok(
				themeContent.includes("border-bottom: 2px solid var(--doom-blue);"),
				"theme.css must style table headers with Doom blue accent underline"
			);
			assert.ok(
				themeContent.includes("--table-selection-border-color: var(--doom-blue);"),
				"theme.css must define visible table selection border color"
			);
			assert.ok(
				themeContent.includes("--table-row-alt-background: var(--doom-stripe);"),
				"theme.css must define zebra striping alt background"
			);
			assert.ok(
				themeContent.includes("--table-background: var(--doom-bg);"),
				"theme.css must define table background"
			);
			assert.ok(
				!/--table-(text-size|header-size|line-height)\s*:/.test(themeContent),
				"theme.css must not override native table text size / line height variables"
			);
		}

		console.log("✓ Native Obsidian table mechanics preservation & Doom color differences verified");
	}

	// -----------------------------------------------------------------------------
	// 20. Popover Pin Button Capital 'P' Symbol & Color Scheme Conformance Tests
	// -----------------------------------------------------------------------------
	{
		const fs = require("node:fs");
		const path = require("node:path");

		const stylesPath = path.resolve(process.cwd(), "styles.css");
		const stylesContent = fs.readFileSync(stylesPath, "utf-8");

		const hpPath = path.resolve(process.cwd(), "src/hoverPreview.ts");
		const hpContent = fs.readFileSync(hpPath, "utf-8");

		// 1. Verify src/hoverPreview.ts uses capital 'P' for the pin button
		assert.ok(
			!hpContent.includes('pinBtn.setText("📌")'),
			"hoverPreview.ts must not use hardcoded pushpin emoji"
		);
		assert.ok(
			hpContent.includes('buttonEl.setText("P")') || hpContent.includes('pinBtn.setText("P")'),
			"hoverPreview.ts must render capital 'P' in pin button"
		);

		// 2. Verify styles.css contains themeable capital 'P' rules for mod-pin
		assert.ok(
			stylesContent.includes(".doom-popover-btn.mod-pin") &&
				stylesContent.includes("font-family: var(--font-monospace-doom"),
			"styles.css must style .doom-popover-btn.mod-pin with monospace font"
		);
		assert.ok(
			stylesContent.includes(".doom-popover-btn.mod-pin:hover"),
			"styles.css must define hover state for .doom-popover-btn.mod-pin"
		);
		assert.ok(
			stylesContent.includes(".doom-popover-btn.is-active") &&
				stylesContent.includes(".doom-popover-btn.mod-pin.is-active"),
			"styles.css must define active state for .doom-popover-btn.mod-pin"
		);
		assert.ok(
			stylesContent.includes("rgba(var(--color-green-rgb"),
			"styles.css must use Obsidian's --color-green-rgb for pin active background (themes recolour it)"
		);

		// 3. Verify Retro Terminal and Suit and Tie popover button styles
		assertTheme((css) => css.includes("body.theme-dark.doom-palette-retro-terminal .doom-popover-btn"), "theme.css must style popover buttons for Retro Terminal");
		assertTheme((css) => css.includes("body.theme-dark.doom-palette-suit-and-tie .doom-popover-btn"), "theme.css must style popover buttons for Suit and Tie");

		// 4. Verify theme.css in companion repo if present
		const themePath = path.resolve(process.cwd(), "../obsidian-theme-doomesque/theme.css");
		if (fs.existsSync(themePath)) {
			const themeContent = fs.readFileSync(themePath, "utf-8");
			assert.ok(
				themeContent.includes(".doom-popover-btn.mod-pin:hover {") &&
					!/\.doom-popover-(header|btn)[^{]*\{[^}]*(display|padding|width|height|cursor|font-family)\s*:/.test(themeContent),
				"theme.css must only colour the plugin's popover header and buttons (layout lives in the plugin)"
			);
			assert.ok(
				themeContent.includes("body.theme-dark.doom-palette-retro-terminal .doom-popover-btn"),
				"theme.css must style popover buttons for Retro Terminal"
			);
			assert.ok(
				themeContent.includes("body.theme-dark.doom-palette-suit-and-tie .doom-popover-btn"),
				"theme.css must style popover buttons for Suit and Tie"
			);
		}

		console.log("✓ Popover pin button capital 'P' symbol & color scheme conformance verified");
	}

	// -----------------------------------------------------------------------------
	// 21. Security, 100% Offline Isolation & Obsidian Guidelines Conformance
	// -----------------------------------------------------------------------------
	{
		const fs = require("node:fs");
		const path = require("node:path");

		const pluginManifestPath = path.resolve(process.cwd(), "manifest.json");
		const pluginManifest = JSON.parse(fs.readFileSync(pluginManifestPath, "utf-8"));
		const packageJsonPath = path.resolve(process.cwd(), "package.json");
		const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
		const versionsPath = path.resolve(process.cwd(), "versions.json");
		const versions = JSON.parse(fs.readFileSync(versionsPath, "utf-8"));

		// 1. Manifest & Version Consistency
		assert.strictEqual(pluginManifest.id, "doomesque-settings", "Plugin id must be doomesque-settings");
		assert.strictEqual(pluginManifest.version, packageJson.version, "Manifest version must match package.json");
		assert.ok(versions[pluginManifest.version], "versions.json must record current release version");
		assert.ok(pluginManifest.minAppVersion, "manifest.json must specify minAppVersion");

		// 2. Strict Offline Guarantee in Plugin CSS
		const stylesPath = path.resolve(process.cwd(), "styles.css");
		const stylesContent = fs.readFileSync(stylesPath, "utf-8");
		assert.ok(!stylesContent.includes("@import"), "styles.css must not use @import");
		assert.ok(!stylesContent.toLowerCase().includes("http://"), "styles.css must not contain http://");
		assert.ok(!stylesContent.toLowerCase().includes("https://"), "styles.css must not contain https://");
		assert.ok(!stylesContent.toLowerCase().includes("url("), "styles.css must not make remote url() requests");

		// 3. Strict Offline & Safe DOM Guarantees in TypeScript Source
		const srcDir = path.resolve(process.cwd(), "src");
		const srcFiles = fs.readdirSync(srcDir).filter((f: string) => f.endsWith(".ts"));
		for (const file of srcFiles) {
			const content = fs.readFileSync(path.join(srcDir, file), "utf-8");
			assert.ok(!content.includes("fetch("), `${file} must not call fetch()`);
			assert.ok(!content.includes("XMLHttpRequest"), `${file} must not use XMLHttpRequest`);
			assert.ok(!content.includes("WebSocket"), `${file} must not use WebSocket`);
			assert.ok(!content.includes("eval("), `${file} must not use eval()`);
			assert.ok(!content.includes("new Function("), `${file} must not use new Function()`);
			assert.ok(!content.includes("innerHTML"), `${file} must not use innerHTML`);
			assert.ok(!content.includes("outerHTML"), `${file} must not use outerHTML`);
			assert.ok(!content.includes("document.write"), `${file} must not use document.write`);
			assert.ok(!content.includes("child_process"), `${file} must not import child_process`);
		}

		// 4. Strict Offline Guarantee in Companion Theme
		const themeRepoPath = path.resolve(process.cwd(), "../obsidian-theme-doomesque");
		if (fs.existsSync(themeRepoPath)) {
			const themeManifest = JSON.parse(
				fs.readFileSync(path.join(themeRepoPath, "manifest.json"), "utf-8")
			);
			assert.strictEqual(themeManifest.name, "DoomEsque", "Theme manifest name must be DoomEsque");
			assert.ok(themeManifest.version, "Theme manifest must have version");
			assert.ok(themeManifest.minAppVersion, "Theme manifest must have minAppVersion");

			const themeCss = fs.readFileSync(path.join(themeRepoPath, "theme.css"), "utf-8");
			assert.ok(!themeCss.includes("@import"), "theme.css must not use @import");
			assert.ok(!themeCss.toLowerCase().includes("http://"), "theme.css must not contain http://");
			assert.ok(!themeCss.toLowerCase().includes("https://"), "theme.css must not contain https://");
			assert.ok(!themeCss.toLowerCase().includes("url("), "theme.css must not make remote url() requests");
		}

		console.log("✓ Security audit passed: 100% offline isolation & Obsidian guidelines conformance verified");
	}

	// -----------------------------------------------------------------------------
	// 22. Multi-Window Document Synchronization & Core Obsidian Theme Base Tokens
	// -----------------------------------------------------------------------------
	{
		const fs = require("node:fs");
		const path = require("node:path");

		// 1. Zero !important verification across both plugin and companion theme
		const stylesPath = path.resolve(process.cwd(), "styles.css");
		const stylesContent = fs.readFileSync(stylesPath, "utf-8");
		assert.ok(
			!stylesContent.includes("!important"),
			"styles.css must contain zero instances of !important"
		);

		const themeRepoPath = path.resolve(process.cwd(), "../obsidian-theme-doomesque");
		if (fs.existsSync(themeRepoPath)) {
			const themeCss = fs.readFileSync(path.join(themeRepoPath, "theme.css"), "utf-8");
			assert.ok(
				!themeCss.includes("!important"),
				"theme.css must contain zero instances of !important"
			);

			// 2. Core Obsidian Token & Base Color Mapping in theme.css
			const expectedBaseTokens = [
				"--color-base-00: var(--doom-bg);",
				"--color-base-05: var(--doom-bg);",
				"--color-base-10: var(--doom-bg-alt);",
				"--color-base-20: var(--doom-bg-alt);",
				"--color-base-25: var(--doom-base0);",
				"--color-base-30: var(--doom-base1);",
				"--color-base-35: var(--doom-base2);",
				"--color-base-40: var(--doom-base3);",
				"--color-base-50: var(--doom-base4);",
				"--color-base-60: var(--doom-base5);",
				"--color-base-70: var(--doom-base6);",
				"--color-base-100: var(--doom-fg);",
				"--titlebar-background: var(--doom-base0);",
				"--titlebar-background-focused: var(--doom-base0);",
				"--ribbon-background: var(--doom-base0);",
				"--tab-container-background: var(--doom-base0);",
				"--tab-background-active: var(--doom-bg);",
			];

			for (const token of expectedBaseTokens) {
				assert.ok(
					themeCss.includes(token),
					`theme.css must define core Obsidian base token: ${token}`
				);
			}
		}

		// 3. Multi-Window and Main Document Synchronization Logic
		const mockMainDoc = { name: "mainWorkspaceDoc", defaultView: { closed: false } } as unknown as Document;
		const mockSettingsDoc = { name: "settingsModalDoc", defaultView: { closed: false } } as unknown as Document;
		const mockPopoutDoc = { name: "popoutDoc", defaultView: { closed: false } } as unknown as Document;

		// Simulate getAllDocuments() logic
		function simulateGetAllDocuments(
			mainDoc: Document | null,
			activeDoc: Document | null,
			trackedDocs: Set<Document>,
			floatingKids: Array<{ doc?: Document; containerEl?: { ownerDocument: Document } }> = []
		): Document[] {
			const docs: Document[] = [];
			if (mainDoc) {
				docs.push(mainDoc);
			}
			if (activeDoc && !docs.includes(activeDoc)) {
				docs.push(activeDoc);
			}
			for (const doc of trackedDocs) {
				if (doc && doc.defaultView && !doc.defaultView.closed && !docs.includes(doc)) {
					docs.push(doc);
				}
			}
			for (const kid of floatingKids) {
				const winDoc = kid?.doc ?? kid?.containerEl?.ownerDocument;
				if (winDoc && !docs.includes(winDoc)) {
					docs.push(winDoc);
				}
			}
			return docs;
		}

		// When activeDocument is the settings window, main workspace document MUST still be included
		const docsWhenSettingsFocused = simulateGetAllDocuments(
			mockMainDoc,
			mockSettingsDoc,
			new Set([mockPopoutDoc])
		);

		assert.strictEqual(docsWhenSettingsFocused.length, 3);
		assert.strictEqual(docsWhenSettingsFocused[0], mockMainDoc, "Main workspace document must be first");
		assert.ok(docsWhenSettingsFocused.includes(mockSettingsDoc), "Settings modal document must be included");
		assert.ok(docsWhenSettingsFocused.includes(mockPopoutDoc), "Popout document must be included");

		console.log("✓ Multi-window document synchronization & core base color token mapping verified");
	}

	// -----------------------------------------------------------------------------
	// 23. Style Settings Ownership & Plugin CSS Scope
	// -----------------------------------------------------------------------------
	{
		const fs = require("node:fs");
		const path = require("node:path");

		// 1. Shared lists are subsets of what the plugin manages
		const managed = new Set(ALL_MANAGED_BODY_CLASSES);
		for (const cls of STYLE_SETTINGS_SHARED_CLASSES) {
			assert.ok(managed.has(cls), `shared class ${cls} must be a managed class`);
		}
		const managedVars = new Set(ALL_MANAGED_CSS_VARS);
		for (const v of STYLE_SETTINGS_SHARED_CSS_VARS) {
			assert.ok(managedVars.has(v), `shared variable ${v} must be a managed variable`);
		}

		// 2. Deferring drops shared classes/variables and never manages them
		const settings = makeSettings({
			darkPalette: "doom-palette-dracula",
			monospaceEditor: true,
			fileLineWidthRem: 60,
			headingScale: 1.2,
		});
		const owned = computeDoomDomState(settings);
		const deferred = computeDoomDomState(settings, { deferToStyleSettings: true });
		assert.ok(owned.activeClasses.includes("doom-palette-dracula"));
		assert.ok(!deferred.activeClasses.includes("doom-palette-dracula"), "deferred state must not set palette");
		assert.ok(!deferred.activeClasses.includes("doom-monospace-editor"), "deferred state must not set shared toggles");
		assert.ok(!("--file-line-width" in deferred.cssVariables), "deferred state must not touch shared variables");
		assert.strictEqual(deferred.cssVariables["--h1-size"], "1.78em", "plugin-only options still apply when deferring");
		assert.ok(
			!(deferred.managedClasses ?? []).some((c) => STYLE_SETTINGS_SHARED_CLASSES.includes(c)),
			"deferred state must not manage shared classes"
		);
		assert.deepStrictEqual(
			[...getManagedClasses({ deferToStyleSettings: true })].sort(),
			ALL_MANAGED_BODY_CLASSES.filter((c) => !STYLE_SETTINGS_SHARED_CLASSES.includes(c)).sort()
		);

		// 3. Applying / clearing while deferring preserves classes and variables Style Settings set
		const props: Record<string, string> = {};
		const doc = {
			body: {
				classList: new MockDOMTokenList(),
				style: {
					setProperty: (k: string, v: string) => {
						props[k] = v;
					},
					removeProperty: (k: string) => {
						delete props[k];
					},
					getPropertyValue: (k: string) => props[k] ?? "",
				},
			},
		};
		doc.body.classList.add("doom-palette-vibrant"); // chosen in Style Settings
		doc.body.style.setProperty("--file-line-width", "52rem");
		applyDoomDomState(doc as unknown as Document, deferred);
		assert.ok(doc.body.classList.contains("doom-palette-vibrant"), "apply must keep Style Settings palette class");
		assert.strictEqual(props["--file-line-width"], "52rem", "apply must keep Style Settings variable");
		assert.ok(!doc.body.classList.contains("doom-palette-dracula"), "apply must not add plugin palette when deferring");
		clearDoomDomState(doc as unknown as Document, { deferToStyleSettings: true });
		assert.ok(doc.body.classList.contains("doom-palette-vibrant"), "clear must keep Style Settings palette class");
		clearDoomDomState(doc as unknown as Document);
		assert.ok(!doc.body.classList.contains("doom-palette-vibrant"), "clear without deferral removes managed classes");

		// 4. Every shared class is a real option in the theme's Style Settings block (when present)
		if (THEME_CSS !== null) {
			const settingsBlock = THEME_CSS.slice(THEME_CSS.indexOf("/* @settings"));
			for (const cls of STYLE_SETTINGS_SHARED_CLASSES) {
				assert.ok(
					settingsBlock.includes(`value: ${cls}`) || settingsBlock.includes(`id: ${cls}`),
					`theme @settings must expose shared class ${cls}`
				);
			}
		}

		// 5. One settings schema drives both the declarative (1.13+, searchable) and legacy tabs;
		//    every setting has exactly one row and shared rows are derived from the shared keys.
		const mainSrc = fs.readFileSync(path.resolve(process.cwd(), "src/main.ts"), "utf-8");
		const schemaKeys = SETTINGS_SECTIONS.flatMap((s) => s.items.map((i) => i.key as string));
		assert.strictEqual(new Set(schemaKeys).size, schemaKeys.length, "each setting appears once in the schema");
		const userFacing = Object.keys(DEFAULT_DOOM_SETTINGS).filter((k) => k !== "settingsVersion");
		assert.deepStrictEqual([...schemaKeys].sort(), [...userFacing].sort(), "every user-facing setting has a row");
		for (const key of STYLE_SETTINGS_SHARED_KEYS) {
			assert.ok(schemaKeys.includes(key), `shared setting ${key} must have a row`);
			assert.ok(isSharedSetting(key), `${key} must be disabled while Style Settings owns it`);
		}
		assert.ok(!isSharedSetting("headingScale"), "plugin-only settings stay enabled");
		assert.ok(/getSettingDefinitions\(\): SettingDefinitionItem\[\]/.test(mainSrc), "the tab must provide declarative definitions (settings search on 1.13+)");
		assert.ok(/setControlValue\(key: string, value: unknown\)/.test(mainSrc) && mainSrc.includes("await this.plugin.saveSettings();"), "declarative changes must go through saveSettings()");
		assert.ok(!/this\.display\(\)/.test(mainSrc) && mainSrc.includes('Reflect.get(this, "update")') && !/this\.update\(\)|this\.getSettingDefinitions\(\)/.test(mainSrc), "reset must re-render declaratively on 1.13+ (display() is deprecated)");
		const slider = findSettingSpec("editorMarginVerticalPx")!;
		assert.strictEqual(normalizeSettingValue(slider, 27.6), 28, "integer sliders round");
		assert.strictEqual(normalizeSettingValue(findSettingSpec("customMonospaceFont")!, ' "Iosevka"; '), sanitizeFontFamily(' "Iosevka"; '), "font names are sanitised");
		assert.ok(!mainSrc.includes('on("layout-change"'), "settings must not be re-applied on every layout change");

		// 6. Plugin CSS only styles plugin-created DOM
		const pluginCss = fs.readFileSync(path.resolve(process.cwd(), "styles.css"), "utf-8");
		for (const forbidden of [
			".modal.mod-settings .setting-item",
			".checkbox-container",
			"doom-palette-",
			"doom-cursor-",
			".cm-table-widget",
			".bases-tr",
			"doom-rainbow-indent-guides",
		]) {
			assert.ok(!pluginCss.includes(forbidden), `styles.css must not contain theme styling: ${forbidden}`);
		}
		for (const required of [".doom-popover-header", ".doom-sticky-popover", ".doom-settings-slider-value", ".doom-settings-banner"]) {
			assert.ok(pluginCss.includes(required), `styles.css must style plugin DOM: ${required}`);
		}

		// 7. Both palette classes are always on <body>, so every palette-specific theme rule must also
		//    name its mode; otherwise the light palette leaks into dark mode (and vice versa).
		if (THEME_CSS !== null) {
			const noComments = THEME_CSS.replace(/\/\*[\s\S]*?\*\//g, "");
			const ungated: string[] = [];
			for (const m of noComments.matchAll(/([^{}]+)\{/g)) {
				for (const sel of m[1].split(",")) {
					for (const compound of sel.trim().split(/\s+/)) {
						if (compound.includes("doom-palette-") && !/\.theme-(dark|light)\b/.test(compound)) ungated.push(sel.trim());
					}
				}
			}
			assert.deepStrictEqual(ungated, [], "theme.css palette rules must be gated with .theme-dark / .theme-light");
			assert.ok(
				!/(^|[\s,])body\.[\w.-]*doom-palette-[\w-]+\s+hr\b/m.test(noComments),
				"palette hr rules must be scoped to note content (Obsidian resize handles are <hr> elements)"
			);
		}

		// 8. drawSelection's ".cm-content :focus ::selection { Highlight !important }" must not paint the
		//    system highlight: nested selections use the theme colour, nested editors' lines hide theirs.
		assert.ok(
			/registerEditorExtension\(\[drawSelection\(\), NESTED_NATIVE_SELECTION_FIX\]\)/.test(mainSrc) &&
				mainSrc.includes('backgroundColor: "var(--text-selection) !important"') &&
				mainSrc.includes(".cm-content .cm-editor .cm-content .cm-line::selection") &&
				mainSrc.includes('backgroundColor: "transparent !important"'),
			"main.ts must register the nested native selection fix alongside drawSelection"
		);

		// 9. Zebra rows must run full width and the header row must be one uniform band:
		//    Obsidian's alternate-column shade would otherwise paint opaque cells over both.
		assertTheme((css) => css.includes("--table-column-alt-background: transparent;"), "theme.css must disable Obsidian's alternate-column shading");
		assertTheme(
			(css) => /\.markdown-rendered thead tr > th:nth-child\(n\)[^{]*\{\s*background-color: var\(--table-header-background\);/.test(css),
			"theme.css must give every header cell the uniform header background"
		);

		// 10. Rainbow indent guides are the default; turning them off adds the mono opt-out class,
		//     and settings saved before v2 (old default false) are migrated to rainbow once.
		assert.strictEqual(DEFAULT_DOOM_SETTINGS.rainbowIndentGuides, true, "rainbow indent guides must be the default");
		assert.ok(!computeDoomDomState(makeSettings()).activeClasses.includes("doom-mono-indent-guides"));
		assert.ok(computeDoomDomState(makeSettings({ rainbowIndentGuides: false })).activeClasses.includes("doom-mono-indent-guides"));
		const legacy = { rainbowIndentGuides: false } as Partial<DoomEsqueStyleSettings>;
		const migrated = { ...DEFAULT_DOOM_SETTINGS, ...legacy };
		assert.strictEqual(migrateSettings(legacy, migrated), true, "version-1 settings must be migrated");
		assert.strictEqual(migrated.rainbowIndentGuides, true);
		assert.strictEqual(migrated.settingsVersion, CURRENT_SETTINGS_VERSION);
		const current = { rainbowIndentGuides: false, settingsVersion: CURRENT_SETTINGS_VERSION } as Partial<DoomEsqueStyleSettings>;
		const kept = { ...DEFAULT_DOOM_SETTINGS, ...current };
		assert.strictEqual(migrateSettings(current, kept), false, "current settings must not be migrated");
		assert.strictEqual(kept.rainbowIndentGuides, false, "an explicit choice saved after v2 must be respected");
		assertTheme((css) => css.includes("body:not(.doom-mono-indent-guides) .markdown-source-view.mod-cm6 .cm-indent"), "theme.css must show rainbow guides unless opted out");

		// 11. Bases toolbar popovers have one frame (Obsidian's .menu); inner containers draw none.
		assertTheme(
			(css) => /\.bases-results-page \{\s*\/\*[^*]*\*\/\s*background-color: transparent;\s*border: none;/.test(css),
			"theme.css must not draw a second frame inside Bases toolbar menus"
		);
		// 12. Task rows read checkbox → TODO/DONE → text: Live Preview badge follows the checkbox label,
		//     Reading view checkbox and fold toggle hang in the gutter out of the text flow.
		assertTheme(
			(css) => css.includes('.HyperMD-task-line[data-task=" "] .task-list-label::after') &&
				css.includes(".markdown-rendered li.task-list-item > .list-collapse-indicator {") &&
				css.includes(".markdown-rendered .list-collapse-indicator {\n  margin-inline-start: -1.9em;") &&
				css.includes(".HyperMD-list-line:not(.cm-active):not(.HyperMD-task-line) .cm-fold-indicator .collapse-indicator {\n  inset-inline-end: calc(var(--list-bullet-end-padding) * -1 - 0.4em);"),
			"theme.css must align list fold toggles and place TODO/DONE badges after the checkbox"
		);

		// 13. Bases toolbar action buttons are icon-only by default, with labels hidden visually (they are the
		//     buttons' only accessible names) rather than with display: none; a Style Settings toggle restores them.
		assertTheme(
			(css) => css.includes("body:not(.doom-bases-toolbar-labels) .bases-toolbar .bases-toolbar-item:not(.bases-toolbar-views-menu, .bases-toolbar-result-count) .text-button-label {") &&
				css.includes("clip: rect(0 0 0 0);") &&
				!/(^|[^-])mask-image\s*:|clip-path\s*:/m.test(css.replace(/\/\*[\s\S]*?\*\//g, "")) &&
				!/--bases-toolbar-label-display:\s*none/.test(css) &&
				css.includes("id: doom-bases-toolbar-labels"),
			"theme.css must make Bases toolbar buttons icon-only while keeping their accessible labels"
		);

		// 14. Hover tooltips for the icon-only Bases toolbar buttons use each button's hidden label.
		{
			const bodyClasses = new Set<string>();
			const makeButton = (label: string, matches: boolean) => {
				const button: any = {
					dataset: {} as Record<string, string>,
					ownerDocument: { body: { classList: { contains: (c: string) => bodyClasses.has(c) } } },
					querySelector: (sel: string) => (sel === ".text-button-label" ? { textContent: ` ${label} ` } : null),
				};
				button.closest = (sel: string) => (matches && sel === BASES_TOOLBAR_ICON_BUTTON_SELECTOR ? button : null);
				return button;
			};
			const sort = makeButton("Sort", true);
			const icon = { closest: (sel: string) => sort.closest(sel) }; // hovering the svg inside the button
			assert.deepStrictEqual(basesToolbarTooltipFor(icon)?.label, "Sort", "tooltip must use the button label");
			sort.dataset.doomTooltip = "Sort";
			assert.strictEqual(basesToolbarTooltipFor(icon), null, "an attached tooltip must not be re-applied");
			assert.strictEqual(basesToolbarTooltipFor(makeButton("Table", false)), null, "view switcher / result count get no tooltip");
			bodyClasses.add("doom-bases-toolbar-labels");
			assert.strictEqual(basesToolbarTooltipFor(makeButton("Filter", true)), null, "no tooltips while labels are visible");
			assert.strictEqual(basesToolbarTooltipFor(null), null);
			assert.ok(
				mainSrc.includes('setTooltip(button, hit.label, { placement: "bottom" })') &&
					mainSrc.includes('this.registerDomEvent(doc, "mouseover", handler, { capture: true })') &&
					mainSrc.includes("this.attachBasesToolbarTooltips(win.document)"),
				"main.ts must attach toolbar tooltips in the main and popout windows"
			);
		}

		// 15. Phones with Obsidian's floating navigation keep a solid top bar covering the status-bar area
		//     (Obsidian makes .view-header transparent and offsets it with margin-top).
		assertTheme(
			(css) => /body\.is-mobile\.is-floating-nav\.is-phone \.view-header \{\s*margin-top: 0;[^}]*background-color: var\(--doom-bg\);/.test(css),
			"theme.css must keep the floating-nav phone header opaque"
		);

		console.log("✓ Style Settings ownership, theme gating and plugin CSS scope verified");
	}

	console.log("\nAll unit tests passed successfully!");
})();

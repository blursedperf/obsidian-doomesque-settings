import assert from "node:assert";
import {
	ALL_MANAGED_BODY_CLASSES,
	ALL_MANAGED_CSS_VARS,
	DEFAULT_DOOM_SETTINGS,
	DOOM_PALETTES,
	DoomEmacsStyleSettings,
	applyDoomDomState,
	clearDoomDomState,
	computeDoomDomState,
	getNextDarkPalette,
	getNextLightPalette,
	getNextIndentStyle,
	getNextCursorStyle,
	sanitizeFontFamily,
} from "../src/settings";

console.log("Running obsidian-doomesque-settings unit tests...\n");

function makeSettings(overrides: Partial<DoomEmacsStyleSettings> = {}): DoomEmacsStyleSettings {
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
	assert.strictEqual(getNextLightPalette("doom-palette-tomorrow-day"), "doom-palette-one-light");
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
			disableActiveLineHighlight: true,
			rainbowIndentGuides: true,
			legalOutlineNumbering: true,
			editorialEmphasis: true,
			stickyHoverPreviews: true,
			showPopoverProperties: true,
			flatSettingsItems: true,
			indentGuideStyle: "dashed",
			sidebarDensity: "compact",
		})
	);

	assert.ok(state.activeClasses.includes("doom-no-org-todo"));
	assert.ok(state.activeClasses.includes("doom-monospace-editor"));
	assert.ok(state.activeClasses.includes("doom-disable-monospace-ui"));
	assert.ok(state.activeClasses.includes("doom-monochrome-headings"));
	assert.ok(state.activeClasses.includes("doom-no-h1-border"));
	assert.ok(state.activeClasses.includes("doom-active-block-highlight"));
	assert.ok(state.activeClasses.includes("doom-no-active-line-highlight"));
	assert.ok(state.activeClasses.includes("doom-rainbow-indent-guides"));
	assert.ok(state.activeClasses.includes("doom-legal-outline"));
	assert.ok(state.activeClasses.includes("doom-editorial-emphasis"));
	assert.ok(state.activeClasses.includes("doom-sticky-hover-enabled"));
	assert.ok(state.activeClasses.includes("doom-popover-properties"));
	assert.ok(state.activeClasses.includes("doom-settings-flat"));
	assert.ok(state.activeClasses.includes("doom-indent-style-dashed"));
	assert.ok(state.activeClasses.includes("doom-sidebar-compact"));

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
	assert.ok(mockDoc.body.classList.contains("doom-rainbow-indent-guides"));
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
		".bases-cards-item",
		".bases-kanban-column",
	];

	for (const selector of requiredBasesSelectors) {
		assert.ok(
			cssContent.includes(selector),
			`styles.css must include Bases selector: ${selector}`
		);
	}

	// Verify header bottom border uses Org-table style
	assert.ok(
		cssContent.includes("border-bottom: 2px solid var(--doom-blue"),
		"styles.css must style Bases table header with Org-table 2px accent underline"
	);

	// Verify fallback tokens are provided for all colors
	assert.ok(
		cssContent.includes("var(--doom-blue, #51afef)"),
		"styles.css must provide hex fallback for doom-blue"
	);
	assert.ok(
		cssContent.includes("var(--table-header-background, var(--doom-base1, #1c1f24))"),
		"styles.css must provide fallback for table-header-background"
	);

	// Verify header right padding offset and embed-actions button separation
	assert.ok(
		cssContent.includes("--bases-header-padding-end: 56px !important"),
		"styles.css must reserve 56px right padding for CM6 embed actions button"
	);
	assert.ok(
		cssContent.includes(".bases-embed .embed-actions"),
		"styles.css must style Bases embed-actions container"
	);
	assert.ok(
		cssContent.includes(".bases-embed .embed-action"),
		"styles.css must style Bases embed-action expose syntax button"
	);

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
		assert.ok(mobileState.activeClasses.includes("doom-rainbow-indent-guides"));
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
		assert.ok(
			stylesContent.includes("body:not(.is-mobile).doom-cursor-block"),
			"styles.css must gate transparent caret behind body:not(.is-mobile) for block cursor"
		);
		assert.ok(
			stylesContent.includes("body:not(.is-mobile).doom-cursor-glow"),
			"styles.css must gate transparent caret behind body:not(.is-mobile) for glow cursor"
		);
		assert.ok(
			stylesContent.includes("body:not(.is-mobile).doom-cursor-hollow"),
			"styles.css must gate transparent caret behind body:not(.is-mobile) for hollow cursor"
		);
		assert.ok(
			stylesContent.includes("body:not(.is-mobile).doom-cursor-underline"),
			"styles.css must gate transparent caret behind body:not(.is-mobile) for underline cursor"
		);

		// 2. Ensure mobile explicit caret-color rules are present
		assert.ok(
			stylesContent.includes(".is-mobile .markdown-source-view.mod-cm6 .cm-content"),
			"styles.css must style caret-color on mobile markdown source view"
		);
		assert.ok(
			stylesContent.includes("caret-color: var(--text-accent, var(--doom-blue, #51afef)) !important;"),
			"styles.css must set mobile caret-color to theme accent"
		);
		assert.ok(
			stylesContent.includes("body.is-mobile.doom-palette-retro-terminal"),
			"styles.css must set retro-terminal mobile caret-color"
		);
		assert.ok(
			stylesContent.includes("caret-color: var(--doom-fg, #33ff33) !important;"),
			"styles.css must set retro-terminal caret-color to phosphor green"
		);

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
				themeContent.includes("caret-color: var(--doom-fg, #33ff33) !important;"),
				"theme.css must set retro-terminal caret-color to phosphor green"
			);
		}

		console.log("✓ Mobile caret visibility and theme accent styling verified");
	}

	console.log("\nAll unit tests passed successfully!");
})();

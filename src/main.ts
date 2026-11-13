import { App, Notice, Platform, Plugin, PluginSettingTab, Setting, setTooltip } from "obsidian";
import type { SettingDefinition, SettingDefinitionItem } from "obsidian";
import { SETTINGS_SECTIONS, SettingKey, SettingSpec, findSettingSpec, isSharedSetting, normalizeSettingValue } from "./settingsSchema";
import { Prec } from "@codemirror/state";
import { EditorView, drawSelection } from "@codemirror/view";
import { HoverPreviewManager } from "./hoverPreview";
import { BASES_TOOLTIP_DATA_KEY, basesToolbarTooltipFor } from "./basesToolbar";
import {
	DOOM_PALETTES,
	DOOM_LIGHT_PALETTES,
	DOOM_CURSOR_STYLES,
	DEFAULT_DOOM_SETTINGS,
	DoomEsqueStyleSettings,
	applyDoomDomState,
	clearDoomDomState,
	computeDoomDomState,
	getNextDarkPalette,
	getNextLightPalette,
	getNextIndentStyle,
	getNextCursorStyle,
	migrateSettings,
	DOOMESQUE_THEME_NAME,
	STYLE_SETTINGS_PLUGIN_ID,
	DoomDomOptions,
} from "./settings";

/**
 * drawSelection makes the outer note editor paint the *native* selection of any focused element
 * nested in its content with the system `Highlight` colour (`.cm-content :focus ::selection`,
 * marked !important), ignoring the theme. That showed up in two places:
 *  - while click-dragging in a table cell that is not yet being edited, the rendered cell's
 *    native selection was the system highlight (light and washed out) until mouse-up;
 *  - inside a cell being edited (a nested CodeMirror with its own drawn selection) the system
 *    highlight was stacked over the drawn one.
 * So nested native selections use the theme's --text-selection, and lines of nested editors
 * hide theirs because those editors draw their own. !important is required to override an
 * !important declaration. Specificity (each includes CodeMirror's scope class): CodeMirror's rule
 * is 0,3,0, the theme-colour rule 0,4,0 and the nested-editor-line rule 0,5,0. No child combinators:
 * Obsidian wraps .cm-content in .cm-contentContainer.
 */
const NESTED_NATIVE_SELECTION_FIX = Prec.highest(
	EditorView.theme({
		".cm-scroller .cm-content :focus::selection, .cm-scroller .cm-content :focus ::selection": {
			backgroundColor: "var(--text-selection) !important",
		},
		".cm-content .cm-editor .cm-content .cm-line::selection, .cm-content .cm-editor .cm-content .cm-line ::selection": {
			backgroundColor: "transparent !important",
		},
	})
);

export default class DoomEsqueSettingsPlugin extends Plugin {
	settings: DoomEsqueStyleSettings = { ...DEFAULT_DOOM_SETTINGS };
	hoverManager: HoverPreviewManager = new HoverPreviewManager(this);
	private trackedDocuments = new Set<Document>();

	async onload(): Promise<void> {
		// Register CodeMirror 6 drawSelection extension so custom cursors
		// (block, glow, hollow, underline) instantiate DOM elements (.cm-cursor).
		// CodeMirror 6 drawSelection is desktop-only; on iOS/mobile touch devices,
		// CodeMirror uses native WebKit selection for magnifier loupe and handles.
		if (Platform.isDesktop) {
			try {
				if (typeof drawSelection === "function") {
					this.registerEditorExtension([drawSelection(), NESTED_NATIVE_SELECTION_FIX]);
				}
			} catch (err) {
				console.warn("DoomEsque Settings: drawSelection registration skipped", err);
			}
		}

		try {
			await this.loadSettings();
			this.applyAllSettings();
		} catch (err) {
			console.error("DoomEsque Settings: error loading or applying settings", err);
		}

		// Desktop-only hover preview popover enhancement and multi-window tracking
		if (Platform.isDesktop) {
			try {
				this.hoverManager.init();
			} catch (err) {
				console.error("DoomEsque Settings: hover preview manager failed to init", err);
			}

			// Hover tooltips for the theme's icon-only Bases toolbar buttons
			this.attachBasesToolbarTooltips(activeDocument);

			// Update popout windows when opened (Obsidian 1.0+ desktop Electron popouts)
			try {
				this.registerEvent(
					this.app.workspace.on("window-open", (_leaf, win) => {
						if (win?.document) {
							this.trackedDocuments.add(win.document);
							this.applySettingsToDocument(win.document);
							this.attachBasesToolbarTooltips(win.document);
						}
						if (win) {
							this.hoverManager.registerWindow(win);
						}
					})
				);
			} catch (err) {
				console.warn("DoomEsque Settings: window-open listener registration skipped", err);
			}
		}

		// Re-apply when the active theme or CSS changes (theme switch, snippets, Style Settings).
		// Applying is diff-based, so this is cheap; layout changes no longer re-apply.
		try {
			this.registerEvent(
				this.app.workspace.on("css-change", () => {
					this.applyAllSettings();
				})
			);
		} catch (err) {
			console.warn("DoomEsque Settings: css-change listener registration skipped", err);
		}

		// Palette switcher / cycler (dark)
		this.addCommand({
			id: "cycle-dark-palette",
			name: "Cycle dark theme palette",
			callback: async () => {
				if (this.blockedByStyleSettings()) return;
				const nextPalette = getNextDarkPalette(this.settings.darkPalette);
				this.settings.darkPalette = nextPalette;
				await this.saveSettings();
				const paletteOption = DOOM_PALETTES.find((p) => p.id === nextPalette);
				new Notice(`DoomEsque: ${paletteOption?.label ?? nextPalette}`);
			},
		});

		// Palette switcher / cycler (light)
		this.addCommand({
			id: "cycle-light-palette",
			name: "Cycle light theme palette",
			callback: async () => {
				if (this.blockedByStyleSettings()) return;
				const nextPalette = getNextLightPalette(this.settings.lightPalette);
				this.settings.lightPalette = nextPalette;
				await this.saveSettings();
				const paletteOption = DOOM_LIGHT_PALETTES.find((p) => p.id === nextPalette);
				new Notice(`DoomEsque: ${paletteOption?.label ?? nextPalette}`);
			},
		});

		// Monospace editor toggle
		this.addCommand({
			id: "toggle-monospace-editor",
			name: "Toggle monospace note editor",
			callback: async () => {
				if (this.blockedByStyleSettings()) return;
				this.settings.monospaceEditor = !this.settings.monospaceEditor;
				await this.saveSettings();
				new Notice(
					`DoomEsque: Monospace editor ${this.settings.monospaceEditor ? "enabled" : "disabled"}`
				);
			},
		});

		// Org TODO badges toggle
		this.addCommand({
			id: "toggle-org-todo-badges",
			name: "Toggle Org-mode TODO/DONE task badges",
			callback: async () => {
				if (this.blockedByStyleSettings()) return;
				this.settings.disableOrgTodoBadges = !this.settings.disableOrgTodoBadges;
				await this.saveSettings();
				new Notice(
					`DoomEsque: Org TODO badges ${this.settings.disableOrgTodoBadges ? "hidden" : "visible"}`
				);
			},
		});

		// Rainbow indent guides toggle
		this.addCommand({
			id: "toggle-rainbow-indent-guides",
			name: "Toggle rainbow indentation guides",
			callback: async () => {
				if (this.blockedByStyleSettings()) return;
				this.settings.rainbowIndentGuides = !this.settings.rainbowIndentGuides;
				await this.saveSettings();
				new Notice(
					`DoomEsque: Rainbow indent guides ${this.settings.rainbowIndentGuides ? "enabled" : "disabled"}`
				);
			},
		});

		// Cycle indent guide styles (solid -> dashed -> dotted -> double -> none)
		this.addCommand({
			id: "cycle-indent-guide-style",
			name: "Cycle indentation guide style (solid, dashed, dotted, double, none)",
			callback: async () => {
				if (this.blockedByStyleSettings()) return;
				const nextStyle = getNextIndentStyle(this.settings.indentGuideStyle);
				this.settings.indentGuideStyle = nextStyle;
				await this.saveSettings();
				new Notice(`DoomEsque: Indent guide style set to '${nextStyle}'`);
			},
		});

		// Cursor style cycler
		this.addCommand({
			id: "cycle-cursor-style",
			name: "Cycle text cursor style (Bar → Block → Phosphor → Hollow → Underline)",
			callback: async () => {
				if (this.blockedByStyleSettings()) return;
				const nextStyle = getNextCursorStyle(this.settings.cursorStyle);
				this.settings.cursorStyle = nextStyle;
				await this.saveSettings();
				const opt = DOOM_CURSOR_STYLES.find((c) => c.id === nextStyle);
				new Notice(`DoomEsque Cursor: ${opt?.label ?? nextStyle}`);
			},
		});

		// Monochrome headings toggle
		this.addCommand({
			id: "toggle-monochrome-headings",
			name: "Toggle monochrome headings (vs Org rainbow)",
			callback: async () => {
				if (this.blockedByStyleSettings()) return;
				this.settings.monochromeHeadings = !this.settings.monochromeHeadings;
				await this.saveSettings();
				new Notice(
					`DoomEsque: Monochrome headings ${this.settings.monochromeHeadings ? "enabled" : "disabled"}`
				);
			},
		});

		// Active block highlight toggle
		this.addCommand({
			id: "toggle-active-block-highlight",
			name: "Toggle active block highlight (hl-line-mode)",
			callback: async () => {
				if (this.blockedByStyleSettings()) return;
				this.settings.activeBlockHighlight = !this.settings.activeBlockHighlight;
				await this.saveSettings();
				new Notice(
					`DoomEsque: Active block highlight ${this.settings.activeBlockHighlight ? "enabled" : "disabled"}`
				);
			},
		});

		// Flat settings rows toggle
		this.addCommand({
			id: "toggle-flat-settings-items",
			name: "Toggle flat settings items style",
			callback: async () => {
				if (this.blockedByStyleSettings()) return;
				this.settings.flatSettingsItems = !this.settings.flatSettingsItems;
				await this.saveSettings();
				new Notice(
					`DoomEsque: ${this.settings.flatSettingsItems ? "Flat" : "Card"} settings style enabled`
				);
			},
		});

		// Legal outline numbering toggle
		this.addCommand({
			id: "toggle-legal-outline-numbering",
			name: "Toggle legal / hornbook outline numbering (I, A, 1, a, i)",
			callback: async () => {
				if (this.blockedByStyleSettings()) return;
				this.settings.legalOutlineNumbering = !this.settings.legalOutlineNumbering;
				await this.saveSettings();
				new Notice(
					`DoomEsque: Legal outline numbering ${this.settings.legalOutlineNumbering ? "enabled" : "disabled"}`
				);
			},
		});

		// Editorial emphasis toggle
		this.addCommand({
			id: "toggle-editorial-emphasis",
			name: "Toggle editorial bold & italic colors",
			callback: async () => {
				if (this.blockedByStyleSettings()) return;
				this.settings.editorialEmphasis = !this.settings.editorialEmphasis;
				await this.saveSettings();
				new Notice(
					`DoomEsque: Editorial bold & italic colors ${this.settings.editorialEmphasis ? "enabled" : "disabled"}`
				);
			},
		});

		// Hover preview commands (desktop-only mouse hover features)
		if (Platform.isDesktop) {
			// Hover Preview: Open in Right Sidebar
			this.addCommand({
				id: "open-active-preview-in-right-sidebar",
				name: "Open active preview in right sidebar",
				callback: async () => {
					const activePopover = this.hoverManager.getActiveHoverPopoverEl();
					const linktext = activePopover?.dataset.doomLinktext;
					const sourcePath = activePopover?.dataset.doomSourcePath || "";
					if (linktext) {
						await this.hoverManager.openInRightSidebar(linktext, sourcePath);
					} else {
						new Notice("DoomEsque: No active preview found");
					}
				},
			});

			// Hover Preview: Toggle Sticky
			this.addCommand({
				id: "toggle-sticky-hover-previews",
				name: "Toggle sticky hover preview windows",
				callback: async () => {
					this.settings.stickyHoverPreviews = !this.settings.stickyHoverPreviews;
					await this.saveSettings();
					new Notice(
						`DoomEsque: Sticky hover previews ${this.settings.stickyHoverPreviews ? "enabled" : "disabled"}`
					);
				},
			});

			// Hover Preview: Toggle note properties
			this.addCommand({
				id: "toggle-popover-properties",
				name: "Toggle note properties in hover previews",
				callback: async () => {
					if (this.blockedByStyleSettings()) return;
					this.settings.showPopoverProperties = !this.settings.showPopoverProperties;
					await this.saveSettings();
					new Notice(
						`DoomEsque: ${
							this.settings.showPopoverProperties ? "Showing" : "Hiding"
						} properties in hover previews`
					);
				},
			});

			// Hover Preview: Close active popover
			this.addCommand({
				id: "close-active-hover-preview",
				name: "Close active hover preview",
				callback: () => {
					const active = this.hoverManager.getActiveHoverPopoverEl();
					if (active) {
						this.hoverManager.closeHoverPopoverEl(active);
					}
				},
			});

			// Hover Preview: Close all popovers
			this.addCommand({
				id: "close-all-hover-previews",
				name: "Close all hover previews",
				callback: () => {
					this.hoverManager.closeAllHoverPopovers(true);
					new Notice("DoomEsque: Closed all hover preview windows");
				},
			});
		}

		this.addSettingTab(new DoomEsqueSettingTab(this.app, this));
	}

	onunload(): void {
		if (Platform.isDesktop) {
			try {
				this.hoverManager.destroy();
			} catch (err) {
				console.warn("DoomEsque Settings: hoverManager cleanup skipped", err);
			}
		}
		try {
			this.clearAllDocuments();
		} catch (err) {
			console.warn("DoomEsque Settings: clearAllDocuments skipped", err);
		}
		this.trackedDocuments.clear();
	}

	async loadSettings(): Promise<void> {
		const saved = (await this.loadData()) as Partial<DoomEsqueStyleSettings> | null;
		this.settings = Object.assign({}, DEFAULT_DOOM_SETTINGS, saved);
		// Pre-1.0 data stored the inverse flag `disableActiveLineHighlight`; read it once from the raw
		// saved object (it is not part of the settings type) and drop it.
		const legacyFlag: unknown = saved ? Reflect.get(saved, "disableActiveLineHighlight") : undefined;
		if (saved?.activeBlockHighlight === undefined && typeof legacyFlag === "boolean") {
			this.settings.activeBlockHighlight = !legacyFlag;
		}
		Reflect.deleteProperty(this.settings, "disableActiveLineHighlight");
		if (migrateSettings(saved, this.settings)) {
			await this.saveData(this.settings);
		}
	}

	async saveSettings(): Promise<void> {
		await this.saveData(this.settings);
		this.applyAllSettings();
		if (Platform.isDesktop) {
			try {
				this.hoverManager.updateOpenPopovers();
			} catch (err) {
				console.warn("DoomEsque Settings: updateOpenPopovers skipped", err);
			}
		}
	}

	private getAllDocuments(): Document[] {
		const docs: Document[] = [];
		const mainDoc = this.app.workspace.containerEl?.ownerDocument;
		if (mainDoc) {
			docs.push(mainDoc);
		}

		if (
			typeof activeDocument !== "undefined" &&
			activeDocument &&
			!docs.includes(activeDocument)
		) {
			docs.push(activeDocument);
		}

		for (const doc of this.trackedDocuments) {
			try {
				if (doc && doc.defaultView && !doc.defaultView.closed && !docs.includes(doc)) {
					docs.push(doc);
				}
			} catch {
				/* ignore detached window checks */
			}
		}

		// Handle Obsidian popout/floating windows
		const workspace = this.app.workspace as unknown as {
			floatingSplit?: {
				children?: Array<{
					doc?: Document;
					containerEl?: HTMLElement;
				}>;
			};
		};

		if (workspace?.floatingSplit?.children) {
			for (const child of workspace.floatingSplit.children) {
				const winDoc = child?.doc ?? child?.containerEl?.ownerDocument;
				if (winDoc && !docs.includes(winDoc)) {
					docs.push(winDoc);
				}
			}
		}

		return docs;
	}

	/**
	 * The theme shows Bases toolbar action buttons as icons only. Attach Obsidian's tooltip, using
	 * the button's (visually hidden) label, the first time a button is hovered or focused. Capture
	 * phase so the tooltip is in place before Obsidian's own hover handling for this same event;
	 * attaching lazily covers toolbars rendered later (views, embeds) without a MutationObserver.
	 */
	attachBasesToolbarTooltips(doc: Document): void {
		const handler = (evt: Event) => {
			const hit = basesToolbarTooltipFor(evt.target);
			if (!hit) return;
			const button = hit.button as unknown as HTMLElement;
			setTooltip(button, hit.label, { placement: "bottom" });
			button.dataset[BASES_TOOLTIP_DATA_KEY] = hit.label;
		};
		this.registerDomEvent(doc, "mouseover", handler, { capture: true });
		this.registerDomEvent(doc, "focusin", handler, { capture: true });
	}

	/** True when the Style Settings plugin is enabled; it then owns the options both plugins expose. */
	isStyleSettingsEnabled(): boolean {
		const plugins = (this.app as unknown as { plugins?: { enabledPlugins?: Set<string> } }).plugins;
		return plugins?.enabledPlugins?.has(STYLE_SETTINGS_PLUGIN_ID) ?? false;
	}

	/** True when DoomEsque is the active community theme (assumed true if Obsidian hides the config). */
	isDoomEsqueThemeActive(): boolean {
		const vault = this.app.vault as unknown as { getConfig?: (key: string) => unknown };
		if (typeof vault.getConfig !== "function") {
			return true;
		}
		return vault.getConfig("cssTheme") === DOOMESQUE_THEME_NAME;
	}

	getDomOptions(): DoomDomOptions {
		return { deferToStyleSettings: this.isStyleSettingsEnabled() };
	}

	/**
	 * Settings as they are actually in effect. While Style Settings owns the shared options,
	 * hover preview behaviour follows the classes and variables it has applied.
	 */
	getEffectiveSettings(): DoomEsqueStyleSettings {
		if (!this.isStyleSettingsEnabled()) {
			return this.settings;
		}
		const body = this.app.workspace.containerEl?.ownerDocument?.body ?? activeDocument.body;
		const styles = getComputedStyle(body);
		const px = (name: string, fallback: number): number => {
			const value = parseFloat(styles.getPropertyValue(name));
			return Number.isFinite(value) && value > 0 ? value : fallback;
		};
		return {
			...this.settings,
			showPopoverProperties: body.classList.contains("doom-popover-properties"),
			hoverPopoverWidthPx: px("--popover-width", DEFAULT_DOOM_SETTINGS.hoverPopoverWidthPx),
			hoverPopoverHeightPx: px("--popover-height", DEFAULT_DOOM_SETTINGS.hoverPopoverHeightPx),
		};
	}

	/** Shows a notice and returns true when a command would change an option Style Settings owns. */
	blockedByStyleSettings(): boolean {
		if (!this.isStyleSettingsEnabled()) {
			return false;
		}
		new Notice("DoomEsque: this option is managed by Style Settings while it is enabled.");
		return true;
	}

	applyAllSettings(): void {
		for (const doc of this.getAllDocuments()) {
			this.applySettingsToDocument(doc);
		}
	}

	applySettingsToDocument(doc: Document): void {
		const options = this.getDomOptions();
		if (!this.isDoomEsqueThemeActive()) {
			// Another theme is active: leave the page exactly as that theme expects.
			clearDoomDomState(doc, options);
			return;
		}
		applyDoomDomState(doc, computeDoomDomState(this.settings, options));
	}

	clearAllDocuments(): void {
		const options = this.getDomOptions();
		for (const doc of this.getAllDocuments()) {
			clearDoomDomState(doc, options);
		}
	}
}

class DoomEsqueSettingTab extends PluginSettingTab {
	plugin: DoomEsqueSettingsPlugin;

	constructor(app: App, plugin: DoomEsqueSettingsPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	/** Disabled while Style Settings owns the option (see STYLE_SETTINGS_SHARED_KEYS). */
	private isDeferred(key: SettingKey): boolean {
		return isSharedSetting(key) && this.plugin.isStyleSettingsEnabled();
	}

	private static readonly THEME_INACTIVE_NOTICE =
		"The DoomEsque theme is not the active theme, so these settings are not applied. They take effect when you switch to DoomEsque in Settings → Appearance.";
	private static readonly STYLE_SETTINGS_NOTICE =
		"Style Settings is enabled, so it controls the palette, spacing, indentation, typography, cursor and hover preview size options that both plugins offer (Style Settings → DoomEsque). Those settings are disabled here; the remaining options still apply.";

	private async resetToDefaults(): Promise<void> {
		this.plugin.settings = { ...DEFAULT_DOOM_SETTINGS };
		await this.plugin.saveSettings();
		this.refreshTab();
		new Notice("DoomEsque settings have been reset to defaults.");
	}

	/** Re-render after the stored values change: declaratively on 1.13+, imperatively before. */
	private refreshTab(): void {
		// update() exists from Obsidian 1.13 (declarative tabs); detect it at runtime rather than
		// referencing the typed API, since minAppVersion still supports older versions.
		const update: unknown = Reflect.get(this, "update");
		if (typeof update === "function") {
			update.call(this);
		} else {
			this.renderLegacy();
		}
	}

	// ---------------------------------------------------------------------
	// Obsidian 1.13+: declarative rendering (also indexes the settings for search)
	// ---------------------------------------------------------------------
	getSettingDefinitions(): SettingDefinitionItem[] {
		const status: SettingDefinitionItem[] = [
			{ name: "DoomEsque theme is not active", desc: DoomEsqueSettingTab.THEME_INACTIVE_NOTICE, searchable: false, visible: () => !this.plugin.isDoomEsqueThemeActive() },
			{ name: "Style Settings is enabled", desc: DoomEsqueSettingTab.STYLE_SETTINGS_NOTICE, searchable: false, visible: () => this.plugin.isStyleSettingsEnabled() },
		];
		const sections: SettingDefinitionItem[] = SETTINGS_SECTIONS.map((section) => ({
			type: "group" as const,
			heading: section.heading,
			items: section.items.map((spec) => this.toDefinition(spec)),
		}));
		const reset: SettingDefinitionItem = {
			type: "group",
			heading: "Reset defaults",
			items: [
				{
					name: "Reset all settings to DoomEsque defaults",
					desc: "Restores all palette faces, spacing, indentation guide, and typography options to default DoomEsque theme values.",
					action: () => void this.resetToDefaults(),
				},
			],
		};
		return [...status, ...sections, reset];
	}

	private toDefinition(spec: SettingSpec): SettingDefinition {
		const disabled = () => this.isDeferred(spec.key);
		const key = spec.key as string;
		const c = spec.control;
		const base = { name: spec.name, desc: spec.desc };
		switch (c.type) {
			case "toggle":
				return { ...base, control: { type: "toggle", key, disabled } };
			case "dropdown":
				return { ...base, control: { type: "dropdown", key, options: c.options, disabled } };
			case "slider":
				return { ...base, control: { type: "slider", key, min: c.min, max: c.max, step: c.step, displayFormat: c.format, disabled } };
			case "text":
				return { ...base, control: { type: "text", key, placeholder: c.placeholder, disabled } };
		}
	}

	getControlValue(key: string): unknown {
		return (this.plugin.settings as unknown as Record<string, unknown>)[key];
	}

	/** Route every change through saveSettings() so it is applied to the page immediately. */
	async setControlValue(key: string, value: unknown): Promise<void> {
		const spec = findSettingSpec(key);
		if (!spec) return;
		(this.plugin.settings as unknown as Record<string, unknown>)[key] = normalizeSettingValue(spec, value);
		await this.plugin.saveSettings();
	}

	// ---------------------------------------------------------------------
	// Obsidian < 1.13: imperative rendering from the same schema
	// (not called on 1.13+, where the definitions above are rendered instead)
	// ---------------------------------------------------------------------
	display(): void {
		this.renderLegacy();
	}

	private renderLegacy(): void {
		const { containerEl } = this;
		containerEl.empty();

		if (!this.plugin.isDoomEsqueThemeActive()) {
			containerEl.createDiv({ cls: "doom-settings-banner", text: DoomEsqueSettingTab.THEME_INACTIVE_NOTICE });
		}
		if (this.plugin.isStyleSettingsEnabled()) {
			containerEl.createDiv({ cls: "doom-settings-banner", text: DoomEsqueSettingTab.STYLE_SETTINGS_NOTICE });
		}

		for (const section of SETTINGS_SECTIONS) {
			new Setting(containerEl).setName(section.heading).setHeading();
			for (const spec of section.items) {
				this.renderLegacySetting(containerEl, spec);
			}
		}

		new Setting(containerEl).setName("Reset defaults").setHeading();
		new Setting(containerEl)
			.setName("Reset all settings to DoomEsque defaults")
			.setDesc("Restores all palette faces, spacing, indentation guide, and typography options to default DoomEsque theme values.")
			.addButton((button) =>
				button
					.setButtonText("Reset to Defaults")
					.setClass("mod-warning")
					.onClick(() => void this.resetToDefaults())
			);
	}

	private renderLegacySetting(containerEl: HTMLElement, spec: SettingSpec): void {
		const setting = new Setting(containerEl).setName(spec.name).setDesc(spec.desc);
		const value = this.getControlValue(spec.key);
		const save = (v: unknown) => this.setControlValue(spec.key, v);
		const c = spec.control;
		switch (c.type) {
			case "toggle":
				setting.addToggle((t) => t.setValue(Boolean(value)).onChange(save));
				break;
			case "dropdown":
				setting.addDropdown((d) => d.addOptions(c.options).setValue(String(value)).onChange(save));
				break;
			case "text":
				setting.addText((t) => t.setPlaceholder(c.placeholder ?? "").setValue(typeof value === "string" ? value : "").onChange(save));
				break;
			case "slider": {
				const badge = setting.controlEl.createSpan({ cls: "doom-settings-slider-value", text: c.format(Number(value)) });
				setting.addSlider((sl) =>
					sl
						.setLimits(c.min, c.max, c.step)
						.setValue(Number(value))
						.onChange((v) => {
							badge.setText(c.format(v));
							void save(v);
						})
				);
				break;
			}
		}
		if (this.isDeferred(spec.key)) {
			setting.setDisabled(true);
			setting.settingEl.addClass("doom-setting-deferred");
		}
	}
}

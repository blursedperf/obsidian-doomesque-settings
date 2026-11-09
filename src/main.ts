import { App, Notice, Platform, Plugin, PluginSettingTab, Setting } from "obsidian";
import { drawSelection } from "@codemirror/view";
import { HoverPreviewManager } from "./hoverPreview";
import {
	DOOM_PALETTES,
	DOOM_LIGHT_PALETTES,
	DOOM_CURSOR_STYLES,
	DEFAULT_DOOM_SETTINGS,
	DoomDarkPalette,
	DoomLightPalette,
	DoomCursorStyle,
	DoomEmacsStyleSettings,
	DoomIndentGuideStyle,
	DoomSidebarDensity,
	applyDoomDomState,
	clearDoomDomState,
	computeDoomDomState,
	getNextDarkPalette,
	getNextLightPalette,
	getNextIndentStyle,
	getNextCursorStyle,
	sanitizeFontFamily,
} from "./settings";

export default class DoomEsqueSettingsPlugin extends Plugin {
	settings: DoomEmacsStyleSettings = { ...DEFAULT_DOOM_SETTINGS };
	hoverManager: HoverPreviewManager = new HoverPreviewManager(this);

	async onload(): Promise<void> {
		// Register CodeMirror 6 drawSelection extension so custom cursors
		// (block, glow, hollow, underline) instantiate DOM elements (.cm-cursor).
		// CodeMirror 6 drawSelection is desktop-only; on iOS/mobile touch devices,
		// CodeMirror uses native WebKit selection for magnifier loupe and handles.
		if (Platform.isDesktop) {
			try {
				if (typeof drawSelection === "function") {
					this.registerEditorExtension(drawSelection());
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

			// Update popout windows when opened (Obsidian 1.0+ desktop Electron popouts)
			try {
				this.registerEvent(
					this.app.workspace.on("window-open", (_leaf, win) => {
						if (win?.document) {
							this.applySettingsToDocument(win.document);
						}
						if (win) {
							this.hoverManager.registerWindow(win as unknown as Window);
						}
					})
				);
			} catch (err) {
				console.warn("DoomEsque Settings: window-open listener registration skipped", err);
			}
		}

		// Palette switcher / cycler (dark)
		this.addCommand({
			id: "cycle-dark-palette",
			name: "Cycle dark theme palette",
			callback: async () => {
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
				this.settings.monochromeHeadings = !this.settings.monochromeHeadings;
				await this.saveSettings();
				new Notice(
					`DoomEsque: Monochrome headings ${this.settings.monochromeHeadings ? "enabled" : "disabled"}`
				);
			},
		});

		// Flat settings rows toggle
		this.addCommand({
			id: "toggle-flat-settings-items",
			name: "Toggle flat settings items style",
			callback: async () => {
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
	}

	async loadSettings(): Promise<void> {
		const saved = (await this.loadData()) as Partial<DoomEmacsStyleSettings> | null;
		this.settings = Object.assign({}, DEFAULT_DOOM_SETTINGS, saved);
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
		if (typeof document !== "undefined" && document) {
			docs.push(document);
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

		if (
			typeof activeDocument !== "undefined" &&
			activeDocument &&
			!docs.includes(activeDocument)
		) {
			docs.push(activeDocument);
		}

		return docs;
	}

	applyAllSettings(): void {
		const computed = computeDoomDomState(this.settings);
		for (const doc of this.getAllDocuments()) {
			applyDoomDomState(doc, computed);
		}
	}

	applySettingsToDocument(doc: Document): void {
		const computed = computeDoomDomState(this.settings);
		applyDoomDomState(doc, computed);
	}

	clearAllDocuments(): void {
		for (const doc of this.getAllDocuments()) {
			clearDoomDomState(doc);
		}
	}
}

class DoomEsqueSettingTab extends PluginSettingTab {
	plugin: DoomEsqueSettingsPlugin;

	constructor(app: App, plugin: DoomEsqueSettingsPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		new Setting(containerEl).setName("DoomEsque Settings").setHeading();

		// ---------------------------------------------------------------------
		// 1. Color Palette & Faces
		// ---------------------------------------------------------------------
		new Setting(containerEl).setName("Color palette & theme faces").setHeading();

		new Setting(containerEl)
			.setName("Dark theme palette")
			.setDesc("Choose which authentic Doom color scheme to apply in Dark Mode.")
			.addDropdown((dropdown) => {
				for (const palette of DOOM_PALETTES) {
					dropdown.addOption(palette.id, palette.label);
				}
				dropdown.setValue(this.plugin.settings.darkPalette);
				dropdown.onChange(async (val) => {
					this.plugin.settings.darkPalette = val as DoomDarkPalette;
					await this.plugin.saveSettings();
				});
			});

		new Setting(containerEl)
			.setName("Light theme palette")
			.setDesc("Choose which authentic Doom color scheme to apply in Light Mode.")
			.addDropdown((dropdown) => {
				for (const palette of DOOM_LIGHT_PALETTES) {
					dropdown.addOption(palette.id, palette.label);
				}
				dropdown.setValue(this.plugin.settings.lightPalette);
				dropdown.onChange(async (val) => {
					this.plugin.settings.lightPalette = val as DoomLightPalette;
					await this.plugin.saveSettings();
				});
			});

		new Setting(containerEl)
			.setName("Disable Org-mode TODO / DONE task badges")
			.setDesc("Hide the explicit TODO and DONE badges displayed alongside task checkboxes.")
			.addToggle((toggle) => {
				toggle
					.setValue(this.plugin.settings.disableOrgTodoBadges)
					.onChange(async (val) => {
						this.plugin.settings.disableOrgTodoBadges = val;
						await this.plugin.saveSettings();
					});
			});

		new Setting(containerEl)
			.setName("Monochrome headings")
			.setDesc(
				"Use a uniform Doom blue for all headings instead of Org-mode rainbow colors (Blue, Magenta, Violet, Orange, Green, Teal)."
			)
			.addToggle((toggle) => {
				toggle
					.setValue(this.plugin.settings.monochromeHeadings)
					.onChange(async (val) => {
						this.plugin.settings.monochromeHeadings = val;
						await this.plugin.saveSettings();
					});
			});

		new Setting(containerEl)
			.setName("Disable H1 underline border")
			.setDesc("Hide the subtle bottom accent underline under Level 1 headings.")
			.addToggle((toggle) => {
				toggle
					.setValue(this.plugin.settings.disableH1Border)
					.onChange(async (val) => {
						this.plugin.settings.disableH1Border = val;
						await this.plugin.saveSettings();
					});
			});

		new Setting(containerEl)
			.setName("Disable active line highlight (hl-line-mode)")
			.setDesc("Turn off the subtle horizontal background highlight on the cursor's active line.")
			.addToggle((toggle) => {
				toggle
					.setValue(this.plugin.settings.disableActiveLineHighlight)
					.onChange(async (val) => {
						this.plugin.settings.disableActiveLineHighlight = val;
						await this.plugin.saveSettings();
					});
			});

		new Setting(containerEl)
			.setName("Flat settings items style")
			.setDesc(
				"Use clean border-delimited flat rows instead of rounded card boxes for settings items."
			)
			.addToggle((toggle) => {
				toggle
					.setValue(this.plugin.settings.flatSettingsItems)
					.onChange(async (val) => {
						this.plugin.settings.flatSettingsItems = val;
						await this.plugin.saveSettings();
					});
			});

		// ---------------------------------------------------------------------
		// 2. Spacing & Layout Rhythm
		// ---------------------------------------------------------------------
		new Setting(containerEl).setName("Spacing & layout rhythm").setHeading();

		this.createSliderSetting({
			containerEl,
			name: "Readable line width",
			desc: "Max width of readable note buffers in rem units (Default: 46 rem).",
			min: 30,
			max: 80,
			step: 1,
			value: this.plugin.settings.fileLineWidthRem,
			formatValue: (v) => `${v} rem`,
			onChange: async (v) => {
				this.plugin.settings.fileLineWidthRem = v;
				await this.plugin.saveSettings();
			},
		});

		this.createSliderSetting({
			containerEl,
			name: "Editor line height",
			desc: "Line height for reading and editing note buffers (Default: 1.65).",
			min: 1.2,
			max: 2.2,
			step: 0.05,
			value: this.plugin.settings.lineHeightNormal,
			formatValue: (v) => v.toFixed(2),
			onChange: async (v) => {
				this.plugin.settings.lineHeightNormal = v;
				await this.plugin.saveSettings();
			},
		});

		this.createSliderSetting({
			containerEl,
			name: "Paragraph spacing",
			desc: "Vertical spacing between markdown paragraphs in rem units (Default: 1.15 rem).",
			min: 0.4,
			max: 2.5,
			step: 0.05,
			value: this.plugin.settings.paragraphSpacingRem,
			formatValue: (v) => `${v.toFixed(2)} rem`,
			onChange: async (v) => {
				this.plugin.settings.paragraphSpacingRem = v;
				await this.plugin.saveSettings();
			},
		});

		this.createSliderSetting({
			containerEl,
			name: "Heading spacing scale",
			desc: "Multiplier for top and bottom breathing room around headings (Default: 1.00x).",
			min: 0.5,
			max: 2.0,
			step: 0.05,
			value: this.plugin.settings.headingSpacingScale,
			formatValue: (v) => `${v.toFixed(2)}x`,
			onChange: async (v) => {
				this.plugin.settings.headingSpacingScale = v;
				await this.plugin.saveSettings();
			},
		});

		this.createSliderSetting({
			containerEl,
			name: "List item vertical spacing",
			desc: "Vertical gap between list items and task list checkboxes in em units (Default: 0.22 em).",
			min: 0.0,
			max: 0.8,
			step: 0.02,
			value: this.plugin.settings.listSpacingEm,
			formatValue: (v) => `${v.toFixed(2)} em`,
			onChange: async (v) => {
				this.plugin.settings.listSpacingEm = v;
				await this.plugin.saveSettings();
			},
		});

		this.createSliderSetting({
			containerEl,
			name: "Editor vertical page margins",
			desc: "Top and bottom padding inside note views in px (Default: 28 px).",
			min: 8,
			max: 80,
			step: 2,
			value: this.plugin.settings.editorMarginVerticalPx,
			formatValue: (v) => `${Math.round(v)} px`,
			onChange: async (v) => {
				this.plugin.settings.editorMarginVerticalPx = Math.round(v);
				await this.plugin.saveSettings();
			},
		});

		this.createSliderSetting({
			containerEl,
			name: "Editor horizontal page margins",
			desc: "Left and right padding inside note views in px (Default: 36 px).",
			min: 12,
			max: 120,
			step: 2,
			value: this.plugin.settings.editorMarginHorizontalPx,
			formatValue: (v) => `${Math.round(v)} px`,
			onChange: async (v) => {
				this.plugin.settings.editorMarginHorizontalPx = Math.round(v);
				await this.plugin.saveSettings();
			},
		});

		new Setting(containerEl)
			.setName("Sidebar item density")
			.setDesc("Vertical padding and compactness for the file explorer, outline, and sidebars.")
			.addDropdown((dropdown) => {
				dropdown.addOption("compact", "Compact (Dense list)");
				dropdown.addOption("normal", "Normal (Default)");
				dropdown.addOption("comfortable", "Comfortable (Spacious touch)");
				dropdown.setValue(this.plugin.settings.sidebarDensity);
				dropdown.onChange(async (val) => {
					this.plugin.settings.sidebarDensity = val as DoomSidebarDensity;
					await this.plugin.saveSettings();
				});
			});

		this.createSliderSetting({
			containerEl,
			name: "Desktop header bar height",
			desc: "Height of the top tab and workspace header bar in px (Default: 36 px).",
			min: 28,
			max: 48,
			step: 1,
			value: this.plugin.settings.headerHeightPx,
			formatValue: (v) => `${Math.round(v)} px`,
			onChange: async (v) => {
				this.plugin.settings.headerHeightPx = Math.round(v);
				await this.plugin.saveSettings();
			},
		});

		// ---------------------------------------------------------------------
		// 3. Indentation & Indent Guides
		// ---------------------------------------------------------------------
		new Setting(containerEl).setName("Indentation & indent guides").setHeading();

		this.createSliderSetting({
			containerEl,
			name: "List & outline indentation",
			desc: "Width of each nesting indentation step in lists and outlines (Default: 1.75 em).",
			min: 1.0,
			max: 3.5,
			step: 0.05,
			value: this.plugin.settings.listIndentEm,
			formatValue: (v) => `${v.toFixed(2)} em`,
			onChange: async (v) => {
				this.plugin.settings.listIndentEm = v;
				await this.plugin.saveSettings();
			},
		});

		new Setting(containerEl)
			.setName("Indentation guide line style")
			.setDesc(
				"Visual stroke style of vertical indent guides (inspired by Emacs highlight-indent-guides / indent-bars)."
			)
			.addDropdown((dropdown) => {
				dropdown.addOption("solid", "Solid line (Default)");
				dropdown.addOption("dashed", "Dashed line");
				dropdown.addOption("dotted", "Dotted line");
				dropdown.addOption("double", "Double line");
				dropdown.addOption("none", "None (Hide guides)");
				dropdown.setValue(this.plugin.settings.indentGuideStyle);
				dropdown.onChange(async (val) => {
					this.plugin.settings.indentGuideStyle = val as DoomIndentGuideStyle;
					await this.plugin.saveSettings();
				});
			});

		this.createSliderSetting({
			containerEl,
			name: "Indentation guide line width",
			desc: "Thickness of vertical indentation guide lines in px (Default: 1.0 px).",
			min: 1.0,
			max: 4.0,
			step: 0.5,
			value: this.plugin.settings.indentGuideWidthPx,
			formatValue: (v) => `${v.toFixed(1)} px`,
			onChange: async (v) => {
				this.plugin.settings.indentGuideWidthPx = v;
				await this.plugin.saveSettings();
			},
		});

		new Setting(containerEl)
			.setName("Rainbow indent guides")
			.setDesc(
				"Color nested indentation depth guides using alternating Doom palette colors (Blue, Magenta, Violet, Orange, Green, Teal)."
			)
			.addToggle((toggle) => {
				toggle
					.setValue(this.plugin.settings.rainbowIndentGuides)
					.onChange(async (val) => {
						this.plugin.settings.rainbowIndentGuides = val;
						await this.plugin.saveSettings();
					});
			});

		new Setting(containerEl)
			.setName("Legal / hornbook outline numbering (I, A, 1, a, i)")
			.setDesc(
				"Use classic legal outline hierarchy (I. → A. → 1. → a. → i. → (1)) for nested ordered lists in Reading View."
			)
			.addToggle((toggle) => {
				toggle
					.setValue(this.plugin.settings.legalOutlineNumbering)
					.onChange(async (val) => {
						this.plugin.settings.legalOutlineNumbering = val;
						await this.plugin.saveSettings();
					});
			});

		this.createSliderSetting({
			containerEl,
			name: "File tree folder indentation",
			desc: "Indentation offset per nested directory level in the file explorer (Default: 14 px).",
			min: 6,
			max: 32,
			step: 2,
			value: this.plugin.settings.fileTreeIndentPx,
			formatValue: (v) => `${Math.round(v)} px`,
			onChange: async (v) => {
				this.plugin.settings.fileTreeIndentPx = Math.round(v);
				await this.plugin.saveSettings();
			},
		});

		// ---------------------------------------------------------------------
		// 4. Typography & Heading Scale
		// ---------------------------------------------------------------------
		new Setting(containerEl).setName("Typography & heading scale").setHeading();

		new Setting(containerEl)
			.setName("Editorial bold & italic colors")
			.setDesc(
				"Use high-contrast neutral text colors for bold and italic emphasis instead of orange/magenta syntax accents during long-form legal or academic reading."
			)
			.addToggle((toggle) => {
				toggle
					.setValue(this.plugin.settings.editorialEmphasis)
					.onChange(async (val) => {
						this.plugin.settings.editorialEmphasis = val;
						await this.plugin.saveSettings();
					});
			});

		new Setting(containerEl)
			.setName("Force monospace note editor")
			.setDesc(
				"Display note buffer body text in Doom monospace font for an authentic Emacs buffer feel."
			)
			.addToggle((toggle) => {
				toggle
					.setValue(this.plugin.settings.monospaceEditor)
					.onChange(async (val) => {
						this.plugin.settings.monospaceEditor = val;
						await this.plugin.saveSettings();
					});
			});

		new Setting(containerEl)
			.setName("System sans-serif UI chrome")
			.setDesc(
				"Revert sidebars, tabs, menus, and modals to system sans-serif font instead of monospace."
			)
			.addToggle((toggle) => {
				toggle
					.setValue(this.plugin.settings.disableMonospaceUi)
					.onChange(async (val) => {
						this.plugin.settings.disableMonospaceUi = val;
						await this.plugin.saveSettings();
					});
			});

		new Setting(containerEl)
			.setName("Text cursor style")
			.setDesc(
				"Choose the text cursor style in the note editor (modern 2px bar, or retro terminal block, glow, hollow, and underline)."
			)
			.addDropdown((dropdown) => {
				for (const opt of DOOM_CURSOR_STYLES) {
					dropdown.addOption(opt.id, opt.label);
				}
				dropdown.setValue(this.plugin.settings.cursorStyle);
				dropdown.onChange(async (val) => {
					this.plugin.settings.cursorStyle = val as DoomCursorStyle;
					await this.plugin.saveSettings();
				});
			});

		new Setting(containerEl)
			.setName("Custom monospace font family")
			.setDesc(
				"Custom font family prepended to the Doom monospace stack (e.g. 'JetBrains Mono', 'Iosevka', 'Fira Code'). Leave blank for default."
			)
			.addText((text) => {
				text
					.setPlaceholder("e.g. JetBrains Mono")
					.setValue(this.plugin.settings.customMonospaceFont)
					.onChange(async (val) => {
						this.plugin.settings.customMonospaceFont = sanitizeFontFamily(val);
						await this.plugin.saveSettings();
					});
			});

		this.createSliderSetting({
			containerEl,
			name: "Heading size scale",
			desc: "Proportional scale factor applied across all H1-H6 heading sizes (Default: 1.00x).",
			min: 0.8,
			max: 1.4,
			step: 0.05,
			value: this.plugin.settings.headingScale,
			formatValue: (v) => `${v.toFixed(2)}x`,
			onChange: async (v) => {
				this.plugin.settings.headingScale = v;
				await this.plugin.saveSettings();
			},
		});

		// ---------------------------------------------------------------------
		// 5. Hover Preview & Sidebar Pop-Open (Desktop)
		// ---------------------------------------------------------------------
		new Setting(containerEl).setName("Hover preview & sidebar pop-open (Desktop)").setHeading();

		this.createSliderSetting({
			containerEl,
			name: "Hover preview width",
			desc: "Width of page preview popover windows in px (Default: 550 px).",
			min: 320,
			max: 1200,
			step: 20,
			value: this.plugin.settings.hoverPopoverWidthPx,
			formatValue: (v) => `${Math.round(v)} px`,
			onChange: async (v) => {
				this.plugin.settings.hoverPopoverWidthPx = Math.round(v);
				await this.plugin.saveSettings();
			},
		});

		this.createSliderSetting({
			containerEl,
			name: "Hover preview height",
			desc: "Height of page preview popover windows in px (Default: 420 px).",
			min: 220,
			max: 1000,
			step: 20,
			value: this.plugin.settings.hoverPopoverHeightPx,
			formatValue: (v) => `${Math.round(v)} px`,
			onChange: async (v) => {
				this.plugin.settings.hoverPopoverHeightPx = Math.round(v);
				await this.plugin.saveSettings();
			},
		});

		this.createSliderSetting({
			containerEl,
			name: "Hover preview text scale",
			desc: "Scale factor for note content, headings, and code inside hover preview windows (Default: 1.00x).",
			min: 0.8,
			max: 1.6,
			step: 0.05,
			value: this.plugin.settings.hoverPopoverFontScale,
			formatValue: (v) => `${v.toFixed(2)}x`,
			onChange: async (v) => {
				this.plugin.settings.hoverPopoverFontScale = v;
				await this.plugin.saveSettings();
			},
		});

		new Setting(containerEl)
			.setName("Sticky hover preview windows")
			.setDesc(
				"Keep hover preview windows open until explicitly closed (via ✕ button or Esc), allowing you to scroll, edit, and navigate the rest of the vault freely."
			)
			.addToggle((toggle) => {
				toggle
					.setValue(this.plugin.settings.stickyHoverPreviews)
					.onChange(async (val) => {
						this.plugin.settings.stickyHoverPreviews = val;
						await this.plugin.saveSettings();
					});
			});

		new Setting(containerEl)
			.setName("Pop open in right sidebar with Super key")
			.setDesc(
				"Pressing the Super (Meta/Win/Cmd) key while hovering over a link or an active preview pops the note open in the right sidebar."
			)
			.addToggle((toggle) => {
				toggle
					.setValue(this.plugin.settings.superKeyOpensRightSidebar)
					.onChange(async (val) => {
						this.plugin.settings.superKeyOpensRightSidebar = val;
						await this.plugin.saveSettings();
					});
			});

		new Setting(containerEl)
			.setName("Show note properties in hover previews")
			.setDesc(
				"Display frontmatter YAML properties (:PROPERTIES: drawer) at the top of note preview popover windows."
			)
			.addToggle((toggle) => {
				toggle
					.setValue(this.plugin.settings.showPopoverProperties)
					.onChange(async (val) => {
						this.plugin.settings.showPopoverProperties = val;
						await this.plugin.saveSettings();
					});
			});

		// ---------------------------------------------------------------------
		// 6. Reset Defaults
		// ---------------------------------------------------------------------
		new Setting(containerEl).setName("Reset defaults").setHeading();

		new Setting(containerEl)
			.setName("Reset all settings to DoomEsque defaults")
			.setDesc(
				"Restores all palette faces, spacing, indentation guide, and typography options to default DoomEsque theme values."
			)
			.addButton((button) => {
				button
					.setButtonText("Reset to Defaults")
					.setWarning()
					.onClick(async () => {
						this.plugin.settings = { ...DEFAULT_DOOM_SETTINGS };
						await this.plugin.saveSettings();
						this.display();
						new Notice("DoomEsque settings have been reset to defaults.");
					});
			});
	}

	private createSliderSetting(options: {
		containerEl: HTMLElement;
		name: string;
		desc: string;
		min: number;
		max: number;
		step: number;
		value: number;
		formatValue: (val: number) => string;
		onChange: (val: number) => Promise<void>;
	}): Setting {
		const setting = new Setting(options.containerEl)
			.setName(options.name)
			.setDesc(options.desc);

		const valueBadge = setting.controlEl.createSpan({
			cls: "doom-settings-slider-value",
			text: options.formatValue(options.value),
		});

		setting.addSlider((slider) => {
			slider
				.setLimits(options.min, options.max, options.step)
				.setValue(options.value)
				.setDynamicTooltip()
				.onChange(async (val) => {
					valueBadge.setText(options.formatValue(val));
					await options.onChange(val);
				});
		});

		return setting;
	}
}

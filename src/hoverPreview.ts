import { App, EventRef, HoverPopover, Notice, Platform, TFile } from "obsidian";
import type DoomEmacsSettingsPlugin from "./main";

export interface HoveredLinkInfo {
	linktext: string;
	sourcePath: string;
	targetEl: HTMLElement;
	timestamp: number;
}

export interface PopoverMetadataEditor {
	collapsed?: boolean;
	setCollapse(collapsed: boolean, animate?: boolean): void;
}

export interface PopoverEmbedComponent {
	linktext?: string;
	sourcePath?: string;
	metadataEditor?: PopoverMetadataEditor;
	constructor?: {
		collapseProperties?: boolean;
	};
}

export interface PatchedHoverPopover {
	_doomIsSticky?: boolean;
	_doomIsDragged?: boolean;
	_doomHasRendered?: boolean;
	_doomPopoverEl?: HTMLElement;
	hoverEl?: HTMLElement;
	targetEl?: HTMLElement;
	isFocused?: boolean;
	onHover?: boolean;
	embed?: PopoverEmbedComponent;
	hide?: (force?: boolean) => void;
	show?: () => void;
	shouldShow?: () => boolean;
	shouldShowSelf?: () => boolean;
	position?: () => void;
}

export interface PopoverHTMLElement extends HTMLElement {
	_doomPopover?: PatchedHoverPopover;
	_doomChildObserver?: MutationObserver;
	dataset: DOMStringMap & {
		doomLinktext?: string;
		doomSourcePath?: string;
		hasDragged?: string;
	};
}

interface HoverLinkTarget {
	event?: MouseEvent;
	source?: string;
	hoverParent?: unknown;
	targetEl?: HTMLElement | null;
	linktext?: string;
	sourcePath?: string;
}

interface HoverPopoverProto {
	show?: (...args: unknown[]) => unknown;
	hide?: (...args: unknown[]) => unknown;
	shouldShow?: (...args: unknown[]) => boolean;
	shouldShowSelf?: (...args: unknown[]) => boolean;
	position?: (...args: unknown[]) => unknown;
}

let topPopoverZIndex = 100;

function renderPinIcon(buttonEl: HTMLElement): void {
	buttonEl.setText("P");
}

export class HoverPreviewManager {
	private plugin: DoomEmacsSettingsPlugin;
	private app: App;
	private currentlyHoveredLink: HoveredLinkInfo | null = null;
	private lastHoveredLink: HoveredLinkInfo | null = null;
	private isSuperKeyDown = false;
	private mutationObserver: MutationObserver | null = null;
	private cleanupFns: Array<() => void> = [];
	private activePopovers: Set<PatchedHoverPopover> = new Set();
	private isPatched = false;

	// Original HoverPopover prototype methods
	private originalShow: ((...args: unknown[]) => unknown) | null = null;
	private originalHide: ((...args: unknown[]) => unknown) | null = null;
	private originalShouldShow: ((...args: unknown[]) => boolean) | null = null;
	private originalShouldShowSelf: ((...args: unknown[]) => boolean) | null = null;
	private originalPosition: ((...args: unknown[]) => unknown) | null = null;

	constructor(plugin: DoomEmacsSettingsPlugin) {
		this.plugin = plugin;
		this.app = plugin.app;
	}

	init(): void {
		if (Platform.isMobile) {
			// On mobile touch platforms, mouseover/hover popovers and desktop window tracking do not apply
			return;
		}
		this.patchHoverPopoverPrototype();
		this.registerWindow(window);
		this.registerWorkspaceHoverListener();
		this.registerDomPopoverObserver();
	}

	destroy(): void {
		this.unpatchHoverPopoverPrototype();

		for (const fn of this.cleanupFns) {
			try {
				fn();
			} catch {
				/* ignore cleanup errors */
			}
		}
		this.cleanupFns = [];

		if (this.mutationObserver) {
			try {
				this.mutationObserver.disconnect();
			} catch {
				/* ignore disconnect error */
			}
			this.mutationObserver = null;
		}

		try {
			this.closeAllHoverPopovers(true);
		} catch {
			/* ignore close error */
		}
		this.activePopovers.clear();
	}

	/**
	 * Registers DOM event listeners on the main window or any newly opened popout window.
	 */
	registerWindow(win: Window): void {
		if (!win) return;
		this.registerLinkTrackers(win);
		this.registerSuperKeyListeners(win);
		this.registerEscapeKeyListener(win);
		this.registerEmbedLinkInterceptor(win);
	}

	/**
	 * Patches Obsidian's HoverPopover class prototype directly so that:
	 * 1. Sticky popovers ignore outside clicks, blur, mouse movement timeouts,
	 *    and navigation across the vault.
	 * 2. Dragged popovers keep their user-placed coordinates without being reset.
	 * 3. Popovers are seamlessly decorated with Doom header controls and dimension settings.
	 */
	private patchHoverPopoverPrototype(): void {
		if (this.isPatched) return;

		let proto: (HoverPopoverProto & Record<string, unknown>) | null = null;
		try {
			proto = HoverPopover.prototype as unknown as HoverPopoverProto & Record<string, unknown>;
		} catch (e) {
			console.warn("DoomEsque Settings: HoverPopover prototype inaccessible", e);
			return;
		}
		if (!proto) {
			console.warn("DoomEsque Settings: HoverPopover prototype not accessible");
			return;
		}

		try {
			this.originalShow = proto.show ?? null;
			this.originalHide = proto.hide ?? null;
			this.originalShouldShow = proto.shouldShow ?? null;
			this.originalShouldShowSelf = proto.shouldShowSelf ?? null;
			this.originalPosition = proto.position ?? null;
		} catch (e) {
			console.warn("DoomEsque Settings: Could not read HoverPopover prototype methods", e);
			return;
		}

		// Helper to safely assign prototype properties without throwing if read-only
		const safePatch = (name: string, fn: (...args: unknown[]) => unknown): void => {
			try {
				Object.defineProperty(proto, name, {
					value: fn,
					writable: true,
					configurable: true,
				});
			} catch {
				try {
					(proto as Record<string, unknown>)[name] = fn;
				} catch (err) {
					console.warn(`DoomEsque Settings: Failed to patch HoverPopover.${name}`, err);
				}
			}
		};

		const { originalShow, originalHide, originalShouldShow, originalShouldShowSelf, originalPosition } = this;
		const onPopoverShow = this.onPopoverShow.bind(this);
		const onPopoverHide = this.onPopoverHide.bind(this);

		// 1. show()
		safePatch("show", function (this: PatchedHoverPopover, ...args: unknown[]) {
			const ret = originalShow ? originalShow.apply(this, args) : undefined;
			try {
				onPopoverShow(this);
			} catch (err) {
				console.error("DoomEsque Settings: error in HoverPopover.show handler", err);
			}
			return ret;
		});

		// 2. hide(force?: boolean)
		// Obsidian calls hide() on outside click (W3), mouse timeout (transition), or embed blur.
		// When _doomIsSticky is true, suppress dismissal unless force is explicitly true.
		safePatch("hide", function (this: PatchedHoverPopover, ...args: unknown[]) {
			const force = Boolean(args[0]);
			if (this._doomIsSticky && !force) {
				return;
			}
			onPopoverHide(this);
			return originalHide ? originalHide.apply(this, args) : undefined;
		});

		// 3. shouldShow()
		// Obsidian's vLe mouse interval calls transition() -> shouldShow().
		// If sticky, always return true so transition() never schedules hide().
		safePatch("shouldShow", function (this: PatchedHoverPopover, ...args: unknown[]) {
			if (this._doomIsSticky) {
				return true;
			}
			return originalShouldShow ? Boolean(originalShouldShow.apply(this, args)) : true;
		});

		// 4. shouldShowSelf()
		// Obsidian checks this in W3 outside click handler (!i.isFocused && ...).
		safePatch("shouldShowSelf", function (this: PatchedHoverPopover, ...args: unknown[]) {
			if (this._doomIsSticky) {
				return true;
			}
			return originalShouldShowSelf ? Boolean(originalShouldShowSelf.apply(this, args)) : true;
		});

		// 5. position()
		// Obsidian re-evaluates position on watchResize (up to 10 times) or scroll.
		// If the user has manually dragged the popover, or if it is sticky and already rendered,
		// or if the user is actively hovering/interacting with the popover, lock coordinates to prevent jumping.
		safePatch("position", function (this: PatchedHoverPopover, ...args: unknown[]) {
			if (this._doomIsDragged || this.hoverEl?.classList.contains("mod-maximized")) {
				return;
			}
			if (this._doomIsSticky && this._doomHasRendered) {
				return;
			}
			if (this._doomHasRendered && (this.onHover || this.hoverEl?.matches(":hover"))) {
				return;
			}
			const ret = originalPosition ? originalPosition.apply(this, args) : undefined;
			if (this.hoverEl && (this.hoverEl.style.left || this.hoverEl.style.top)) {
				this._doomHasRendered = true;
			}
			return ret;
		});

		this.isPatched = true;
	}

	/**
	 * Restores original HoverPopover methods on plugin unload.
	 */
	private unpatchHoverPopoverPrototype(): void {
		if (!this.isPatched) return;
		try {
			const proto = HoverPopover.prototype as unknown as HoverPopoverProto & Record<string, unknown>;
			if (proto) {
				const safeRestore = (name: string, original: ((...args: unknown[]) => unknown) | null): void => {
					if (!original) return;
					try {
						proto[name] = original;
					} catch {
						try {
							Object.defineProperty(proto, name, {
								value: original,
								writable: true,
								configurable: true,
							});
						} catch {
							/* ignore restore failure */
						}
					}
				};

				safeRestore("show", this.originalShow);
				safeRestore("hide", this.originalHide);
				safeRestore("shouldShow", this.originalShouldShow);
				safeRestore("shouldShowSelf", this.originalShouldShowSelf);
				safeRestore("position", this.originalPosition);
			}
		} catch (e) {
			console.warn("DoomEsque Settings: unpatchHoverPopoverPrototype skipped", e);
		}
		this.isPatched = false;
	}

	/**
	 * Called immediately when a HoverPopover instance shows on screen.
	 */
	private onPopoverShow(instance: PatchedHoverPopover): void {
		if (!instance) return;
		this.activePopovers.add(instance);

		const hoverEl = instance.hoverEl;
		if (hoverEl) {
			(hoverEl as PopoverHTMLElement)._doomPopover = instance;
			instance._doomPopoverEl = hoverEl;

			// Store link info on element if available
			const recentLink =
				this.currentlyHoveredLink ||
				(this.lastHoveredLink && Date.now() - this.lastHoveredLink.timestamp < 3000
					? this.lastHoveredLink
					: null);
			if (recentLink) {
				hoverEl.dataset.doomLinktext = recentLink.linktext;
				hoverEl.dataset.doomSourcePath = recentLink.sourcePath;
			}
		}

		// Configure sticky behavior according to settings
		const isStickyDefault = Boolean(this.plugin.settings.stickyHoverPreviews);
		if (isStickyDefault) {
			instance._doomIsSticky = true;
			instance.isFocused = true;
			if (hoverEl) {
				hoverEl.classList.add("doom-sticky-popover");
			}
		}

		if (hoverEl) {
			this.enhanceHoverPopover(hoverEl, instance);
		}
	}

	/**
	 * Called when a HoverPopover instance is closed.
	 */
	private onPopoverHide(instance: PatchedHoverPopover): void {
		this.activePopovers.delete(instance);
	}

	/**
	 * Tracks pointer hover over markdown internal links to detect target note names before click or keypress.
	 */
	private registerLinkTrackers(win: Window): void {
		const onMouseOver = (evt: MouseEvent): void => {
			const target = evt.target as HTMLElement | null;
			if (!target) return;

			const linkEl = target.closest<HTMLElement>("a.internal-link, .cm-hmd-internal-link, [data-href]");
			if (!linkEl) return;

			const linktext =
				linkEl.getAttribute("data-href") ||
				linkEl.getAttribute("href") ||
				linkEl.textContent?.trim() ||
				"";

			if (!linktext) return;

			const activeFile = this.app.workspace.getActiveFile();
			const sourcePath = activeFile ? activeFile.path : "";

			this.currentlyHoveredLink = {
				linktext,
				sourcePath,
				targetEl: linkEl,
				timestamp: Date.now(),
			};
		};

		const onMouseOut = (evt: MouseEvent): void => {
			const related = evt.relatedTarget as HTMLElement | null;
			if (
				this.currentlyHoveredLink &&
				related &&
				this.currentlyHoveredLink.targetEl.contains(related)
			) {
				return;
			}
			this.currentlyHoveredLink = null;
		};

		this.plugin.registerDomEvent(win, "mouseover", onMouseOver, { capture: true, passive: true });
		this.plugin.registerDomEvent(win, "mouseout", onMouseOut, { capture: true, passive: true });

		this.cleanupFns.push(() => {
			try {
				win.removeEventListener("mouseover", onMouseOver, { capture: true });
				win.removeEventListener("mouseout", onMouseOut, { capture: true });
			} catch {
				/* cleanup failed */
			}
		});
	}

	/**
	 * Detects the Super (Meta/Cmd/Win) key to pop open previews directly into the right sidebar.
	 */
	private registerSuperKeyListeners(win: Window): void {
		const isSuperKey = (evt: KeyboardEvent): boolean =>
			evt.key === "Meta" ||
			evt.code === "MetaLeft" ||
			evt.code === "MetaRight" ||
			(evt.metaKey && !evt.ctrlKey && !evt.altKey);

		const onKeyDown = (evt: KeyboardEvent): void => {
			if (!isSuperKey(evt)) return;
			this.isSuperKeyDown = true;

			if (!this.plugin.settings.superKeyOpensRightSidebar) {
				return;
			}

			// If user is currently hovering a link, open it immediately
			if (this.currentlyHoveredLink) {
				evt.preventDefault();
				evt.stopPropagation();
				void this.openInRightSidebar(
					this.currentlyHoveredLink.linktext,
					this.currentlyHoveredLink.sourcePath
				);
				return;
			}

			// If a hover popover is active on screen, pop it open in the right sidebar and close floating preview
			const activePopover = this.getActiveHoverPopoverEl();
			if (activePopover) {
				const linktext = activePopover.dataset.doomLinktext;
				const sourcePath = activePopover.dataset.doomSourcePath || "";
				if (linktext) {
					evt.preventDefault();
					evt.stopPropagation();
					void this.openInRightSidebar(linktext, sourcePath);
					this.closeHoverPopoverEl(activePopover);
				}
			}
		};

		const onKeyUp = (evt: KeyboardEvent): void => {
			if (isSuperKey(evt)) {
				this.isSuperKeyDown = false;
			}
		};

		this.plugin.registerDomEvent(win, "keydown", onKeyDown, { capture: true });
		this.plugin.registerDomEvent(win, "keyup", onKeyUp, { capture: true });

		this.cleanupFns.push(() => {
			try {
				win.removeEventListener("keydown", onKeyDown, { capture: true });
				win.removeEventListener("keyup", onKeyUp, { capture: true });
			} catch {
				/* cleanup failed */
			}
		});
	}

	/**
	 * Intercepts Obsidian workspace 'hover-link' event to handle Super key or store active link info.
	 */
	private registerWorkspaceHoverListener(): void {
		const onHoverLink = (data: HoverLinkTarget): void => {
			if (!data || !data.linktext) return;

			this.lastHoveredLink = {
				linktext: data.linktext,
				sourcePath: data.sourcePath || "",
				targetEl: data.targetEl || activeDocument.body,
				timestamp: Date.now(),
			};

			// If Super key was held when hover-link fired, open directly in right sidebar
			const heldSuper = this.isSuperKeyDown || Boolean(data.event && data.event.metaKey);
			if (this.plugin.settings.superKeyOpensRightSidebar && heldSuper) {
				void this.openInRightSidebar(data.linktext, data.sourcePath || "");
			}
		};

		const workspaceWithHoverLink = this.app.workspace as unknown as {
			on(name: "hover-link", callback: (data: HoverLinkTarget) => void): EventRef;
		};
		this.plugin.registerEvent(workspaceWithHoverLink.on("hover-link", onHoverLink));
	}

	/**
	 * Observes the DOM for newly mounted `.popover.hover-popover` elements as a safety fallback.
	 */
	private registerDomPopoverObserver(): void {
		const checkAndEnhancePopovers = (): void => {
			const popovers = activeDocument.querySelectorAll<HTMLElement>(
				".popover.hover-popover:not(.doom-popover-initialized)"
			);
			for (let i = 0; i < popovers.length; i++) {
				const el = popovers[i];
				const customEl = el as PopoverHTMLElement;
				const instance = customEl._doomPopover || this.findInstanceForEl(customEl);
				this.enhanceHoverPopover(customEl, instance ?? undefined);
			}
		};

		this.mutationObserver = new MutationObserver(() => {
			checkAndEnhancePopovers();
		});

		this.mutationObserver.observe(activeDocument.body, {
			childList: true,
			subtree: true,
		});

		checkAndEnhancePopovers();
	}

	private findInstanceForEl(el: HTMLElement): PatchedHoverPopover | null {
		for (const inst of this.activePopovers) {
			if (inst.hoverEl === el || inst._doomPopoverEl === el) {
				return inst;
			}
		}
		return null;
	}

	/**
	 * Decorates a hover popover element with Doom styling, metadata, and controls.
	 */
	enhanceHoverPopover(popoverEl: HTMLElement, popoverInstance?: PatchedHoverPopover): void {
		const customEl = popoverEl as PopoverHTMLElement;
		if (customEl.classList.contains("doom-popover-initialized")) {
			// Re-apply sticky status or headers if needed
			if (popoverInstance) {
				customEl._doomPopover = popoverInstance;
			}
			return;
		}

		customEl.classList.add("doom-popover-initialized");

		const instance = popoverInstance || customEl._doomPopover || this.findInstanceForEl(customEl);
		if (instance) {
			customEl._doomPopover = instance;
			instance._doomPopoverEl = customEl;
		}

		// Associate linktext and sourcePath with popover DOM element
		const recentLink =
			this.currentlyHoveredLink ||
			(this.lastHoveredLink && Date.now() - this.lastHoveredLink.timestamp < 4000
				? this.lastHoveredLink
				: null);

		const resolvedLinktext =
			customEl.dataset.doomLinktext ||
			instance?.embed?.linktext ||
			instance?.targetEl?.getAttribute("data-href") ||
			instance?.targetEl?.getAttribute("href") ||
			recentLink?.linktext ||
			"Page Preview";

		const resolvedSourcePath =
			customEl.dataset.doomSourcePath ||
			instance?.embed?.sourcePath ||
			recentLink?.sourcePath ||
			"";

		customEl.dataset.doomLinktext = resolvedLinktext;
		customEl.dataset.doomSourcePath = resolvedSourcePath;

		// Set initial dimensions from settings if not manually resized
		if (!customEl.style.width) {
			customEl.setCssStyles({ width: `${this.plugin.settings.hoverPopoverWidthPx}px` });
		}
		if (!customEl.style.height) {
			customEl.setCssStyles({ height: `${this.plugin.settings.hoverPopoverHeightPx}px` });
		}

		// Ensure child content container expands to fill full popover width and height
		this.expandPopoverInnerContent(customEl);

		const isStickyDefault = Boolean(this.plugin.settings.stickyHoverPreviews);
		if (isStickyDefault || instance?._doomIsSticky) {
			customEl.classList.add("doom-sticky-popover");
			if (instance) {
				instance._doomIsSticky = true;
				instance.isFocused = true;
			}
		}

		// Bring to front on click
		customEl.addEventListener(
			"pointerdown",
			() => {
				topPopoverZIndex++;
				customEl.setCssStyles({ zIndex: `${topPopoverZIndex}` });
			},
			{ capture: true }
		);

		// Intercept clicks on any embed link button within this popover so it opens in a new tab
		customEl.addEventListener(
			"click",
			(evt: MouseEvent) => {
				void (async () => {
					const target = evt.target as HTMLElement | null;
					if (!target) return;
					const embedLink = target.closest<HTMLElement>(".markdown-embed-link, .file-embed-link");
					if (!embedLink) return;

					evt.preventDefault();
					evt.stopPropagation();
					evt.stopImmediatePropagation();

					const curLink = customEl.dataset.doomLinktext || resolvedLinktext;
					const curSource = customEl.dataset.doomSourcePath || resolvedSourcePath;
					if (curLink) {
						await this.openInNewTab(curLink, curSource, instance ?? undefined, customEl);
					}
				})();
			},
			{ capture: true }
		);

		// Contain mouse wheel events within this popover so scrolling never leaks to the underlying note
		customEl.addEventListener(
			"wheel",
			(evt: WheelEvent) => {
				evt.stopPropagation();
			},
			{ passive: true }
		);

		this.buildPopoverHeader(customEl, resolvedLinktext, resolvedSourcePath, instance ?? undefined);

		// Observe subsequent asynchronous embed mounting inside this popover to expand immediately,
		// ignoring section changes from virtual scrolling so scroll loops never occur
		try {
			let expandRaf: number | null = null;
			const childObserver = new MutationObserver((mutations) => {
				let hasNewContainer = false;
				for (let i = 0; i < mutations.length; i++) {
					const added = mutations[i].addedNodes;
					for (let j = 0; j < added.length; j++) {
						const node = added[j] as HTMLElement;
						if (node.nodeType === 1) {
							const cls = node.className || "";
							if (
								typeof cls === "string" &&
								(cls.includes("markdown-embed") ||
									cls.includes("popover-content") ||
									cls.includes("markdown-preview-view") ||
									cls.includes("cm-editor") ||
									cls.includes("bases-embed"))
							) {
								hasNewContainer = true;
								break;
							}
						}
					}
					if (hasNewContainer) break;
				}
				if (!hasNewContainer) return;

				if (expandRaf !== null) return;
				expandRaf = window.requestAnimationFrame(() => {
					expandRaf = null;
					this.expandPopoverInnerContent(customEl);
				});
			});
			childObserver.observe(customEl, { childList: true, subtree: true });
			customEl._doomChildObserver = childObserver;
		} catch {
			/* ignore observer setup error */
		}
	}

	/**
	 * Builds the top modeline-styled control bar for sticky hover previews.
	 */
	private buildPopoverHeader(
		popoverEl: HTMLElement,
		linktext: string,
		sourcePath: string,
		popoverInstance?: PatchedHoverPopover
	): void {
		if (popoverEl.querySelector(".doom-popover-header")) {
			return;
		}

		const header = createDiv({ cls: "doom-popover-header" });

		// Title & Drag Handle
		const titleEl = createSpan({
			cls: "doom-popover-title",
			title: "Open note in new tab",
		});
		const titleIcon = titleEl.createSpan({ cls: "doom-popover-title-icon" });
		titleIcon.setText("📄");
		const titleText = titleEl.createSpan();
		titleText.setText(linktext);
		titleEl.onclick = (e) => {
			if (header.dataset.hasDragged === "true") return;
			e.stopPropagation();
			e.preventDefault();
			const customEl = popoverEl as PopoverHTMLElement;
			const curLink = customEl.dataset.doomLinktext || linktext;
			const curSource = customEl.dataset.doomSourcePath || sourcePath;
			void this.openInNewTab(curLink, curSource, popoverInstance, popoverEl);
		};
		header.appendChild(titleEl);

		// Action buttons container
		const actionsEl = createDiv({ cls: "doom-popover-actions" });

		// 1. Open note in new tab button (↗)
		const openBtn = createEl("button", {
			cls: "doom-popover-btn mod-open-tab",
			title: "Open note in new tab",
			text: "↗",
		});
		openBtn.onclick = (e) => {
			e.stopPropagation();
			e.preventDefault();
			const customEl = popoverEl as PopoverHTMLElement;
			const curLink = customEl.dataset.doomLinktext || linktext;
			const curSource = customEl.dataset.doomSourcePath || sourcePath;
			void this.openInNewTab(curLink, curSource, popoverInstance, popoverEl);
		};
		actionsEl.appendChild(openBtn);

		// 2. Pop to Right Sidebar button (⇥)
		const sidebarBtn = createEl("button", {
			cls: "doom-popover-btn mod-sidebar",
			title: "Pop open in right sidebar (Super key)",
			text: "⇥",
		});
		sidebarBtn.onclick = (e) => {
			e.stopPropagation();
			e.preventDefault();
			const customEl = popoverEl as PopoverHTMLElement;
			const curLink = customEl.dataset.doomLinktext || linktext;
			const curSource = customEl.dataset.doomSourcePath || sourcePath;
			void (async () => {
				await this.openInRightSidebar(curLink, curSource);
				this.closeHoverPopoverEl(popoverEl, popoverInstance);
			})();
		};
		actionsEl.appendChild(sidebarBtn);

		// 3. Maximize / Restore Toggle button (⤢)
		const maxBtn = createEl("button", {
			cls: "doom-popover-btn mod-maximize",
			title: "Maximize / restore preview window",
			text: "⤢",
		});
		let isMaximized = false;
		let prevStyle = { left: "", top: "", width: "", height: "", position: "" };

		maxBtn.onclick = (e) => {
			e.stopPropagation();
			e.preventDefault();
			isMaximized = !isMaximized;

			if (isMaximized) {
				prevStyle = {
					left: popoverEl.style.left,
					top: popoverEl.style.top,
					width: popoverEl.style.width,
					height: popoverEl.style.height,
					position: popoverEl.style.position,
				};
				popoverEl.classList.add("mod-maximized");
				popoverEl.setCssStyles({
					position: "",
					left: "",
					top: "",
					width: "",
					height: "",
					margin: "",
				});
				maxBtn.classList.add("is-active");
				maxBtn.setText("🗗");
				maxBtn.title = "Restore preview window size";
			} else {
				popoverEl.classList.remove("mod-maximized");
				popoverEl.setCssStyles({
					position: prevStyle.position || "",
					left: prevStyle.left,
					top: prevStyle.top,
					width: prevStyle.width || `${this.plugin.settings.hoverPopoverWidthPx}px`,
					height: prevStyle.height || `${this.plugin.settings.hoverPopoverHeightPx}px`,
				});
				maxBtn.classList.remove("is-active");
				maxBtn.setText("⤢");
				maxBtn.title = "Maximize preview window";
			}
			this.expandPopoverInnerContent(popoverEl);
		};
		actionsEl.appendChild(maxBtn);

		// 4. Sticky Pin Toggle button (themeable symbol conforming to active colorscheme)
		const isCurrentlySticky =
			popoverEl.classList.contains("doom-sticky-popover") ||
			Boolean(popoverInstance?._doomIsSticky);

		const pinBtn = createEl("button", {
			cls: `doom-popover-btn mod-pin ${isCurrentlySticky ? "is-active" : ""}`,
			title: isCurrentlySticky ? "Pinned (sticky until closed)" : "Pin preview (make sticky)",
		});
		renderPinIcon(pinBtn);

		pinBtn.onclick = (e) => {
			e.stopPropagation();
			e.preventDefault();
			const wasSticky = popoverEl.classList.contains("doom-sticky-popover");
			const nowSticky = !wasSticky;
			const customEl = popoverEl as PopoverHTMLElement;
			const inst = popoverInstance || customEl._doomPopover;

			if (nowSticky) {
				popoverEl.classList.add("doom-sticky-popover");
				pinBtn.classList.add("is-active");
				pinBtn.title = "Pinned (sticky until closed)";
				if (inst) {
					inst._doomIsSticky = true;
					inst.isFocused = true;
				}
			} else {
				popoverEl.classList.remove("doom-sticky-popover");
				pinBtn.classList.remove("is-active");
				pinBtn.title = "Pin preview (make sticky)";
				if (inst) {
					inst._doomIsSticky = false;
					inst.isFocused = false;
				}
			}
		};
		actionsEl.appendChild(pinBtn);

		// 5. Close button (✕)
		const closeBtn = createEl("button", {
			cls: "doom-popover-btn mod-close",
			title: "Close preview (Esc)",
			text: "✕",
		});
		closeBtn.onclick = (e) => {
			e.stopPropagation();
			e.preventDefault();
			this.closeHoverPopoverEl(popoverEl, popoverInstance);
		};
		actionsEl.appendChild(closeBtn);

		header.appendChild(actionsEl);

		// Make popover draggable via header
		this.makeElementDraggable(popoverEl, header);

		popoverEl.prepend(header);
	}

	/**
	 * Allows dragging the preview window anywhere on screen.
	 */
	private makeElementDraggable(popoverEl: HTMLElement, handleEl: HTMLElement): void {
		let isDragging = false;
		let startX = 0;
		let startY = 0;
		let initialLeft = 0;
		let initialTop = 0;
		let rafId: number | null = null;

		const onPointerDown = (e: PointerEvent): void => {
			if ((e.target as HTMLElement).closest(".doom-popover-btn")) {
				return;
			}

			isDragging = true;
			startX = e.clientX;
			startY = e.clientY;
			handleEl.dataset.hasDragged = "false";

			const rect = popoverEl.getBoundingClientRect();
			initialLeft = rect.left;
			initialTop = rect.top;

			// Mark instance as dragged so Obsidian's internal position() never jumps back to link
			const customEl = popoverEl as PopoverHTMLElement;
			const inst = customEl._doomPopover;
			if (inst) {
				inst._doomIsDragged = true;
			}

			// Bring to top
			topPopoverZIndex++;
			popoverEl.setCssStyles({ zIndex: `${topPopoverZIndex}` });

			try {
				handleEl.setPointerCapture(e.pointerId);
			} catch {
				/* pointer capture not available */
			}
			e.preventDefault();
		};

		const onPointerMove = (e: PointerEvent): void => {
			if (!isDragging) return;
			const clientX = e.clientX;
			const clientY = e.clientY;
			const dx = clientX - startX;
			const dy = clientY - startY;

			if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
				handleEl.dataset.hasDragged = "true";
			}

			if (rafId !== null) return;

			rafId = window.requestAnimationFrame(() => {
				rafId = null;
				if (!isDragging) return;

				const maxLeft = Math.max(10, (window.innerWidth || 1200) - 80);
				const maxTop = Math.max(10, (window.innerHeight || 800) - 50);

				popoverEl.classList.add("mod-dragged");
				popoverEl.setCssStyles({
					left: `${Math.min(maxLeft, Math.max(10, initialLeft + dx))}px`,
					top: `${Math.min(maxTop, Math.max(10, initialTop + dy))}px`,
				});
			});
		};

		const onPointerUp = (e: PointerEvent): void => {
			if (!isDragging) return;
			isDragging = false;
			if (rafId !== null) {
				window.cancelAnimationFrame(rafId);
				rafId = null;
			}
			try {
				handleEl.releasePointerCapture(e.pointerId);
			} catch {
				/* pointer capture release failed */
			}
			window.setTimeout(() => {
				handleEl.dataset.hasDragged = "false";
			}, 150);
		};

		handleEl.addEventListener("pointerdown", onPointerDown);
		handleEl.addEventListener("pointermove", onPointerMove);
		handleEl.addEventListener("pointerup", onPointerUp);
		handleEl.addEventListener("pointercancel", onPointerUp);
	}

	/**
	 * Registers Escape key listener to close topmost active/sticky preview.
	 */
	private registerEscapeKeyListener(win: Window): void {
		const onKeyDown = (evt: KeyboardEvent): void => {
			if (evt.key !== "Escape") return;

			// Don't intercept if user is in an Obsidian modal (e.g. Command Palette, Settings)
			if (activeDocument.querySelector(".modal-container")) {
				return;
			}

			const activePopover = this.getActiveHoverPopoverEl();
			if (activePopover) {
				evt.preventDefault();
				evt.stopPropagation();
				this.closeHoverPopoverEl(activePopover);
			}
		};

		this.plugin.registerDomEvent(win, "keydown", onKeyDown, { capture: true });
		this.cleanupFns.push(() => {
			try {
				win.removeEventListener("keydown", onKeyDown, { capture: true });
			} catch {
				/* cleanup failed */
			}
		});
	}

	/**
	 * Intercepts clicks on the open link button (.markdown-embed-link / .file-embed-link)
	 * in the top right of hover preview popovers, ensuring notes open in a new tab rather than the same tab.
	 */
	private registerEmbedLinkInterceptor(win: Window): void {
		const handleEmbedLinkClick = async (evt: MouseEvent): Promise<void> => {
			if (evt.button !== 0 && evt.button !== 1) return;

			const target = evt.target as HTMLElement | null;
			if (!target) return;

			const embedLink = target.closest<HTMLElement>(".markdown-embed-link, .file-embed-link");
			if (!embedLink) return;

			const popoverEl = embedLink.closest<HTMLElement>(".popover.hover-popover");
			if (!popoverEl) return;

			evt.preventDefault();
			evt.stopPropagation();
			evt.stopImmediatePropagation();

			const customEl = popoverEl as PopoverHTMLElement;
			const instance = customEl._doomPopover || this.findInstanceForEl(customEl);
			const curLink =
				customEl.dataset.doomLinktext ||
				instance?.embed?.linktext ||
				this.currentlyHoveredLink?.linktext ||
				"";
			const curSource =
				customEl.dataset.doomSourcePath ||
				instance?.embed?.sourcePath ||
				this.currentlyHoveredLink?.sourcePath ||
				"";

			if (curLink) {
				await this.openInNewTab(curLink, curSource, instance ?? undefined, popoverEl);
			}
		};

		const onEmbedLinkClick = (evt: MouseEvent): void => {
			void handleEmbedLinkClick(evt);
		};

		this.plugin.registerDomEvent(win, "click", onEmbedLinkClick, { capture: true });

		this.cleanupFns.push(() => {
			try {
				win.removeEventListener("click", onEmbedLinkClick, { capture: true });
			} catch {
				/* cleanup failed */
			}
		});
	}

	/**
	 * Opens a linktarget in the right sidebar sidedock.
	 */
	async openInRightSidebar(linktext: string, sourcePath = ""): Promise<boolean> {
		const rawPath = linktext.split("#")[0].split("^")[0].trim();
		if (!rawPath) return false;

		// Resolve TFile in vault
		let file = this.app.metadataCache.getFirstLinkpathDest(rawPath, sourcePath);
		if (!file) {
			const direct = this.app.vault.getAbstractFileByPath(rawPath);
			if (direct instanceof TFile) file = direct;
		}

		if (!file && !rawPath.endsWith(".md")) {
			const withMd = this.app.metadataCache.getFirstLinkpathDest(rawPath + ".md", sourcePath);
			if (withMd) file = withMd;
		}

		if (!file) {
			new Notice(`DoomEsque: Could not find note "${rawPath}"`);
			return false;
		}

		// Obtain leaf in right sidebar
		const leaf = this.app.workspace.getRightLeaf(false);
		if (!leaf) {
			new Notice("DoomEsque: Could not open right sidebar leaf");
			return false;
		}

		// Extract subpath (heading/block)
		const subpathMatch = linktext.match(/(#.*)$/);
		const subpath = subpathMatch ? subpathMatch[1] : undefined;

		await leaf.openFile(file, {
			active: true,
			eState: subpath ? { subpath } : undefined,
		});

		// Expand right sidebar if collapsed
		const rightSplit = this.app.workspace.rightSplit;
		if (rightSplit && typeof rightSplit.expand === "function" && rightSplit.collapsed) {
			rightSplit.expand();
		}

		await this.app.workspace.revealLeaf(leaf);
		new Notice(`DoomEsque: Opened "${file.basename}" in right sidebar`);
		return true;
	}

	/**
	 * Opens a linktarget in a new editor tab and closes the preview popover.
	 */
	async openInNewTab(
		linktext: string,
		sourcePath = "",
		popoverInstance?: PatchedHoverPopover,
		popoverEl?: HTMLElement
	): Promise<boolean> {
		const rawPath = linktext.split("#")[0].split("^")[0].trim();
		if (!rawPath) return false;

		// Resolve TFile in vault
		let file = this.app.metadataCache.getFirstLinkpathDest(rawPath, sourcePath);
		if (!file) {
			const direct = this.app.vault.getAbstractFileByPath(rawPath);
			if (direct instanceof TFile) file = direct;
		}

		if (!file && !rawPath.endsWith(".md")) {
			const withMd = this.app.metadataCache.getFirstLinkpathDest(rawPath + ".md", sourcePath);
			if (withMd) file = withMd;
		}

		// Extract subpath (heading/block)
		const subpathMatch = linktext.match(/(#.*)$/);
		const subpath = subpathMatch ? subpathMatch[1] : undefined;

		try {
			if (file) {
				const leaf = this.app.workspace.getLeaf("tab");
				await leaf.openFile(file, {
					active: true,
					eState: subpath ? { subpath } : undefined,
				});
				this.app.workspace.setActiveLeaf(leaf, { focus: true });
			} else {
				await this.app.workspace.openLinkText(linktext, sourcePath, "tab", {
					active: true,
				});
			}
		} catch (err) {
			console.error("DoomEsque Settings: error opening note in new tab", err);
			return false;
		} finally {
			const targetPopover = popoverEl || this.getActiveHoverPopoverEl();
			if (targetPopover) {
				this.closeHoverPopoverEl(targetPopover, popoverInstance);
			}
		}

		return true;
	}

	/**
	 * Closes a specific popover element and cleanly tears down its internal HoverPopover component.
	 */
	closeHoverPopoverEl(popoverEl: HTMLElement, popoverInstance?: PatchedHoverPopover): void {
		const customEl = popoverEl as PopoverHTMLElement;
		try {
			customEl._doomChildObserver?.disconnect();
		} catch {
			/* ignore disconnect error */
		}

		const instance = popoverInstance || customEl._doomPopover || this.findInstanceForEl(customEl);
		if (instance) {
			instance._doomIsSticky = false;
			instance.isFocused = false;
			this.activePopovers.delete(instance);
			if (typeof instance.hide === "function") {
				try {
					instance.hide(true);
				} catch (err) {
					console.error("DoomEsque Settings: error calling popover.hide(true)", err);
				}
			}
		}

		try {
			popoverEl.remove();
		} catch {
			/* ignore remove error */
		}
	}

	/**
	 * Returns the most recent/topmost active hover popover in the DOM.
	 */
	getActiveHoverPopoverEl(): HTMLElement | null {
		const popovers = activeDocument.querySelectorAll<HTMLElement>(".popover.hover-popover");
		if (popovers.length === 0) return null;
		return popovers[popovers.length - 1];
	}

	/**
	 * Closes all open hover popover elements.
	 */
	closeAllHoverPopovers(force = false): void {
		const popovers = Array.from(activeDocument.querySelectorAll<HTMLElement>(".popover.hover-popover"));
		for (const el of popovers) {
			if (force || el.classList.contains("doom-sticky-popover")) {
				this.closeHoverPopoverEl(el);
			}
		}
	}

	/**
	 * Expands popover inner content and updates tooltips.
	 */
	expandPopoverInnerContent(popoverEl: HTMLElement): void {
		if (!popoverEl) return;

		// 1. Update tooltip / aria-label on embed link buttons
		const embedLinks = popoverEl.querySelectorAll<HTMLElement>(
			".markdown-embed-link, .file-embed-link"
		);
		for (let i = 0; i < embedLinks.length; i++) {
			embedLinks[i].setAttribute("aria-label", "Open note in new tab");
			embedLinks[i].setAttribute("title", "Open note in new tab");
		}

		// 4. Ensure frontmatter properties are unfolded when showPopoverProperties is enabled
		if (this.plugin.settings.showPopoverProperties) {
			this.unfoldPopoverProperties(popoverEl);
		}
	}

	/**
	 * Unfolds frontmatter properties drawer inside a hover preview popover.
	 */
	unfoldPopoverProperties(popoverEl: HTMLElement, popoverInstance?: PatchedHoverPopover): void {
		if (!popoverEl) return;

		const customEl = popoverEl as PopoverHTMLElement;
		const inst =
			popoverInstance ||
			customEl._doomPopover ||
			this.findInstanceForEl(customEl);

		// If the embed has a metadataEditor, ensure it is unfolded
		const metadataEditor = inst?.embed?.metadataEditor;
		if (metadataEditor) {
			if (metadataEditor.collapsed) {
				try {
					metadataEditor.setCollapse(false, false);
				} catch {
					/* ignore failure */
				}
			}
		}

		// Also ensure kE constructor has collapseProperties = false so subsequent loads stay unfolded
		const embedConstructor = inst?.embed?.constructor;
		if (embedConstructor && "collapseProperties" in embedConstructor) {
			embedConstructor.collapseProperties = false;
		}

		// In DOM, remove is-collapsed from .metadata-container if it has properties
		const metaContainer = popoverEl.querySelector<HTMLElement>(".metadata-container");
		if (metaContainer && metaContainer.getAttribute("data-property-count") !== "0") {
			metaContainer.classList.remove("is-collapsed");
			const heading = metaContainer.querySelector<HTMLElement>(".metadata-properties-heading");
			if (heading) heading.classList.remove("is-collapsed");
			const foldEl = metaContainer.querySelector<HTMLElement>(".collapse-indicator");
			if (foldEl) foldEl.classList.remove("is-collapsed");
			const content = metaContainer.querySelector<HTMLElement>(".metadata-content");
			if (content && (content.style.display === "none" || content.hidden)) {
				content.setCssStyles({ display: "" });
				content.hidden = false;
			}
		}
	}

	/**
	 * Updates dimensions and sticky state on all open hover popovers when settings change.
	 */
	updateOpenPopovers(): void {
		if (Platform.isMobile) return;
		try {
			const isSticky = Boolean(this.plugin.settings.stickyHoverPreviews);
			const popovers = activeDocument.querySelectorAll<HTMLElement>(".popover.hover-popover");

			for (let i = 0; i < popovers.length; i++) {
				const el = popovers[i];
				const customEl = el as PopoverHTMLElement;
				const inst = customEl._doomPopover || this.findInstanceForEl(customEl);

				if (inst) {
					inst._doomIsSticky = isSticky;
					inst.isFocused = isSticky;
				}

				if (isSticky) {
					el.classList.add("doom-sticky-popover");
					const pinBtn = el.querySelector<HTMLElement>(".doom-popover-btn.mod-pin");
					if (pinBtn) {
						pinBtn.classList.add("is-active");
						pinBtn.setAttribute("title", "Pinned (sticky until closed)");
						if (pinBtn.textContent !== "P") {
							renderPinIcon(pinBtn);
						}
					}
				} else {
					el.classList.remove("doom-sticky-popover");
					const pinBtn = el.querySelector<HTMLElement>(".doom-popover-btn.mod-pin");
					if (pinBtn) {
						pinBtn.classList.remove("is-active");
						pinBtn.setAttribute("title", "Pin preview (make sticky)");
						if (pinBtn.textContent !== "P") {
							renderPinIcon(pinBtn);
						}
					}
				}

				if (!el.classList.contains("mod-maximized")) {
					el.setCssStyles({
						width: `${this.plugin.settings.hoverPopoverWidthPx}px`,
						height: `${this.plugin.settings.hoverPopoverHeightPx}px`,
					});
				}
				this.expandPopoverInnerContent(el);
			}
		} catch (err) {
			console.warn("DoomEsque Settings: updateOpenPopovers error", err);
		}
	}
}

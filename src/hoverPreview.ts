import { App, HoverPopover, Notice, Platform, TFile } from "obsidian";
import type DoomEmacsSettingsPlugin from "./main";

export interface HoveredLinkInfo {
	linktext: string;
	sourcePath: string;
	targetEl: HTMLElement;
	timestamp: number;
}

let topPopoverZIndex = 100;

export class HoverPreviewManager {
	private plugin: DoomEmacsSettingsPlugin;
	private app: App;
	private currentlyHoveredLink: HoveredLinkInfo | null = null;
	private lastHoveredLink: HoveredLinkInfo | null = null;
	private isSuperKeyDown = false;
	private mutationObserver: MutationObserver | null = null;
	private cleanupFns: Array<() => void> = [];
	private activePopovers: Set<any> = new Set();
	private isPatched = false;

	// Original HoverPopover prototype methods
	private originalShow: ((...args: any[]) => any) | null = null;
	private originalHide: ((...args: any[]) => any) | null = null;
	private originalShouldShow: ((...args: any[]) => any) | null = null;
	private originalShouldShowSelf: ((...args: any[]) => any) | null = null;
	private originalPosition: ((...args: any[]) => any) | null = null;

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
			} catch {}
		}
		this.cleanupFns = [];

		if (this.mutationObserver) {
			try {
				this.mutationObserver.disconnect();
			} catch {}
			this.mutationObserver = null;
		}

		try {
			this.closeAllHoverPopovers(true);
		} catch {}
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

		let proto: any = null;
		try {
			proto = (HoverPopover as any)?.prototype;
		} catch (e) {
			console.warn("DoomEsque Settings: HoverPopover prototype inaccessible", e);
			return;
		}
		if (!proto) {
			console.warn("DoomEsque Settings: HoverPopover prototype not accessible");
			return;
		}

		try {
			this.originalShow = proto.show;
			this.originalHide = proto.hide;
			this.originalShouldShow = proto.shouldShow;
			this.originalShouldShowSelf = proto.shouldShowSelf;
			this.originalPosition = proto.position;
		} catch (e) {
			console.warn("DoomEsque Settings: Could not read HoverPopover prototype methods", e);
			return;
		}

		const self = this;

		// Helper to safely assign prototype properties without throwing if read-only
		const safePatch = (name: string, fn: (...args: any[]) => any) => {
			try {
				Object.defineProperty(proto, name, {
					value: fn,
					writable: true,
					configurable: true,
				});
			} catch {
				try {
					proto[name] = fn;
				} catch (err) {
					console.warn(`DoomEsque Settings: Failed to patch HoverPopover.${name}`, err);
				}
			}
		};

		// 1. show()
		safePatch("show", function (this: any) {
			const ret = self.originalShow ? self.originalShow.apply(this, arguments) : undefined;
			try {
				self.onPopoverShow(this);
			} catch (err) {
				console.error("DoomEsque Settings: error in HoverPopover.show handler", err);
			}
			return ret;
		});

		// 2. hide(force?: boolean)
		// Obsidian calls hide() on outside click (W3), mouse timeout (transition), or embed blur.
		// When _doomIsSticky is true, suppress dismissal unless force is explicitly true.
		safePatch("hide", function (this: any, force?: boolean) {
			if (this._doomIsSticky && !force) {
				return;
			}
			self.onPopoverHide(this);
			return self.originalHide ? self.originalHide.apply(this, arguments) : undefined;
		});

		// 3. shouldShow()
		// Obsidian's vLe mouse interval calls transition() -> shouldShow().
		// If sticky, always return true so transition() never schedules hide().
		safePatch("shouldShow", function (this: any) {
			if (this._doomIsSticky) {
				return true;
			}
			return self.originalShouldShow ? self.originalShouldShow.apply(this, arguments) : true;
		});

		// 4. shouldShowSelf()
		// Obsidian checks this in W3 outside click handler (!i.isFocused && ...).
		safePatch("shouldShowSelf", function (this: any) {
			if (this._doomIsSticky) {
				return true;
			}
			return self.originalShouldShowSelf ? self.originalShouldShowSelf.apply(this, arguments) : true;
		});

		// 5. position()
		// Obsidian re-evaluates position on watchResize (up to 10 times) or scroll.
		// If the user has manually dragged the popover, or if it is sticky and already rendered,
		// or if the user is actively hovering/interacting with the popover, lock coordinates to prevent jumping.
		safePatch("position", function (this: any) {
			if (this._doomIsDragged || this.hoverEl?.classList.contains("mod-maximized")) {
				return;
			}
			if (this._doomIsSticky && this._doomHasRendered) {
				return;
			}
			if (this._doomHasRendered && (this.onHover || this.hoverEl?.matches(":hover"))) {
				return;
			}
			const ret = self.originalPosition ? self.originalPosition.apply(this, arguments) : undefined;
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
			const proto = (HoverPopover as any)?.prototype;
			if (proto) {
				const safeRestore = (name: string, original: any) => {
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
						} catch {}
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
	private onPopoverShow(instance: any): void {
		if (!instance) return;
		this.activePopovers.add(instance);

		const hoverEl = instance.hoverEl as HTMLElement | undefined;
		if (hoverEl) {
			(hoverEl as any)._doomPopover = instance;
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
	private onPopoverHide(instance: any): void {
		this.activePopovers.delete(instance);
	}

	/**
	 * Tracks pointer hover over markdown internal links to detect target note names before click or keypress.
	 */
	private registerLinkTrackers(win: Window): void {
		const onMouseOver = (evt: MouseEvent): void => {
			const target = evt.target as HTMLElement | null;
			if (!target) return;

			const linkEl = target.closest("a.internal-link, .cm-hmd-internal-link, [data-href]") as HTMLElement | null;
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
			} catch {}
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
				this.openInRightSidebar(
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
					this.openInRightSidebar(linktext, sourcePath);
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
			} catch {}
		});
	}

	/**
	 * Intercepts Obsidian workspace 'hover-link' event to handle Super key or store active link info.
	 */
	private registerWorkspaceHoverListener(): void {
		const onHoverLink = (data: {
			event?: MouseEvent;
			source?: string;
			hoverParent?: any;
			targetEl?: HTMLElement | null;
			linktext?: string;
			sourcePath?: string;
		}): void => {
			if (!data || !data.linktext) return;

			this.lastHoveredLink = {
				linktext: data.linktext,
				sourcePath: data.sourcePath || "",
				targetEl: data.targetEl || document.body,
				timestamp: Date.now(),
			};

			// If Super key was held when hover-link fired, open directly in right sidebar
			const heldSuper = this.isSuperKeyDown || Boolean(data.event && data.event.metaKey);
			if (this.plugin.settings.superKeyOpensRightSidebar && heldSuper) {
				this.openInRightSidebar(data.linktext, data.sourcePath || "");
			}
		};

		this.plugin.registerEvent(this.app.workspace.on("hover-link" as any, onHoverLink as any));
	}

	/**
	 * Observes the DOM for newly mounted `.popover.hover-popover` elements as a safety fallback.
	 */
	private registerDomPopoverObserver(): void {
		const checkAndEnhancePopovers = (): void => {
			const popovers = document.querySelectorAll<HTMLElement>(
				".popover.hover-popover:not(.doom-popover-initialized)"
			);
			for (let i = 0; i < popovers.length; i++) {
				const el = popovers[i];
				const instance = (el as any)._doomPopover || this.findInstanceForEl(el);
				this.enhanceHoverPopover(el, instance);
			}
		};

		this.mutationObserver = new MutationObserver(() => {
			checkAndEnhancePopovers();
		});

		this.mutationObserver.observe(document.body, {
			childList: true,
			subtree: true,
		});

		checkAndEnhancePopovers();
	}

	private findInstanceForEl(el: HTMLElement): any {
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
	enhanceHoverPopover(popoverEl: HTMLElement, popoverInstance?: any): void {
		if (popoverEl.classList.contains("doom-popover-initialized")) {
			// Re-apply sticky status or headers if needed
			if (popoverInstance) {
				(popoverEl as any)._doomPopover = popoverInstance;
			}
			return;
		}

		popoverEl.classList.add("doom-popover-initialized");

		const instance = popoverInstance || (popoverEl as any)._doomPopover || this.findInstanceForEl(popoverEl);
		if (instance) {
			(popoverEl as any)._doomPopover = instance;
			instance._doomPopoverEl = popoverEl;
		}

		// Associate linktext and sourcePath with popover DOM element
		const recentLink =
			this.currentlyHoveredLink ||
			(this.lastHoveredLink && Date.now() - this.lastHoveredLink.timestamp < 4000
				? this.lastHoveredLink
				: null);

		const resolvedLinktext =
			popoverEl.dataset.doomLinktext ||
			instance?.embed?.linktext ||
			instance?.targetEl?.getAttribute("data-href") ||
			instance?.targetEl?.getAttribute("href") ||
			recentLink?.linktext ||
			"Page Preview";

		const resolvedSourcePath =
			popoverEl.dataset.doomSourcePath ||
			instance?.embed?.sourcePath ||
			recentLink?.sourcePath ||
			"";

		popoverEl.dataset.doomLinktext = resolvedLinktext;
		popoverEl.dataset.doomSourcePath = resolvedSourcePath;

		// Set initial dimensions from settings if not manually resized
		if (!popoverEl.style.width) {
			popoverEl.style.width = `${this.plugin.settings.hoverPopoverWidthPx}px`;
		}
		if (!popoverEl.style.height) {
			popoverEl.style.height = `${this.plugin.settings.hoverPopoverHeightPx}px`;
		}

		// Ensure child content container expands to fill full popover width and height
		this.expandPopoverInnerContent(popoverEl);

		const isStickyDefault = Boolean(this.plugin.settings.stickyHoverPreviews);
		if (isStickyDefault || instance?._doomIsSticky) {
			popoverEl.classList.add("doom-sticky-popover");
			if (instance) {
				instance._doomIsSticky = true;
				instance.isFocused = true;
			}
		}

		// Bring to front on click
		popoverEl.addEventListener(
			"pointerdown",
			() => {
				topPopoverZIndex++;
				popoverEl.style.zIndex = `${topPopoverZIndex}`;
			},
			{ capture: true }
		);

		// Intercept clicks on any embed link button within this popover so it opens in a new tab
		popoverEl.addEventListener(
			"click",
			async (evt: MouseEvent) => {
				const target = evt.target as HTMLElement | null;
				if (!target) return;
				const embedLink = target.closest(".markdown-embed-link, .file-embed-link") as HTMLElement | null;
				if (!embedLink) return;

				evt.preventDefault();
				evt.stopPropagation();
				evt.stopImmediatePropagation();

				const curLink = popoverEl.dataset.doomLinktext || resolvedLinktext;
				const curSource = popoverEl.dataset.doomSourcePath || resolvedSourcePath;
				if (curLink) {
					await this.openInNewTab(curLink, curSource, instance, popoverEl);
				}
			},
			{ capture: true }
		);

		// Contain mouse wheel events within this popover so scrolling never leaks to the underlying note
		popoverEl.addEventListener(
			"wheel",
			(evt: WheelEvent) => {
				evt.stopPropagation();
			},
			{ passive: true }
		);

		this.buildPopoverHeader(popoverEl, resolvedLinktext, resolvedSourcePath, instance);

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
				expandRaf = requestAnimationFrame(() => {
					expandRaf = null;
					this.expandPopoverInnerContent(popoverEl);
				});
			});
			childObserver.observe(popoverEl, { childList: true, subtree: true });
			(popoverEl as any)._doomChildObserver = childObserver;
		} catch {}
	}

	/**
	 * Builds the top modeline-styled control bar for sticky hover previews.
	 */
	private buildPopoverHeader(
		popoverEl: HTMLElement,
		linktext: string,
		sourcePath: string,
		popoverInstance: any
	): void {
		if (popoverEl.querySelector(".doom-popover-header")) {
			return;
		}

		const header = document.createElement("div");
		header.className = "doom-popover-header";

		// Title & Drag Handle
		const titleEl = document.createElement("span");
		titleEl.className = "doom-popover-title";
		titleEl.title = "Open note in new tab";
		const titleIcon = titleEl.createSpan();
		titleIcon.setText("📄");
		titleIcon.style.fontSize = "12px";
		const titleText = titleEl.createSpan();
		titleText.setText(linktext);
		titleEl.onclick = async (e) => {
			if (header.dataset.hasDragged === "true") return;
			e.stopPropagation();
			e.preventDefault();
			const curLink = popoverEl.dataset.doomLinktext || linktext;
			const curSource = popoverEl.dataset.doomSourcePath || sourcePath;
			await this.openInNewTab(curLink, curSource, popoverInstance, popoverEl);
		};
		header.appendChild(titleEl);

		// Action buttons container
		const actionsEl = document.createElement("div");
		actionsEl.className = "doom-popover-actions";

		// 1. Open note in new tab button (↗)
		const openBtn = document.createElement("button");
		openBtn.className = "doom-popover-btn mod-open-tab";
		openBtn.title = "Open note in new tab";
		openBtn.setText("↗");
		openBtn.onclick = async (e) => {
			e.stopPropagation();
			e.preventDefault();
			const curLink = popoverEl.dataset.doomLinktext || linktext;
			const curSource = popoverEl.dataset.doomSourcePath || sourcePath;
			await this.openInNewTab(curLink, curSource, popoverInstance, popoverEl);
		};
		actionsEl.appendChild(openBtn);

		// 2. Pop to Right Sidebar button (⇥)
		const sidebarBtn = document.createElement("button");
		sidebarBtn.className = "doom-popover-btn mod-sidebar";
		sidebarBtn.title = "Pop open in right sidebar (Super key)";
		sidebarBtn.setText("⇥");
		sidebarBtn.onclick = async (e) => {
			e.stopPropagation();
			e.preventDefault();
			const curLink = popoverEl.dataset.doomLinktext || linktext;
			const curSource = popoverEl.dataset.doomSourcePath || sourcePath;
			await this.openInRightSidebar(curLink, curSource);
			this.closeHoverPopoverEl(popoverEl, popoverInstance);
		};
		actionsEl.appendChild(sidebarBtn);

		// 2. Maximize / Restore Toggle button (⤢)
		const maxBtn = document.createElement("button");
		maxBtn.className = "doom-popover-btn mod-maximize";
		maxBtn.title = "Maximize / restore preview window";
		maxBtn.setText("⤢");
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
				popoverEl.style.position = "fixed";
				popoverEl.style.left = "4vw";
				popoverEl.style.top = "5vh";
				popoverEl.style.width = "92vw";
				popoverEl.style.height = "90vh";
				popoverEl.style.margin = "0";
				maxBtn.classList.add("is-active");
				maxBtn.setText("🗗");
				maxBtn.title = "Restore preview window size";
			} else {
				popoverEl.classList.remove("mod-maximized");
				popoverEl.style.position = prevStyle.position || "absolute";
				popoverEl.style.left = prevStyle.left;
				popoverEl.style.top = prevStyle.top;
				popoverEl.style.width = prevStyle.width || `${this.plugin.settings.hoverPopoverWidthPx}px`;
				popoverEl.style.height = prevStyle.height || `${this.plugin.settings.hoverPopoverHeightPx}px`;
				maxBtn.classList.remove("is-active");
				maxBtn.setText("⤢");
				maxBtn.title = "Maximize preview window";
			}
			this.expandPopoverInnerContent(popoverEl);
		};
		actionsEl.appendChild(maxBtn);

		// 3. Sticky Pin Toggle button (📌)
		const pinBtn = document.createElement("button");
		const isCurrentlySticky =
			popoverEl.classList.contains("doom-sticky-popover") ||
			Boolean(popoverInstance?._doomIsSticky);

		pinBtn.className = `doom-popover-btn mod-pin ${isCurrentlySticky ? "is-active" : ""}`;
		pinBtn.title = isCurrentlySticky ? "Pinned (sticky until closed)" : "Pin preview (make sticky)";
		pinBtn.setText("📌");

		pinBtn.onclick = (e) => {
			e.stopPropagation();
			e.preventDefault();
			const wasSticky = popoverEl.classList.contains("doom-sticky-popover");
			const nowSticky = !wasSticky;
			const inst = popoverInstance || (popoverEl as any)._doomPopover;

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

		// 4. Close button (✕)
		const closeBtn = document.createElement("button");
		closeBtn.className = "doom-popover-btn mod-close";
		closeBtn.title = "Close preview (Esc)";
		closeBtn.setText("✕");
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
			const inst = (popoverEl as any)._doomPopover;
			if (inst) {
				inst._doomIsDragged = true;
			}

			// Bring to top
			topPopoverZIndex++;
			popoverEl.style.zIndex = `${topPopoverZIndex}`;

			try {
				handleEl.setPointerCapture(e.pointerId);
			} catch {}
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

			rafId = requestAnimationFrame(() => {
				rafId = null;
				if (!isDragging) return;

				const maxLeft = Math.max(10, (window.innerWidth || 1200) - 80);
				const maxTop = Math.max(10, (window.innerHeight || 800) - 50);

				popoverEl.style.position = "fixed";
				popoverEl.style.left = `${Math.min(maxLeft, Math.max(10, initialLeft + dx))}px`;
				popoverEl.style.top = `${Math.min(maxTop, Math.max(10, initialTop + dy))}px`;
				popoverEl.style.right = "auto";
				popoverEl.style.bottom = "auto";
				popoverEl.style.margin = "0";
			});
		};

		const onPointerUp = (e: PointerEvent): void => {
			if (!isDragging) return;
			isDragging = false;
			if (rafId !== null) {
				cancelAnimationFrame(rafId);
				rafId = null;
			}
			try {
				handleEl.releasePointerCapture(e.pointerId);
			} catch {}
			setTimeout(() => {
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
			if (document.querySelector(".modal-container")) {
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
			} catch {}
		});
	}

	/**
	 * Intercepts clicks on the open link button (.markdown-embed-link / .file-embed-link)
	 * in the top right of hover preview popovers, ensuring notes open in a new tab rather than the same tab.
	 */
	private registerEmbedLinkInterceptor(win: Window): void {
		const onEmbedLinkClick = async (evt: MouseEvent): Promise<void> => {
			if (evt.button !== 0 && evt.button !== 1) return;

			const target = evt.target as HTMLElement | null;
			if (!target) return;

			const embedLink = target.closest(".markdown-embed-link, .file-embed-link") as HTMLElement | null;
			if (!embedLink) return;

			const popoverEl = embedLink.closest(".popover.hover-popover") as HTMLElement | null;
			if (!popoverEl) return;

			evt.preventDefault();
			evt.stopPropagation();
			evt.stopImmediatePropagation();

			const instance = (popoverEl as any)._doomPopover || this.findInstanceForEl(popoverEl);
			const curLink =
				popoverEl.dataset.doomLinktext ||
				instance?.embed?.linktext ||
				this.currentlyHoveredLink?.linktext ||
				"";
			const curSource =
				popoverEl.dataset.doomSourcePath ||
				instance?.embed?.sourcePath ||
				this.currentlyHoveredLink?.sourcePath ||
				"";

			if (curLink) {
				await this.openInNewTab(curLink, curSource, instance, popoverEl);
			}
		};

		this.plugin.registerDomEvent(win, "click", onEmbedLinkClick, { capture: true });

		this.cleanupFns.push(() => {
			try {
				win.removeEventListener("click", onEmbedLinkClick, { capture: true });
			} catch {}
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
		const rightSplit = (this.app.workspace as any)?.rightSplit;
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
		popoverInstance?: any,
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
	closeHoverPopoverEl(popoverEl: HTMLElement, popoverInstance?: any): void {
		try {
			(popoverEl as any)?._doomChildObserver?.disconnect();
		} catch {}

		const instance = popoverInstance || (popoverEl as any)?._doomPopover || this.findInstanceForEl(popoverEl);
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
		} catch {}
	}

	/**
	 * Returns the most recent/topmost active hover popover in the DOM.
	 */
	getActiveHoverPopoverEl(): HTMLElement | null {
		const popovers = document.querySelectorAll<HTMLElement>(".popover.hover-popover");
		if (popovers.length === 0) return null;
		return popovers[popovers.length - 1];
	}

	/**
	 * Closes all open hover popover elements.
	 */
	closeAllHoverPopovers(force = false): void {
		const popovers = Array.from(document.querySelectorAll<HTMLElement>(".popover.hover-popover"));
		for (const el of popovers) {
			if (force || el.classList.contains("doom-sticky-popover")) {
				this.closeHoverPopoverEl(el);
			}
		}
	}

	/**
	 * Unconstrains inner embed elements so they expand to 100% of the resized window.
	 */
	expandPopoverInnerContent(popoverEl: HTMLElement): void {
		if (!popoverEl) return;

		// 1. Unconstrain direct container children
		const directChildren = Array.from(popoverEl.children || []) as HTMLElement[];
		for (const child of directChildren) {
			if (!child.classList.contains("doom-popover-header")) {
				child.style.width = "100%";
				child.style.maxWidth = "100%";
				child.style.height = "100%";
				child.style.maxHeight = "none";
			}
		}

		// 2. Unconstrain nested embed components and views
		const embeds = popoverEl.querySelectorAll<HTMLElement>(
			".markdown-embed, .markdown-embed-content, .markdown-preview-view, .markdown-preview-sizer, .popover-content, .cm-editor, .cm-scroller, .bases-embed"
		);
		for (let i = 0; i < embeds.length; i++) {
			const el = embeds[i];
			// Do not disturb hidden elements (e.g. inactive editorEl inside embeds)
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

		// 3. Update tooltip / aria-label on embed link buttons
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
	unfoldPopoverProperties(popoverEl: HTMLElement, popoverInstance?: any): void {
		if (!popoverEl) return;

		const inst =
			popoverInstance ||
			(popoverEl as any)._doomPopover ||
			this.findInstanceForEl(popoverEl);

		// If the embed has a metadataEditor, ensure it is unfolded
		const metadataEditor = inst?.embed?.metadataEditor;
		if (metadataEditor) {
			if (metadataEditor.collapsed) {
				try {
					metadataEditor.setCollapse(false, false);
				} catch {}
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
				content.style.display = "";
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
			const popovers = document.querySelectorAll<HTMLElement>(".popover.hover-popover");

			for (let i = 0; i < popovers.length; i++) {
				const el = popovers[i];
				const inst = (el as any)._doomPopover || this.findInstanceForEl(el);

				if (inst) {
					inst._doomIsSticky = isSticky;
					inst.isFocused = isSticky;
				}

				if (isSticky) {
					el.classList.add("doom-sticky-popover");
					const pinBtn = el.querySelector(".doom-popover-btn.mod-pin");
					if (pinBtn) {
						pinBtn.classList.add("is-active");
						pinBtn.setAttribute("title", "Pinned (sticky until closed)");
					}
				} else {
					el.classList.remove("doom-sticky-popover");
					const pinBtn = el.querySelector(".doom-popover-btn.mod-pin");
					if (pinBtn) {
						pinBtn.classList.remove("is-active");
						pinBtn.setAttribute("title", "Pin preview (make sticky)");
					}
				}

				if (!el.classList.contains("mod-maximized")) {
					el.style.width = `${this.plugin.settings.hoverPopoverWidthPx}px`;
					el.style.height = `${this.plugin.settings.hoverPopoverHeightPx}px`;
				}
				this.expandPopoverInnerContent(el);
			}
		} catch (err) {
			console.warn("DoomEsque Settings: updateOpenPopovers error", err);
		}
	}
}

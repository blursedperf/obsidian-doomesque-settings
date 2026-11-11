/**
 * Bases toolbar tooltips.
 *
 * The DoomEsque theme shows the Bases toolbar action buttons (Display, Sort, Group, Filter,
 * Properties, Search, New) as icons only. Their text labels stay in the DOM (visually hidden), so
 * the label is used as the tooltip. Kept free of the `obsidian` runtime import so it can be tested.
 */

/** Toolbar action buttons whose labels the theme hides (view switcher and result count keep text). */
export const BASES_TOOLBAR_ICON_BUTTON_SELECTOR =
	".bases-toolbar .bases-toolbar-item:not(.bases-toolbar-views-menu, .bases-toolbar-result-count) .text-icon-button";

/** Body class (Style Settings "Bases Toolbar Text Labels") that shows the labels again. */
export const BASES_TOOLBAR_LABELS_CLASS = "doom-bases-toolbar-labels";

/** Dataset key recording which label a button's tooltip was set from. */
export const BASES_TOOLTIP_DATA_KEY = "doomTooltip";

interface ElementLike {
	closest?(selector: string): ElementLike | null;
	querySelector?(selector: string): { textContent: string | null } | null;
	ownerDocument?: { body?: { classList: { contains(cls: string): boolean } } | null } | null;
	dataset?: Record<string, string | undefined>;
}

/**
 * Returns the toolbar button and the tooltip text to attach for an event target, or null when the
 * target is not an icon-only Bases toolbar button, labels are visible, or the tooltip is current.
 */
export function basesToolbarTooltipFor(target: unknown): { button: ElementLike; label: string } | null {
	const el = target as ElementLike | null;
	if (!el || typeof el.closest !== "function") return null;
	const button = el.closest(BASES_TOOLBAR_ICON_BUTTON_SELECTOR);
	if (!button || typeof button.querySelector !== "function") return null;
	if (button.ownerDocument?.body?.classList.contains(BASES_TOOLBAR_LABELS_CLASS)) return null;
	const label = button.querySelector(".text-button-label")?.textContent?.trim();
	if (!label) return null;
	if (button.dataset?.[BASES_TOOLTIP_DATA_KEY] === label) return null;
	return { button, label };
}

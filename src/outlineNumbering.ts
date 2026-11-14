/**
 * Outline numbering for ordered lists: works out what each ordered list item's marker should read in
 * a given style, from the note's text alone, following the same rules Reading view uses.
 *
 *   - A list's first typed number sets its start; later typed numbers are ignored (1, 1, 1 reads
 *     1, 2, 3), as in Markdown.
 *   - The level of an ordered item counts only ordered lists in its ancestry, so a bullet list in
 *     between does not shift the letters (the theme's `ol ol` selectors work the same way).
 *   - Decimal numbering chains every enclosing list item, as CSS `counters(list-item, ".")` does.
 *   - Blank lines inside a list do not end it; a less-indented line after a blank line does, as do
 *     headings, fences and thematic breaks. A line directly after an item's text is a lazy
 *     continuation of it. Switching between `1.` and `1)` starts a new list.
 *   - Fenced code blocks, the frontmatter and blockquotes / callouts are skipped (Live Preview does
 *     not draw lists inside quotes as lists).
 *
 * Pure functions with no Obsidian or CodeMirror dependency.
 */

export type OutlineStyle = "standard" | "hornbook" | "decimal" | "statutory";

export const OUTLINE_STYLES: readonly OutlineStyle[] = ["standard", "hornbook", "decimal", "statutory"];

export interface OutlineMarker {
	/** 0-based line number. */
	line: number;
	/** Column range of the typed marker, e.g. "12." or "3)" (without the space after it). */
	from: number;
	to: number;
	/** Ordered-list depth, 1-based (bullet lists in between do not count). */
	level: number;
	/** The item's number in its list (start + index). */
	number: number;
	/** Ordinals of every enclosing list item, outermost first, ending with this item's number. */
	chain: number[];
}

const ITEM = /^([ \t]*)(?:([-*+])|(\d{1,9})([.)]))(?=[ \t]|$)([ \t]*)/;
const FENCE = /^[ \t]*(`{3,}|~{3,})/;
const HEADING = /^ {0,3}#{1,6}(?:[ \t]|$)/;
const THEMATIC = /^ {0,3}(?:(?:-[ \t]*){3,}|(?:\*[ \t]*){3,}|(?:_[ \t]*){3,})$/;
const QUOTE = /^ {0,3}>/;

/** Width of leading whitespace in columns, with tab stops every 4 columns. */
function columns(ws: string): number {
	let col = 0;
	for (const ch of ws) col = ch === "\t" ? col + 4 - (col % 4) : col + 1;
	return col;
}

interface List {
	ordered: boolean;
	delim: string;
	start: number;
	count: number;
	/** Ordinal chain of the item that contains this list (empty at top level). */
	parentChain: number[];
	/** Ordered-list depth of the containing item's lists. */
	parentLevel: number;
}

interface OpenItem {
	list: List;
	markerCol: number;
	contentCol: number;
	chain: number[];
	/** Ordered-list depth including this item's list. */
	level: number;
}

/** Find every ordered list item in the note and its number, level and ancestry. */
export function computeOutline(lines: readonly string[]): OutlineMarker[] {
	const out: OutlineMarker[] = [];
	const stack: OpenItem[] = [];
	let fence: string | null = null;
	let prevBlank = true;
	let prevInItemText = false;
	let i = 0;

	// Frontmatter
	if (lines[0]?.trim() === "---") {
		const end = lines.findIndex((l, n) => n > 0 && /^(?:---|\.\.\.)\s*$/.test(l));
		if (end > 0) i = end + 1;
	}

	for (; i < lines.length; i++) {
		const text = lines[i];

		if (fence !== null) {
			const close = text.match(FENCE);
			if (close && close[1][0] === fence[0] && close[1].length >= fence.length && !text.slice(text.indexOf(close[1]) + close[1].length).trim()) {
				fence = null;
			}
			prevBlank = false;
			prevInItemText = false;
			continue;
		}

		if (!text.trim()) {
			prevBlank = true;
			prevInItemText = false;
			continue;
		}

		const indent = columns(text.match(/^[ \t]*/)![0]);
		const m = text.match(ITEM);

		if (m) {
			const markerCol = columns(m[1]);
			// Close items this one is not nested inside; the shallowest closed item is a sibling.
			let sibling: OpenItem | null = null;
			while (stack.length && markerCol < stack[stack.length - 1].contentCol) sibling = stack.pop()!;
			const ordered = m[3] !== undefined;
			const delim = ordered ? m[4] : m[2];
			const parent = stack[stack.length - 1] ?? null;
			let list: List;
			if (sibling && sibling.list.ordered === ordered && sibling.list.delim === delim) {
				list = sibling.list;
			} else {
				list = {
					ordered,
					delim,
					start: ordered ? Number(m[3]) : 1,
					count: 0,
					parentChain: parent ? parent.chain : [],
					parentLevel: parent ? parent.level : 0,
				};
			}
			const number = list.start + list.count;
			list.count++;
			const chain = [...list.parentChain, number];
			const level = list.parentLevel + (ordered ? 1 : 0);
			// Content starts after the marker and 1-4 columns of space; 5+ (or none) means marker + 1.
			const markerEnd = m[1].length + (ordered ? m[3].length + 1 : 1);
			const afterMarker = columns(text.slice(0, markerEnd));
			const gap = columns(text.slice(0, markerEnd) + m[5]) - afterMarker;
			const contentCol = afterMarker + (gap >= 1 && gap <= 4 ? gap : 1);
			stack.push({ list, markerCol, contentCol, chain, level });
			if (ordered) out.push({ line: i, from: m[1].length, to: markerEnd, level, number, chain });
			prevBlank = false;
			prevInItemText = true;
			continue;
		}

		const fenceOpen = text.match(FENCE);
		const interrupts = HEADING.test(text) || THEMATIC.test(text) || QUOTE.test(text) || !!fenceOpen;

		// Paragraph text: inside the deepest item whose content column it reaches, or a lazy
		// continuation of the item text just above. Otherwise the lists above end.
		const deepest = stack[stack.length - 1];
		const inside = deepest && indent >= deepest.contentCol;
		const lazy = !interrupts && !prevBlank && prevInItemText;
		if (deepest && !inside && !lazy) {
			while (stack.length && indent < stack[stack.length - 1].contentCol) stack.pop();
		}
		if (fenceOpen) fence = fenceOpen[1];
		prevBlank = false;
		prevInItemText = stack.length > 0 && !interrupts;
	}
	return out;
}

/* ---------- formatting ---------- */

function alpha(n: number, upper: boolean): string {
	if (n < 1) return String(n);
	let s = "";
	while (n > 0) {
		n--;
		s = String.fromCharCode(97 + (n % 26)) + s;
		n = Math.floor(n / 26);
	}
	return upper ? s.toUpperCase() : s;
}

function roman(n: number, upper: boolean): string {
	if (n < 1 || n > 3999) return String(n);
	const table: [number, string][] = [
		[1000, "m"], [900, "cm"], [500, "d"], [400, "cd"], [100, "c"], [90, "xc"],
		[50, "l"], [40, "xl"], [10, "x"], [9, "ix"], [5, "v"], [4, "iv"], [1, "i"],
	];
	let s = "";
	for (const [v, r] of table) while (n >= v) { s += r; n -= v; }
	return upper ? s.toUpperCase() : s;
}

type Counter = "decimal" | "lower-alpha" | "upper-alpha" | "lower-roman" | "upper-roman";

function counter(n: number, kind: Counter): string {
	switch (kind) {
		case "decimal": return String(n);
		case "lower-alpha": return alpha(n, false);
		case "upper-alpha": return alpha(n, true);
		case "lower-roman": return roman(n, false);
		case "upper-roman": return roman(n, true);
	}
}

/** Counter per ordered-list level; the last entry repeats for deeper levels. Mirrors theme.css. */
export const STYLE_LEVELS: Record<Exclude<OutlineStyle, "decimal">, Counter[]> = {
	standard: ["decimal", "lower-alpha", "lower-roman", "upper-alpha", "lower-roman"],
	hornbook: ["upper-roman", "upper-alpha", "decimal", "lower-alpha", "lower-roman", "decimal"],
	statutory: ["decimal", "lower-alpha", "lower-roman", "upper-alpha", "upper-roman"],
};

/** The marker text for an item in a style: "b.", "IV.", "(a)", "2.1.3". */
export function formatMarker(item: Pick<OutlineMarker, "level" | "number" | "chain">, style: OutlineStyle): string {
	if (style === "decimal") return item.chain.length > 1 ? item.chain.join(".") : `${item.number}.`;
	const levels = STYLE_LEVELS[style];
	const text = counter(item.number, levels[Math.min(item.level, levels.length) - 1]);
	return style === "statutory" ? `(${text})` : `${text}.`;
}

/** The style a set of CSS classes selects: a note's `outline-*` cssclass, then the body class. */
export function styleFromClasses(noteClasses: Iterable<string>, bodyClasses: Iterable<string>): OutlineStyle {
	for (const c of noteClasses) {
		const m = /^outline-(standard|hornbook|decimal|statutory)$/.exec(c);
		if (m) return m[1] as OutlineStyle;
	}
	const body = new Set(bodyClasses);
	if (body.has("doom-legal-outline")) return "hornbook";
	if (body.has("doom-outline-decimal")) return "decimal";
	if (body.has("doom-outline-statutory")) return "statutory";
	return "standard";
}

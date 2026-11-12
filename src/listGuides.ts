/**
 * List indent guides under wrapped parents (Live Preview / Source).
 *
 * Obsidian draws a list's indent guide on the child lines only, so when a parent item wraps over
 * several rows the guide starts below its last row instead of under its marker. The theme can draw
 * the missing segment down the parent line, but CSS cannot tell that the *next* line is a deeper
 * list item without `:has()`, which the theme avoids. This extension adds that fact as a line class
 * (`doom-list-parent`); the theme styles `.HyperMD-list-line-N.doom-list-parent`.
 *
 * A line gets the class when it is a list item, the next line is a list item indented further, the
 * child is not hidden by a fold, and Obsidian's "Show indentation guides" setting is on.
 */
import { RangeSetBuilder } from "@codemirror/state";
import { Decoration, DecorationSet, EditorView, ViewPlugin, ViewUpdate } from "@codemirror/view";

export const LIST_PARENT_CLASS = "doom-list-parent";

const LIST_ITEM = /^([ \t]*)(?:[-*+]|\d+[.)])(?:[ \t]|$)/;

/** Visual width of a line's list indentation, or null when the line is not a list item. */
export function listIndentWidth(text: string, tabSize: number): number | null {
	const match = LIST_ITEM.exec(text);
	if (!match) return null;
	let width = 0;
	for (const ch of match[1]) {
		width = ch === "\t" ? width + tabSize - (width % tabSize) : width + 1;
	}
	return width;
}

/** True when `next` is a list item nested under the list item `line`. */
export function isListParent(line: string, next: string | null, tabSize: number): boolean {
	if (next === null) return false;
	const own = listIndentWidth(line, tabSize);
	if (own === null) return false;
	const child = listIndentWidth(next, tabSize);
	return child !== null && child > own;
}

const parentLine = Decoration.line({ class: LIST_PARENT_CLASS });

function buildDecorations(view: EditorView, guidesOn: () => boolean): DecorationSet {
	const builder = new RangeSetBuilder<Decoration>();
	if (!guidesOn()) return builder.finish();
	const { doc, tabSize } = view.state;
	for (const { from, to } of view.visibleRanges) {
		let pos = from;
		while (pos <= to) {
			const line = doc.lineAt(pos);
			if (line.number < doc.lines) {
				const next = doc.line(line.number + 1);
				// A folded child is merged into the parent's visual block, so it does not start one.
				if (isListParent(line.text, next.text, tabSize) && view.lineBlockAt(next.from).from === next.from) {
					builder.add(line.from, line.from, parentLine);
				}
			}
			pos = line.to + 1;
		}
	}
	return builder.finish();
}

/**
 * The editor extension. `guidesOn` reports Obsidian's "Show indentation guides" setting; it is read
 * on every update, so toggling the setting (which re-renders the editor) is picked up.
 */
export function listParentGuides(guidesOn: () => boolean) {
	return ViewPlugin.fromClass(
		class {
			decorations: DecorationSet;
			constructor(view: EditorView) {
				this.decorations = buildDecorations(view, guidesOn);
			}
			update(update: ViewUpdate) {
				// Cheap (visible lines only); also covers folds and the guides setting changing.
				this.decorations = buildDecorations(update.view, guidesOn);
			}
		},
		{ decorations: (v) => v.decorations }
	);
}

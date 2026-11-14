import { RangeSetBuilder } from "@codemirror/state";
import { Decoration, DecorationSet, EditorView, ViewPlugin, ViewUpdate, WidgetType } from "@codemirror/view";
import { editorLivePreviewField } from "obsidian";
import { OutlineMarker, OutlineStyle, computeOutline, formatMarker, styleFromClasses } from "./outlineNumbering";

/** Body class the plugin sets while DoomEsque is active and Live Preview numbering is on. */
export const OUTLINE_LIVE_CLASS = "doom-outline-live";

/**
 * The marker drawn in place of the typed one. An invisible copy of the typed marker keeps exactly its
 * width, so the item's text and its wrapped lines stay where Obsidian put them; the new marker is
 * right-aligned to the same edge and extends to the left when it is longer ("III." for "3.").
 */
class OutlineMarkerWidget extends WidgetType {
	constructor(readonly text: string, readonly source: string, readonly level: number) {
		super();
	}

	eq(other: OutlineMarkerWidget): boolean {
		return other.text === this.text && other.source === this.source && other.level === this.level;
	}

	toDOM(): HTMLElement {
		// The list-marker classes give the widget the theme's marker font, weight and per-level colour,
		// and keep the invisible copy exactly as wide as the typed marker it stands in for.
		const el = createSpan({
			cls: `cm-formatting cm-formatting-list cm-formatting-list-ol doom-outline-marker doom-outline-level-${Math.min(this.level, 6)}`,
		});
		el.createSpan({ cls: "doom-outline-marker-sizer", text: this.source });
		el.createSpan({ cls: "doom-outline-marker-text", text: `${this.text} ` });
		return el;
	}

	ignoreEvent(): boolean {
		return false;
	}
}

class OutlineNumbering {
	decorations: DecorationSet = Decoration.none;
	private markers: OutlineMarker[] | null = null;
	private style: OutlineStyle | null = null;
	private observer: MutationObserver;
	private observedNote: Element | null = null;

	constructor(private view: EditorView) {
		this.observer = new MutationObserver(() => this.recheck());
		this.observer.observe(view.dom.ownerDocument.body, { attributes: true, attributeFilter: ["class"] });
		this.observeNote();
		this.style = this.readStyle();
		this.decorations = this.build();
	}

	/** The note's view container carries its `cssclasses`; watch it for `outline-*` changes. */
	private observeNote(): void {
		const note = this.view.dom.closest(".markdown-source-view");
		if (!note || note === this.observedNote) return;
		this.observedNote = note;
		this.observer.observe(note, { attributes: true, attributeFilter: ["class"] });
	}

	/** null when numbering should not be drawn (another theme, turned off, or Source mode). */
	private readStyle(): OutlineStyle | null {
		const body = this.view.dom.ownerDocument.body;
		if (!body.classList.contains(OUTLINE_LIVE_CLASS)) return null;
		if (!this.view.state.field(editorLivePreviewField, false)) return null;
		return styleFromClasses(Array.from(this.observedNote?.classList ?? []), Array.from(body.classList));
	}

	private recheck(): void {
		const style = this.readStyle();
		if (style === this.style) return;
		this.style = style;
		this.decorations = this.build();
		// Ask CodeMirror to redraw with the new decorations.
		this.view.dispatch({});
	}

	update(u: ViewUpdate): void {
		this.observeNote();
		if (u.docChanged) this.markers = null;
		const style = this.readStyle();
		if (u.docChanged || u.viewportChanged || u.selectionSet || style !== this.style) {
			this.style = style;
			this.decorations = this.build();
		}
	}

	private build(): DecorationSet {
		if (!this.style) return Decoration.none;
		const { state } = this.view;
		if (!this.markers) {
			const lines: string[] = [];
			for (const iter = state.doc.iterLines(); !iter.next().done; ) lines.push(iter.value);
			this.markers = computeOutline(lines);
		}
		if (!this.markers.length) return Decoration.none;
		const builder = new RangeSetBuilder<Decoration>();
		const { from: vFrom, to: vTo } = this.view.viewport;
		const selection = state.selection.ranges;
		for (const m of this.markers) {
			const line = state.doc.line(m.line + 1);
			if (line.to < vFrom) continue;
			if (line.from > vTo) break;
			// The typed marker and the space after it ("12. "), all of which Obsidian draws as the marker.
			let end = m.to;
			while (end < line.text.length && (line.text[end] === " " || line.text[end] === "\t")) end++;
			const from = line.from + m.from;
			const to = line.from + end;
			// Editing the number: show what is typed while the cursor touches the marker.
			if (selection.some((r) => r.from <= to && r.to >= from)) continue;
			const text = formatMarker(m, this.style);
			if (text === line.text.slice(m.from, m.to)) continue;
			const source = line.text.slice(m.from, end);
			builder.add(from, to, Decoration.replace({ widget: new OutlineMarkerWidget(text, source, m.level) }));
		}
		return builder.finish();
	}

	destroy(): void {
		this.observer.disconnect();
	}
}

/** Live Preview outline numbering: the same markers Reading view draws for ordered lists. */
export const outlineNumberingExtension = ViewPlugin.fromClass(OutlineNumbering, {
	decorations: (v) => v.decorations,
});

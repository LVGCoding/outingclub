import {
	ElementNode,
	$createParagraphNode,
	type LexicalNode,
	type NodeKey,
	type SerializedElementNode,
	type DOMExportOutput
} from 'lexical';

export type SerializedColumnLayoutNode = SerializedElementNode & {
	type: 'column-layout';
	version: 1;
	columns: number;
};

export class ColumnLayoutNode extends ElementNode {
	__columns: number;

	static getType(): string {
		return 'column-layout';
	}

	static clone(node: ColumnLayoutNode): ColumnLayoutNode {
		return new ColumnLayoutNode(node.__columns, node.__key);
	}

	static importJSON(serializedNode: SerializedColumnLayoutNode): ColumnLayoutNode {
		return new ColumnLayoutNode(serializedNode.columns);
	}

	constructor(columns = 2, key?: NodeKey) {
		super(key);

		this.__columns = Math.max(1, Math.floor(columns));
	}

	exportJSON(): SerializedColumnLayoutNode {
		return {
			...super.exportJSON(),
			type: 'column-layout',
			version: 1,
			columns: this.__columns
		};
	}

	getColumns(): number {
		return this.getLatest().__columns;
	}

	setColumns(columns: number): this {
		this.getWritable().__columns = Math.max(1, Math.floor(columns));

		return this;
	}

	createDOM(): HTMLElement {
		const dom = document.createElement('div');

		dom.className = 'column-layout border';
		console.log(this.__columns);
		dom.style.setProperty('--column-layout-columns', String(this.__columns));

		return dom;
	}

	exportDOM(): DOMExportOutput {
		const dom = document.createElement('div');

		dom.className = 'column-layout';
		console.log(this.__columns);
		dom.style.setProperty('--column-layout-columns', String(this.__columns));

		return {
			element: dom
		};
	}

	updateDOM(prevNode: ColumnLayoutNode, dom: HTMLElement): boolean {
		if (prevNode.__columns !== this.__columns) {
			dom.style.setProperty('--column-layout-columns', String(this.__columns));
		}

		return false;
	}

	isInline(): boolean {
		return false;
	}

	canBeEmpty(): boolean {
		return false;
	}

	canInsertTextBefore(): boolean {
		return false;
	}

	canInsertTextAfter(): boolean {
		return false;
	}
}

export function $createColumnLayoutNode(columns = 2): ColumnLayoutNode {
	const node = new ColumnLayoutNode(columns);

	node.append($createParagraphNode());

	return node;
}

export function $isColumnLayoutNode(
	node: LexicalNode | null | undefined
): node is ColumnLayoutNode {
	return node instanceof ColumnLayoutNode;
}

// ImageNode.ts
import { DecoratorNode } from 'lexical';
import type {
	DOMConversionMap,
	DOMExportOutput,
	LexicalNode,
	NodeKey,
	SerializedLexicalNode,
	Spread
} from 'lexical';
import ImageComponent from './ImageComponent.svelte';
import type { ComponentProps } from 'svelte';

type DecoratorImageType = {
	componentClass: typeof ImageComponent;
	updateProps: (props: ComponentProps<typeof ImageComponent>) => void;
};

export type ImageWrapMode = 'left' | 'inline' | 'right';
export type Size = { width: number; height: number };

export type SerializedImageNode = Spread<
	{
		url: string;
		caption: string;
		wrapMode: ImageWrapMode;
		size: Size;
	},
	SerializedLexicalNode
>;

export function $createImageNode(
	url: string,
	text: string,
	wrapMode: ImageWrapMode,
	size: Size
): ImageNode {
	return new ImageNode(url, text, wrapMode, size);
}

export class ImageNode extends DecoratorNode<DecoratorImageType> {
	__url: string;
	__caption: string;
	__wrapMode: ImageWrapMode;
	__size: Size;

	static getType(): string {
		return 'image-node';
	}

	static clone(node: ImageNode): ImageNode {
		return new ImageNode(node.__url, node.__caption, node.__wrapMode, node.__size, node.__key);
	}

	constructor(url: string, text: string, wrapMode: ImageWrapMode, size: Size, key?: NodeKey) {
		super(key);
		this.__url = url;
		this.__caption = text;
		this.__wrapMode = wrapMode;
		this.__size = size;
	}

	createDOM() {
		//config: EditorConfig
		const span = document.createElement('span');
		span.style.display = 'inline-flex';
		span.style.position = 'relative';
		return span;
	}

	updateDOM(): false {
		return false;
	}
	static importJSON(serializedNode: SerializedImageNode): ImageNode {
		return $createImageNode(
			serializedNode.url,
			serializedNode.caption,
			serializedNode.wrapMode,
			serializedNode.size
		).updateFromJSON(serializedNode);
	}

	exportDOM(): DOMExportOutput {
		const span = document.createElement('span');
		span.style.display = 'inline-flex';
		span.style.position = 'relative';
		const img = document.createElement('img');
		img.src = this.__url;
		img.alt = this.__caption;
		img.width = this.__size.width;
		img.height = this.__size.height;
		img.style.width = `${this.__size.width}px`;
		img.style.height = `${this.__size.height}px`;
		img.draggable = false;
		img.classList.add('m-2');
		switch (this.__wrapMode) {
			case 'left':
				img.classList.add('left-image');
				break;
			case 'inline':
				img.classList.add('inline-image');
				break;
			case 'right':
				img.classList.add('right-image');
				break;
		}
		span.append(img);
		return { element: span };
	}

	static importDOM(): DOMConversionMap | null {
		//TODO
		return {};
	}

	exportJSON(): SerializedImageNode {
		return {
			...super.exportJSON(),
			url: this.__url,
			caption: this.__caption,
			wrapMode: this.__wrapMode,
			size: this.__size
		};
	}

	setData(url: string, text: string, wrapMode: ImageWrapMode, size: Size) {
		const writable = this.getWritable();
		writable.__url = url;
		writable.__caption = text;
		writable.__wrapMode = wrapMode;
		writable.__size = size;
	}

	decorate(): DecoratorImageType {
		return {
			componentClass: ImageComponent,
			updateProps: (props) => {
				props.caption = this.__caption;
				props.url = this.__url;
				props.wrapMode = this.__wrapMode;
				props.size = this.__size;
				props.key = this.__key;
			}
		};
	}
}

// Helper
export function createImageNode(
	url: string,
	caption: string,
	wrapMode: ImageWrapMode,
	size: Size
): ImageNode {
	return new ImageNode(url, caption, wrapMode, size);
}

export function isImageNode(node: LexicalNode | null): node is ImageNode {
	return node instanceof ImageNode;
}

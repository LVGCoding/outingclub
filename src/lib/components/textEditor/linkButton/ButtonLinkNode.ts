import { DecoratorNode } from 'lexical';
import type {
	DOMConversionMap,
	DOMExportOutput,
	LexicalNode,
	NodeKey,
	SerializedLexicalNode,
	Spread
} from 'lexical';

import ButtonLinkComponent from './ButtonLinkComponent.svelte';
import type { ComponentProps } from 'svelte';
import { buttonVariants } from '../../ui/button';
import { cn } from '#lib/utils';

type DecoratorButtonLinkType = {
	componentClass: typeof ButtonLinkComponent;
	updateProps: (props: ComponentProps<typeof ButtonLinkComponent>) => void;
};

export type SerializedButtonLinkNode = Spread<
	{
		url: string;
		text: string;
	},
	SerializedLexicalNode
>;

export function $createButtonLinkNode(url: string, text: string): ButtonLinkNode {
	return new ButtonLinkNode(url, text);
}

export class ButtonLinkNode extends DecoratorNode<DecoratorButtonLinkType> {
	__url: string;
	__text: string;

	static getType(): string {
		return 'button-link';
	}

	static clone(node: ButtonLinkNode): ButtonLinkNode {
		return new ButtonLinkNode(node.__url, node.__text, node.__key);
	}

	constructor(url: string, text: string, key?: NodeKey) {
		super(key);
		this.__url = url;
		this.__text = text;
	}

	createDOM() {
		const span = document.createElement('span');
		return span;
	}

	updateDOM(): false {
		return false;
	}

	exportDOM(): DOMExportOutput {
		const wrapper = document.createElement('span');
		const link = document.createElement('a');

		link.href = this.__url;
		link.target = '_blank';
		link.rel = 'noopener noreferrer';
		link.textContent = this.__text;

		link.className = cn('mx-2', buttonVariants({ variant: 'outline' }));

		wrapper.appendChild(link);

		return {
			element: wrapper
		};
	}

	static importDOM(): DOMConversionMap | null {
		//TODO
		return {};
	}

	static importJSON(serializedNode: SerializedButtonLinkNode): ButtonLinkNode {
		return $createButtonLinkNode(serializedNode.url, serializedNode.text).updateFromJSON(
			serializedNode
		);
	}

	exportJSON(): SerializedButtonLinkNode {
		return {
			...super.exportJSON(),
			url: this.__url,
			text: this.__text
		};
	}

	setData(url: string, text: string) {
		const writable = this.getWritable();

		writable.__url = url;
		writable.__text = text;
	}

	decorate(): DecoratorButtonLinkType {
		return {
			componentClass: ButtonLinkComponent,
			updateProps: (props) => {
				props.text = this.__text;
				props.url = this.__url;
				props.key = this.__key;
			}
		};
	}
}

export function createButtonLinkNode(url: string, text: string): ButtonLinkNode {
	return new ButtonLinkNode(url, text);
}

export function isButtonLinkNode(node: LexicalNode | null): node is ButtonLinkNode {
	return node instanceof ButtonLinkNode;
}

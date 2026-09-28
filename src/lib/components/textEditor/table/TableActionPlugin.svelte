<!-- eslint-disable-next-line svelte/no-unused-svelte-ignore -->
<!--svelte-ignore state_referenced_locally -->
<script lang="ts">
	import {
		$getTableNodeFromLexicalNodeOrThrow as getTableNodeFromLexicalNodeOrThrow,
		$getTableCellNodeFromLexicalNode as getTableCellNodeFromLexicalNode,
		getTableElement,
		TableCellNode,
		TableObserver,
		getTableObserverFromTableElement,
		$isTableSelection as isTableSelection,
		$isTableCellNode as isTableCellNode,
		$insertTableRowAtSelection as _insertTableRowAtSelection,
		$insertTableColumnAtSelection as _insertTableColumnAtSelection,
		$deleteTableRowAtSelection as _deleteTableRowAtSelection,
		$deleteTableColumnAtSelection as _deleteTableColumnAtSelection,
		$getNodeTriplet as getNodeTriplet
	} from '@lexical/table';
	import {
		COMMAND_PRIORITY_CRITICAL,
		$getSelection as getSelection,
		$isRangeSelection as isRangeSelection,
		type LexicalEditor,
		$setSelection as setSelection,
		SELECTION_CHANGE_COMMAND
	} from 'lexical';
	import * as DropdownMenu from '#lib/components/ui/dropdown-menu/';
	import { writable, type Readable } from 'svelte/store';
	import { mergeRegister } from '@lexical/utils';
	import { getContext } from 'svelte';
	import {
		AlignVerticalJustifyCenter,
		AlignVerticalJustifyEnd,
		AlignVerticalJustifyStart,
		ChevronDown
	} from 'lucide-svelte';
	import { buttonVariants } from '../../ui/button';
	import * as Dialog from '#lib/components/ui/dialog/';
	import ColorPicker from '../colorpicker/ColorPicker.svelte';

	function getEditor(): LexicalEditor {
		return getContext('editor');
	}
	function getIsEditable(): Readable<boolean> {
		return getContext('isEditable');
	}
	interface Props {
		anchorElem: HTMLElement;
	}

	let { anchorElem }: Props = $props();

	const editor = getEditor();
	const isEditable = getIsEditable();

	let menuButtonRef: HTMLElement | null = $state(null);
	const isMenuOpen = writable(false);

	let tableCellNode = $state<TableCellNode | null>(null);
	let openColor = $state(false);

	const checkTableCellOverflow = (tableCellParentNodeDOM: HTMLElement): boolean => {
		const scrollableContainer = tableCellParentNodeDOM.closest(
			'.PlaygroundEditorTheme__tableScrollableWrapper'
		);
		if (scrollableContainer) {
			const containerRect = (scrollableContainer as HTMLElement).getBoundingClientRect();
			const cellRect = tableCellParentNodeDOM.getBoundingClientRect();

			// Calculate where the action button would be positioned (5px from right edge of cell)
			// Also account for the button width and table cell padding (8px)
			const actionButtonRight = cellRect.right - 5;
			const actionButtonLeft = actionButtonRight - 28; // 20px width + 8px padding

			// Only hide if the action button would overflow the container
			if (actionButtonRight > containerRect.right || actionButtonLeft < containerRect.left) {
				return true;
			}
		}
		return false;
	};

	const moveMenu = () => {
		const menu = menuButtonRef;
		const selection = getSelection();
		const nativeSelection = window.getSelection();
		const activeElement = document.activeElement;
		function disable() {
			if (menu) {
				menu.classList.remove('table-cell-action-button-container--active');
				menu.classList.add('table-cell-action-button-container--inactive');
			}
			tableCellNode = null;
		}

		if (selection == null || menu == null) {
			return disable();
		}

		const rootElement = editor.getRootElement();
		let tableObserver: TableObserver | null = null;
		let tableCellParentNodeDOM: HTMLElement | null = null;

		if (
			isRangeSelection(selection) &&
			rootElement !== null &&
			nativeSelection !== null &&
			rootElement.contains(nativeSelection.anchorNode)
		) {
			const tableCellNodeFromSelection = getTableCellNodeFromLexicalNode(
				selection.anchor.getNode()
			);

			if (tableCellNodeFromSelection == null) {
				return disable();
			}

			tableCellParentNodeDOM = editor.getElementByKey(tableCellNodeFromSelection.getKey());

			if (tableCellParentNodeDOM == null || !tableCellNodeFromSelection.isAttached()) {
				return disable();
			}

			if (checkTableCellOverflow(tableCellParentNodeDOM)) {
				return disable();
			}

			const tableNode = getTableNodeFromLexicalNodeOrThrow(tableCellNodeFromSelection);
			const tableElement = getTableElement(tableNode, editor.getElementByKey(tableNode.getKey()));

			if (!tableElement) {
				throw new Error('Expected to find tableElement in DOM');
			}

			tableObserver = getTableObserverFromTableElement(tableElement);
			tableCellNode = tableCellNodeFromSelection;
		} else if (isTableSelection(selection)) {
			const anchorNode = getTableCellNodeFromLexicalNode(selection.anchor.getNode());
			if (!isTableCellNode(anchorNode)) {
				throw new Error('TableSelection anchorNode must be a TableCellNode');
			}
			const tableNode = getTableNodeFromLexicalNodeOrThrow(anchorNode);
			const tableElement = getTableElement(tableNode, editor.getElementByKey(tableNode.getKey()));
			if (!tableElement) {
				throw new Error('Expected to find tableElement in DOM');
			}
			tableObserver = getTableObserverFromTableElement(tableElement);
			tableCellParentNodeDOM = editor.getElementByKey(anchorNode.getKey());

			if (tableCellParentNodeDOM === null) {
				return disable();
			}

			if (checkTableCellOverflow(tableCellParentNodeDOM)) {
				return disable();
			}
		} else if (!activeElement) {
			return disable();
		}
		if (tableObserver === null || tableCellParentNodeDOM === null) {
			return disable();
		}
		const enabled = !tableObserver || !tableObserver.isSelecting;
		menu.classList.toggle('table-cell-action-button-container--active', enabled);
		menu.classList.toggle('table-cell-action-button-container--inactive', !enabled);
		if (enabled) {
			const tableCellRect = tableCellParentNodeDOM.getBoundingClientRect();
			const anchorRect = anchorElem.getBoundingClientRect();
			const top = tableCellRect.top - anchorRect.top;
			const left = tableCellRect.right - anchorRect.left;
			menu.style.transform = `translate(${left}px, ${top}px)`;
		}
	};

	$effect(() => {
		// We call the $moveMenu callback every time the selection changes,
		// once up front, and once after each pointerup
		let timeoutId: ReturnType<typeof setTimeout> | undefined = undefined;
		const callback = () => {
			timeoutId = undefined;
			editor.getEditorState().read(moveMenu);
		};
		const delayedCallback = () => {
			if (timeoutId === undefined) {
				timeoutId = setTimeout(callback, 0);
			}
			return false;
		};
		return mergeRegister(
			editor.registerUpdateListener(delayedCallback),
			editor.registerCommand(SELECTION_CHANGE_COMMAND, delayedCallback, COMMAND_PRIORITY_CRITICAL),
			editor.registerRootListener((rootElement, prevRootElement) => {
				if (prevRootElement) {
					prevRootElement.removeEventListener('pointerup', delayedCallback);
				}
				if (rootElement) {
					rootElement.addEventListener('pointerup', delayedCallback);
					delayedCallback();
				}
			}),
			() => clearTimeout(timeoutId)
		);
	});

	let prevTableCellDOM = $state(tableCellNode);

	$effect(() => {
		if (prevTableCellDOM === tableCellNode) return;
		$isMenuOpen = false;
		prevTableCellDOM = tableCellNode;
	});
	const clearTableSelection = () => {
		editor.update(() => {
			if (tableCellNode?.isAttached()) {
				const tableNode = getTableNodeFromLexicalNodeOrThrow(tableCellNode);
				const tableElement = getTableElement(tableNode, editor.getElementByKey(tableNode.getKey()));

				if (!tableElement) {
					throw new Error('Expected to find tableElement in DOM');
				}

				const tableObserver = getTableObserverFromTableElement(tableElement);
				if (tableObserver !== null) {
					tableObserver.$clearHighlight();
				}

				tableNode.markDirty();
				tableCellNode = tableCellNode.getLatest();
			}
			setSelection(null);
		});
	};

	const insertTableRowAtSelection = (shouldInsertAfter: boolean) => {
		editor.update(() => {
			_insertTableRowAtSelection(shouldInsertAfter);
		});
	};
	const insertTableColumnAtSelection = (shouldInsertAfter: boolean) => {
		editor.update(() => {
			_insertTableColumnAtSelection(shouldInsertAfter);
		});
	};
	const deleteTableRowAtSelection = () => {
		editor.update(() => {
			_deleteTableRowAtSelection();
		});
	};

	const deleteTableAtSelection = () => {
		editor.update(() => {
			if (!tableCellNode) return;
			const tableNode = getTableNodeFromLexicalNodeOrThrow(tableCellNode);
			tableNode.remove();

			clearTableSelection();
		});
	};

	const deleteTableColumnAtSelection = () => {
		editor.update(() => {
			_deleteTableColumnAtSelection();
		});
	};

	const toggleFirstRowFreeze = () => {
		editor.update(() => {
			if (tableCellNode?.isAttached()) {
				const tableNode = getTableNodeFromLexicalNodeOrThrow(tableCellNode);
				if (tableNode) {
					tableNode.setFrozenRows(tableNode.getFrozenRows() === 0 ? 1 : 0);
				}
			}
			clearTableSelection();
		});
	};

	const toggleFirstColumnFreeze = () => {
		editor.update(() => {
			if (tableCellNode?.isAttached()) {
				const tableNode = getTableNodeFromLexicalNodeOrThrow(tableCellNode);
				if (tableNode) {
					tableNode.setFrozenColumns(tableNode.getFrozenColumns() === 0 ? 1 : 0);
				}
			}
			clearTableSelection();
		});
	};

	const formatVerticalAlign = (value: string) => {
		editor.update(() => {
			const selection = getSelection();
			if (isRangeSelection(selection) || isTableSelection(selection)) {
				const [cell] = getNodeTriplet(selection.anchor);
				if (isTableCellNode(cell)) {
					cell.setVerticalAlign(value);
				}

				if (isTableSelection(selection)) {
					const nodes = selection.getNodes();

					for (let i = 0; i < nodes.length; i++) {
						const node = nodes[i];
						if (isTableCellNode(node)) {
							node.setVerticalAlign(value);
						}
					}
				}
			}
		});
	};
	const handleCellBackgroundColor = (value: string) => {
		editor.update(() => {
			const selection = getSelection();
			if (isRangeSelection(selection) || isTableSelection(selection)) {
				const [cell] = getNodeTriplet(selection.anchor);
				if (isTableCellNode(cell)) {
					cell.setBackgroundColor(value);
				}
				if (isTableSelection(selection)) {
					const nodes = selection.getNodes();
					for (let i = 0; i < nodes.length; i++) {
						const node = nodes[i];
						if (isTableCellNode(node)) {
							node.setBackgroundColor(value);
						}
					}
				}
			}
		});
	};
	function currentCellBackgroundColor(editor: LexicalEditor): null | string {
		return editor.getEditorState().read(() => {
			const selection = getSelection();
			if (isRangeSelection(selection) || isTableSelection(selection)) {
				const [cell] = getNodeTriplet(selection.anchor);
				if (isTableCellNode(cell)) {
					return cell.getBackgroundColor();
				}
			}
			return null;
		});
	}
	let backgroundColor = writable(currentCellBackgroundColor(editor) || '');
</script>

{#if $isEditable}
	<div class="table-cell-action-button-container" bind:this={menuButtonRef}>
		{#if tableCellNode != null}
			<DropdownMenu.Root>
				<DropdownMenu.Trigger
					type="button"
					class={buttonVariants({ size: 'xs', variant: 'ghost' })}
					style="justify-content: center;
    align-items: center;
    border: 0;
    position: absolute;
    top: 6px;
    right: 0px;
    display: inline-block;">
					<ChevronDown />
				</DropdownMenu.Trigger>
				<DropdownMenu.Content class="w-56">
					<DropdownMenu.Group>
						<DropdownMenu.Label>Table</DropdownMenu.Label>
						<DropdownMenu.Separator />
						<DropdownMenu.Item onclick={() => toggleFirstRowFreeze()}>
							Toggle First Row Freeze
						</DropdownMenu.Item>
						<DropdownMenu.Item onclick={() => toggleFirstColumnFreeze()}>
							Toggle First Col Freeze
						</DropdownMenu.Item>
						<DropdownMenu.Item onclick={() => {}}>Make Border Transparent</DropdownMenu.Item>
						<DropdownMenu.Item onclick={() => deleteTableAtSelection()}>
							Delete Table
						</DropdownMenu.Item>
					</DropdownMenu.Group>
					<DropdownMenu.Group>
						<DropdownMenu.Label>Row/Col</DropdownMenu.Label>
						<DropdownMenu.Separator />
						<DropdownMenu.Item onclick={() => insertTableRowAtSelection(false)}>
							Insert Row Above
						</DropdownMenu.Item>
						<DropdownMenu.Item onclick={() => insertTableRowAtSelection(true)}>
							Insert Row Below
						</DropdownMenu.Item>
						<DropdownMenu.Item onclick={() => insertTableColumnAtSelection(true)}>
							Insert Col Right
						</DropdownMenu.Item>
						<DropdownMenu.Item onclick={() => insertTableColumnAtSelection(false)}>
							Insert Col Left
						</DropdownMenu.Item>
						<DropdownMenu.Item onclick={() => deleteTableRowAtSelection()}>
							Delete Row
						</DropdownMenu.Item>
						<DropdownMenu.Item onclick={() => deleteTableColumnAtSelection()}>
							Delete Col
						</DropdownMenu.Item>
					</DropdownMenu.Group>
					<DropdownMenu.Group>
						<DropdownMenu.Label>Cell</DropdownMenu.Label>
						<DropdownMenu.Separator />
						<DropdownMenu.Item
							onclick={() => {
								$backgroundColor = currentCellBackgroundColor(editor) || '';
								openColor = true;
							}}>
							Set Background color
						</DropdownMenu.Item>
						<DropdownMenu.Sub>
							<DropdownMenu.SubTrigger>Vertical Align</DropdownMenu.SubTrigger>
							<DropdownMenu.SubContent>
								<DropdownMenu.Item
									onclick={() => {
										formatVerticalAlign('top');
									}}>
									<AlignVerticalJustifyStart size={16} />
									Align Top
								</DropdownMenu.Item>
								<DropdownMenu.Item
									onclick={() => {
										formatVerticalAlign('middle');
									}}>
									<AlignVerticalJustifyCenter size={16} />
									Align Middle
								</DropdownMenu.Item>
								<DropdownMenu.Item
									onclick={() => {
										formatVerticalAlign('bottom');
									}}>
									<AlignVerticalJustifyEnd size={16} />Align Bottom
								</DropdownMenu.Item>
							</DropdownMenu.SubContent>
						</DropdownMenu.Sub>
					</DropdownMenu.Group>
				</DropdownMenu.Content>
			</DropdownMenu.Root>
			<!-- <Button
				type="button"
				variant="ghost"
				style="justify-content: center;
    align-items: center;
    border: 0;
    position: absolute;
    top: 6px;
    right: 0px;
    display: inline-block;"
				size="xs"
				onclick={(e) => {
					e.stopPropagation();
					$isMenuOpen = !$isMenuOpen;
				}}>
				<ChevronDown />
			</Button>
			{#if $isMenuOpen}
				test
			{/if} -->
		{/if}
	</div>
	<Dialog.Root bind:open={openColor}>
		<Dialog.Content>
			<Dialog.Header>
				<Dialog.Title>Set Color</Dialog.Title>
			</Dialog.Header>
			<ColorPicker
				color={$backgroundColor === '#fff' ? '' : $backgroundColor}
				onChange={(value) => {
					handleCellBackgroundColor(value);
				}}></ColorPicker>
			<Dialog.Footer>
				<Dialog.Close type="button" class={buttonVariants({ variant: 'outline' })}>
					Cancel
				</Dialog.Close>
				<Dialog.Close type="button" class={buttonVariants({ variant: 'default' })}>
					Confirm
				</Dialog.Close>
			</Dialog.Footer>
		</Dialog.Content>
	</Dialog.Root>
{/if}

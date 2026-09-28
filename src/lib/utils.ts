import { clsx, type ClassValue } from 'clsx';
import Swal from 'sweetalert2';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type WithoutChild<T> = T extends { child?: any } ? Omit<T, 'child'> : T;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type WithoutChildren<T> = T extends { children?: any } ? Omit<T, 'children'> : T;
export type WithoutChildrenOrChild<T> = WithoutChildren<WithoutChild<T>>;
export type WithElementRef<T, U extends HTMLElement = HTMLElement> = T & { ref?: U | null };
export function includes<T extends U, U>(arr: readonly T[], el: U): el is T {
	return arr.includes(el as T);
}

export const sweetAlertClasses = {
	popup: `
    !bg-background
    !text-foreground
    !border
    !border-border
    !rounded-lg
    !shadow-lg
  `,
	title: `
    !text-foreground
    !text-lg
    !font-semibold
  `,
	htmlContainer: `
    !text-muted-foreground
    !text-sm
  `,
	confirmButton: `
    !items-center
    !justify-center
    !whitespace-nowrap
    !rounded-md
    !text-sm
    !font-medium
    !ring-offset-background
    !transition-colors
    !focus-visible:outline-none
    !focus-visible:ring-2
    !focus-visible:ring-ring
    !focus-visible:ring-offset-2
    !disabled:pointer-events-none
    !disabled:opacity-50
    !bg-primary
    !text-primary-foreground
    !hover:bg-primary/90
    !px-4
    !py-2
  `,
	cancelButton: `
    !items-center
    !justify-center
    !whitespace-nowrap
    !rounded-md
    !text-sm
    !font-medium
    !ring-offset-background
    !transition-colors
    !focus-visible:outline-none
    !focus-visible:ring-2
    !focus-visible:ring-ring
    !focus-visible:ring-offset-2
    !disabled:pointer-events-none
    !disabled:opacity-50
    !border
    !border-input
    !bg-background
    !hover:bg-accent
    !hover:text-accent-foreground
    !px-4
    !py-2
  `,
	denyButton: `
    !items-center
    !justify-center
    !whitespace-nowrap
    !rounded-md
    !text-sm
    !font-medium
    !ring-offset-background
    !transition-colors
    !focus-visible:outline-none
    !focus-visible:ring-2
    !focus-visible:ring-ring
    !focus-visible:ring-offset-2
    !disabled:pointer-events-none
    !disabled:opacity-50
    !bg-destructive
    !text-destructive-foreground
    !hover:bg-destructive/90
    !px-4
    !py-2
  `,
	actions: `
    !gap-2
    !mt-4
  `,
	input: `
    !flex
    !h-10
    !rounded-md
    !border
    !border-input
    !bg-background
    !px-3
    !py-2
    !text-sm
    !text-foreground
    !ring-offset-background
    !placeholder:text-muted-foreground
    !focus-visible:outline-none
    !focus-visible:ring-2
    !focus-visible:ring-ring
    !focus-visible:ring-offset-2
  `,
	textarea: `
    !flex
    !min-h-[80px]
    !rounded-md
    !border
    !border-input
    !bg-background
    !px-3
    !py-2
    !text-sm
    !text-foreground
    !ring-offset-background
    !placeholder:text-muted-foreground
    !focus-visible:outline-none
    !focus-visible:ring-2
    !focus-visible:ring-ring
    !focus-visible:ring-offset-2
    after:content-['⌄']
  `,
	select: `
    !flex
    !h-10
    !rounded-md
    !border
    !border-input
    !bg-background
    !px-3
    !py-2
    !text-sm
    !text-foreground
    !ring-offset-background
    !focus:outline-none
    !focus:ring-2
    !focus:ring-ring
  `,
	validationMessage: `
    !text-destructive
    !text-sm
    !mt-2
  `,
	loader: `
    !text-primary
  `,
	footer: `
    !text-muted-foreground
    !text-xs
    !border-t
    !border-border
    !mt-4
    !pt-3
  `,
	closeButton: `
    !text-muted-foreground
    !hover:text-foreground
    !hover:bg-accent
    !rounded-md
    !transition-colors
    !focus:outline-none
    !focus:ring-2
    !focus:ring-ring
  `
};
export const Swal2 = Swal.mixin({
	heightAuto: false,
	customClass: sweetAlertClasses
});

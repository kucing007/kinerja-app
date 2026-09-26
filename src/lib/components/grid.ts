/**
 * Spreadsheet habit for entry grids: Enter moves to the same column in the next row
 * (Shift+Enter to the previous one). Inputs opt in with a data-kol attribute.
 */
export function enterPindahBaris(e: KeyboardEvent) {
	const el = e.target as HTMLElement;
	const kol = el.dataset?.kol;
	if (e.key !== 'Enter' || !kol || e.isComposing) return;
	const sekolom = [...(e.currentTarget as HTMLElement).querySelectorAll<HTMLInputElement>(`[data-kol="${kol}"]`)];
	const berikut = sekolom[sekolom.indexOf(el as HTMLInputElement) + (e.shiftKey ? -1 : 1)];
	// Names are wrapped textareas, but a line break in an IKI name is never intended
	if (berikut || el.tagName === 'TEXTAREA') e.preventDefault();
	if (!berikut) return;
	berikut.focus();
	berikut.select();
}

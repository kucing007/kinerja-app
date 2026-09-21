import { redirect } from '@sveltejs/kit';
import { resolve } from '$app/paths';

// The old "Simulasi NKP" page was split: NPK moved to /perilaku, the rest to the home page.
export const load = () => {
	redirect(307, resolve('/'));
};

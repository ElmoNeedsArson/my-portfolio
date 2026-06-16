import { writable } from "svelte/store";

export const figureNumberMap = writable<Record<string, number>>({});
export const figureCardMap = writable<Record<string, string>>({});

import { writable } from "svelte/store";
import type { Source } from "./sources";

export const citationNumberMap = writable<Record<string, number>>({});
export const citedSources = writable<Source[]>([]);
export const citationCardMap = writable<Record<string, string>>({});

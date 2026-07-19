import { writable } from 'svelte/store';
import { browser } from '$app/environment';

const initial = true;

export const darkMode = writable(initial);

if (browser) {
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme) {
    darkMode.set(savedTheme === 'dark');
  }

  darkMode.subscribe((value) => {
    document.documentElement.setAttribute('data-theme', value ? 'dark' : 'light');
    localStorage.setItem('theme', value ? 'dark' : 'light');
  });
}

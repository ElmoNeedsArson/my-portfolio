import { writable } from 'svelte/store';

const savedTheme = localStorage.getItem('theme');
const initial = savedTheme ? savedTheme === 'dark' : true;

export const darkMode = writable(initial);

darkMode.subscribe((value) => {
  document.documentElement.setAttribute('data-theme', value ? 'dark' : 'light');
  localStorage.setItem('theme', value ? 'dark' : 'light');
});

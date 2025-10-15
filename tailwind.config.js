/** @type {import('tailwindcss').Config} */
export default {
	content: ['./src/**/*.{html,js,svelte,ts}'],
	darkMode: 'class',
	theme: {
		extend: {
			colors: {
				primary: '#4ec0ca',
				secondary: '#E40078',
				accent: '#00008B',
				dark: '#1a1a1a',
				'dark-secondary': '#2d2d2d'
			},
			fontFamily: {
				rubik: ['Rubik', 'sans-serif']
			}
		}
	},
	plugins: []
};

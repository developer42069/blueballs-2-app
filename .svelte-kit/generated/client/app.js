export { matchers } from './matchers.js';

export const nodes = [
	() => import('./nodes/0'),
	() => import('./nodes/1'),
	() => import('./nodes/2'),
	() => import('./nodes/3'),
	() => import('./nodes/4'),
	() => import('./nodes/5'),
	() => import('./nodes/6'),
	() => import('./nodes/7'),
	() => import('./nodes/8'),
	() => import('./nodes/9'),
	() => import('./nodes/10'),
	() => import('./nodes/11'),
	() => import('./nodes/12'),
	() => import('./nodes/13'),
	() => import('./nodes/14'),
	() => import('./nodes/15'),
	() => import('./nodes/16'),
	() => import('./nodes/17'),
	() => import('./nodes/18'),
	() => import('./nodes/19'),
	() => import('./nodes/20'),
	() => import('./nodes/21'),
	() => import('./nodes/22'),
	() => import('./nodes/23'),
	() => import('./nodes/24'),
	() => import('./nodes/25')
];

export const server_loads = [];

export const dictionary = {
		"/": [2],
		"/affiliate": [3],
		"/auth/callback": [4],
		"/auth/forgot-password": [5],
		"/auth/goodbye": [6],
		"/auth/login": [7],
		"/auth/onboarding": [8],
		"/auth/register": [9],
		"/auth/reset-password": [10],
		"/auth/welcome": [11],
		"/bolengadmin": [12],
		"/bolengadmin/game": [13],
		"/chat": [14],
		"/chat/friends": [15],
		"/dashboard": [16],
		"/friends": [17],
		"/game/[difficulty]": [18],
		"/leaderboard": [19],
		"/privacy": [20],
		"/profile/[id]": [21],
		"/settings": [22],
		"/subscribe": [23],
		"/subscribe/success": [24],
		"/terms": [25]
	};

export const hooks = {
	handleError: (({ error }) => { console.error(error) }),
	
	reroute: (() => {}),
	transport: {}
};

export const decoders = Object.fromEntries(Object.entries(hooks.transport).map(([k, v]) => [k, v.decode]));

export const hash = false;

export const decode = (type, value) => decoders[type](value);

export { default as root } from '../root.js';
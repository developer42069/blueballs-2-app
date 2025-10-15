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
	() => import('./nodes/23')
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
		"/chat": [13],
		"/chat/friends": [14],
		"/dashboard": [15],
		"/friends": [16],
		"/game/[difficulty]": [17],
		"/leaderboard": [18],
		"/privacy": [19],
		"/profile/[id]": [20],
		"/settings": [21],
		"/subscribe": [22],
		"/terms": [23]
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
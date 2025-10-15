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
	() => import('./nodes/20')
];

export const server_loads = [];

export const dictionary = {
		"/": [2],
		"/affiliate": [3],
		"/auth/callback": [4],
		"/auth/forgot-password": [5],
		"/auth/login": [6],
		"/auth/register": [7],
		"/auth/reset-password": [8],
		"/bolengadmin": [9],
		"/chat": [10],
		"/chat/friends": [11],
		"/dashboard": [12],
		"/friends": [13],
		"/game/[difficulty]": [14],
		"/leaderboard": [15],
		"/privacy": [16],
		"/profile/[id]": [17],
		"/settings": [18],
		"/subscribe": [19],
		"/terms": [20]
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
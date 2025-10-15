export const GAME_CONFIG = {
	easy: {
		gravity: 0.2,
		jump: -5,
		pipeSpeed: 1.5,
		pipeGap: 200,
		pipeSpacing: 220,
		pointMultiplier: 1
	},
	medium: {
		gravity: 0.3,
		jump: -5,
		pipeSpeed: 1.7,
		pipeGap: 200,
		pipeSpacing: 220,
		pointMultiplier: 1.5
	},
	hard: {
		gravity: 0.4,
		jump: -5,
		pipeSpeed: 1.8,
		pipeGap: 180,
		pipeSpacing: 200,
		pointMultiplier: 2
	}
} as const;

export type Difficulty = keyof typeof GAME_CONFIG;

export const RANK_NAMES = {
	blue: { name: 'Blue', color: '#00008B' },
	silver: { name: 'Silver', color: '#C0C0C0' },
	gold: { name: 'Gold', color: '#FFD700' },
	platinum: { name: 'Platinum', color: '#E5E4E2' },
	diamond: { name: 'Diamond', color: '#B9F2FF' },
	black: { name: 'Black', color: '#000000' }
} as const;

export const MEMBERSHIP_TIERS = {
	free: {
		name: 'BlueBalls',
		price: 0,
		livesPerHour: 4,
		maxLives: 100,
		features: ['4 lives per hour', 'Max 100 lives/day', 'Basic profile']
	},
	mid: {
		name: 'BlueBalls Mid',
		price: 2,
		livesPerHour: 40,
		maxLives: 1000,
		features: ['40 lives per hour', 'Max 1000 lives/day', 'Custom profile picture', 'Chat every 3 minutes']
	},
	big: {
		name: 'BlueBalls Big',
		price: 10,
		livesPerHour: Infinity,
		maxLives: Infinity,
		features: ['Unlimited lives', 'Custom profile picture', 'Chat every minute', 'No ads']
	}
} as const;

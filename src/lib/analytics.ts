// Google Analytics event tracking helper

declare global {
	interface Window {
		gtag?: (command: string, ...args: any[]) => void;
	}
}

export const analytics = {
	// Page views are tracked automatically

	// Game events
	gameStart: (difficulty: 'easy' | 'medium' | 'hard') => {
		if (typeof window !== 'undefined' && window.gtag) {
			window.gtag('event', 'game_start', {
				event_category: 'Game',
				event_label: difficulty,
				difficulty: difficulty
			});
		}
	},

	gameEnd: (difficulty: 'easy' | 'medium' | 'hard', score: number, duration: number) => {
		if (typeof window !== 'undefined' && window.gtag) {
			window.gtag('event', 'game_end', {
				event_category: 'Game',
				event_label: difficulty,
				difficulty: difficulty,
				score: score,
				duration_seconds: Math.round(duration / 1000)
			});
		}
	},

	// User authentication events
	signUp: (method: 'email' | 'google' | 'discord') => {
		if (typeof window !== 'undefined' && window.gtag) {
			window.gtag('event', 'sign_up', {
				method: method
			});
		}
	},

	login: (method: 'email' | 'google' | 'discord') => {
		if (typeof window !== 'undefined' && window.gtag) {
			window.gtag('event', 'login', {
				method: method
			});
		}
	},

	// Subscription events
	viewSubscription: () => {
		if (typeof window !== 'undefined' && window.gtag) {
			window.gtag('event', 'view_subscription', {
				event_category: 'Subscription'
			});
		}
	},

	initiateCheckout: (tier: 'mid' | 'big', value: number) => {
		if (typeof window !== 'undefined' && window.gtag) {
			window.gtag('event', 'begin_checkout', {
				event_category: 'Subscription',
				currency: 'USD',
				value: value,
				tier: tier,
				items: [{
					item_id: `sub_${tier}`,
					item_name: `Blue Balls ${tier.toUpperCase()}`,
					price: value
				}]
			});
		}
	},

	purchase: (tier: 'mid' | 'big', value: number, transactionId?: string) => {
		if (typeof window !== 'undefined' && window.gtag) {
			window.gtag('event', 'purchase', {
				event_category: 'Subscription',
				currency: 'USD',
				value: value,
				transaction_id: transactionId || `txn_${Date.now()}`,
				tier: tier,
				items: [{
					item_id: `sub_${tier}`,
					item_name: `Blue Balls ${tier.toUpperCase()}`,
					price: value
				}]
			});
		}
	},

	subscriptionChange: (fromTier: string, toTier: string) => {
		if (typeof window !== 'undefined' && window.gtag) {
			window.gtag('event', 'subscription_change', {
				event_category: 'Subscription',
				from_tier: fromTier,
				to_tier: toTier
			});
		}
	},

	subscriptionCancel: (tier: string) => {
		if (typeof window !== 'undefined' && window.gtag) {
			window.gtag('event', 'subscription_cancel', {
				event_category: 'Subscription',
				tier: tier
			});
		}
	},

	// Social events
	sendMessage: (type: 'global' | 'direct') => {
		if (typeof window !== 'undefined' && window.gtag) {
			window.gtag('event', 'send_message', {
				event_category: 'Social',
				message_type: type
			});
		}
	},

	sendFriendRequest: () => {
		if (typeof window !== 'undefined' && window.gtag) {
			window.gtag('event', 'send_friend_request', {
				event_category: 'Social'
			});
		}
	},

	acceptFriendRequest: () => {
		if (typeof window !== 'undefined' && window.gtag) {
			window.gtag('event', 'accept_friend_request', {
				event_category: 'Social'
			});
		}
	},

	viewProfile: (isOwnProfile: boolean) => {
		if (typeof window !== 'undefined' && window.gtag) {
			window.gtag('event', 'view_profile', {
				event_category: 'Social',
				is_own_profile: isOwnProfile
			});
		}
	},

	// Leaderboard events
	viewLeaderboard: (type: 'global' | 'regional' | 'friends') => {
		if (typeof window !== 'undefined' && window.gtag) {
			window.gtag('event', 'view_leaderboard', {
				event_category: 'Engagement',
				leaderboard_type: type
			});
		}
	},

	// Settings events
	updateSettings: (settingType: 'profile' | 'preferences' | 'privacy') => {
		if (typeof window !== 'undefined' && window.gtag) {
			window.gtag('event', 'update_settings', {
				event_category: 'Engagement',
				setting_type: settingType
			});
		}
	},

	// Custom events
	customEvent: (eventName: string, params?: Record<string, any>) => {
		if (typeof window !== 'undefined' && window.gtag) {
			window.gtag('event', eventName, params);
		}
	}
};

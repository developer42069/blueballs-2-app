
// this file is generated — do not edit it


declare module "svelte/elements" {
	export interface HTMLAttributes<T> {
		'data-sveltekit-keepfocus'?: true | '' | 'off' | undefined | null;
		'data-sveltekit-noscroll'?: true | '' | 'off' | undefined | null;
		'data-sveltekit-preload-code'?:
			| true
			| ''
			| 'eager'
			| 'viewport'
			| 'hover'
			| 'tap'
			| 'off'
			| undefined
			| null;
		'data-sveltekit-preload-data'?: true | '' | 'hover' | 'tap' | 'off' | undefined | null;
		'data-sveltekit-reload'?: true | '' | 'off' | undefined | null;
		'data-sveltekit-replacestate'?: true | '' | 'off' | undefined | null;
	}
}

export {};


declare module "$app/types" {
	export interface AppTypes {
		RouteId(): "/" | "/affiliate" | "/api" | "/api/cancel-subscription" | "/api/change-subscription" | "/api/health" | "/api/health/r2" | "/api/lives" | "/api/lives/regen" | "/api/notifications" | "/api/notifications/mark-all-read" | "/api/notifications/mark-read" | "/api/score" | "/api/stripe" | "/api/stripe/create-checkout" | "/api/stripe/get-publishable-key" | "/api/stripe/webhook" | "/api/upload-profile-image" | "/auth" | "/auth/callback" | "/auth/forgot-password" | "/auth/goodbye" | "/auth/login" | "/auth/onboarding" | "/auth/register" | "/auth/reset-password" | "/auth/welcome" | "/bolengadmin" | "/bolengadmin/game" | "/chat" | "/chat/friends" | "/dashboard" | "/friends" | "/game" | "/game/[difficulty]" | "/leaderboard" | "/privacy" | "/profile" | "/profile/[id]" | "/settings" | "/subscribe" | "/subscribe/success" | "/terms";
		RouteParams(): {
			"/game/[difficulty]": { difficulty: string };
			"/profile/[id]": { id: string }
		};
		LayoutParams(): {
			"/": { difficulty?: string; id?: string };
			"/affiliate": Record<string, never>;
			"/api": Record<string, never>;
			"/api/cancel-subscription": Record<string, never>;
			"/api/change-subscription": Record<string, never>;
			"/api/health": Record<string, never>;
			"/api/health/r2": Record<string, never>;
			"/api/lives": Record<string, never>;
			"/api/lives/regen": Record<string, never>;
			"/api/notifications": Record<string, never>;
			"/api/notifications/mark-all-read": Record<string, never>;
			"/api/notifications/mark-read": Record<string, never>;
			"/api/score": Record<string, never>;
			"/api/stripe": Record<string, never>;
			"/api/stripe/create-checkout": Record<string, never>;
			"/api/stripe/get-publishable-key": Record<string, never>;
			"/api/stripe/webhook": Record<string, never>;
			"/api/upload-profile-image": Record<string, never>;
			"/auth": Record<string, never>;
			"/auth/callback": Record<string, never>;
			"/auth/forgot-password": Record<string, never>;
			"/auth/goodbye": Record<string, never>;
			"/auth/login": Record<string, never>;
			"/auth/onboarding": Record<string, never>;
			"/auth/register": Record<string, never>;
			"/auth/reset-password": Record<string, never>;
			"/auth/welcome": Record<string, never>;
			"/bolengadmin": Record<string, never>;
			"/bolengadmin/game": Record<string, never>;
			"/chat": Record<string, never>;
			"/chat/friends": Record<string, never>;
			"/dashboard": Record<string, never>;
			"/friends": Record<string, never>;
			"/game": { difficulty?: string };
			"/game/[difficulty]": { difficulty: string };
			"/leaderboard": Record<string, never>;
			"/privacy": Record<string, never>;
			"/profile": { id?: string };
			"/profile/[id]": { id: string };
			"/settings": Record<string, never>;
			"/subscribe": Record<string, never>;
			"/subscribe/success": Record<string, never>;
			"/terms": Record<string, never>
		};
		Pathname(): "/" | "/affiliate" | "/affiliate/" | "/api" | "/api/" | "/api/cancel-subscription" | "/api/cancel-subscription/" | "/api/change-subscription" | "/api/change-subscription/" | "/api/health" | "/api/health/" | "/api/health/r2" | "/api/health/r2/" | "/api/lives" | "/api/lives/" | "/api/lives/regen" | "/api/lives/regen/" | "/api/notifications" | "/api/notifications/" | "/api/notifications/mark-all-read" | "/api/notifications/mark-all-read/" | "/api/notifications/mark-read" | "/api/notifications/mark-read/" | "/api/score" | "/api/score/" | "/api/stripe" | "/api/stripe/" | "/api/stripe/create-checkout" | "/api/stripe/create-checkout/" | "/api/stripe/get-publishable-key" | "/api/stripe/get-publishable-key/" | "/api/stripe/webhook" | "/api/stripe/webhook/" | "/api/upload-profile-image" | "/api/upload-profile-image/" | "/auth" | "/auth/" | "/auth/callback" | "/auth/callback/" | "/auth/forgot-password" | "/auth/forgot-password/" | "/auth/goodbye" | "/auth/goodbye/" | "/auth/login" | "/auth/login/" | "/auth/onboarding" | "/auth/onboarding/" | "/auth/register" | "/auth/register/" | "/auth/reset-password" | "/auth/reset-password/" | "/auth/welcome" | "/auth/welcome/" | "/bolengadmin" | "/bolengadmin/" | "/bolengadmin/game" | "/bolengadmin/game/" | "/chat" | "/chat/" | "/chat/friends" | "/chat/friends/" | "/dashboard" | "/dashboard/" | "/friends" | "/friends/" | "/game" | "/game/" | `/game/${string}` & {} | `/game/${string}/` & {} | "/leaderboard" | "/leaderboard/" | "/privacy" | "/privacy/" | "/profile" | "/profile/" | `/profile/${string}` & {} | `/profile/${string}/` & {} | "/settings" | "/settings/" | "/subscribe" | "/subscribe/" | "/subscribe/success" | "/subscribe/success/" | "/terms" | "/terms/";
		ResolvedPathname(): `${"" | `/${string}`}${ReturnType<AppTypes['Pathname']>}`;
		Asset(): "/android-chrome-192x192.png" | "/android-chrome-512x512.png" | "/apple-touch-icon.png" | "/favicon-16x16.png" | "/favicon-32x32.png" | "/favicon.ico" | "/favicon.png" | "/site.webmanifest" | string & {};
	}
}
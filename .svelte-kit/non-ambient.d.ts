
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
		RouteId(): "/" | "/affiliate" | "/api" | "/api/lives" | "/api/lives/regen" | "/api/score" | "/api/stripe" | "/api/stripe/create-checkout" | "/api/stripe/webhook" | "/auth" | "/auth/callback" | "/auth/login" | "/auth/register" | "/bolengadmin" | "/chat" | "/dashboard" | "/friends" | "/game" | "/game/[difficulty]" | "/leaderboard" | "/profile" | "/profile/[id]" | "/settings" | "/subscribe";
		RouteParams(): {
			"/game/[difficulty]": { difficulty: string };
			"/profile/[id]": { id: string }
		};
		LayoutParams(): {
			"/": { difficulty?: string; id?: string };
			"/affiliate": Record<string, never>;
			"/api": Record<string, never>;
			"/api/lives": Record<string, never>;
			"/api/lives/regen": Record<string, never>;
			"/api/score": Record<string, never>;
			"/api/stripe": Record<string, never>;
			"/api/stripe/create-checkout": Record<string, never>;
			"/api/stripe/webhook": Record<string, never>;
			"/auth": Record<string, never>;
			"/auth/callback": Record<string, never>;
			"/auth/login": Record<string, never>;
			"/auth/register": Record<string, never>;
			"/bolengadmin": Record<string, never>;
			"/chat": Record<string, never>;
			"/dashboard": Record<string, never>;
			"/friends": Record<string, never>;
			"/game": { difficulty?: string };
			"/game/[difficulty]": { difficulty: string };
			"/leaderboard": Record<string, never>;
			"/profile": { id?: string };
			"/profile/[id]": { id: string };
			"/settings": Record<string, never>;
			"/subscribe": Record<string, never>
		};
		Pathname(): "/" | "/affiliate" | "/affiliate/" | "/api" | "/api/" | "/api/lives" | "/api/lives/" | "/api/lives/regen" | "/api/lives/regen/" | "/api/score" | "/api/score/" | "/api/stripe" | "/api/stripe/" | "/api/stripe/create-checkout" | "/api/stripe/create-checkout/" | "/api/stripe/webhook" | "/api/stripe/webhook/" | "/auth" | "/auth/" | "/auth/callback" | "/auth/callback/" | "/auth/login" | "/auth/login/" | "/auth/register" | "/auth/register/" | "/bolengadmin" | "/bolengadmin/" | "/chat" | "/chat/" | "/dashboard" | "/dashboard/" | "/friends" | "/friends/" | "/game" | "/game/" | `/game/${string}` & {} | `/game/${string}/` & {} | "/leaderboard" | "/leaderboard/" | "/profile" | "/profile/" | `/profile/${string}` & {} | `/profile/${string}/` & {} | "/settings" | "/settings/" | "/subscribe" | "/subscribe/";
		ResolvedPathname(): `${"" | `/${string}`}${ReturnType<AppTypes['Pathname']>}`;
		Asset(): string & {};
	}
}
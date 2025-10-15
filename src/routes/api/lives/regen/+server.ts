import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { supabase } from '$lib/supabase';

export const POST: RequestHandler = async ({ request }) => {
	try {
		// Get the authorization header
		const authHeader = request.headers.get('authorization');
		if (!authHeader) {
			return json({ success: false, error: 'Unauthorized' }, { status: 401 });
		}

		// Get user from Supabase auth using the access token from header
		const token = authHeader.replace('Bearer ', '');
		const { data: { user }, error: authError } = await supabase.auth.getUser(token);

		if (authError || !user) {
			return json({ success: false, error: 'Unauthorized' }, { status: 401 });
		}

		// Get current profile
		const { data: profile, error: profileError } = await supabase
			.from('profiles')
			.select('*')
			.eq('id', user.id)
			.single();

		if (profileError || !profile) {
			return json({ success: false, error: 'Profile not found' }, { status: 404 });
		}

		// Calculate lives to regenerate
		const now = new Date();
		const lastRegen = new Date(profile.last_life_regen);
		const timeDiff = now.getTime() - lastRegen.getTime();
		const hoursPassed = timeDiff / (1000 * 60 * 60);

		// Calculate lives gained
		const livesGained = Math.floor(hoursPassed * profile.lives_per_hour);

		if (livesGained === 0) {
			return json({
				success: true,
				livesGained: 0,
				currentLives: profile.lives,
				message: 'No lives to regenerate yet'
			});
		}

		// Calculate new lives (capped at max_lives)
		const newLives = Math.min(profile.lives + livesGained, profile.max_lives);

		// Update last regen time to now
		const { data: updatedProfile, error: updateError } = await supabase
			.from('profiles')
			.update({
				lives: newLives,
				last_life_regen: now.toISOString()
			})
			.eq('id', user.id)
			.select()
			.single();

		if (updateError) {
			console.error('Profile update error:', updateError);
			return json({ success: false, error: 'Failed to regenerate lives' }, { status: 500 });
		}

		return json({
			success: true,
			livesGained,
			currentLives: newLives,
			profile: updatedProfile
		});
	} catch (error) {
		console.error('Lives regen API error:', error);
		return json({ success: false, error: 'Internal server error' }, { status: 500 });
	}
};

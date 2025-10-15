import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { supabase } from '$lib/supabase';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const { score, difficulty, pointsEarned } = await request.json();

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

		// Check if user has lives
		if (profile.lives <= 0) {
			return json({ success: false, error: 'No lives remaining' }, { status: 400 });
		}

		// Save the score
		const { error: scoreError } = await supabase
			.from('game_scores')
			.insert({
				user_id: user.id,
				score,
				difficulty,
				points_earned: pointsEarned
			});

		if (scoreError) {
			console.error('Score insert error:', scoreError);
			return json({ success: false, error: 'Failed to save score' }, { status: 500 });
		}

		// Update profile
		const newLifetimePoints = profile.lifetime_points + pointsEarned;
		const newLast30DaysPoints = profile.last_30_days_points + pointsEarned;
		const newLives = Math.max(0, profile.lives - 1);

		// Calculate new level (100 points per level)
		const newLevel = Math.floor(newLifetimePoints / 100) + 1;

		// Calculate new rank based on lifetime points
		let newRank = profile.current_rank;
		if (newLifetimePoints >= 10000) newRank = 'black';
		else if (newLifetimePoints >= 5000) newRank = 'diamond';
		else if (newLifetimePoints >= 2000) newRank = 'platinum';
		else if (newLifetimePoints >= 1000) newRank = 'gold';
		else if (newLifetimePoints >= 500) newRank = 'silver';
		else newRank = 'blue';

		// Check if new high score
		const highScoreField = `high_score_${difficulty}`;
		const currentHighScore = profile[highScoreField as keyof typeof profile] as number;
		const newHighScore = Math.max(currentHighScore, score);

		// Update profile
		const { data: updatedProfile, error: updateError } = await supabase
			.from('profiles')
			.update({
				lives: newLives,
				lifetime_points: newLifetimePoints,
				last_30_days_points: newLast30DaysPoints,
				lifetime_level: newLevel,
				current_rank: newRank,
				[highScoreField]: newHighScore
			})
			.eq('id', user.id)
			.select()
			.single();

		if (updateError) {
			console.error('Profile update error:', updateError);
			return json({ success: false, error: 'Failed to update profile' }, { status: 500 });
		}

		return json({
			success: true,
			profile: updatedProfile,
			isNewHighScore: newHighScore > currentHighScore,
			levelUp: newLevel > profile.lifetime_level,
			rankUp: newRank !== profile.current_rank
		});
	} catch (error) {
		console.error('Score API error:', error);
		return json({ success: false, error: 'Internal server error' }, { status: 500 });
	}
};

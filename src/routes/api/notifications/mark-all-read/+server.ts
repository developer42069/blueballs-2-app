import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';

export const POST: RequestHandler = async ({ request }) => {
	try {
		// Get the authorization header
		const authHeader = request.headers.get('authorization');
		if (!authHeader) {
			return json({ success: false, error: 'Unauthorized' }, { status: 401 });
		}

		// Create a Supabase client with the user's token
		const supabase = createClient(
			PUBLIC_SUPABASE_URL,
			PUBLIC_SUPABASE_ANON_KEY,
			{
				global: {
					headers: {
						Authorization: authHeader
					}
				}
			}
		);

		// Get user from Supabase auth
		const { data: { user }, error: authError } = await supabase.auth.getUser();

		if (authError || !user) {
			return json({ success: false, error: 'Unauthorized' }, { status: 401 });
		}

		// Mark all notifications as read
		const { error: updateError } = await supabase
			.from('notifications')
			.update({ read: true })
			.eq('user_id', user.id)
			.eq('read', false);

		if (updateError) {
			console.error('Error marking all notifications as read:', updateError);
			return json({ success: false, error: 'Failed to mark notifications as read' }, { status: 500 });
		}

		return json({ success: true });
	} catch (error) {
		console.error('Mark all notifications as read error:', error);
		return json({ success: false, error: 'Internal server error' }, { status: 500 });
	}
};

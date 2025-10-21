import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, locals }) => {
	try {
		// Get session from locals (set by hooks.server.ts)
		const { session, user } = await locals.safeGetSession();

		if (!session || !user) {
			return json({ success: false, error: 'Unauthorized' }, { status: 401 });
		}

		// Mark all notifications as read
		const { error: updateError } = await locals.supabase
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

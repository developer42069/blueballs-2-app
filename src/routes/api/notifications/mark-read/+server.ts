import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, locals }) => {
	try {
		const { notificationId } = await request.json();

		// Get session from locals (set by hooks.server.ts)
		const { session, user } = await locals.safeGetSession();

		if (!session || !user) {
			return json({ success: false, error: 'Unauthorized' }, { status: 401 });
		}

		// Mark notification as read
		const { error: updateError } = await locals.supabase
			.from('notifications')
			.update({ read: true })
			.eq('id', notificationId)
			.eq('user_id', user.id);

		if (updateError) {
			console.error('Error marking notification as read:', updateError);
			return json({ success: false, error: 'Failed to mark notification as read' }, { status: 500 });
		}

		return json({ success: true });
	} catch (error) {
		console.error('Mark notification as read error:', error);
		return json({ success: false, error: 'Internal server error' }, { status: 500 });
	}
};

import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import sharp from 'sharp';
import { uploadToR2, deleteFromR2, generateProfileImageKey, extractKeyFromUrl } from '$lib/r2';
import { supabase } from '$lib/supabase';

// Maximum file size: 5MB
const MAX_FILE_SIZE = 5 * 1024 * 1024;

// Allowed image types
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];

// Image dimensions
const IMAGE_WIDTH = 400;
const IMAGE_HEIGHT = 400;

export const POST: RequestHandler = async ({ request, cookies }) => {
	try {
		// Get the session from cookies
		const sessionCookie = cookies.get('sb-access-token');
		if (!sessionCookie) {
			throw error(401, 'Unauthorized - Please log in');
		}

		// Verify the session and get user
		const { data: { user }, error: authError } = await supabase.auth.getUser(sessionCookie);

		if (authError || !user) {
			throw error(401, 'Unauthorized - Invalid session');
		}

		// Parse the multipart form data
		const formData = await request.formData();
		const file = formData.get('image') as File;

		if (!file) {
			throw error(400, 'No image file provided');
		}

		// Validate file type
		if (!ALLOWED_TYPES.includes(file.type)) {
			throw error(400, `Invalid file type. Allowed types: ${ALLOWED_TYPES.join(', ')}`);
		}

		// Validate file size
		if (file.size > MAX_FILE_SIZE) {
			throw error(400, `File too large. Maximum size: ${MAX_FILE_SIZE / 1024 / 1024}MB`);
		}

		// Convert file to buffer
		const arrayBuffer = await file.arrayBuffer();
		const buffer = Buffer.from(arrayBuffer);

		// Optimize and resize image using sharp
		const optimizedImage = await sharp(buffer)
			.resize(IMAGE_WIDTH, IMAGE_HEIGHT, {
				fit: 'cover',
				position: 'center'
			})
			.webp({ quality: 85 }) // Convert to WebP for better compression
			.toBuffer();

		// Get file extension
		const extension = 'webp';

		// Generate unique key for the image (automatically creates user-profiles folder)
		const key = generateProfileImageKey(user.id, extension);

		// Upload to R2
		const imageUrl = await uploadToR2(optimizedImage, key, 'image/webp');

		// Get the user's current profile image to delete old one
		const { data: profile } = await supabase
			.from('profiles')
			.select('profile_image_url')
			.eq('id', user.id)
			.single();

		// Delete old profile image if it exists and is hosted on R2
		if (profile?.profile_image_url) {
			const oldKey = extractKeyFromUrl(profile.profile_image_url);
			if (oldKey) {
				try {
					await deleteFromR2(oldKey);
				} catch (err) {
					// Don't fail the request if old image deletion fails
					console.error('Failed to delete old image:', err);
				}
			}
		}

		// Update the user's profile with the new image URL
		const { error: updateError } = await supabase
			.from('profiles')
			.update({
				profile_image_url: imageUrl,
				updated_at: new Date().toISOString()
			})
			.eq('id', user.id);

		if (updateError) {
			// If database update fails, delete the uploaded image
			try {
				await deleteFromR2(key);
			} catch (err) {
				console.error('Failed to cleanup uploaded image:', err);
			}
			throw error(500, 'Failed to update profile');
		}

		return json({
			success: true,
			url: imageUrl,
			message: 'Profile image uploaded successfully'
		});
	} catch (err: any) {
		console.error('Profile image upload error:', err);

		// If it's already an error from throw error(), pass it through
		if (err.status) {
			throw err;
		}

		throw error(500, err.message || 'Failed to upload profile image');
	}
};

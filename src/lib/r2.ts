import { S3Client, PutObjectCommand, DeleteObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import {
	R2_ACCOUNT_ID,
	R2_ACCESS_KEY_ID,
	R2_SECRET_ACCESS_KEY,
	R2_BUCKET_NAME,
	R2_PUBLIC_URL,
	R2_ENDPOINT_URL
} from '$env/static/private';

// Initialize R2 client with S3-compatible API
const r2Client = new S3Client({
	region: 'auto',
	endpoint: R2_ENDPOINT_URL,
	credentials: {
		accessKeyId: R2_ACCESS_KEY_ID,
		secretAccessKey: R2_SECRET_ACCESS_KEY
	}
});

/**
 * Upload a file to R2 bucket
 * Automatically creates the folder structure if it doesn't exist
 */
export async function uploadToR2(
	file: Uint8Array | Buffer,
	key: string,
	contentType: string
): Promise<string> {
	try {
		const command = new PutObjectCommand({
			Bucket: R2_BUCKET_NAME,
			Key: key,
			Body: file,
			ContentType: contentType,
			// Make the file publicly accessible
			// Note: Your R2 bucket must have public access enabled
		});

		await r2Client.send(command);

		// Return the public CDN URL
		return `${R2_PUBLIC_URL}/${key}`;
	} catch (error) {
		console.error('Error uploading to R2:', error);
		throw new Error('Failed to upload file to R2');
	}
}

/**
 * Delete a file from R2 bucket
 */
export async function deleteFromR2(key: string): Promise<void> {
	try {
		const command = new DeleteObjectCommand({
			Bucket: R2_BUCKET_NAME,
			Key: key
		});

		await r2Client.send(command);
	} catch (error) {
		console.error('Error deleting from R2:', error);
		throw new Error('Failed to delete file from R2');
	}
}

/**
 * Check if a file exists in R2
 */
export async function fileExistsInR2(key: string): Promise<boolean> {
	try {
		const command = new HeadObjectCommand({
			Bucket: R2_BUCKET_NAME,
			Key: key
		});

		await r2Client.send(command);
		return true;
	} catch (error) {
		return false;
	}
}

/**
 * Generate a unique filename for user profile image
 */
export function generateProfileImageKey(userId: string, extension: string): string {
	// Create folder structure: user-profiles/{userId}/profile.{ext}
	// This automatically creates the folder when uploading
	const timestamp = Date.now();
	return `user-profiles/${userId}/profile-${timestamp}.${extension}`;
}

/**
 * Extract the old image key from a CDN URL
 */
export function extractKeyFromUrl(url: string): string | null {
	if (!url || !url.startsWith(R2_PUBLIC_URL)) {
		return null;
	}

	// Remove the CDN URL to get the key
	return url.replace(`${R2_PUBLIC_URL}/`, '');
}

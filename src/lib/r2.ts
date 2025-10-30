import { S3Client, PutObjectCommand, DeleteObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { env } from '$env/dynamic/private';

// Lazy initialization - only validate and create client when needed
let r2Client: S3Client | null = null;
let sanitizedBucketName: string;
let sanitizedPublicUrl: string;

function getR2Client(): S3Client {
	if (r2Client) {
		return r2Client;
	}

	// Validate required environment variables
	const requiredEnvVars = {
		R2_ACCESS_KEY_ID: env.R2_ACCESS_KEY_ID,
		R2_SECRET_ACCESS_KEY: env.R2_SECRET_ACCESS_KEY,
		R2_BUCKET_NAME: env.R2_BUCKET_NAME,
		R2_PUBLIC_URL: env.R2_PUBLIC_URL,
		R2_ENDPOINT_URL: env.R2_ENDPOINT_URL
	};

	const missingVars = Object.entries(requiredEnvVars)
		.filter(([_, value]) => !value)
		.map(([key]) => key);

	if (missingVars.length > 0) {
		const errorMsg = `Missing required R2 environment variables: ${missingVars.join(', ')}`;
		console.error(errorMsg);
		console.error('Please ensure these variables are set in your production environment.');
		throw new Error(errorMsg);
	}

	// Sanitize all inputs to avoid "Invalid header value" errors in Cloudflare Workers
	// Remove any whitespace, newlines, or control characters from credentials
	const sanitizedAccessKeyId = env.R2_ACCESS_KEY_ID!.replace(/\s/g, '').trim();
	const sanitizedSecretAccessKey = env.R2_SECRET_ACCESS_KEY!.replace(/\s/g, '').trim();
	const sanitizedEndpointUrl = env.R2_ENDPOINT_URL!.replace(/\/+$/, '').trim();
	sanitizedBucketName = env.R2_BUCKET_NAME!.trim();
	sanitizedPublicUrl = env.R2_PUBLIC_URL!.trim();

	console.log('Initializing R2 client:', {
		endpoint: sanitizedEndpointUrl,
		bucket: sanitizedBucketName,
		accessKeyLength: sanitizedAccessKeyId.length,
		secretKeyLength: sanitizedSecretAccessKey.length,
		hasValidCredentials: sanitizedAccessKeyId.length > 0 && sanitizedSecretAccessKey.length > 0
	});

	// Initialize R2 client with S3-compatible API
	// Let the SDK auto-detect the runtime environment (Node.js vs Workers)
	r2Client = new S3Client({
		region: 'auto',
		endpoint: sanitizedEndpointUrl,
		credentials: {
			accessKeyId: sanitizedAccessKeyId,
			secretAccessKey: sanitizedSecretAccessKey
		}
	});

	return r2Client;
}

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
		// Sanitize and validate contentType to avoid "Invalid header value" errors
		// in Cloudflare Workers environment
		let sanitizedContentType = contentType || 'application/octet-stream';

		// Remove any control characters, null bytes, newlines, or other invalid characters
		sanitizedContentType = sanitizedContentType
			.replace(/[\x00-\x1F\x7F-\x9F]/g, '') // Remove control characters
			.trim();

		// If content type is empty after sanitization, use default
		if (!sanitizedContentType) {
			sanitizedContentType = 'application/octet-stream';
		}

		console.log('Uploading to R2:', {
			bucket: sanitizedBucketName,
			key,
			originalContentType: contentType,
			sanitizedContentType,
			fileSize: file.length
		});

		const client = getR2Client();

		const command = new PutObjectCommand({
			Bucket: sanitizedBucketName,
			Key: key,
			Body: file,
			ContentType: sanitizedContentType
			// Note: Your R2 bucket must have public access enabled for CDN access
		});

		await client.send(command);

		// Return the public CDN URL
		const publicUrl = `${sanitizedPublicUrl}/${key}`;
		console.log('R2 upload successful:', publicUrl);
		return publicUrl;
	} catch (error: any) {
		console.error('Error uploading to R2:', error);
		console.error('R2 Error Code:', error.Code || error.code);
		console.error('R2 Error Name:', error.name);
		console.error('R2 Error Message:', error.message);
		console.error('R2 Error Stack:', error.stack);

		// Provide detailed error messages based on error type
		let errorMessage = 'Failed to upload file to R2';

		if (error.name === 'CredentialsProviderError' || error.Code === 'InvalidAccessKeyId') {
			errorMessage = 'R2 authentication failed - Invalid access key or secret';
		} else if (error.name === 'NoSuchBucket' || error.Code === 'NoSuchBucket') {
			errorMessage = `R2 bucket '${sanitizedBucketName || 'unknown'}' does not exist`;
		} else if (error.name === 'AccessDenied' || error.Code === 'AccessDenied') {
			errorMessage = 'R2 access denied - Check bucket permissions';
		} else if (error.name === 'NetworkError' || error.code === 'ENOTFOUND') {
			errorMessage = `R2 network error - Cannot reach endpoint`;
		} else if (error.message) {
			errorMessage = `R2 upload error: ${error.message}`;
		}

		throw new Error(errorMessage);
	}
}

/**
 * Delete a file from R2 bucket
 */
export async function deleteFromR2(key: string): Promise<void> {
	try {
		const client = getR2Client();
		const command = new DeleteObjectCommand({
			Bucket: sanitizedBucketName,
			Key: key
		});

		await client.send(command);
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
		const client = getR2Client();
		const command = new HeadObjectCommand({
			Bucket: sanitizedBucketName,
			Key: key
		});

		await client.send(command);
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
	// Ensure R2 is initialized first (lazy load)
	if (!sanitizedPublicUrl && env.R2_PUBLIC_URL) {
		sanitizedPublicUrl = env.R2_PUBLIC_URL.trim();
	}

	if (!url || !sanitizedPublicUrl || !url.startsWith(sanitizedPublicUrl)) {
		return null;
	}

	// Remove the CDN URL to get the key
	return url.replace(`${sanitizedPublicUrl}/`, '');
}

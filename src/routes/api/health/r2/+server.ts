import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { HeadObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { FetchHttpHandler } from '@aws-sdk/fetch-http-handler';
import { env } from '$env/dynamic/private';

export const GET: RequestHandler = async () => {
	const healthCheck: any = {
		status: 'unknown',
		timestamp: new Date().toISOString(),
		r2: {
			configured: false,
			bucket: env.R2_BUCKET_NAME || 'not set',
			endpoint: env.R2_ENDPOINT_URL || 'not set',
			publicUrl: env.R2_PUBLIC_URL || 'not set'
		},
		environmentVariables: {
			R2_ACCESS_KEY_ID: !!env.R2_ACCESS_KEY_ID,
			R2_SECRET_ACCESS_KEY: !!env.R2_SECRET_ACCESS_KEY,
			R2_BUCKET_NAME: !!env.R2_BUCKET_NAME,
			R2_PUBLIC_URL: !!env.R2_PUBLIC_URL,
			R2_ENDPOINT_URL: !!env.R2_ENDPOINT_URL
		}
	};

	try {
		// Check if all environment variables are set
		const allVarsSet = Object.values(healthCheck.environmentVariables).every((v) => v === true);

		if (!allVarsSet) {
			healthCheck.status = 'error';
			healthCheck.message = 'Missing required R2 environment variables';
			const missingVars = Object.entries(healthCheck.environmentVariables)
				.filter(([_, value]) => !value)
				.map(([key]) => key);
			healthCheck.missingVariables = missingVars;
			return json(healthCheck, { status: 503 });
		}

		healthCheck.r2.configured = true;

		// Try to connect to R2 by checking if bucket is accessible
		const r2Client = new S3Client({
			region: 'auto',
			endpoint: env.R2_ENDPOINT_URL,
			credentials: {
				accessKeyId: env.R2_ACCESS_KEY_ID!,
				secretAccessKey: env.R2_SECRET_ACCESS_KEY!
			},
			// Use FetchHttpHandler for Cloudflare Workers/Pages compatibility
			requestHandler: new FetchHttpHandler()
		});

		// Test bucket access by trying to get metadata for a non-existent file
		// This will fail with NoSuchKey if bucket is accessible, or with access errors if not
		try {
			const testCommand = new HeadObjectCommand({
				Bucket: env.R2_BUCKET_NAME,
				Key: 'health-check-test-file.txt'
			});
			await r2Client.send(testCommand);
			// If we get here, the file exists (unlikely)
			healthCheck.r2.testFileExists = true;
		} catch (error: any) {
			// NoSuchKey means bucket is accessible but file doesn't exist (expected)
			if (error.name === 'NotFound' || error.Code === 'NoSuchKey') {
				healthCheck.r2.accessible = true;
				healthCheck.r2.authenticated = true;
			} else {
				// Any other error means there's a problem
				throw error;
			}
		}

		healthCheck.status = 'ok';
		healthCheck.message = 'R2 is properly configured and accessible';

		return json(healthCheck, { status: 200 });
	} catch (error: any) {
		console.error('R2 health check error:', error);

		healthCheck.status = 'error';
		healthCheck.r2.accessible = false;

		// Provide specific error information
		if (error.name === 'CredentialsProviderError' || error.Code === 'InvalidAccessKeyId') {
			healthCheck.message = 'R2 authentication failed - Invalid access key or secret';
			healthCheck.error = 'Invalid credentials';
		} else if (error.name === 'NoSuchBucket' || error.Code === 'NoSuchBucket') {
			healthCheck.message = `R2 bucket '${env.R2_BUCKET_NAME}' does not exist`;
			healthCheck.error = 'Bucket not found';
		} else if (error.name === 'AccessDenied' || error.Code === 'AccessDenied') {
			healthCheck.message = 'R2 access denied - Check bucket permissions';
			healthCheck.error = 'Access denied';
		} else if (error.name === 'NetworkError' || error.code === 'ENOTFOUND') {
			healthCheck.message = `R2 network error - Cannot reach endpoint ${env.R2_ENDPOINT_URL}`;
			healthCheck.error = 'Network error';
		} else {
			healthCheck.message = error.message || 'Unknown R2 error';
			healthCheck.error = error.name || 'Unknown';
		}

		return json(healthCheck, { status: 503 });
	}
};

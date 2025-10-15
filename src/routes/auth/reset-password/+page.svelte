<script lang="ts">
	import { onMount } from 'svelte';
	import { supabase } from '$lib/supabase';
	import { goto } from '$app/navigation';
	import { Lock, CheckCircle, X, AlertCircle } from 'lucide-svelte';

	let password = '';
	let confirmPassword = '';
	let loading = false;
	let error = '';
	let success = false;
	let validSession = false;
	let isChecking = true;

	onMount(async () => {
		try {
			// Check if we have hash parameters in the URL
			const hashParams = new URLSearchParams(window.location.hash.substring(1));
			const accessToken = hashParams.get('access_token');
			const refreshToken = hashParams.get('refresh_token');
			const type = hashParams.get('type');

			console.log('Reset password page loaded');
			console.log('Has access token:', !!accessToken);
			console.log('Type:', type);

			if (accessToken && refreshToken && type === 'recovery') {
				// Set the session with the tokens from the email
				const { data, error: sessionError } = await supabase.auth.setSession({
					access_token: accessToken,
					refresh_token: refreshToken
				});

				if (sessionError) {
					console.error('Session error:', sessionError);
					error = sessionError.message || 'Failed to validate reset link';
					validSession = false;
				} else if (data.session) {
					console.log('Session established successfully');
					validSession = true;
					error = '';
				} else {
					error = 'Invalid reset link. Please request a new one.';
					validSession = false;
				}
			} else {
				// Try to get existing session
				const { data: { session } } = await supabase.auth.getSession();

				if (session) {
					console.log('Found existing session');
					validSession = true;
				} else {
					error = 'Invalid or expired reset link. Please request a new password reset.';
					validSession = false;
				}
			}
		} catch (e: any) {
			console.error('Mount error:', e);
			error = e.message || 'An error occurred. Please try again.';
			validSession = false;
		} finally {
			isChecking = false;
		}
	});

	async function handleResetPassword() {
		error = '';
		loading = true;

		console.log('Starting password reset...');

		// Validate passwords
		if (password.length < 6) {
			error = 'Password must be at least 6 characters long';
			loading = false;
			return;
		}

		if (password !== confirmPassword) {
			error = 'Passwords do not match';
			loading = false;
			return;
		}

		try {
			console.log('Calling updateUser...');
			const { data, error: updateError } = await supabase.auth.updateUser({
				password: password
			});

			console.log('Update result:', data);
			console.log('Update error:', updateError);

			if (updateError) {
				throw updateError;
			}

			console.log('Password updated successfully');

			// Sign out the user for security
			console.log('Signing out user...');
			await supabase.auth.signOut();

			success = true;
		} catch (e: any) {
			console.error('Reset password error:', e);
			error = e.message || 'Failed to reset password. Please try again.';
		} finally {
			loading = false;
		}
	}
</script>

<svelte:head>
	<title>Reset Password - Blue Balls</title>
</svelte:head>

<div class="min-h-screen flex items-center justify-center p-4">
	<div class="card max-w-md w-full">
		<h1 class="text-3xl font-bold text-center mb-2">Reset Password</h1>
		<p class="text-center dark:text-gray-300 mb-6">
			Enter your new password below.
		</p>

		{#if isChecking}
			<div class="flex items-center justify-center py-8">
				<div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
			</div>
		{:else}
			{#if error}
				<div class="bg-red-500/20 border border-red-500 text-red-500 px-4 py-3 rounded-lg mb-4 flex items-start gap-2">
					<AlertCircle size={20} class="flex-shrink-0 mt-0.5" />
					<div>
						<p class="font-bold">Error</p>
						<p class="text-sm">{error}</p>
						{#if !validSession}
							<a href="/auth/forgot-password" class="text-sm underline mt-2 inline-block">
								Request a new reset link
							</a>
						{/if}
					</div>
				</div>
			{/if}

			{#if success}
				<div class="bg-green-500/20 border border-green-500 text-green-600 dark:text-green-400 px-4 py-3 rounded-lg mb-4">
					<div class="flex items-start gap-2">
						<CheckCircle size={20} class="flex-shrink-0 mt-0.5" />
						<div>
							<p class="font-bold">Password reset successful!</p>
							<p class="text-sm mt-1">You can now login with your new password.</p>
						</div>
					</div>
				</div>

				<a href="/auth/login" class="btn-primary w-full text-center block">
					Go to Login
				</a>
			{:else if validSession}
				<form on:submit|preventDefault={handleResetPassword} class="space-y-4">
					<div>
						<label for="password" class="block text-sm font-medium mb-2 dark:text-gray-300">
							New Password
						</label>
						<div class="relative">
							<Lock class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
							<input
								id="password"
								type="password"
								bind:value={password}
								required
								minlength="6"
								disabled={loading}
								class="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary dark:bg-dark-accent dark:border-gray-600 dark:text-white disabled:opacity-50"
								placeholder="••••••••"
							/>
						</div>
						<p class="text-xs text-gray-500 dark:text-gray-400 mt-1">Minimum 6 characters</p>
					</div>

					<div>
						<label for="confirmPassword" class="block text-sm font-medium mb-2 dark:text-gray-300">
							Confirm New Password
						</label>
						<div class="relative">
							<Lock class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
							<input
								id="confirmPassword"
								type="password"
								bind:value={confirmPassword}
								required
								minlength="6"
								disabled={loading}
								class="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary dark:bg-dark-accent dark:border-gray-600 dark:text-white disabled:opacity-50"
								placeholder="••••••••"
							/>
						</div>
					</div>

					<button
						type="submit"
						disabled={loading}
						class="btn-primary w-full disabled:opacity-50"
					>
						{loading ? 'Resetting Password...' : 'Reset Password'}
					</button>
				</form>
			{/if}
		{/if}

		<div class="mt-6 text-center">
			<p class="text-sm dark:text-gray-300">
				<a href="/auth/login" class="text-primary dark:text-secondary font-semibold hover:underline">
					Back to Login
				</a>
			</p>
		</div>
	</div>
</div>

<script lang="ts">
	import { supabase } from '$lib/supabase';
	import { Mail, ArrowLeft, CheckCircle } from 'lucide-svelte';

	let email = '';
	let loading = false;
	let error = '';
	let success = false;

	async function handleForgotPassword() {
		loading = true;
		error = '';
		success = false;

		try {
			const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
				redirectTo: `${window.location.origin}/auth/reset-password`
			});

			if (resetError) throw resetError;

			success = true;
		} catch (e: any) {
			error = e.message || 'Failed to send reset email';
		} finally {
			loading = false;
		}
	}
</script>

<svelte:head>
	<title>Forgot Password - Blue Balls</title>
</svelte:head>

<div class="min-h-screen flex items-center justify-center p-4">
	<div class="card max-w-md w-full">
		<a href="/auth/login" class="inline-flex items-center gap-2 text-primary dark:text-secondary hover:underline mb-4">
			<ArrowLeft size={18} />
			Back to Login
		</a>

		<h1 class="text-3xl font-bold text-center mb-2">Forgot Password?</h1>
		<p class="text-center dark:text-gray-300 mb-6">
			No worries! Enter your email and we'll send you a reset link.
		</p>

		{#if error}
			<div class="bg-red-500/20 border border-red-500 text-red-500 px-4 py-3 rounded-lg mb-4">
				{error}
			</div>
		{/if}

		{#if success}
			<div class="bg-green-500/20 border border-green-500 text-green-600 dark:text-green-400 px-4 py-3 rounded-lg mb-4">
				<div class="flex items-start gap-2">
					<CheckCircle size={20} class="flex-shrink-0 mt-0.5" />
					<div>
						<p class="font-bold">Check your email!</p>
						<p class="text-sm mt-1">
							We've sent a password reset link to <strong>{email}</strong>.
							Click the link in the email to reset your password.
						</p>
					</div>
				</div>
			</div>
		{:else}
			<form on:submit|preventDefault={handleForgotPassword} class="space-y-4">
				<div>
					<label for="email" class="block text-sm font-medium mb-2 dark:text-gray-300">
						Email Address
					</label>
					<div class="relative">
						<Mail class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
						<input
							id="email"
							type="email"
							bind:value={email}
							required
							class="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary dark:bg-dark-accent dark:border-gray-600 dark:text-white"
							placeholder="your@email.com"
						/>
					</div>
				</div>

				<button
					type="submit"
					disabled={loading}
					class="btn-primary w-full disabled:opacity-50"
				>
					{loading ? 'Sending...' : 'Send Reset Link'}
				</button>
			</form>
		{/if}

		<div class="mt-6 text-center">
			<p class="text-sm dark:text-gray-300">
				Remember your password?
				<a href="/auth/login" class="text-primary dark:text-secondary font-semibold hover:underline">
					Login
				</a>
			</p>
		</div>
	</div>
</div>

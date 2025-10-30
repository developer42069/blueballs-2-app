<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { AlertCircle, Home, RefreshCw } from 'lucide-svelte';

	// Get error details from page store
	$: status = $page.status;
	$: message = $page.error?.message || 'An unexpected error occurred';

	function goHome() {
		goto('/');
	}

	function reload() {
		window.location.reload();
	}
</script>

<svelte:head>
	<title>Error - Blue Balls</title>
</svelte:head>

<div class="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-red-50 to-red-100 dark:from-gray-900 dark:to-gray-800">
	<div class="max-w-md w-full">
		<div class="card text-center">
			<div class="mb-6">
				<div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/20">
					<AlertCircle size={32} class="text-red-600 dark:text-red-400" />
				</div>
			</div>

			<h1 class="text-3xl font-bold mb-2">
				{#if status === 404}
					Page Not Found
				{:else if status === 500}
					Server Error
				{:else}
					Error {status}
				{/if}
			</h1>

			<p class="text-gray-600 dark:text-gray-300 mb-6">
				{#if status === 404}
					The page you're looking for doesn't exist or has been moved.
				{:else if status === 500}
					Something went wrong on our end. Please try again.
				{:else}
					{message}
				{/if}
			</p>

			<div class="flex flex-col sm:flex-row gap-3 justify-center">
				<button
					on:click={reload}
					class="btn-primary bg-primary hover:bg-primary/90 flex items-center justify-center gap-2"
				>
					<RefreshCw size={18} />
					Try Again
				</button>

				<button
					on:click={goHome}
					class="btn-primary bg-gray-500 hover:bg-gray-600 flex items-center justify-center gap-2"
				>
					<Home size={18} />
					Go Home
				</button>
			</div>

			{#if status === 500}
				<div class="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
					<p class="text-sm text-yellow-800 dark:text-yellow-200">
						<strong>Tip:</strong> If this keeps happening, try clearing your browser cache or logging out and back in.
					</p>
				</div>
			{/if}
		</div>

		<p class="text-center text-sm text-gray-500 dark:text-gray-400 mt-4">
			Need help? Contact support at <a href="mailto:support@blueballs.lol" class="text-primary hover:underline">support@blueballs.lol</a>
		</p>
	</div>
</div>

<style>
	.card {
		background: white;
		border-radius: 0.75rem;
		padding: 2rem;
		box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
	}

	:global(.dark) .card {
		background: #1f2937;
	}

	.btn-primary {
		padding: 0.75rem 1.5rem;
		border-radius: 0.5rem;
		font-weight: 600;
		transition: all 0.2s;
		color: white;
		border: none;
		cursor: pointer;
	}
</style>

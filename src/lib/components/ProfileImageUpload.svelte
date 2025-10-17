<script lang="ts">
	import { Upload, User, Loader2 } from 'lucide-svelte';
	import { user } from '$lib/stores/auth';

	export let currentImageUrl: string | null = null;
	export let onUploadSuccess: (url: string) => void = () => {};

	let uploading = false;
	let error = '';
	let previewUrl = currentImageUrl;
	let fileInput: HTMLInputElement;

	$: displayUrl = previewUrl || currentImageUrl;

	async function handleFileSelect(event: Event) {
		const target = event.target as HTMLInputElement;
		const file = target.files?.[0];

		if (!file) return;

		// Validate file type
		const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
		if (!validTypes.includes(file.type)) {
			error = 'Please upload a valid image (JPEG, PNG, or WebP)';
			return;
		}

		// Validate file size (5MB)
		const maxSize = 5 * 1024 * 1024;
		if (file.size > maxSize) {
			error = 'Image must be smaller than 5MB';
			return;
		}

		// Show preview
		const reader = new FileReader();
		reader.onload = (e) => {
			previewUrl = e.target?.result as string;
		};
		reader.readAsDataURL(file);

		// Upload the file
		await uploadImage(file);
	}

	async function uploadImage(file: File) {
		uploading = true;
		error = '';

		try {
			const formData = new FormData();
			formData.append('image', file);

			const response = await fetch('/api/upload-profile-image', {
				method: 'POST',
				body: formData
			});

			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.message || 'Upload failed');
			}

			// Success!
			currentImageUrl = data.url;
			previewUrl = data.url;
			onUploadSuccess(data.url);

			// Show success message briefly
			setTimeout(() => {
				error = '';
			}, 3000);
		} catch (err: any) {
			error = err.message || 'Failed to upload image';
			// Reset preview on error
			previewUrl = currentImageUrl;
		} finally {
			uploading = false;
		}
	}

	function triggerFileInput() {
		fileInput?.click();
	}
</script>

<div class="profile-image-upload">
	<div class="image-container">
		{#if displayUrl}
			<img src={displayUrl} alt="Profile" class="profile-image" />
		{:else}
			<div class="placeholder-image">
				<User size={64} class="text-gray-400 dark:text-gray-600" />
			</div>
		{/if}

		<button
			type="button"
			class="upload-overlay"
			on:click={triggerFileInput}
			disabled={uploading}
		>
			{#if uploading}
				<Loader2 size={24} class="animate-spin" />
				<span class="text-sm mt-2">Uploading...</span>
			{:else}
				<Upload size={24} />
				<span class="text-sm mt-2">Change Photo</span>
			{/if}
		</button>
	</div>

	<input
		type="file"
		bind:this={fileInput}
		on:change={handleFileSelect}
		accept="image/jpeg,image/png,image/webp,image/jpg"
		class="hidden"
		disabled={uploading}
	/>

	{#if error}
		<p class="error-message">{error}</p>
	{/if}

	<p class="help-text">
		Recommended: Square image, at least 400x400px. Max 5MB.
	</p>
</div>

<style>
	.profile-image-upload {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1rem;
	}

	.image-container {
		position: relative;
		width: 160px;
		height: 160px;
		border-radius: 50%;
		overflow: hidden;
		border: 4px solid #e0e0e0;
		transition: border-color 0.3s ease;
	}

	.image-container:hover {
		border-color: #e40078;
	}

	.profile-image {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.placeholder-image {
		width: 100%;
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		background: linear-gradient(135deg, #f5f5f5, #e0e0e0);
	}

	:global(.dark) .placeholder-image {
		background: linear-gradient(135deg, #2a2a2a, #1a1a1a);
	}

	.upload-overlay {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.7);
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		color: white;
		opacity: 0;
		transition: opacity 0.3s ease;
		cursor: pointer;
		border: none;
		font-weight: 600;
	}

	.upload-overlay:hover:not(:disabled) {
		opacity: 1;
	}

	.upload-overlay:disabled {
		cursor: not-allowed;
		opacity: 0.8;
	}

	.error-message {
		color: #dc2626;
		font-size: 0.875rem;
		text-align: center;
		margin: 0;
	}

	.help-text {
		color: #6b7280;
		font-size: 0.875rem;
		text-align: center;
		margin: 0;
	}

	:global(.dark) .help-text {
		color: #9ca3af;
	}

	.hidden {
		display: none;
	}
</style>

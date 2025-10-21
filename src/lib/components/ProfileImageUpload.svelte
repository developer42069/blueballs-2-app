<script lang="ts">
	import { Upload, User, Loader2, X, Check, RotateCw, ZoomIn, ZoomOut } from 'lucide-svelte';
	import { supabase } from '$lib/supabase';
	import Cropper from 'svelte-easy-crop';

	export let currentImageUrl: string | null = null;
	export let onUploadSuccess: (url: string) => void = () => {};

	let uploading = false;
	let error = '';
	let success = '';
	let previewUrl = currentImageUrl;
	let fileInput: HTMLInputElement;
	let cropperModal = false;
	let selectedFile: File | null = null;
	let originalImageUrl: string | null = null;

	// Cropper state
	let crop = { x: 0, y: 0 };
	let zoom = 1;
	let rotation = 0;
	let croppedAreaPixels: any = null;

	$: displayUrl = previewUrl || currentImageUrl;

	async function handleFileSelect(event: Event) {
		const target = event.target as HTMLInputElement;
		const file = target.files?.[0];

		if (!file) return;

		// Validate file type
		const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
		if (!validTypes.includes(file.type)) {
			error = 'Please upload a valid image (JPEG, PNG, or WebP)';
			setTimeout(() => error = '', 5000);
			return;
		}

		// Validate file size (10MB before processing)
		const maxSize = 10 * 1024 * 1024;
		if (file.size > maxSize) {
			error = 'Image must be smaller than 10MB';
			setTimeout(() => error = '', 5000);
			return;
		}

		error = '';
		selectedFile = file;

		// Create URL for cropper
		if (originalImageUrl) {
			URL.revokeObjectURL(originalImageUrl);
		}
		originalImageUrl = URL.createObjectURL(file);

		// Reset cropper state
		crop = { x: 0, y: 0 };
		zoom = 1;
		rotation = 0;
		croppedAreaPixels = null; // Reset this too

		// Open cropper modal
		cropperModal = true;

		console.log('Cropper modal opened, waiting for cropcomplete event...');
	}

	function closeCropper() {
		if (originalImageUrl) {
			URL.revokeObjectURL(originalImageUrl);
			originalImageUrl = null;
		}
		cropperModal = false;
		selectedFile = null;
		// Reset file input
		if (fileInput) {
			fileInput.value = '';
		}
	}

	function onCropComplete(e: CustomEvent) {
		console.log('Crop complete event fired:', e.detail);
		croppedAreaPixels = e.detail.pixels;
		console.log('Updated croppedAreaPixels:', croppedAreaPixels);
	}

	function adjustZoom(delta: number) {
		zoom = Math.max(1, Math.min(3, zoom + delta));
	}

	function adjustRotation(delta: number) {
		rotation = (rotation + delta) % 360;
	}

	async function createCroppedImage(
		imageSrc: string,
		pixelCrop: any,
		rotation: number
	): Promise<Blob> {
		const image = await createImage(imageSrc);
		const canvas = document.createElement('canvas');
		const ctx = canvas.getContext('2d');

		if (!ctx) {
			throw new Error('Failed to get canvas context');
		}

		// Calculate rotated size
		const maxSize = Math.max(image.width, image.height);
		const safeArea = 2 * ((maxSize / 2) * Math.sqrt(2));

		// Set canvas size
		canvas.width = safeArea;
		canvas.height = safeArea;

		// Translate and rotate
		ctx.translate(safeArea / 2, safeArea / 2);
		ctx.rotate((rotation * Math.PI) / 180);
		ctx.translate(-safeArea / 2, -safeArea / 2);

		// Draw rotated image
		ctx.drawImage(
			image,
			safeArea / 2 - image.width * 0.5,
			safeArea / 2 - image.height * 0.5
		);

		const data = ctx.getImageData(0, 0, safeArea, safeArea);

		// Set canvas size to final crop
		canvas.width = pixelCrop.width;
		canvas.height = pixelCrop.height;

		// Draw cropped image
		ctx.putImageData(
			data,
			Math.round(0 - safeArea / 2 + image.width * 0.5 - pixelCrop.x),
			Math.round(0 - safeArea / 2 + image.height * 0.5 - pixelCrop.y)
		);

		// Convert to blob
		return new Promise((resolve, reject) => {
			canvas.toBlob(
				(blob) => {
					if (blob) {
						resolve(blob);
					} else {
						reject(new Error('Failed to create blob'));
					}
				},
				'image/jpeg',
				0.9
			);
		});
	}

	function createImage(url: string): Promise<HTMLImageElement> {
		return new Promise((resolve, reject) => {
			const image = new Image();
			image.addEventListener('load', () => resolve(image));
			image.addEventListener('error', (error) => reject(error));
			image.src = url;
		});
	}

	async function handleCropAndUpload() {
		console.log('handleCropAndUpload called');
		console.log('selectedFile:', selectedFile);
		console.log('originalImageUrl:', originalImageUrl);
		console.log('croppedAreaPixels:', croppedAreaPixels);

		if (!selectedFile) {
			error = 'No file selected';
			console.error('No file selected');
			setTimeout(() => error = '', 3000);
			return;
		}

		if (!originalImageUrl) {
			error = 'No image URL available';
			console.error('No image URL');
			setTimeout(() => error = '', 3000);
			return;
		}

		if (!croppedAreaPixels) {
			error = 'Please wait for the cropper to load, then try again';
			console.error('No cropped area pixels - cropper not ready');
			setTimeout(() => error = '', 3000);
			return;
		}

		uploading = true;
		error = '';
		success = '';

		try {
			console.log('Creating cropped image...');
			// Create cropped image
			const croppedBlob = await createCroppedImage(
				originalImageUrl,
				croppedAreaPixels,
				rotation
			);
			console.log('Cropped blob created:', croppedBlob);

			// Create file from blob
			const croppedFile = new File([croppedBlob], selectedFile.name, {
				type: 'image/jpeg',
				lastModified: Date.now(),
			});

			// Show preview
			const reader = new FileReader();
			reader.onload = (e) => {
				previewUrl = e.target?.result as string;
			};
			reader.readAsDataURL(croppedFile);

			// Close cropper
			closeCropper();

			// Upload the cropped file
			await uploadImage(croppedFile);
		} catch (err: any) {
			error = err.message || 'Failed to process image';
			uploading = false;
		}
	}

	async function uploadImage(file: File) {
		uploading = true;
		error = '';
		success = '';

		try {
			// Check if user is logged in
			const session = await supabase.auth.getSession();
			if (!session.data.session) {
				throw new Error('No active session. Please log in again.');
			}

			const formData = new FormData();
			formData.append('image', file);

			// Upload via API
			const response = await fetch('/api/upload-profile-image', {
				method: 'POST',
				credentials: 'same-origin',
				body: formData,
			});

			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.message || data.error || 'Upload failed');
			}

			// Success!
			currentImageUrl = data.url;
			previewUrl = data.url;
			success = 'Profile picture updated successfully!';
			onUploadSuccess(data.url);

			// Clear success message after 3 seconds
			setTimeout(() => {
				success = '';
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

	function removeImage() {
		previewUrl = null;
		currentImageUrl = null;
		if (fileInput) {
			fileInput.value = '';
		}
	}
</script>

<div class="profile-image-upload">
	<!-- Main Image Display -->
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

	<!-- File Input -->
	<input
		type="file"
		bind:this={fileInput}
		on:change={handleFileSelect}
		accept="image/jpeg,image/png,image/webp,image/jpg"
		class="hidden"
		disabled={uploading}
	/>

	<!-- Action Buttons -->
	<div class="button-group">
		<button
			type="button"
			class="btn-secondary"
			on:click={triggerFileInput}
			disabled={uploading}
		>
			<Upload size={16} />
			Choose Photo
		</button>
		{#if displayUrl}
			<button
				type="button"
				class="btn-danger"
				on:click={removeImage}
				disabled={uploading}
			>
				<X size={16} />
				Remove
			</button>
		{/if}
	</div>

	<!-- Messages -->
	{#if error}
		<div class="message error-message">
			<X size={16} />
			{error}
		</div>
	{/if}

	{#if success}
		<div class="message success-message">
			<Check size={16} />
			{success}
		</div>
	{/if}

	<p class="help-text">
		Square images work best. We'll help you crop it perfectly!
	</p>
</div>

<!-- Cropper Modal -->
{#if cropperModal && originalImageUrl}
	<!-- svelte-ignore a11y-click-events-have-key-events -->
	<!-- svelte-ignore a11y-no-static-element-interactions -->
	<div class="modal-backdrop" on:click={closeCropper}>
		<!-- svelte-ignore a11y-click-events-have-key-events -->
		<!-- svelte-ignore a11y-no-static-element-interactions -->
		<div class="modal-content" on:click|stopPropagation>
			<div class="modal-header">
				<h3 class="modal-title">Crop Your Profile Picture</h3>
				<button type="button" class="close-button" on:click={closeCropper}>
					<X size={24} />
				</button>
			</div>

			<div class="modal-body">
				<!-- Cropper Container -->
				<div class="cropper-container">
					<Cropper
						image={originalImageUrl}
						bind:crop
						bind:zoom
						bind:rotation
						aspect={1}
						oncropcomplete={onCropComplete}
					/>
				</div>

				<!-- Cropper Controls -->
				<div class="cropper-controls">
					<div class="control-group">
						<span class="control-label">Zoom</span>
						<div class="control-buttons">
							<button
								type="button"
								class="control-btn"
								on:click={() => adjustZoom(-0.1)}
								title="Zoom out"
							>
								<ZoomOut size={20} />
							</button>
							<input
								type="range"
								min="1"
								max="3"
								step="0.1"
								bind:value={zoom}
								class="zoom-slider"
							/>
							<button
								type="button"
								class="control-btn"
								on:click={() => adjustZoom(0.1)}
								title="Zoom in"
							>
								<ZoomIn size={20} />
							</button>
						</div>
					</div>

					<div class="control-group">
						<span class="control-label">Rotate</span>
						<div class="control-buttons">
							<button
								type="button"
								class="control-btn"
								on:click={() => adjustRotation(-90)}
								title="Rotate left"
							>
								<RotateCw size={20} style="transform: scaleX(-1)" />
							</button>
							<input
								type="range"
								min="0"
								max="360"
								step="1"
								bind:value={rotation}
								class="zoom-slider"
							/>
							<button
								type="button"
								class="control-btn"
								on:click={() => adjustRotation(90)}
								title="Rotate right"
							>
								<RotateCw size={20} />
							</button>
						</div>
					</div>
				</div>
			</div>

			<div class="modal-footer">
				<button type="button" class="btn-cancel" on:click={closeCropper}>
					Cancel
				</button>
				<button
					type="button"
					class="btn-primary"
					on:click={handleCropAndUpload}
					disabled={uploading}
				>
					{#if uploading}
						<Loader2 size={16} class="animate-spin" />
						Uploading...
					{:else}
						<Check size={16} />
						Crop & Upload
					{/if}
				</button>
			</div>
		</div>
	</div>
{/if}

<style>
	.profile-image-upload {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1rem;
		width: 100%;
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

	:global(.dark) .image-container {
		border-color: #374151;
	}

	:global(.dark) .image-container:hover {
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

	.button-group {
		display: flex;
		gap: 0.75rem;
		flex-wrap: wrap;
		justify-content: center;
	}

	.btn-secondary,
	.btn-danger {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 1rem;
		border-radius: 0.5rem;
		font-weight: 600;
		font-size: 0.875rem;
		border: none;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.btn-secondary {
		background-color: #e40078;
		color: white;
	}

	.btn-secondary:hover:not(:disabled) {
		background-color: #c00066;
		transform: translateY(-1px);
	}

	.btn-danger {
		background-color: #dc2626;
		color: white;
	}

	.btn-danger:hover:not(:disabled) {
		background-color: #b91c1c;
		transform: translateY(-1px);
	}

	.btn-secondary:disabled,
	.btn-danger:disabled {
		opacity: 0.5;
		cursor: not-allowed;
		transform: none;
	}

	.message {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.75rem 1rem;
		border-radius: 0.5rem;
		font-size: 0.875rem;
		font-weight: 500;
	}

	.error-message {
		background-color: #fee2e2;
		color: #dc2626;
		border: 1px solid #fca5a5;
	}

	:global(.dark) .error-message {
		background-color: #7f1d1d;
		color: #fca5a5;
		border-color: #991b1b;
	}

	.success-message {
		background-color: #d1fae5;
		color: #059669;
		border: 1px solid #6ee7b7;
	}

	:global(.dark) .success-message {
		background-color: #064e3b;
		color: #6ee7b7;
		border-color: #047857;
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

	/* Modal Styles */
	.modal-backdrop {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.75);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 9999;
		padding: 1rem;
		animation: fadeIn 0.2s ease;
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}

	.modal-content {
		background: white;
		border-radius: 1rem;
		max-width: 600px;
		width: 100%;
		max-height: 90vh;
		overflow: auto;
		box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
		animation: slideUp 0.3s ease;
	}

	:global(.dark) .modal-content {
		background: #1f2937;
	}

	@keyframes slideUp {
		from {
			transform: translateY(20px);
			opacity: 0;
		}
		to {
			transform: translateY(0);
			opacity: 1;
		}
	}

	.modal-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 1.5rem;
		border-bottom: 1px solid #e5e7eb;
	}

	:global(.dark) .modal-header {
		border-bottom-color: #374151;
	}

	.modal-title {
		font-size: 1.25rem;
		font-weight: 700;
		margin: 0;
		color: #111827;
	}

	:global(.dark) .modal-title {
		color: #f9fafb;
	}

	.close-button {
		background: none;
		border: none;
		cursor: pointer;
		padding: 0.5rem;
		border-radius: 0.5rem;
		color: #6b7280;
		transition: all 0.2s ease;
	}

	.close-button:hover {
		background: #f3f4f6;
		color: #111827;
	}

	:global(.dark) .close-button:hover {
		background: #374151;
		color: #f9fafb;
	}

	.modal-body {
		padding: 1.5rem;
	}

	.cropper-container {
		width: 100%;
		height: 400px;
		position: relative;
		background: #f9fafb;
		border-radius: 0.5rem;
		overflow: hidden;
		margin-bottom: 1.5rem;
	}

	:global(.dark) .cropper-container {
		background: #111827;
	}

	.cropper-controls {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.control-group {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.control-label {
		font-size: 0.875rem;
		font-weight: 600;
		color: #374151;
	}

	:global(.dark) .control-label {
		color: #d1d5db;
	}

	.control-buttons {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.control-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 2.5rem;
		height: 2.5rem;
		background: #f3f4f6;
		border: 1px solid #d1d5db;
		border-radius: 0.5rem;
		cursor: pointer;
		transition: all 0.2s ease;
		color: #374151;
		flex-shrink: 0;
	}

	.control-btn:hover {
		background: #e5e7eb;
		border-color: #9ca3af;
		transform: translateY(-1px);
	}

	:global(.dark) .control-btn {
		background: #374151;
		border-color: #4b5563;
		color: #d1d5db;
	}

	:global(.dark) .control-btn:hover {
		background: #4b5563;
		border-color: #6b7280;
	}

	.zoom-slider {
		flex: 1;
		height: 0.5rem;
		border-radius: 0.25rem;
		background: #e5e7eb;
		outline: none;
		appearance: none;
	}

	.zoom-slider::-webkit-slider-thumb {
		appearance: none;
		width: 1rem;
		height: 1rem;
		border-radius: 50%;
		background: #e40078;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.zoom-slider::-webkit-slider-thumb:hover {
		background: #c00066;
		transform: scale(1.1);
	}

	.zoom-slider::-moz-range-thumb {
		width: 1rem;
		height: 1rem;
		border-radius: 50%;
		background: #e40078;
		cursor: pointer;
		border: none;
		transition: all 0.2s ease;
	}

	.zoom-slider::-moz-range-thumb:hover {
		background: #c00066;
		transform: scale(1.1);
	}

	:global(.dark) .zoom-slider {
		background: #4b5563;
	}

	.modal-footer {
		display: flex;
		gap: 0.75rem;
		justify-content: flex-end;
		padding: 1.5rem;
		border-top: 1px solid #e5e7eb;
	}

	:global(.dark) .modal-footer {
		border-top-color: #374151;
	}

	.btn-cancel,
	.btn-primary {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.625rem 1.25rem;
		border-radius: 0.5rem;
		font-weight: 600;
		font-size: 0.875rem;
		border: none;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.btn-cancel {
		background: #f3f4f6;
		color: #374151;
	}

	.btn-cancel:hover {
		background: #e5e7eb;
	}

	:global(.dark) .btn-cancel {
		background: #374151;
		color: #d1d5db;
	}

	:global(.dark) .btn-cancel:hover {
		background: #4b5563;
	}

	.btn-primary {
		background-color: #e40078;
		color: white;
	}

	.btn-primary:hover:not(:disabled) {
		background-color: #c00066;
		transform: translateY(-1px);
	}

	.btn-primary:disabled {
		opacity: 0.5;
		cursor: not-allowed;
		transform: none;
	}
</style>

<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { createEventDispatcher } from 'svelte';
	import { GAME_CONFIG, type Difficulty } from '$lib/utils/gameConfig';
	import { Volume2, VolumeX, Share2, RefreshCw, X, Maximize2 } from 'lucide-svelte';

	export let difficulty: Difficulty = 'easy';

	const dispatch = createEventDispatcher();

	let canvas: HTMLCanvasElement;
	let ctx: CanvasRenderingContext2D;
	let animationId: number;
	let gameStarted = false;
	let gameOver = false;
	let score = 0;
	let muted = false;
	let countdown = 0; // 3, 2, 1, 0 (0 means countdown finished)
	let countdownInterval: number;
	let waitingForFirstJump = false; // True after countdown, waiting for first jump
	let showGameOverModal = false; // Show the game over modal
	let isFullscreen = false; // Full-screen mobile mode
	let isMobile = false; // Detect if mobile device
	let fullscreenContainer: HTMLDivElement;

	// Game objects
	let bird = {
		x: 50,
		y: 250,
		radius: 15,
		velocity: 0,
		color: '#00008B' // Blue balls
	};

	let pipes: Array<{
		x: number;
		topHeight: number;
		bottomY: number;
		passed: boolean;
		topSpikeWidth: number;
		bottomSpikeWidth: number;
	}> = [];

	let lastPipeX = 400;
	const spikeWidth = 80; // Width of spike at base
	const pipeColor = '#E40078'; // Pink

	// Get config for current difficulty
	$: config = GAME_CONFIG[difficulty];

	// Sound effects with bubble sounds
	const playSound = (type: 'jump' | 'score' | 'die') => {
		if (muted) return;

		const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
		const oscillator = audioContext.createOscillator();
		const gainNode = audioContext.createGain();

		oscillator.connect(gainNode);
		gainNode.connect(audioContext.destination);

		if (type === 'jump') {
			// Bubble "bloob" sound - quick pitch wobble
			oscillator.type = 'sine';
			oscillator.frequency.setValueAtTime(400, audioContext.currentTime);
			oscillator.frequency.exponentialRampToValueAtTime(200, audioContext.currentTime + 0.05);
			oscillator.frequency.exponentialRampToValueAtTime(250, audioContext.currentTime + 0.1);
			gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
			gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.12);
			oscillator.start();
			oscillator.stop(audioContext.currentTime + 0.12);
		} else if (type === 'score') {
			// Score sound - quick high ping
			oscillator.frequency.value = 800;
			gainNode.gain.value = 0.1;
			oscillator.start();
			oscillator.stop(audioContext.currentTime + 0.1);
		} else if (type === 'die') {
			// Bubble pop sound - sharp descending pitch
			oscillator.type = 'sine';
			oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
			oscillator.frequency.exponentialRampToValueAtTime(100, audioContext.currentTime + 0.15);
			gainNode.gain.setValueAtTime(0.25, audioContext.currentTime);
			gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15);
			oscillator.start();
			oscillator.stop(audioContext.currentTime + 0.2);
		}
	};

	onMount(() => {
		if (!canvas) return;

		// Detect mobile device
		isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth <= 768;

		ctx = canvas.getContext('2d')!;
		resizeCanvas();
		window.addEventListener('resize', resizeCanvas);

		// Input handlers
		const handleInput = () => {
			if (countdown > 0) {
				// Ignore input during countdown
				return;
			} else if (!gameStarted && !waitingForFirstJump && countdown === 0) {
				// Start countdown
				startCountdown();
			} else if (waitingForFirstJump) {
				// First jump after countdown - start the game
				waitingForFirstJump = false;
				startGame();
			} else if (!gameOver && gameStarted) {
				jump();
			} else if (gameOver) {
				resetGame();
			}
		};

		canvas.addEventListener('click', handleInput);
		const keydownHandler = (e: KeyboardEvent) => {
			// Don't interfere with typing in inputs/textareas
			const target = e.target as HTMLElement;
			if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
				return;
			}

			if (e.code === 'Space' || e.code === 'ArrowUp') {
				e.preventDefault();
				handleInput();
			}
		};
		window.addEventListener('keydown', keydownHandler);

		drawStartScreen();

		return () => {
			window.removeEventListener('resize', resizeCanvas);
			window.removeEventListener('keydown', keydownHandler);
			if (animationId) cancelAnimationFrame(animationId);
		};
	});

	function resizeCanvas() {
		const container = canvas.parentElement;
		if (container) {
			if (isFullscreen) {
				// In fullscreen mode, use full viewport dimensions
				canvas.width = window.innerWidth;
				canvas.height = window.innerHeight;
			} else {
				canvas.width = container.clientWidth;
				canvas.height = Math.min(500, container.clientWidth * 0.6);
			}
		}
	}

	async function enterFullscreen() {
		isFullscreen = true;

		// Prevent body scrolling
		document.body.style.overflow = 'hidden';

		// Wait for DOM to update
		await new Promise(resolve => setTimeout(resolve, 50));

		// Try to enter browser fullscreen API
		if (fullscreenContainer?.requestFullscreen) {
			fullscreenContainer.requestFullscreen().catch(() => {
				// Fallback if fullscreen API fails
			});
		}

		// Lock orientation to landscape if possible
		if (screen.orientation && 'lock' in screen.orientation) {
			(screen.orientation as any).lock('landscape').catch(() => {
				// Orientation lock not supported or failed
			});
		}

		// Resize and redraw after entering fullscreen
		setTimeout(() => {
			resizeCanvas();

			// Redraw current screen
			if (gameStarted && !gameOver) {
				// Game is running, it will redraw in game loop
			} else if (gameOver) {
				draw();
			} else if (waitingForFirstJump) {
				drawWaitingScreen();
			} else if (countdown > 0) {
				drawCountdown();
			} else {
				drawStartScreen();
			}
		}, 100);
	}

	function exitFullscreen() {
		isFullscreen = false;

		// Restore body scrolling
		document.body.style.overflow = '';

		// Exit browser fullscreen
		if (document.fullscreenElement) {
			document.exitFullscreen();
		}

		// Unlock orientation
		if (screen.orientation && 'unlock' in screen.orientation) {
			(screen.orientation as any).unlock();
		}

		setTimeout(() => {
			resizeCanvas();

			// Redraw current screen
			if (gameStarted && !gameOver) {
				// Game is running, it will redraw in game loop
			} else if (gameOver) {
				draw();
			} else if (waitingForFirstJump) {
				drawWaitingScreen();
			} else if (countdown > 0) {
				drawCountdown();
			} else {
				drawStartScreen();
			}
		}, 100);
	}

	function startCountdown() {
		countdown = 3;
		gameOver = false;
		score = 0;
		bird.y = canvas.height / 2;
		bird.velocity = 0;
		pipes = [];
		lastPipeX = canvas.width;

		// Draw countdown screen
		drawCountdown();

		// Countdown timer
		countdownInterval = window.setInterval(() => {
			countdown--;
			if (countdown > 0) {
				drawCountdown();
			} else {
				clearInterval(countdownInterval);
				// Countdown finished - ball hovering, waiting for first jump
				waitingForFirstJump = true;
				drawWaitingScreen();
			}
		}, 1000);
	}

	function startGame() {
		gameStarted = true;
		gameLoop();
	}

	function jump() {
		bird.velocity = config.jump;
		playSound('jump');
	}

	function resetGame() {
		gameStarted = false;
		gameOver = false;
		countdown = 0;
		waitingForFirstJump = false;
		if (countdownInterval) {
			clearInterval(countdownInterval);
		}
		drawStartScreen();
	}

	function gameLoop() {
		if (gameOver || !gameStarted) return;

		// Update bird physics (only if game has actually started)
		bird.velocity += config.gravity;
		bird.y += bird.velocity;

		// Generate spikes (like original game)
		if (pipes.length === 0 || pipes[pipes.length - 1].x < canvas.width - 220) {
			const minHeight = 50;
			const maxHeight = canvas.height - config.pipeGap - minHeight;
			const topHeight = Math.floor(Math.random() * (maxHeight - minHeight)) + minHeight;

			pipes.push({
				x: canvas.width,
				topHeight,
				bottomY: topHeight + config.pipeGap,
				passed: false,
				topSpikeWidth: spikeWidth,
				bottomSpikeWidth: spikeWidth
			});

			lastPipeX = canvas.width;
		}

		// Update pipes
		for (let i = pipes.length - 1; i >= 0; i--) {
			const pipe = pipes[i];
			pipe.x -= config.pipeSpeed;

			// Remove off-screen pipes
			if (pipe.x < -Math.max(pipe.topSpikeWidth, pipe.bottomSpikeWidth)) {
				pipes.splice(i, 1);
				continue;
			}

			// Score when passing spike center
			if (!pipe.passed && pipe.x + (pipe.topSpikeWidth / 2) < bird.x) {
				pipe.passed = true;
				score++;
				playSound('score');
			}

			// Collision detection with triangular spikes
			if (checkSpikeCollision(pipe)) {
				endGame();
				return;
			}
		}

		lastPipeX = pipes.length > 0 ? pipes[pipes.length - 1].x : canvas.width;

		// Check bounds
		if (bird.y - bird.radius < 0 || bird.y + bird.radius > canvas.height) {
			endGame();
			return;
		}

		draw();
		animationId = requestAnimationFrame(gameLoop);
	}

	function checkSpikeCollision(pipe: typeof pipes[0]): boolean {
		// Exact collision detection from original game
		const topSpikeLeft = pipe.x;
		const topSpikeRight = pipe.x + pipe.topSpikeWidth;
		const topSpikeBottom = pipe.topHeight;
		const topSpikeCenterX = pipe.x + (pipe.topSpikeWidth / 2);

		const bottomSpikeLeft = pipe.x;
		const bottomSpikeRight = pipe.x + pipe.bottomSpikeWidth;
		const bottomSpikeTop = pipe.bottomY;
		const bottomSpikeCenterX = pipe.x + (pipe.bottomSpikeWidth / 2);

		// Check if bird is within the spike's horizontal range
		if (bird.x + bird.radius > topSpikeLeft && bird.x - bird.radius < topSpikeRight) {
			// Check collision with top spike (triangle pointing down)
			if (bird.y - bird.radius < topSpikeBottom) {
				// Calculate if bird is within the triangle
				const relativeX = bird.x - topSpikeCenterX;
				const slope = (topSpikeBottom * 2) / pipe.topSpikeWidth;
				const maxYAtX = topSpikeBottom - Math.abs(relativeX) * slope;

				if (bird.y - bird.radius < maxYAtX) {
					return true;
				}
			}

			// Check collision with bottom spike (triangle pointing up)
			if (bird.y + bird.radius > bottomSpikeTop) {
				const relativeX = bird.x - bottomSpikeCenterX;
				const slope = ((canvas.height - bottomSpikeTop) * 2) / pipe.bottomSpikeWidth;
				const minYAtX = bottomSpikeTop + Math.abs(relativeX) * slope;

				if (bird.y + bird.radius > minYAtX) {
					return true;
				}
			}
		}

		return false;
	}

	function endGame() {
		gameOver = true;
		playSound('die');
		showGameOverModal = true;

		// Calculate points earned
		const pointsEarned = Math.floor(score * config.pointMultiplier);

		// Dispatch game over event with score
		dispatch('gameover', { score, pointsEarned });
	}

	function playAgain() {
		showGameOverModal = false;
		startCountdown();
	}

	async function shareScore() {
		const shareText = `I scored ${score} points in Blue Balls ${difficulty} mode! Can you beat me?`;
		const shareUrl = window.location.href;

		if (navigator.share) {
			try {
				await navigator.share({
					title: 'Blue Balls Game',
					text: shareText,
					url: shareUrl
				});
			} catch (err) {
				// Fallback to clipboard
				navigator.clipboard.writeText(`${shareText} ${shareUrl}`);
			}
		} else {
			navigator.clipboard.writeText(`${shareText} ${shareUrl}`);
		}
	}

	function draw() {
		// Fill with cyan background (matching original game)
		ctx.fillStyle = '#4ec0ca';
		ctx.fillRect(0, 0, canvas.width, canvas.height);

		// Draw spikes (triangles) with enhanced shadows
		ctx.fillStyle = pipeColor;
		for (const pipe of pipes) {
			// Add shadow for depth
			ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
			ctx.shadowBlur = 8;
			ctx.shadowOffsetX = 3;
			ctx.shadowOffsetY = 3;

			// Draw top spike (pointing down)
			ctx.beginPath();
			ctx.moveTo(pipe.x, 0);
			ctx.lineTo(pipe.x + pipe.topSpikeWidth, 0);
			ctx.lineTo(pipe.x + (pipe.topSpikeWidth / 2), pipe.topHeight);
			ctx.closePath();
			ctx.fill();

			// Draw bottom spike (pointing up)
			ctx.beginPath();
			ctx.moveTo(pipe.x, canvas.height);
			ctx.lineTo(pipe.x + pipe.bottomSpikeWidth, canvas.height);
			ctx.lineTo(pipe.x + (pipe.bottomSpikeWidth / 2), pipe.bottomY);
			ctx.closePath();
			ctx.fill();

			// Reset shadow
			ctx.shadowColor = 'transparent';
			ctx.shadowBlur = 0;
			ctx.shadowOffsetX = 0;
			ctx.shadowOffsetY = 0;
		}

		// Draw bird (blue ball) with glow effect
		// Outer glow
		ctx.shadowColor = bird.color;
		ctx.shadowBlur = 20;
		ctx.beginPath();
		ctx.arc(bird.x, bird.y, bird.radius, 0, Math.PI * 2);
		ctx.fillStyle = bird.color;
		ctx.fill();

		// Inner highlight for 3D effect
		ctx.shadowColor = 'transparent';
		ctx.shadowBlur = 0;
		const gradient = ctx.createRadialGradient(
			bird.x - bird.radius / 3,
			bird.y - bird.radius / 3,
			0,
			bird.x,
			bird.y,
			bird.radius
		);
		gradient.addColorStop(0, '#4169E1');
		gradient.addColorStop(0.7, bird.color);
		gradient.addColorStop(1, '#000050');
		ctx.fillStyle = gradient;
		ctx.beginPath();
		ctx.arc(bird.x, bird.y, bird.radius, 0, Math.PI * 2);
		ctx.fill();

		// Draw score with enhanced styling
		ctx.fillStyle = '#FFFFFF';
		ctx.strokeStyle = '#000000';
		ctx.lineWidth = 4;
		ctx.font = 'bold 42px Arial';
		ctx.textAlign = 'center';
		ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
		ctx.shadowBlur = 6;
		ctx.shadowOffsetX = 2;
		ctx.shadowOffsetY = 2;
		ctx.strokeText(score.toString(), canvas.width / 2, 50);
		ctx.fillText(score.toString(), canvas.width / 2, 50);
		ctx.shadowColor = 'transparent';
		ctx.shadowBlur = 0;
		ctx.shadowOffsetX = 0;
		ctx.shadowOffsetY = 0;
	}

	function drawCountdown() {
		if (!ctx) return;

		// Fill with cyan background
		ctx.fillStyle = '#4ec0ca';
		ctx.fillRect(0, 0, canvas.width, canvas.height);

		// Draw bird in center
		ctx.beginPath();
		ctx.arc(bird.x, bird.y, bird.radius, 0, Math.PI * 2);
		ctx.fillStyle = bird.color;
		ctx.fill();
		ctx.strokeStyle = '#000080';
		ctx.lineWidth = 2;
		ctx.stroke();

		// Draw countdown number
		ctx.fillStyle = '#FFFFFF';
		ctx.strokeStyle = '#000000';
		ctx.lineWidth = 6;
		ctx.font = 'bold 120px Arial';
		ctx.textAlign = 'center';
		ctx.strokeText(countdown.toString(), canvas.width / 2, canvas.height / 2 + 40);
		ctx.fillText(countdown.toString(), canvas.width / 2, canvas.height / 2 + 40);
	}

	function drawWaitingScreen() {
		if (!ctx) return;

		// Fill with cyan background
		ctx.fillStyle = '#4ec0ca';
		ctx.fillRect(0, 0, canvas.width, canvas.height);

		// Draw bird hovering in center
		ctx.beginPath();
		ctx.arc(bird.x, bird.y, bird.radius, 0, Math.PI * 2);
		ctx.fillStyle = bird.color;
		ctx.fill();
		ctx.strokeStyle = '#000080';
		ctx.lineWidth = 2;
		ctx.stroke();

		// Draw "Click to Jump!" instruction
		ctx.fillStyle = '#FFFFFF';
		ctx.strokeStyle = '#000000';
		ctx.lineWidth = 4;
		ctx.font = 'bold 36px Arial';
		ctx.textAlign = 'center';
		const text = 'Click to Jump!';
		ctx.strokeText(text, canvas.width / 2, canvas.height / 2 + 80);
		ctx.fillText(text, canvas.width / 2, canvas.height / 2 + 80);
	}

	function drawStartScreen() {
		if (!ctx) return;

		// Fill with cyan background (matching original game)
		ctx.fillStyle = '#4ec0ca';
		ctx.fillRect(0, 0, canvas.width, canvas.height);

		// Draw bird
		ctx.beginPath();
		ctx.arc(bird.x, bird.y, bird.radius, 0, Math.PI * 2);
		ctx.fillStyle = bird.color;
		ctx.fill();
		ctx.strokeStyle = '#000080';
		ctx.lineWidth = 2;
		ctx.stroke();

		// Draw instructions
		ctx.fillStyle = '#FFFFFF';
		ctx.strokeStyle = '#000000';
		ctx.lineWidth = 4;
		ctx.font = 'bold 32px Arial';
		ctx.textAlign = 'center';

		const text = 'Click or Press SPACE to Start';
		ctx.strokeText(text, canvas.width / 2, canvas.height / 2);
		ctx.fillText(text, canvas.width / 2, canvas.height / 2);

		// Draw difficulty
		ctx.font = 'bold 24px Arial';
		const diffText = `Difficulty: ${difficulty.toUpperCase()}`;
		ctx.strokeText(diffText, canvas.width / 2, canvas.height / 2 + 40);
		ctx.fillText(diffText, canvas.width / 2, canvas.height / 2 + 40);
	}

	function drawGameOver() {
		if (!ctx) return;

		// Semi-transparent overlay
		ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
		ctx.fillRect(0, 0, canvas.width, canvas.height);

		// Game Over text
		ctx.fillStyle = '#FF1493';
		ctx.strokeStyle = '#FFFFFF';
		ctx.lineWidth = 4;
		ctx.font = 'bold 48px Arial';
		ctx.textAlign = 'center';
		ctx.strokeText('GAME OVER', canvas.width / 2, canvas.height / 2 - 40);
		ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - 40);

		// Score
		ctx.fillStyle = '#FFFFFF';
		ctx.strokeStyle = '#000000';
		ctx.font = 'bold 32px Arial';
		const scoreText = `Score: ${score}`;
		ctx.strokeText(scoreText, canvas.width / 2, canvas.height / 2 + 10);
		ctx.fillText(scoreText, canvas.width / 2, canvas.height / 2 + 10);

		// Points earned
		const points = Math.floor(score * config.pointMultiplier);
		ctx.font = 'bold 24px Arial';
		const pointsText = `Points: ${points}`;
		ctx.strokeText(pointsText, canvas.width / 2, canvas.height / 2 + 50);
		ctx.fillText(pointsText, canvas.width / 2, canvas.height / 2 + 50);

		// Restart instruction
		ctx.font = 'bold 20px Arial';
		const restartText = 'Click to Restart';
		ctx.strokeText(restartText, canvas.width / 2, canvas.height / 2 + 90);
		ctx.fillText(restartText, canvas.width / 2, canvas.height / 2 + 90);
	}

	function toggleMute() {
		muted = !muted;
	}
</script>

<div class="relative">
	{#if !isFullscreen}
		<!-- Normal Mode UI -->
		<button
			on:click={toggleMute}
			class="absolute top-4 right-4 z-10 bg-white/90 dark:bg-dark-accent/90 p-2 rounded-lg hover:bg-white dark:hover:bg-dark-accent transition shadow-lg"
			aria-label={muted ? 'Unmute' : 'Mute'}
		>
			{#if muted}
				<VolumeX size={24} class="text-gray-700 dark:text-white" />
			{:else}
				<Volume2 size={24} class="text-gray-700 dark:text-white" />
			{/if}
		</button>

		<!-- Fullscreen button for all users -->
		<button
			on:click={enterFullscreen}
			class="absolute top-4 left-4 z-10 bg-gradient-to-r from-primary to-secondary text-white p-3 rounded-lg hover:opacity-90 transition shadow-xl group"
			aria-label="Enter fullscreen"
			title="Play in fullscreen"
		>
			<Maximize2 size={24} />
			{#if !isMobile}
				<span class="absolute left-full ml-2 top-1/2 -translate-y-1/2 whitespace-nowrap bg-gray-900 text-white text-sm px-3 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
					Fullscreen Mode
				</span>
			{/if}
		</button>

		<canvas
			bind:this={canvas}
			class="w-full border-4 border-primary dark:border-secondary rounded-lg shadow-2xl cursor-pointer"
			style="max-height: 500px;"
		></canvas>

		<div class="mt-4 text-center text-sm dark:text-gray-300">
			<p>Click or press SPACE to jump</p>
			<p class="mt-1">Avoid the pink obstacles!</p>
			{#if !isMobile}
				<p class="mt-2 text-xs text-primary dark:text-secondary font-semibold">
					💡 Try fullscreen mode for an immersive experience!
				</p>
			{/if}
		</div>
	{:else}
		<!-- Fullscreen Mode UI -->
		<div bind:this={fullscreenContainer} class="fullscreen-container">
			<!-- Exit Button (Top Left) -->
			<button
				on:click={exitFullscreen}
				class="absolute top-4 left-4 z-50 bg-red-500 text-white p-4 rounded-full hover:bg-red-600 transition-all shadow-2xl animate-pulse-subtle"
				aria-label="Exit fullscreen"
				style="box-shadow: 0 0 20px rgba(239, 68, 68, 0.5);"
			>
				<X size={32} class="drop-shadow-lg" />
			</button>

			<!-- Mute Button (Top Right) -->
			<button
				on:click={toggleMute}
				class="absolute top-4 right-4 z-50 bg-white/90 backdrop-blur-sm p-4 rounded-full hover:bg-white transition-all shadow-2xl"
				aria-label={muted ? 'Unmute' : 'Mute'}
			>
				{#if muted}
					<VolumeX size={28} class="text-gray-700" />
				{:else}
					<Volume2 size={28} class="text-gray-700" />
				{/if}
			</button>

			<!-- Game Canvas -->
			<canvas
				bind:this={canvas}
				class="fullscreen-canvas"
			></canvas>

			<!-- TAP Button (Bottom Right) - Show during gameplay on mobile, or as hint on desktop -->
			{#if gameStarted && !gameOver && isMobile}
				<button
					on:click={jump}
					class="absolute bottom-8 right-8 z-50 tap-button"
					aria-label="Tap to jump"
				>
					<div class="tap-button-inner">
						<span class="tap-text">TAP</span>
					</div>
					<div class="tap-ripple"></div>
				</button>
			{:else if gameStarted && !gameOver && !isMobile}
				<!-- Desktop keyboard hint -->
				<div class="absolute bottom-8 right-8 z-50 keyboard-hint">
					<div class="keyboard-key">SPACE</div>
					<div class="keyboard-hint-text">Press to jump</div>
				</div>
			{/if}
		</div>
	{/if}
</div>

{#if showGameOverModal && !isFullscreen}
	<div class="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
		<div class="bg-white dark:bg-dark-secondary rounded-lg p-8 max-w-md w-full mx-4 text-center shadow-2xl">
			<h2 class="text-4xl font-bold text-secondary mb-4">GAME OVER!</h2>
			<p class="text-6xl font-bold text-gray-800 dark:text-white mb-2">{score}</p>
			<p class="text-gray-600 dark:text-gray-400 mb-4">Score</p>
			<p class="text-2xl font-bold text-primary dark:text-secondary mb-6">{Math.floor(score * config.pointMultiplier)} Points</p>

			<div class="flex gap-4">
				<button on:click={shareScore} class="flex-1 btn-secondary flex items-center justify-center gap-2">
					<Share2 size={20} />
					Share
				</button>
				<button on:click={playAgain} class="flex-1 btn-primary flex items-center justify-center gap-2">
					<RefreshCw size={20} />
					Play Again
				</button>
			</div>
		</div>
	</div>
{/if}

<style>
	/* Fullscreen container */
	.fullscreen-container {
		position: fixed;
		top: 0;
		left: 0;
		width: 100vw;
		height: 100vh;
		max-width: 100vw;
		max-height: 100vh;
		background: #4ec0ca;
		z-index: 9999;
		display: flex;
		align-items: center;
		justify-content: center;
		overflow: hidden;
		-webkit-overflow-scrolling: none;
	}

	/* Fullscreen canvas */
	.fullscreen-canvas {
		width: 100vw;
		height: 100vh;
		cursor: pointer;
		touch-action: none;
	}

	/* TAP Button - Vibrant and Eye-catching */
	.tap-button {
		width: 120px;
		height: 120px;
		border-radius: 50%;
		background: linear-gradient(135deg, #E40078 0%, #FF1493 50%, #FF69B4 100%);
		border: 4px solid white;
		box-shadow:
			0 0 30px rgba(228, 0, 120, 0.6),
			0 0 60px rgba(228, 0, 120, 0.4),
			0 8px 20px rgba(0, 0, 0, 0.3),
			inset 0 -4px 10px rgba(0, 0, 0, 0.2),
			inset 0 4px 10px rgba(255, 255, 255, 0.3);
		display: flex;
		align-items: center;
		justify-content: center;
		position: relative;
		cursor: pointer;
		transition: all 0.2s ease;
		animation: tap-pulse 1.5s ease-in-out infinite;
	}

	.tap-button:active {
		transform: scale(0.95);
		box-shadow:
			0 0 20px rgba(228, 0, 120, 0.8),
			0 0 40px rgba(228, 0, 120, 0.6),
			0 4px 10px rgba(0, 0, 0, 0.3);
	}

	.tap-button-inner {
		width: 100%;
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 50%;
		background: radial-gradient(circle at 40% 40%, rgba(255, 255, 255, 0.3), transparent);
	}

	.tap-text {
		font-size: 28px;
		font-weight: 900;
		color: white;
		text-shadow:
			0 2px 4px rgba(0, 0, 0, 0.3),
			0 0 10px rgba(255, 255, 255, 0.5);
		letter-spacing: 2px;
		text-transform: uppercase;
	}

	.tap-ripple {
		position: absolute;
		width: 100%;
		height: 100%;
		border-radius: 50%;
		border: 3px solid rgba(228, 0, 120, 0.6);
		animation: ripple 1.5s ease-out infinite;
	}

	/* Animations */
	@keyframes tap-pulse {
		0%, 100% {
			transform: scale(1);
		}
		50% {
			transform: scale(1.05);
		}
	}

	@keyframes ripple {
		0% {
			transform: scale(1);
			opacity: 1;
		}
		100% {
			transform: scale(1.5);
			opacity: 0;
		}
	}

	@keyframes animate-pulse-subtle {
		0%, 100% {
			opacity: 1;
		}
		50% {
			opacity: 0.8;
		}
	}

	.animate-pulse-subtle {
		animation: animate-pulse-subtle 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
	}

	/* Ensure buttons are visible on top */
	button {
		-webkit-tap-highlight-color: transparent;
		user-select: none;
	}

	/* Desktop keyboard hint */
	.keyboard-hint {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 8px;
		animation: float 2s ease-in-out infinite;
	}

	.keyboard-key {
		background: linear-gradient(135deg, #E40078 0%, #FF1493 50%, #FF69B4 100%);
		color: white;
		padding: 16px 24px;
		border-radius: 12px;
		font-size: 24px;
		font-weight: 900;
		letter-spacing: 2px;
		box-shadow:
			0 0 30px rgba(228, 0, 120, 0.6),
			0 8px 20px rgba(0, 0, 0, 0.3),
			inset 0 -4px 10px rgba(0, 0, 0, 0.2),
			inset 0 4px 10px rgba(255, 255, 255, 0.3);
		border: 3px solid white;
		text-shadow:
			0 2px 4px rgba(0, 0, 0, 0.3),
			0 0 10px rgba(255, 255, 255, 0.5);
	}

	.keyboard-hint-text {
		color: white;
		font-size: 16px;
		font-weight: 600;
		text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
		background: rgba(0, 0, 0, 0.3);
		padding: 6px 12px;
		border-radius: 6px;
		backdrop-filter: blur(4px);
	}

	@keyframes float {
		0%, 100% {
			transform: translateY(0px);
		}
		50% {
			transform: translateY(-10px);
		}
	}
</style>

<script lang="ts">
	import { FileText } from 'lucide-svelte';
</script>

<svelte:head>
	<title>Terms of Service - Blue Balls</title>
</svelte:head>

<div class="min-h-screen p-4 py-8">
	<div class="max-w-4xl mx-auto">
		<div class="card">
			<h1 class="text-3xl font-bold mb-2 flex items-center gap-2">
				<FileText size={32} />
				Terms of Service
			</h1>
			<p class="text-sm dark:text-gray-300 mb-6">Last updated: {new Date().toLocaleDateString()}</p>

			<div class="space-y-6 dark:text-gray-300">
				<section>
					<h2 class="text-2xl font-bold mb-3 dark:text-white">1. Acceptance of Terms</h2>
					<p>
						Welcome to BlueBalls.lol ("Service," "we," "us," or "our"). By accessing or using our website and services, you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, please do not use our Service.
					</p>
				</section>

				<section>
					<h2 class="text-2xl font-bold mb-3 dark:text-white">2. Description of Service</h2>
					<p>
						BlueBalls.lol is an online gaming platform that provides browser-based games, leaderboards, social features, and subscription services. We reserve the right to modify, suspend, or discontinue any aspect of the Service at any time without notice.
					</p>
				</section>

				<section>
					<h2 class="text-2xl font-bold mb-3 dark:text-white">3. Eligibility</h2>
					<p class="mb-3">To use our Service, you must:</p>
					<ul class="list-disc list-inside space-y-1 ml-4">
						<li>Be at least 13 years of age</li>
						<li>Have the legal capacity to enter into a binding contract</li>
						<li>Not be prohibited from using the Service under applicable laws</li>
						<li>Provide accurate and complete registration information</li>
					</ul>
					<p class="mt-3">If you are under 18, you must have parental or guardian consent to use the Service.</p>
				</section>

				<section>
					<h2 class="text-2xl font-bold mb-3 dark:text-white">4. User Accounts</h2>

					<h3 class="text-xl font-semibold mb-2 dark:text-white">4.1 Account Creation</h3>
					<p class="mb-3">You may register for an account using:</p>
					<ul class="list-disc list-inside space-y-1 ml-4">
						<li>Email and password</li>
						<li>Google OAuth</li>
						<li>Discord OAuth</li>
					</ul>

					<h3 class="text-xl font-semibold mb-2 mt-4 dark:text-white">4.2 Account Security</h3>
					<p class="mb-3">You are responsible for:</p>
					<ul class="list-disc list-inside space-y-1 ml-4">
						<li>Maintaining the confidentiality of your account credentials</li>
						<li>All activities that occur under your account</li>
						<li>Notifying us immediately of any unauthorized access</li>
					</ul>

					<h3 class="text-xl font-semibold mb-2 mt-4 dark:text-white">4.3 Account Termination</h3>
					<p>We reserve the right to suspend or terminate your account if you violate these Terms or engage in fraudulent, abusive, or illegal activities.</p>
				</section>

				<section>
					<h2 class="text-2xl font-bold mb-3 dark:text-white">5. Acceptable Use Policy</h2>
					<p class="mb-3">You agree NOT to:</p>
					<ul class="list-disc list-inside space-y-1 ml-4">
						<li>Use the Service for any illegal purpose or in violation of any laws</li>
						<li>Harass, abuse, threaten, or intimidate other users</li>
						<li>Post or transmit offensive, vulgar, or inappropriate content</li>
						<li>Spam, advertise, or solicit other users</li>
						<li>Impersonate another person or entity</li>
						<li>Use automated tools (bots) to interact with the Service</li>
						<li>Exploit bugs or glitches for unfair advantage</li>
						<li>Attempt to hack, reverse engineer, or compromise the Service</li>
						<li>Distribute malware, viruses, or harmful code</li>
						<li>Scrape, data mine, or extract data from the Service</li>
						<li>Interfere with or disrupt the Service or servers</li>
					</ul>
				</section>

				<section>
					<h2 class="text-2xl font-bold mb-3 dark:text-white">6. User Content</h2>

					<h3 class="text-xl font-semibold mb-2 dark:text-white">6.1 Your Content</h3>
					<p>You retain ownership of content you post (profile information, chat messages, etc.). By posting content, you grant us a worldwide, non-exclusive, royalty-free license to use, display, and distribute your content in connection with the Service.</p>

					<h3 class="text-xl font-semibold mb-2 mt-4 dark:text-white">6.2 Content Standards</h3>
					<p class="mb-3">All user content must:</p>
					<ul class="list-disc list-inside space-y-1 ml-4">
						<li>Comply with applicable laws and regulations</li>
						<li>Be respectful and appropriate for all audiences</li>
						<li>Not infringe on intellectual property rights</li>
						<li>Not contain personal information of others without consent</li>
					</ul>

					<h3 class="text-xl font-semibold mb-2 mt-4 dark:text-white">6.3 Content Moderation</h3>
					<p>We reserve the right to review, remove, or modify any user content that violates these Terms without notice.</p>
				</section>

				<section>
					<h2 class="text-2xl font-bold mb-3 dark:text-white">7. Subscriptions and Payments</h2>

					<h3 class="text-xl font-semibold mb-2 dark:text-white">7.1 Membership Tiers</h3>
					<p class="mb-3">We offer the following membership tiers:</p>
					<ul class="list-disc list-inside space-y-1 ml-4">
						<li><strong>Free:</strong> Basic access with limited features</li>
						<li><strong>Mid Tier:</strong> Enhanced features including profile pictures and increased lives</li>
						<li><strong>Big Tier:</strong> Premium features with maximum lives and exclusive perks</li>
					</ul>

					<h3 class="text-xl font-semibold mb-2 mt-4 dark:text-white">7.2 Billing</h3>
					<p class="mb-3">By subscribing:</p>
					<ul class="list-disc list-inside space-y-1 ml-4">
						<li>You authorize us to charge your payment method (processed via Stripe)</li>
						<li>Subscriptions renew automatically unless cancelled</li>
						<li>Prices are subject to change with 30 days notice</li>
						<li>All payments are non-refundable except as required by law</li>
					</ul>

					<h3 class="text-xl font-semibold mb-2 mt-4 dark:text-white">7.3 Cancellation</h3>
					<p>You may cancel your subscription at any time through your account settings. Cancellation takes effect at the end of the current billing period.</p>
				</section>

				<section>
					<h2 class="text-2xl font-bold mb-3 dark:text-white">8. Affiliate Program</h2>
					<p class="mb-3">Our BB Club affiliate program allows users to earn commissions by referring new subscribers. By participating:</p>
					<ul class="list-disc list-inside space-y-1 ml-4">
						<li>You must comply with all advertising laws and regulations</li>
						<li>You may not use spam or deceptive marketing practices</li>
						<li>Commissions are paid according to our affiliate program terms</li>
						<li>We reserve the right to suspend affiliates for violations</li>
					</ul>
				</section>

				<section>
					<h2 class="text-2xl font-bold mb-3 dark:text-white">9. Intellectual Property</h2>

					<h3 class="text-xl font-semibold mb-2 dark:text-white">9.1 Our Rights</h3>
					<p>All content, features, and functionality of the Service (including but not limited to text, graphics, logos, game mechanics, and software) are owned by us or our licensors and are protected by copyright, trademark, and other intellectual property laws.</p>

					<h3 class="text-xl font-semibold mb-2 mt-4 dark:text-white">9.2 Limited License</h3>
					<p>We grant you a limited, non-exclusive, non-transferable license to access and use the Service for personal, non-commercial purposes.</p>
				</section>

				<section>
					<h2 class="text-2xl font-bold mb-3 dark:text-white">10. Virtual Items and Lives</h2>
					<p class="mb-3">The Service includes virtual items such as "lives" and points:</p>
					<ul class="list-disc list-inside space-y-1 ml-4">
						<li>Virtual items have no real-world monetary value</li>
						<li>Virtual items cannot be transferred, sold, or redeemed for cash</li>
						<li>We may modify, suspend, or remove virtual items at any time</li>
						<li>Virtual items are forfeited upon account termination</li>
					</ul>
				</section>

				<section>
					<h2 class="text-2xl font-bold mb-3 dark:text-white">11. Disclaimers</h2>
					<p class="mb-3">THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND. WE DISCLAIM ALL WARRANTIES, EXPRESS OR IMPLIED, INCLUDING:</p>
					<ul class="list-disc list-inside space-y-1 ml-4">
						<li>Warranties of merchantability and fitness for a particular purpose</li>
						<li>Warranties that the Service will be uninterrupted or error-free</li>
						<li>Warranties regarding the accuracy or reliability of content</li>
						<li>Warranties that the Service is free from viruses or harmful components</li>
					</ul>
				</section>

				<section>
					<h2 class="text-2xl font-bold mb-3 dark:text-white">12. Limitation of Liability</h2>
					<p class="mb-3">
						TO THE MAXIMUM EXTENT PERMITTED BY LAW, WE SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR REVENUES, WHETHER INCURRED DIRECTLY OR INDIRECTLY, OR ANY LOSS OF DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES RESULTING FROM:
					</p>
					<ul class="list-disc list-inside space-y-1 ml-4">
						<li>Your use or inability to use the Service</li>
						<li>Unauthorized access to your account or data</li>
						<li>Errors, bugs, or interruptions in the Service</li>
						<li>Content posted by other users</li>
						<li>Any other matter relating to the Service</li>
					</ul>
				</section>

				<section>
					<h2 class="text-2xl font-bold mb-3 dark:text-white">13. Indemnification</h2>
					<p>
						You agree to indemnify, defend, and hold harmless BlueBalls.lol, its officers, directors, employees, and agents from any claims, liabilities, damages, losses, and expenses arising out of or related to your use of the Service, violation of these Terms, or violation of any rights of another.
					</p>
				</section>

				<section>
					<h2 class="text-2xl font-bold mb-3 dark:text-white">14. Dispute Resolution</h2>

					<h3 class="text-xl font-semibold mb-2 dark:text-white">14.1 Informal Resolution</h3>
					<p>Before filing a claim, you agree to try to resolve disputes informally by contacting us at <a href="mailto:hello@blueballs.lol" class="text-primary dark:text-blue-400 hover:underline">hello@blueballs.lol</a>.</p>

					<h3 class="text-xl font-semibold mb-2 mt-4 dark:text-white">14.2 Governing Law</h3>
					<p>These Terms shall be governed by and construed in accordance with the laws of your jurisdiction, without regard to its conflict of law provisions.</p>
				</section>

				<section>
					<h2 class="text-2xl font-bold mb-3 dark:text-white">15. Changes to Terms</h2>
					<p>
						We reserve the right to modify these Terms at any time. We will provide notice of material changes by posting the new Terms on the Service and updating the "Last updated" date. Your continued use of the Service after changes constitutes acceptance of the modified Terms.
					</p>
				</section>

				<section>
					<h2 class="text-2xl font-bold mb-3 dark:text-white">16. Severability</h2>
					<p>
						If any provision of these Terms is found to be unenforceable or invalid, that provision shall be limited or eliminated to the minimum extent necessary, and the remaining provisions shall remain in full force and effect.
					</p>
				</section>

				<section>
					<h2 class="text-2xl font-bold mb-3 dark:text-white">17. Entire Agreement</h2>
					<p>
						These Terms, together with our Privacy Policy, constitute the entire agreement between you and BlueBalls.lol regarding the use of the Service and supersede all prior agreements.
					</p>
				</section>

				<section>
					<h2 class="text-2xl font-bold mb-3 dark:text-white">18. Contact Information</h2>
					<p class="mb-3">For questions about these Terms, please contact us:</p>
					<ul class="list-disc list-inside space-y-1 ml-4">
						<li>Email: <a href="mailto:hello@blueballs.lol" class="text-primary dark:text-blue-400 hover:underline">hello@blueballs.lol</a></li>
						<li>Website: <a href="https://blueballs.lol" class="text-primary dark:text-blue-400 hover:underline">https://blueballs.lol</a></li>
					</ul>
				</section>

				<div class="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg">
					<p class="text-sm">
						<strong>By using BlueBalls.lol, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.</strong>
					</p>
				</div>
			</div>
		</div>
	</div>
</div>

<script lang="ts">
	import { FileText } from 'lucide-svelte';
</script>

<svelte:head>
	<title>Privacy Policy - Blue Balls</title>
</svelte:head>

<div class="min-h-screen p-4 py-8">
	<div class="max-w-4xl mx-auto">
		<div class="card">
			<h1 class="text-3xl font-bold mb-2 flex items-center gap-2">
				<FileText size={32} />
				Privacy Policy
			</h1>
			<p class="text-sm dark:text-gray-300 mb-6">Last updated: {new Date().toLocaleDateString()}</p>

			<div class="space-y-6 dark:text-gray-300">
				<section>
					<h2 class="text-2xl font-bold mb-3 dark:text-white">1. Introduction</h2>
					<p>
						Welcome to BlueBalls.lol ("we," "our," or "us"). We are committed to protecting your privacy and ensuring you have a positive experience on our website. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website and use our services.
					</p>
				</section>

				<section>
					<h2 class="text-2xl font-bold mb-3 dark:text-white">2. Information We Collect</h2>

					<h3 class="text-xl font-semibold mb-2 dark:text-white">2.1 Personal Information</h3>
					<p class="mb-3">When you register for an account, we may collect:</p>
					<ul class="list-disc list-inside space-y-1 ml-4">
						<li>Email address</li>
						<li>Username</li>
						<li>Country/Region (detected automatically via IP address)</li>
						<li>Profile information (profile picture, social media links, bio)</li>
						<li>Payment information (processed securely through Stripe)</li>
					</ul>

					<h3 class="text-xl font-semibold mb-2 mt-4 dark:text-white">2.2 Usage Information</h3>
					<p class="mb-3">We automatically collect certain information when you use our services:</p>
					<ul class="list-disc list-inside space-y-1 ml-4">
						<li>Game scores and statistics</li>
						<li>Chat messages and interactions</li>
						<li>Device information (IP address, browser type, operating system)</li>
						<li>Log data (access times, pages viewed, links clicked)</li>
					</ul>

					<h3 class="text-xl font-semibold mb-2 mt-4 dark:text-white">2.3 Cookies and Tracking Technologies</h3>
					<p class="mb-3">We use cookies and similar tracking technologies to track activity on our service:</p>
					<ul class="list-disc list-inside space-y-1 ml-4">
						<li>Essential cookies for authentication and functionality</li>
						<li>Analytics cookies (Google Analytics) to understand usage patterns</li>
						<li>Preference cookies to remember your settings</li>
					</ul>
				</section>

				<section>
					<h2 class="text-2xl font-bold mb-3 dark:text-white">3. How We Use Your Information</h2>
					<p class="mb-3">We use the collected information for various purposes:</p>
					<ul class="list-disc list-inside space-y-1 ml-4">
						<li>To provide and maintain our gaming service</li>
						<li>To process your subscription payments</li>
						<li>To manage your account and provide customer support</li>
						<li>To send you notifications about your account and game activities</li>
						<li>To display leaderboards and rankings</li>
						<li>To enable social features (friends, chat, profiles)</li>
						<li>To analyze usage and improve our services</li>
						<li>To detect and prevent fraud or abuse</li>
						<li>To comply with legal obligations</li>
					</ul>
				</section>

				<section>
					<h2 class="text-2xl font-bold mb-3 dark:text-white">4. Information Sharing and Disclosure</h2>
					<p class="mb-3">We may share your information in the following situations:</p>

					<h3 class="text-xl font-semibold mb-2 dark:text-white">4.1 Public Information</h3>
					<p class="mb-3">The following information is publicly visible if your profile is set to public:</p>
					<ul class="list-disc list-inside space-y-1 ml-4">
						<li>Username</li>
						<li>Profile picture</li>
						<li>Game scores and rankings</li>
						<li>Bio/message to the world</li>
						<li>Social media links (if provided)</li>
					</ul>

					<h3 class="text-xl font-semibold mb-2 mt-4 dark:text-white">4.2 Service Providers</h3>
					<p class="mb-3">We use third-party service providers:</p>
					<ul class="list-disc list-inside space-y-1 ml-4">
						<li><strong>Supabase</strong> - Database and authentication</li>
						<li><strong>Stripe</strong> - Payment processing</li>
						<li><strong>Google Analytics</strong> - Website analytics</li>
						<li><strong>Cloudflare</strong> - Hosting and CDN services</li>
					</ul>

					<h3 class="text-xl font-semibold mb-2 mt-4 dark:text-white">4.3 Legal Requirements</h3>
					<p>We may disclose your information if required by law or in response to valid requests by public authorities.</p>
				</section>

				<section>
					<h2 class="text-2xl font-bold mb-3 dark:text-white">5. Data Security</h2>
					<p>
						We implement appropriate technical and organizational security measures to protect your personal information. However, no method of transmission over the Internet or electronic storage is 100% secure. We use:
					</p>
					<ul class="list-disc list-inside space-y-1 ml-4 mt-3">
						<li>HTTPS encryption for all data transmission</li>
						<li>Secure authentication protocols</li>
						<li>Regular security audits and updates</li>
						<li>Access controls and data encryption at rest</li>
					</ul>
				</section>

				<section>
					<h2 class="text-2xl font-bold mb-3 dark:text-white">6. Your Data Rights</h2>
					<p class="mb-3">You have the following rights regarding your personal information:</p>
					<ul class="list-disc list-inside space-y-1 ml-4">
						<li><strong>Access:</strong> Request a copy of your personal data</li>
						<li><strong>Correction:</strong> Update or correct your information in Settings</li>
						<li><strong>Deletion:</strong> Request deletion of your account and data</li>
						<li><strong>Objection:</strong> Object to certain data processing activities</li>
						<li><strong>Portability:</strong> Request your data in a portable format</li>
						<li><strong>Withdraw Consent:</strong> Withdraw consent for data processing</li>
					</ul>
					<p class="mt-3">To exercise these rights, contact us at <a href="mailto:hello@blueballs.lol" class="text-primary dark:text-blue-400 hover:underline">hello@blueballs.lol</a></p>
				</section>

				<section>
					<h2 class="text-2xl font-bold mb-3 dark:text-white">7. Data Retention</h2>
					<p>
						We retain your personal information for as long as your account is active or as needed to provide you services. If you request account deletion, we will delete or anonymize your personal information within 30 days, except where we are required to retain it for legal purposes.
					</p>
				</section>

				<section>
					<h2 class="text-2xl font-bold mb-3 dark:text-white">8. Children's Privacy</h2>
					<p>
						Our service is not directed to individuals under the age of 13. We do not knowingly collect personal information from children under 13. If you are a parent or guardian and believe your child has provided us with personal information, please contact us at <a href="mailto:hello@blueballs.lol" class="text-primary dark:text-blue-400 hover:underline">hello@blueballs.lol</a>.
					</p>
				</section>

				<section>
					<h2 class="text-2xl font-bold mb-3 dark:text-white">9. International Data Transfers</h2>
					<p>
						Your information may be transferred to and maintained on computers located outside of your country where data protection laws may differ. By using our service, you consent to such transfers.
					</p>
				</section>

				<section>
					<h2 class="text-2xl font-bold mb-3 dark:text-white">10. Third-Party Links</h2>
					<p>
						Our service may contain links to third-party websites. We are not responsible for the privacy practices of these external sites. We encourage you to read their privacy policies.
					</p>
				</section>

				<section>
					<h2 class="text-2xl font-bold mb-3 dark:text-white">11. Google Analytics</h2>
					<p>
						We use Google Analytics to analyze website usage. Google Analytics uses cookies to collect information such as how often users visit the site, what pages they visit, and what other sites they used prior to coming to our site. We use this information to improve our service. Google's ability to use and share information collected by Google Analytics is restricted by the Google Analytics Terms of Service and Google Privacy Policy.
					</p>
				</section>

				<section>
					<h2 class="text-2xl font-bold mb-3 dark:text-white">12. Changes to This Privacy Policy</h2>
					<p>
						We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date. You are advised to review this Privacy Policy periodically for any changes.
					</p>
				</section>

				<section>
					<h2 class="text-2xl font-bold mb-3 dark:text-white">13. Contact Us</h2>
					<p class="mb-3">If you have any questions about this Privacy Policy, please contact us:</p>
					<ul class="list-disc list-inside space-y-1 ml-4">
						<li>Email: <a href="mailto:hello@blueballs.lol" class="text-primary dark:text-blue-400 hover:underline">hello@blueballs.lol</a></li>
						<li>Website: <a href="https://blueballs.lol" class="text-primary dark:text-blue-400 hover:underline">https://blueballs.lol</a></li>
					</ul>
				</section>
			</div>
		</div>
	</div>
</div>

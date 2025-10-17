<script lang="ts">
	import { Search, X } from 'lucide-svelte';

	export let value: string = '';
	export let onSelect: (country: string) => void = () => {};

	let searchQuery = '';
	let isOpen = false;
	let dropdownRef: HTMLDivElement;

	// Complete list of all countries in the world
	const allCountries = [
		'Afghanistan', 'Albania', 'Algeria', 'Andorra', 'Angola', 'Antigua and Barbuda',
		'Argentina', 'Armenia', 'Australia', 'Austria', 'Azerbaijan', 'Bahamas',
		'Bahrain', 'Bangladesh', 'Barbados', 'Belarus', 'Belgium', 'Belize',
		'Benin', 'Bhutan', 'Bolivia', 'Bosnia and Herzegovina', 'Botswana', 'Brazil',
		'Brunei', 'Bulgaria', 'Burkina Faso', 'Burundi', 'Cabo Verde', 'Cambodia',
		'Cameroon', 'Canada', 'Central African Republic', 'Chad', 'Chile', 'China',
		'Colombia', 'Comoros', 'Congo', 'Costa Rica', 'Croatia', 'Cuba',
		'Cyprus', 'Czech Republic', 'Denmark', 'Djibouti', 'Dominica', 'Dominican Republic',
		'DR Congo', 'Ecuador', 'Egypt', 'El Salvador', 'Equatorial Guinea', 'Eritrea',
		'Estonia', 'Eswatini', 'Ethiopia', 'Fiji', 'Finland', 'France',
		'Gabon', 'Gambia', 'Georgia', 'Germany', 'Ghana', 'Greece',
		'Grenada', 'Guatemala', 'Guinea', 'Guinea-Bissau', 'Guyana', 'Haiti',
		'Honduras', 'Hungary', 'Iceland', 'India', 'Indonesia', 'Iran',
		'Iraq', 'Ireland', 'Israel', 'Italy', 'Ivory Coast', 'Jamaica',
		'Japan', 'Jordan', 'Kazakhstan', 'Kenya', 'Kiribati', 'Kosovo',
		'Kuwait', 'Kyrgyzstan', 'Laos', 'Latvia', 'Lebanon', 'Lesotho',
		'Liberia', 'Libya', 'Liechtenstein', 'Lithuania', 'Luxembourg', 'Madagascar',
		'Malawi', 'Malaysia', 'Maldives', 'Mali', 'Malta', 'Marshall Islands',
		'Mauritania', 'Mauritius', 'Mexico', 'Micronesia', 'Moldova', 'Monaco',
		'Mongolia', 'Montenegro', 'Morocco', 'Mozambique', 'Myanmar', 'Namibia',
		'Nauru', 'Nepal', 'Netherlands', 'New Zealand', 'Nicaragua', 'Niger',
		'Nigeria', 'North Korea', 'North Macedonia', 'Norway', 'Oman', 'Pakistan',
		'Palau', 'Palestine', 'Panama', 'Papua New Guinea', 'Paraguay', 'Peru',
		'Philippines', 'Poland', 'Portugal', 'Qatar', 'Romania', 'Russia',
		'Rwanda', 'Saint Kitts and Nevis', 'Saint Lucia', 'Saint Vincent and the Grenadines', 'Samoa', 'San Marino',
		'Sao Tome and Principe', 'Saudi Arabia', 'Senegal', 'Serbia', 'Seychelles', 'Sierra Leone',
		'Singapore', 'Slovakia', 'Slovenia', 'Solomon Islands', 'Somalia', 'South Africa',
		'South Korea', 'South Sudan', 'Spain', 'Sri Lanka', 'Sudan', 'Suriname',
		'Sweden', 'Switzerland', 'Syria', 'Taiwan', 'Tajikistan', 'Tanzania',
		'Thailand', 'Timor-Leste', 'Togo', 'Tonga', 'Trinidad and Tobago', 'Tunisia',
		'Turkey', 'Turkmenistan', 'Tuvalu', 'Uganda', 'Ukraine', 'United Arab Emirates',
		'United Kingdom', 'United States', 'Uruguay', 'Uzbekistan', 'Vanuatu', 'Vatican City',
		'Venezuela', 'Vietnam', 'Yemen', 'Zambia', 'Zimbabwe'
	];

	$: filteredCountries = allCountries.filter(country =>
		country.toLowerCase().includes(searchQuery.toLowerCase())
	);

	function selectCountry(country: string) {
		value = country;
		onSelect(country);
		isOpen = false;
		searchQuery = '';
	}

	function clearSelection() {
		value = '';
		onSelect('');
		searchQuery = '';
	}

	function handleClickOutside(event: MouseEvent) {
		if (dropdownRef && !dropdownRef.contains(event.target as Node)) {
			isOpen = false;
			searchQuery = '';
		}
	}

	$: if (typeof window !== 'undefined') {
		if (isOpen) {
			window.addEventListener('click', handleClickOutside);
		} else {
			window.removeEventListener('click', handleClickOutside);
		}
	}
</script>

<div class="country-select-container" bind:this={dropdownRef}>
	<!-- Selected Country Display / Search Input -->
	{#if !isOpen}
		<button
			type="button"
			on:click={() => isOpen = true}
			class="country-select-button"
		>
			<span class:text-gray-400={!value}>{value || 'Select a country'}</span>
			{#if value}
				<button
					type="button"
					on:click|stopPropagation={clearSelection}
					class="clear-button"
					aria-label="Clear selection"
				>
					<X size={18} />
				</button>
			{/if}
		</button>
	{:else}
		<div class="search-input-container">
			<Search size={20} class="search-icon" />
			<input
				type="text"
				bind:value={searchQuery}
				placeholder="Search countries..."
				class="search-input"
				autofocus
			/>
		</div>
	{/if}

	<!-- Dropdown List -->
	{#if isOpen}
		<div class="dropdown-list">
			{#if filteredCountries.length === 0}
				<div class="no-results">No countries found</div>
			{:else}
				{#each filteredCountries as country}
					<button
						type="button"
						on:click={() => selectCountry(country)}
						class="country-option"
						class:selected={value === country}
					>
						{country}
					</button>
				{/each}
			{/if}
		</div>
	{/if}
</div>

<style>
	.country-select-container {
		position: relative;
		width: 100%;
	}

	.country-select-button {
		width: 100%;
		padding: 0.5rem 1rem;
		border: 1px solid #d1d5db;
		border-radius: 0.5rem;
		background: white;
		text-align: left;
		cursor: pointer;
		transition: all 0.2s;
		display: flex;
		justify-content: space-between;
		align-items: center;
		font-size: 1rem;
	}

	:global(.dark) .country-select-button {
		background: #1f2937;
		border-color: #4b5563;
		color: white;
	}

	.country-select-button:hover {
		border-color: #E40078;
	}

	.country-select-button:focus {
		outline: none;
		ring: 2px;
		ring-color: #E40078;
	}

	.clear-button {
		padding: 0.25rem;
		border-radius: 50%;
		background: transparent;
		border: none;
		cursor: pointer;
		color: #6b7280;
		transition: all 0.2s;
	}

	.clear-button:hover {
		background: #f3f4f6;
		color: #E40078;
	}

	:global(.dark) .clear-button:hover {
		background: #374151;
	}

	.search-input-container {
		position: relative;
		width: 100%;
	}

	.search-icon {
		position: absolute;
		left: 1rem;
		top: 50%;
		transform: translateY(-50%);
		color: #9ca3af;
		pointer-events: none;
	}

	.search-input {
		width: 100%;
		padding: 0.5rem 1rem 0.5rem 3rem;
		border: 2px solid #E40078;
		border-radius: 0.5rem;
		background: white;
		font-size: 1rem;
		outline: none;
	}

	:global(.dark) .search-input {
		background: #1f2937;
		color: white;
	}

	.dropdown-list {
		position: absolute;
		top: calc(100% + 0.25rem);
		left: 0;
		right: 0;
		max-height: 300px;
		overflow-y: auto;
		background: white;
		border: 1px solid #d1d5db;
		border-radius: 0.5rem;
		box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
		z-index: 50;
	}

	:global(.dark) .dropdown-list {
		background: #1f2937;
		border-color: #4b5563;
	}

	.country-option {
		width: 100%;
		padding: 0.75rem 1rem;
		text-align: left;
		border: none;
		background: transparent;
		cursor: pointer;
		transition: background 0.2s;
		font-size: 1rem;
		color: inherit;
	}

	.country-option:hover {
		background: #f3f4f6;
	}

	:global(.dark) .country-option:hover {
		background: #374151;
	}

	.country-option.selected {
		background: #fce7f3;
		color: #E40078;
		font-weight: 600;
	}

	:global(.dark) .country-option.selected {
		background: rgba(228, 0, 120, 0.2);
	}

	.no-results {
		padding: 2rem 1rem;
		text-align: center;
		color: #9ca3af;
	}

	/* Custom scrollbar */
	.dropdown-list::-webkit-scrollbar {
		width: 8px;
	}

	.dropdown-list::-webkit-scrollbar-track {
		background: #f1f1f1;
		border-radius: 0 0.5rem 0.5rem 0;
	}

	:global(.dark) .dropdown-list::-webkit-scrollbar-track {
		background: #374151;
	}

	.dropdown-list::-webkit-scrollbar-thumb {
		background: #E40078;
		border-radius: 4px;
	}

	.dropdown-list::-webkit-scrollbar-thumb:hover {
		background: #c0006a;
	}
</style>

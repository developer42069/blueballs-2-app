<script lang="ts">
	import { Search, X, ChevronDown } from 'lucide-svelte';
	import { onMount, onDestroy } from 'svelte';

	export let value: string = '';
	export let onSelect: (country: string) => void = () => {};

	let searchQuery = '';
	let isOpen = false;
	let dropdownRef: HTMLDivElement;
	let searchInputRef: HTMLInputElement;

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

	function toggleDropdown() {
		isOpen = !isOpen;
		if (isOpen) {
			// Focus search input after dropdown opens
			setTimeout(() => searchInputRef?.focus(), 10);
		} else {
			searchQuery = '';
		}
	}

	function selectCountry(country: string) {
		value = country;
		onSelect(country);
		isOpen = false;
		searchQuery = '';
	}

	function clearSelection(event: Event) {
		event.stopPropagation();
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

	onMount(() => {
		document.addEventListener('click', handleClickOutside, true);
	});

	onDestroy(() => {
		document.removeEventListener('click', handleClickOutside, true);
	});
</script>

<div class="country-select-container" bind:this={dropdownRef}>
	<!-- Trigger Button -->
	<button
		type="button"
		on:click={toggleDropdown}
		class="country-select-button"
	>
		<span class:placeholder={!value}>{value || 'Select a country'}</span>
		<div class="button-icons">
			{#if value}
				<button
					type="button"
					on:click={clearSelection}
					class="clear-button"
					aria-label="Clear selection"
				>
					<X size={18} />
				</button>
			{/if}
			<ChevronDown size={20} class={isOpen ? 'chevron rotated' : 'chevron'} />
		</div>
	</button>

	<!-- Dropdown -->
	{#if isOpen}
		<div class="dropdown-panel">
			<!-- Search Input -->
			<div class="search-container">
				<Search size={18} class="search-icon" />
				<input
					bind:this={searchInputRef}
					type="text"
					bind:value={searchQuery}
					placeholder="Type to search..."
					class="search-input"
				/>
			</div>

			<!-- Country List -->
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
		padding: 0.75rem 1rem;
		border: 2px solid #4ec0ca;
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
		background: #2d2d2d;
		border-color: #4ec0ca;
		color: white;
	}

	.country-select-button:hover {
		border-color: #E40078;
		box-shadow: 0 0 0 2px rgba(228, 0, 120, 0.1);
	}

	.placeholder {
		color: #9ca3af;
	}

	.button-icons {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.clear-button {
		padding: 0.25rem;
		border-radius: 50%;
		background: transparent;
		border: none;
		cursor: pointer;
		color: #6b7280;
		transition: all 0.2s;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.clear-button:hover {
		background: rgba(228, 0, 120, 0.1);
		color: #E40078;
	}

	:global(.dark) .clear-button:hover {
		background: rgba(228, 0, 120, 0.2);
		color: #E40078;
	}

	.chevron {
		color: #6b7280;
		transition: transform 0.2s;
	}

	.chevron.rotated {
		transform: rotate(180deg);
	}

	.dropdown-panel {
		position: absolute;
		top: calc(100% + 0.5rem);
		left: 0;
		right: 0;
		background: white;
		border: 2px solid #4ec0ca;
		border-radius: 0.5rem;
		box-shadow: 0 10px 15px -3px rgba(78, 192, 202, 0.2), 0 4px 6px -2px rgba(78, 192, 202, 0.1);
		z-index: 1000;
		overflow: hidden;
	}

	:global(.dark) .dropdown-panel {
		background: #2d2d2d;
		border-color: #4ec0ca;
		box-shadow: 0 10px 15px -3px rgba(78, 192, 202, 0.3), 0 4px 6px -2px rgba(78, 192, 202, 0.2);
	}

	.search-container {
		position: relative;
		padding: 0.75rem;
		border-bottom: 1px solid #4ec0ca;
	}

	:global(.dark) .search-container {
		border-bottom-color: #4ec0ca;
	}

	.search-icon {
		position: absolute;
		left: 1.25rem;
		top: 50%;
		transform: translateY(-50%);
		color: #9ca3af;
		pointer-events: none;
	}

	.search-input {
		width: 100%;
		padding: 0.5rem 0.75rem 0.5rem 2.5rem;
		border: 1px solid #4ec0ca;
		border-radius: 0.375rem;
		background: white;
		font-size: 0.875rem;
		outline: none;
		transition: border-color 0.2s, box-shadow 0.2s;
	}

	.search-input:focus {
		border-color: #E40078;
		box-shadow: 0 0 0 2px rgba(228, 0, 120, 0.1);
	}

	:global(.dark) .search-input {
		background: #1a1a1a;
		border-color: #4ec0ca;
		color: white;
	}

	:global(.dark) .search-input:focus {
		box-shadow: 0 0 0 2px rgba(228, 0, 120, 0.2);
	}

	.dropdown-list {
		max-height: 300px;
		overflow-y: auto;
	}

	.country-option {
		width: 100%;
		padding: 0.75rem 1rem;
		text-align: left;
		border: none;
		background: transparent;
		cursor: pointer;
		transition: background 0.15s;
		font-size: 0.875rem;
		color: inherit;
		display: block;
	}

	.country-option:hover {
		background: rgba(78, 192, 202, 0.1);
	}

	:global(.dark) .country-option:hover {
		background: rgba(78, 192, 202, 0.15);
	}

	.country-option.selected {
		background: rgba(228, 0, 120, 0.15);
		color: #E40078;
		font-weight: 600;
	}

	:global(.dark) .country-option.selected {
		background: rgba(228, 0, 120, 0.25);
		color: #E40078;
	}

	.no-results {
		padding: 2rem 1rem;
		text-align: center;
		color: #9ca3af;
		font-size: 0.875rem;
	}

	/* Custom scrollbar */
	.dropdown-list::-webkit-scrollbar {
		width: 8px;
	}

	.dropdown-list::-webkit-scrollbar-track {
		background: rgba(78, 192, 202, 0.1);
	}

	:global(.dark) .dropdown-list::-webkit-scrollbar-track {
		background: rgba(78, 192, 202, 0.1);
	}

	.dropdown-list::-webkit-scrollbar-thumb {
		background: #4ec0ca;
		border-radius: 4px;
	}

	.dropdown-list::-webkit-scrollbar-thumb:hover {
		background: #E40078;
	}

	:global(.dark) .dropdown-list::-webkit-scrollbar-thumb {
		background: #4ec0ca;
	}

	:global(.dark) .dropdown-list::-webkit-scrollbar-thumb:hover {
		background: #E40078;
	}
</style>

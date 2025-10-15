export const REGIONS = {
	asia: 'Asia',
	europe: 'Europe',
	north_america: 'North America',
	south_america: 'South America',
	africa: 'Africa',
	oceania: 'Oceania'
} as const;

export const COUNTRY_TO_REGION: Record<string, keyof typeof REGIONS> = {
	// Asia
	CN: 'asia', JP: 'asia', IN: 'asia', KR: 'asia', TH: 'asia', VN: 'asia',
	PH: 'asia', MY: 'asia', SG: 'asia', ID: 'asia', PK: 'asia', BD: 'asia',
	// Europe
	GB: 'europe', DE: 'europe', FR: 'europe', IT: 'europe', ES: 'europe',
	NL: 'europe', SE: 'europe', NO: 'europe', PL: 'europe', RU: 'europe',
	// North America
	US: 'north_america', CA: 'north_america', MX: 'north_america',
	// South America
	BR: 'south_america', AR: 'south_america', CL: 'south_america',
	CO: 'south_america', PE: 'south_america', VE: 'south_america',
	// Africa
	ZA: 'africa', NG: 'africa', EG: 'africa', KE: 'africa', GH: 'africa',
	// Oceania
	AU: 'oceania', NZ: 'oceania', FJ: 'oceania', PG: 'oceania'
};

export function getRegionFromCountry(countryCode: string): keyof typeof REGIONS {
	return COUNTRY_TO_REGION[countryCode] || 'north_america';
}

export async function detectUserCountry(): Promise<string> {
	try {
		const response = await fetch('https://ipapi.co/json/');
		const data = await response.json();
		return data.country_code || 'US';
	} catch {
		return 'US';
	}
}

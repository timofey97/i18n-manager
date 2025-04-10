const axios = require('axios');
const { translate } = require('@vitalets/google-translate-api');
const { HttpProxyAgent } = require('http-proxy-agent');

/**
 * Fetches fresh HTTP proxies from proxy-list.download
 * @returns {Promise<string[]>} - Array of proxy addresses in format 'ip:port'
 */
async function getFreshProxies() {
	try {
		const res = await axios.get('https://www.proxy-list.download/api/v1/get?type=http');
		return res.data.split('\r\n').filter((p) => p && p.includes(':'));
	} catch (err) {
		console.error('❌ Failed to fetch proxy list:', err.message);
		return [];
	}
}

/**
 * Translates text to target language using Google Translate API with fresh proxies
 * @param {string} text - Text to translate
 * @param {string} targetLang - Target language code (e.g., 'es', 'fr')
 * @returns {Promise<string>} - Translated text
 * @throws {Error} - If all proxies fail or rate limit is exceeded
 */
async function translateText(text, targetLang) {
	const proxies = await getFreshProxies();

	if (proxies.length === 0) {
		throw new Error('No proxies available');
	}

	for (let i = 0; i < proxies.length; i++) {
		const proxy = proxies[i];
		try {
			const agent = new HttpProxyAgent(`http://${proxy}`);
			const result = await translate(text, {
				to: targetLang,
				fetchOptions: { agent }
			});
			return result.text;
		} catch (err) {
			if (err.name === 'TooManyRequestsError') {
				console.warn(`⚠️  Proxy ${proxy} rate-limited (429), trying next...`);
			} else {
				console.warn(`⚠️  Proxy ${proxy} failed: ${err.message}`);
			}
		}
	}

	throw new Error('All proxies failed or rate-limited');
}

/**
 * Recursively translates all string values in a nested object
 * @param {Object} obj - Object to translate
 * @param {string} targetLang - Target language code
 * @returns {Promise<Object>} - Translated object
 */
async function translateNestedObject(obj, targetLang) {
	const result = {};

	for (const [key, value] of Object.entries(obj)) {
		if (typeof value === 'string') {
			// Translate string values
			result[key] = await translateText(value, targetLang);
		} else if (typeof value === 'object' && value !== null) {
			if (Array.isArray(value)) {
				// Handle arrays
				result[key] = await translateArray(value, targetLang);
			} else {
				// Handle nested objects
				result[key] = await translateNestedObject(value, targetLang);
			}
		} else {
			// Keep non-string values as is
			result[key] = value;
		}
	}

	return result;
}

/**
 * Translates all string elements in an array
 * @param {Array} arr - Array to translate
 * @param {string} targetLang - Target language code
 * @returns {Promise<Array>} - Translated array
 */
async function translateArray(arr, targetLang) {
	return Promise.all(
		arr.map(async (item) => {
			if (typeof item === 'string') {
				// Translate string elements
				return await translateText(item, targetLang);
			} else if (typeof item === 'object' && item !== null) {
				if (Array.isArray(item)) {
					// Handle nested arrays
					return await translateArray(item, targetLang);
				} else {
					// Handle nested objects
					return await translateNestedObject(item, targetLang);
				}
			}
			// Keep non-string elements as is
			return item;
		})
	);
}

module.exports = {
	translateText,
	translateNestedObject,
	translateArray
};

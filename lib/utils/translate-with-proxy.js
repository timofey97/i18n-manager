const axios = require('axios');
const { translate } = require('@vitalets/google-translate-api');
const { HttpProxyAgent } = require('http-proxy-agent');
const cliProgress = require('cli-progress');

let isPortReachable;
let workingProxy = null; // Сохраняем рабочий прокси
const progressBar = new cliProgress.SingleBar({
	format: 'Translating |{bar}| {percentage}%',
	barCompleteChar: '\u2588',
	barIncompleteChar: '\u2591',
	hideCursor: true
});

// Динамический импорт ES модуля
import('is-port-reachable').then((module) => {
	isPortReachable = module.default;
});

/**
 * Fetches fresh HTTP proxies from multiple sources
 * @returns {Promise<string[]>} - Array of proxy addresses
 */
async function getFreshProxies() {
	const proxySources = ['https://api.proxyscrape.com/v4/free-proxy-list/get?request=display_proxies&proxy_format=protocolipport&format=text', 'https://raw.githubusercontent.com/TheSpeedX/PROXY-List/master/http.txt', 'https://raw.githubusercontent.com/ShiftyTR/Proxy-List/master/http.txt', 'https://raw.githubusercontent.com/monosans/proxy-list/main/proxies/http.txt'];

	const allProxies = new Set();

	for (const source of proxySources) {
		try {
			// console.log(`📥 Fetching proxies from ${source}`);
			const response = await fetch(source);
			const text = await response.text();
			const proxies = text
				.split('\n')
				.map((line) => line.trim())
				.filter((line) => line && line.startsWith('http://'))
				.map((line) => line.replace('http://', ''));

			proxies.forEach((proxy) => allProxies.add(proxy));
			// console.log(`✅ Found ${proxies.length} proxies`);
		} catch (error) {
			// console.warn(`⚠️  Failed to fetch proxies from ${source}: ${error.message}`);
		}
	}

	return Array.from(allProxies);
}

/**
 * Checks if a proxy is reachable
 * @param {string} proxy - Proxy address in format 'ip:port'
 * @returns {Promise<boolean>} - Whether the proxy is reachable
 */
async function isProxyReachable(proxy) {
	try {
		const agent = new HttpProxyAgent(`http://${proxy}`);
		const response = await fetch('https://translate.google.com', {
			agent,
			timeout: 5000
		});
		return response.ok;
	} catch (error) {
		return false;
	}
}

/**
 * Finds the first working proxy from the list
 * @returns {Promise<string|null>} - Working proxy address or null if none found
 */
async function findWorkingProxy() {
	const proxies = await getFreshProxies();

	for (const proxy of proxies) {
		if (await isProxyReachable(proxy)) {
			return proxy;
		}
	}

	return null;
}

/**
 * Translates text using Google Translate API, first without proxy, then with proxy if needed
 * @param {string} text - Text to translate
 * @param {string} targetLang - Target language code (e.g., 'es', 'fr')
 * @param {number} current - Current translation number
 * @param {number} total - Total number of translations
 * @returns {Promise<string>} - Translated text
 */
async function translateText(text, targetLang, current = 1, total = 1) {
	// Обновляем прогресс

	progressBar.update(current, { total });

	// Сначала пробуем без прокси
	try {
		const result = await translate(text, { to: targetLang });
		return result.text;
	} catch (err) {
		// console.warn('⚠️  Error without proxy, switching to proxy...');

		// Используем сохраненный рабочий прокси или ищем новый
		if (!workingProxy) {
			workingProxy = await findWorkingProxy();
		}

		if (!workingProxy) {
			throw new Error('❌ No working proxies available');
		}

		try {
			const agent = new HttpProxyAgent(`http://${workingProxy}`);
			const result = await translate(text, {
				to: targetLang,
				fetchOptions: { agent }
			});
			return result.text;
		} catch (proxyErr) {
			// При любой ошибке пробуем другой прокси
			// console.warn(`⚠️  Proxy ${workingProxy} failed with error: ${proxyErr.message}, searching for new one...`);
			workingProxy = null;
			return translateText(text, targetLang, current, total); // Рекурсивно пробуем снова
		}
	}
}

/**
 * Recursively translates all string values in a nested object
 * @param {Object} obj - Object to translate
 * @param {string} targetLang - Target language code
 * @param {number} current - Current translation number
 * @param {number} total - Total number of translations
 * @returns {Promise<Object>} - Translated object
 */
async function translateNestedObject(obj, targetLang, current = 1, total = 1) {
	// Запускаем прогресс-бар
	progressBar.start(total, 0);

	const result = {};
	let translationCount = 0;

	for (const [key, value] of Object.entries(obj)) {
		if (typeof value === 'string') {
			translationCount++;
			result[key] = await translateText(value, targetLang, translationCount, total);
		} else if (typeof value === 'object' && value !== null) {
			if (Array.isArray(value)) {
				result[key] = await translateArray(value, targetLang, translationCount, total);
			} else {
				result[key] = await translateNestedObject(value, targetLang, translationCount, total);
			}
		} else {
			result[key] = value;
		}
	}

	// Останавливаем прогресс-бар
	progressBar.stop();
	return result;
}

/**
 * Translates all string elements in an array
 * @param {Array} arr - Array to translate
 * @param {string} targetLang - Target language code
 * @param {number} current - Current translation number
 * @param {number} total - Total number of translations
 * @returns {Promise<Array>} - Translated array
 */
async function translateArray(arr, targetLang, current = 1, total = 1) {
	let translationCount = 0;
	const result = await Promise.all(
		arr.map(async (item) => {
			if (typeof item === 'string') {
				translationCount++;
				return await translateText(item, targetLang, translationCount, total);
			} else if (typeof item === 'object' && item !== null) {
				if (Array.isArray(item)) {
					return await translateArray(item, targetLang, translationCount, total);
				} else {
					return await translateNestedObject(item, targetLang, translationCount, total);
				}
			}
			return item;
		})
	);
	return result;
}

module.exports = {
	translateText,
	translateNestedObject,
	translateArray
};

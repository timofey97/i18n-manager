const { spawn } = require('child_process');
const path = require('path');

const translatorPath = path.join(__dirname, 'translator');

/**
 * Counts the total number of strings to translate in an object
 * @param {Object} obj - Object to count
 * @returns {number} - Total number of strings
 */
function countStrings(obj) {
	let count = 0;
	if (typeof obj === 'string') {
		return 1;
	}
	if (Array.isArray(obj)) {
		return obj.reduce((sum, item) => sum + countStrings(item), 0);
	}
	if (typeof obj === 'object' && obj !== null) {
		return Object.values(obj).reduce((sum, value) => sum + countStrings(value), 0);
	}
	return count;
}

/**
 * Translates text using Go library
 * @param {string} text - Text to translate
 * @param {string} targetLang - Target language
 * @returns {Promise<string>} - Translated text
 */
async function translateText(text, targetLang) {
	return new Promise((resolve, reject) => {
		const child = spawn(translatorPath);

		const input = JSON.stringify({ text, to: targetLang });
		let output = '';

		child.stdout.on('data', (data) => {
			output += data.toString();
		});

		child.stderr.on('data', (err) => {
			console.error('⚠️ stderr:', err.toString());
		});

		child.on('error', reject);

		child.on('close', () => {
			try {
				const result = JSON.parse(output);
				if (result.status) {
					resolve(result.translatedText);
				} else {
					reject(new Error(result.message || 'Translation failed'));
				}
			} catch (e) {
				reject(new Error('Failed to parse Go output'));
			}
		});

		child.stdin.write(input);
		child.stdin.end();
	});
}

/**
 * Recursively translates all string values in an object
 * @param {Object} obj - Object to translate
 * @param {string} targetLang - Target language
 * @returns {Promise<Object>} - Translated object
 */
async function translateNestedObject(obj, targetLang) {
	const result = {};
	for (const [key, value] of Object.entries(obj)) {
		if (typeof value === 'string') {
			result[key] = await translateText(value, targetLang);
		} else if (typeof value === 'object' && value !== null) {
			if (Array.isArray(value)) {
				result[key] = await translateArray(value, targetLang);
			} else {
				result[key] = await translateNestedObject(value, targetLang);
			}
		} else {
			result[key] = value;
		}
	}
	return result;
}

/**
 * Translates all string elements in an array
 * @param {Array} arr - Array to translate
 * @param {string} targetLang - Target language
 * @returns {Promise<Array>} - Translated array
 */
async function translateArray(arr, targetLang) {
	const result = await Promise.all(
		arr.map(async (item) => {
			if (typeof item === 'string') {
				return await translateText(item, targetLang);
			} else if (typeof item === 'object' && item !== null) {
				if (Array.isArray(item)) {
					return await translateArray(item, targetLang);
				} else {
					return await translateNestedObject(item, targetLang);
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
	translateArray,
	countStrings
};

const { translate } = require('@vitalets/google-translate-api');

/**
 * Переводит текст на указанный язык
 * @param {string} text - Текст для перевода
 * @param {string} targetLang - Целевой язык (двухбуквенный код)
 * @returns {Promise<string>} - Переведенный текст
 */
async function translateText(text, targetLang) {
	try {
		const result = await translate(text, { to: targetLang });
		return result.text;
	} catch (error) {
		throw new Error(`Translation failed: ${error.message}`);
	}
}

/**
 * Рекурсивно переводит все строковые значения в объекте
 * @param {Object} obj - Объект для перевода
 * @param {string} targetLang - Целевой язык (двухбуквенный код)
 * @returns {Promise<Object>} - Переведенный объект
 */
async function translateNestedObject(obj, targetLang) {
	const result = {};

	for (const [key, value] of Object.entries(obj)) {
		if (typeof value === 'string') {
			// Переводим строковое значение
			result[key] = await translateText(value, targetLang);
		} else if (value && typeof value === 'object' && !Array.isArray(value)) {
			// Рекурсивно обрабатываем вложенный объект
			result[key] = await translateNestedObject(value, targetLang);
		} else if (Array.isArray(value)) {
			// Обрабатываем массив
			result[key] = await translateArray(value, targetLang);
		} else {
			// Для других типов данных просто копируем значение
			result[key] = value;
		}
	}

	return result;
}

/**
 * Переводит все элементы массива
 * @param {Array} arr - Массив для перевода
 * @param {string} targetLang - Целевой язык (двухбуквенный код)
 * @returns {Promise<Array>} - Переведенный массив
 */
async function translateArray(arr, targetLang) {
	const result = [];

	for (const item of arr) {
		if (typeof item === 'string') {
			// Переводим строковое значение
			result.push(await translateText(item, targetLang));
		} else if (item && typeof item === 'object' && !Array.isArray(item)) {
			// Рекурсивно обрабатываем вложенный объект
			result.push(await translateNestedObject(item, targetLang));
		} else if (Array.isArray(item)) {
			// Рекурсивно обрабатываем вложенный массив
			result.push(await translateArray(item, targetLang));
		} else {
			// Для других типов данных просто копируем значение
			result.push(item);
		}
	}

	return result;
}

module.exports = {
	translateText,
	translateNestedObject,
	translateArray
};

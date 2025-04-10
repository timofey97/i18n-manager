const { translateText, translateNestedObject } = require('./lib/utils/translate-with-proxy');

async function testTranslation() {
	try {
		// Тест простого перевода
		console.log('🔍 Testing simple translation...');
		const simpleText = 'Hello, world!';
		const translatedSimple = await translateText(simpleText, 'fr');
		console.log(`✅ Simple translation: "${simpleText}" -> "${translatedSimple}"\n`);

		// Тест вложенного объекта
		console.log('🔍 Testing nested object translation...');
		const nestedObject = {
			greeting: 'Hello',
			user: {
				name: 'John',
				messages: ['Welcome', 'Good morning']
			}
		};
		const translatedNested = await translateNestedObject(nestedObject, 'es');
		console.log('✅ Nested object translation:');
		console.log(JSON.stringify(translatedNested, null, 2));
	} catch (error) {
		console.error('❌ Test failed:', error.message);
	}
}

// Запуск теста
testTranslation();

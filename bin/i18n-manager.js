#!/usr/bin/env node

const { program } = require('commander');
const { createLanguageFile } = require('../lib/create-lang');
const { syncTranslations } = require('../lib/sync');
const { checkTranslations } = require('../lib/check');

program.name('i18n-manager').description('A powerful i18n management tool for handling translations').version('1.0.0').option('-p, --path <path>', 'Path to translations directory', 'src/assets/i18n').option('-b, --base-lang <lang>', 'Base language code', 'en');

program
	.command('create')
	.description('Create a new language file')
	.argument('<langCode>', 'Two-letter language code (e.g., fr, pl, id)')
	.action((langCode, options) => {
		const path = options.parent ? options.parent.path : 'src/assets/i18n';
		const baseLang = options.parent ? options.parent.baseLang : 'en';
		createLanguageFile(langCode, path, baseLang);
	});

program
	.command('sync')
	.description('Sync missing translations with base language')
	.action((options) => {
		const path = options.parent ? options.parent.path : 'src/assets/i18n';
		const baseLang = options.parent ? options.parent.baseLang : 'en';
		syncTranslations(path, baseLang);
	});

program
	.command('check')
	.description('Check for missing translations')
	.action((options) => {
		const path = options.parent ? options.parent.path : 'src/assets/i18n';
		const baseLang = options.parent ? options.parent.baseLang : 'en';
		checkTranslations(path, baseLang);
	});

program.parse(); 
#!/usr/bin/env node

const { program } = require('commander');
const { createLanguageFile } = require('../lib/create-lang');
const { syncTranslations } = require('../lib/sync');
const { checkTranslations } = require('../lib/check');
const { transformTranslations } = require('../lib/transform');
const path = require('path');

program.name('i18n-manager').description('A powerful i18n management tool for handling translations').version('1.0.0').option('-p, --path <path>', 'Path to translations directory', 'src/assets/i18n').option('-b, --base-lang <lang>', 'Base language code', 'en');

program
	.command('create')
	.description('Create a new language file')
	.argument('<langCode>', 'Two-letter language code (e.g., fr, pl, id)')
	.option('-p, --path <path>', 'Path to translations directory', 'i18n')
	.option('-b, --base-lang <lang>', 'Base language code', 'en')
	.action((langCode, options) => {
		createLanguageFile(langCode, options.path, options.baseLang);
	});

program
	.command('sync')
	.description('Sync missing translations with base language')
	.action(() => {
		const opts = program.opts();
		const translationsPath = opts.path || 'src/assets/i18n';
		const baseLang = opts.baseLang || 'en';
		syncTranslations(translationsPath, baseLang);
	});

program
	.command('check')
	.description('Check for missing translations')
	.action(() => {
		console.log('🚀 ~ .action ~ options:', program.opts());
		const opts = program.opts();
		const translationsPath = opts.path || 'src/assets/i18n';
		const baseLang = opts.baseLang || 'en';
		checkTranslations(translationsPath, baseLang);
	});

program
	.command('transform')
	.description('Transform flat translation structure to nested format')
	.option('-p, --path <path>', 'Path to translations directory', 'i18n')
	.option('-l, --lang <lang>', 'Language code to transform (e.g., en, ru). If not specified, all languages will be transformed')
	.action((options) => {
		transformTranslations(options.path, options.lang);
	});

program.parse(); 
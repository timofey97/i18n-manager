# i18n-manager

A powerful tool for managing translations in your project.

## Installation

### Global Installation

```bash
npm install -g @msomsina/i18n-manager
```

### Local Installation

```bash
npm install @msomsina/i18n-manager
```

## Usage

### Global Usage

After global installation, you can use the tool from anywhere:

```bash
i18n-manager <command> [options]
```

### Local Usage

After local installation, you can use the tool in your project:

```bash
npx i18n-manager <command> [options]
```

### Global Options

- `-p, --path <path>` - Path to translations directory (default: "src/assets/i18n")
- `-b, --base-lang <lang>` - Base language code (default: "en")

### Commands

#### Create New Language

```bash
i18n-manager create <language-code> [--path <path>] [--base-lang <lang>]
```

Example:
```bash
# Using default path and base language (src/assets/i18n, en)
i18n-manager create fr

# Using custom path
i18n-manager create fr --path src/assets/i18n

# Using custom base language
i18n-manager create fr --base-lang ru
```

This will create a new translation file `fr.json` with the same structure as your base language file.

#### Sync Translations

```bash
i18n-manager sync [--path <path>] [--base-lang <lang>]
```

Example:
```bash
# Using default path and base language
i18n-manager sync

# Using custom path
i18n-manager sync --path src/assets/i18n

# Using custom base language
i18n-manager sync --base-lang de
```

This will sync all missing translations with the base language file.

#### Check Translations

```bash
i18n-manager check [--path <path>] [--base-lang <lang>]
```

Example:
```bash
# Using default path and base language
i18n-manager check

# Using custom path
i18n-manager check --path src/assets/i18n

# Using custom base language
i18n-manager check --base-lang es
```

This will check for missing translations in all language files.

## License

MIT 
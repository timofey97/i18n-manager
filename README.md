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

### Commands

#### Initialize Translations

```bash
i18n-manager init
```

This command creates a new translations directory with the following structure:
```
translations/
├── en.json
├── ru.json
└── index.js
```

#### Add New Language

```bash
i18n-manager add <language-code>
```

Example:
```bash
i18n-manager add fr
```

This will create a new translation file `fr.json` with the same structure as your base language file.

#### Add New Key

```bash
i18n-manager add-key <key> <value>
```

Example:
```bash
i18n-manager add-key "welcome.message" "Welcome to our app!"
```

This will add the new key to all language files.

#### Update Key

```bash
i18n-manager update <key> <value>
```

Example:
```bash
i18n-manager update "welcome.message" "Welcome to our amazing app!"
```

This will update the key in all language files.

#### Remove Key

```bash
i18n-manager remove <key>
```

Example:
```bash
i18n-manager remove "welcome.message"
```

This will remove the key from all language files.

#### Custom Translations Directory

You can specify a custom directory for your translations:

```bash
i18n-manager init --dir ./my-translations
```

All subsequent commands will use this directory:

```bash
i18n-manager add-key "welcome.message" "Welcome!" --dir ./my-translations
```

## License

MIT 
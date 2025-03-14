# HTML to JSON Converter

A utility for converting HTML content in CSV files to a specific JSON format.

## Features

- Converts HTML content to a structured JSON format
- Preserves text formatting (italic, bold, underline, etc.)
- Supports lists, paragraphs, and headings
- Processes single files or batches of CSV files
- Handles large files with streaming mode
- Command-line interface for easy use

## Installation

1. Clone this repository:
   ```
   git clone https://github.com/YOUR-USERNAME/html-to-json-converter.git
   cd html-to-json-converter
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. (Optional) Install globally:
   ```
   npm install -g .
   ```

## Usage

### Processing a Single CSV File

```bash
node index.js csv --input products.csv --output converted.csv --column "Body HTML"
```

Options:
- `--input, -i`: Input CSV file path (required)
- `--output, -o`: Output CSV file path (required)
- `--column, -c`: Name of the column containing HTML (default: "Body HTML")
- `--stream, -s`: Use streaming for large files (boolean)

### Converting a Single HTML String

```bash
node index.js convert --html "<p>Hello <em>world</em></p>"
```

Options:
- `--html`: HTML string to convert
- `--input, -i`: HTML file to convert (alternative to --html)
- `--output, -o`: Output file path (optional, defaults to stdout)

### Processing Multiple CSV Files

```bash
node index.js batch --pattern "data/*.csv" --output-dir converted-data
```

Options:
- `--pattern, -p`: Glob pattern for input files (required)
- `--output-dir, -d`: Output directory (required)
- `--column, -c`: Name of the column containing HTML (default: "Body HTML")

## JSON Format

The converter transforms HTML into a structured JSON format with the following schema:

```json
{
  "type": "root",
  "children": [
    {
      "type": "paragraph",
      "children": [
        {
          "type": "text",
          "value": "Regular text"
        },
        {
          "type": "text",
          "value": "Italic text",
          "italic": true
        }
      ]
    }
  ]
}
```

## Supported HTML Elements

- Paragraphs (`<p>`)
- Formatted text:
  - Italic: `<em>`, `<i>`
  - Bold: `<strong>`, `<b>`
  - Underline: `<u>`
  - Strikethrough: `<strike>`, `<s>`, `<del>`
  - Code: `<code>`
  - Highlight: `<mark>`
  - Small: `<small>`
  - Subscript: `<sub>`
  - Superscript: `<sup>`
- Lists:
  - Unordered lists: `<ul>`
  - Ordered lists: `<ol>`
  - List items: `<li>`
- Headings: `<h1>` through `<h6>`

## API

You can also use the converter programmatically:

```javascript
const converter = require('./html-to-json-converter');

// Convert HTML string to JSON
const htmlString = '<p>Hello <em>world</em></p>';
const jsonOutput = converter.htmlToJson(htmlString);

// Convert HTML string to JSON string
const jsonString = converter.htmlToJsonString(htmlString);

// Process a CSV file
converter.processCSV('input.csv', 'output.csv', 'HTML Column');

// Batch process multiple files
converter.batchProcessCSV('data/*.csv', 'output-dir', 'HTML Column');

// Stream process a large CSV file
await converter.streamProcessCSV('large-file.csv', 'output.csv', 'HTML Column');
```

## License

MIT
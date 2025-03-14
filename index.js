#!/usr/bin/env node

/**
 * HTML to JSON Converter - Entry Point
 * 
 * This file serves as the main entry point for the HTML to JSON converter.
 * It processes CSV files, converting HTML content in specified columns to JSON format.
 * 
 * Usage:
 * 1. Process a single CSV file:
 *    node index.js csv --input products.csv --output converted.csv --column "Body HTML"
 * 
 * 2. Convert a single HTML string:
 *    node index.js convert --html "<p>Hello <em>world</em></p>"
 * 
 * 3. Process multiple CSV files:
 *    node index.js batch --pattern "data/*.csv" --output-dir converted-data --column "Body HTML"
 */

const converter = require('./html-to-json-converter');

// Run the CLI
converter.main();
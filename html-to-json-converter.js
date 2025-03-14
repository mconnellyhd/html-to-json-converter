/**
 * HTML to JSON Conversion Solution
 * 
 * A comprehensive solution for converting HTML content in CSV files to a specific JSON format.
 * 
 * This solution includes:
 * 1. HTML to JSON converter
 * 2. CSV processor
 * 3. Command-line interface
 * 
 * Supported HTML elements:
 * - Paragraphs (<p>)
 * - Formatted text (italic, bold, underline, etc.)
 * - Lists (ordered and unordered)
 * - Headings (h1-h6)
 * 
 * Usage:
 * 1. Process a single CSV file:
 *    node index.js --input products.csv --output converted.csv --column "Body HTML"
 * 
 * 2. Convert a single HTML string:
 *    node index.js --convert "<p>Hello <em>world</em></p>"
 * 
 * 3. Process multiple CSV files:
 *    node index.js --batch "data/*.csv" --output-dir converted-data --column "Body HTML"
 */

const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');
const { stringify } = require('csv-stringify/sync');

/**
 * Convert HTML to a specific JSON format
 * @param {string} htmlString - The HTML content to convert
 * @return {Object} - The converted JSON structure
 */
function htmlToJson(htmlString) {
  // Create the root structure
  const result = {
    type: "root",
    children: []
  };
  
  try {
    // Process paragraphs
    const paragraphRegex = /<p(?:\s[^>]*)?>([\s\S]*?)<\/p>/g;
    let match;
    
    while ((match = paragraphRegex.exec(htmlString)) !== null) {
      const paragraphContent = match[1];
      const paragraph = {
        type: "paragraph",
        children: []
      };
      
      // Handle empty paragraphs or those with just a BR tag
      if (!paragraphContent.trim() || paragraphContent.trim() === '<br>') {
        paragraph.children.push({
          type: "text",
          value: " "
        });
      } else {
        // Parse the content with formatting
        parseFormattedContent(paragraphContent, paragraph.children);
      }
      
      result.children.push(paragraph);
    }
    
    // Process lists
    processLists(htmlString, result);
    
    // Process headings
    processHeadings(htmlString, result);
    
  } catch (error) {
    console.error('Error parsing HTML:', error);
  }
  
  return result;
}

/**
 * Process lists from HTML string and add them to the result
 * @param {string} htmlString - HTML content
 * @param {Object} result - Result object to add lists to
 */
function processLists(htmlString, result) {
  // Process unordered lists
  const ulRegex = /<ul(?:\s[^>]*)?>([\s\S]*?)<\/ul>/g;
  let match;
  
  while ((match = ulRegex.exec(htmlString)) !== null) {
    const listContent = match[1];
    const list = {
      type: "list",
      listType: "unordered",
      children: []
    };
    
    // Extract list items
    processListItems(listContent, list);
    
    result.children.push(list);
  }
  
  // Process ordered lists
  const olRegex = /<ol(?:\s[^>]*)?>([\s\S]*?)<\/ol>/g;
  while ((match = olRegex.exec(htmlString)) !== null) {
    const listContent = match[1];
    const list = {
      type: "list",
      listType: "ordered",
      children: []
    };
    
    // Extract list items
    processListItems(listContent, list);
    
    result.children.push(list);
  }
}

/**
 * Process list items and add them to the list
 * @param {string} listContent - Content of the list
 * @param {Object} list - List object to add items to
 */
function processListItems(listContent, list) {
  const listItemRegex = /<li(?:\s[^>]*)?>([\s\S]*?)<\/li>/g;
  let itemMatch;
  
  while ((itemMatch = listItemRegex.exec(listContent)) !== null) {
    const itemContent = itemMatch[1];
    const listItem = {
      type: "listItem",
      children: []
    };
    
    parseFormattedContent(itemContent, listItem.children);
    list.children.push(listItem);
  }
}

/**
 * Process headings from HTML string and add them to the result
 * @param {string} htmlString - HTML content
 * @param {Object} result - Result object to add headings to
 */
function processHeadings(htmlString, result) {
  // Process h1-h6 tags
  for (let level = 1; level <= 6; level++) {
    const headingRegex = new RegExp(`<h${level}(?:\\s[^>]*)?>([\\\s\\\S]*?)<\\/h${level}>`, 'g');
    let match;
    
    while ((match = headingRegex.exec(htmlString)) !== null) {
      const headingContent = match[1];
      const heading = {
        type: "heading",
        level: level,
        children: []
      };
      
      parseFormattedContent(headingContent, heading.children);
      result.children.push(heading);
    }
  }
}

/**
 * Parse HTML content with formatting elements and add to children array
 * @param {string} content - HTML content to parse
 * @param {Array} childrenArray - Array to add parsed content to
 */
function parseFormattedContent(content, childrenArray) {
  // Process all formatting tags in the content
  const formattingTags = [
    { start: '<em>', end: '</em>', attr: 'italic' },
    { start: '<i>', end: '</i>', attr: 'italic' },
    { start: '<strong>', end: '</strong>', attr: 'bold' },
    { start: '<b>', end: '</b>', attr: 'bold' },
    { start: '<u>', end: '</u>', attr: 'underline' },
    { start: '<strike>', end: '</strike>', attr: 'strikethrough' },
    { start: '<s>', end: '</s>', attr: 'strikethrough' },
    { start: '<del>', end: '</del>', attr: 'strikethrough' },
    { start: '<code>', end: '</code>', attr: 'code' },
    { start: '<mark>', end: '</mark>', attr: 'highlight' },
    { start: '<small>', end: '</small>', attr: 'small' },
    { start: '<sub>', end: '</sub>', attr: 'subscript' },
    { start: '<sup>', end: '</sup>', attr: 'superscript' }
  ];
  
  // Find all tag positions in the content
  const tagPositions = [];
  
  formattingTags.forEach(tag => {
    let startIndex = 0;
    while ((startIndex = content.indexOf(tag.start, startIndex)) !== -1) {
      const endIndex = content.indexOf(tag.end, startIndex + tag.start.length);
      if (endIndex === -1) break;
      
      tagPositions.push({
        start: startIndex,
        end: endIndex + tag.end.length,
        contentStart: startIndex + tag.start.length,
        contentEnd: endIndex,
        attr: tag.attr
      });
      
      startIndex = endIndex + tag.end.length;
    }
  });
  
  // If no formatting tags, add the content as is
  if (tagPositions.length === 0) {
    childrenArray.push({
      type: "text",
      value: content
    });
    return;
  }
  
  // Sort positions by start index
  tagPositions.sort((a, b) => a.start - b.start);
  
  // Process content with tags
  let lastIndex = 0;
  
  for (const pos of tagPositions) {
    // Add text before the tag if any
    if (pos.start > lastIndex) {
      const textBefore = content.substring(lastIndex, pos.start);
      if (textBefore) {
        childrenArray.push({
          type: "text",
          value: textBefore
        });
      }
    }
    
    // Add the formatted text
    const formattedText = content.substring(pos.contentStart, pos.contentEnd);
    const textNode = {
      type: "text",
      value: formattedText
    };
    textNode[pos.attr] = true;
    
    childrenArray.push(textNode);
    
    // Update lastIndex
    lastIndex = pos.end;
  }
  
  // Add any remaining text
  if (lastIndex < content.length) {
    const textAfter = content.substring(lastIndex);
    if (textAfter) {
      childrenArray.push({
        type: "text",
        value: textAfter
      });
    }
  }
}

/**
 * Convert HTML string to JSON string
 * @param {string} htmlString - HTML string to convert
 * @return {string} JSON string
 */
function htmlToJsonString(htmlString) {
  const jsonOutput = htmlToJson(htmlString);
  return JSON.stringify(jsonOutput);
}

/**
 * Process a CSV file, converting HTML columns to JSON
 * @param {string} inputFilePath - Path to input CSV file
 * @param {string} outputFilePath - Path to output CSV file
 * @param {string} htmlColumn - Name of the column containing HTML
 * @param {Object} options - Additional options
 */
function processCSV(inputFilePath, outputFilePath, htmlColumn = 'Body HTML', options = {}) {
  try {
    // Default CSV parsing options
    const defaultOptions = {
      columns: true,
      skip_empty_lines: true,
      trim: true
    };
    
    const csvOptions = { ...defaultOptions, ...options };
    
    // Read and parse the CSV file
    const content = fs.readFileSync(inputFilePath, 'utf8');
    const records = parse(content, csvOptions);
    
    console.log(`Processing ${records.length} records from ${inputFilePath}`);
    
    // Process each row
    const processedRecords = records.map((record, index) => {
      const newRecord = { ...record };
      
      // Only process the HTML column if it exists
      if (htmlColumn in record) {
        try {
          const htmlContent = record[htmlColumn];
          
          // Skip empty content
          if (htmlContent && htmlContent.trim()) {
            const jsonContent = htmlToJson(htmlContent);
            newRecord[htmlColumn] = JSON.stringify(jsonContent);
          }
        } catch (err) {
          console.warn(`Warning: Error processing HTML in row ${index + 1}:`, err.message);
          // Keep original content on error
        }
      } else if (index === 0) {
        console.warn(`Column "${htmlColumn}" not found in CSV file.`);
      }
      
      return newRecord;
    });
    
    // Convert back to CSV
    const outputContent = stringify(processedRecords, {
      header: true
    });
    
    // Write to output file
    fs.writeFileSync(outputFilePath, outputContent);
    console.log(`CSV processed successfully. Output written to: ${outputFilePath}`);
    
    return {
      recordsProcessed: records.length,
      outputFile: outputFilePath
    };
  } catch (error) {
    console.error('Error processing CSV file:', error.message);
    throw error;
  }
}

/**
 * Process multiple CSV files using a glob pattern
 * @param {string} globPattern - Glob pattern for input files
 * @param {string} outputDir - Directory for output files
 * @param {string} htmlColumn - Name of the column containing HTML
 * @param {Object} options - Additional options
 */
function batchProcessCSV(globPattern, outputDir, htmlColumn = 'Body HTML', options = {}) {
  const glob = require('glob');
  
  // Find all files matching the pattern
  const files = glob.sync(globPattern);
  
  if (files.length === 0) {
    console.error(`No files found matching pattern: ${globPattern}`);
    return [];
  }
  
  // Create output directory if it doesn't exist
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  console.log(`Found ${files.length} files matching pattern: ${globPattern}`);
  
  // Process each file
  const results = [];
  
  files.forEach((file, index) => {
    try {
      const basename = path.basename(file);
      const outputFile = path.join(outputDir, basename);
      
      console.log(`[${index + 1}/${files.length}] Processing ${file}`);
      const result = processCSV(file, outputFile, htmlColumn, options);
      
      results.push({
        input: file,
        output: outputFile,
        success: true,
        ...result
      });
    } catch (error) {
      console.error(`Error processing ${file}:`, error.message);
      
      results.push({
        input: file,
        success: false,
        error: error.message
      });
    }
  });
  
  // Print summary
  const successful = results.filter(r => r.success).length;
  console.log(`\nProcessing complete: ${successful}/${files.length} files processed successfully.`);
  
  return results;
}

/**
 * Stream process a large CSV file to avoid memory issues
 * @param {string} inputFilePath - Input CSV file path
 * @param {string} outputFilePath - Output CSV file path
 * @param {string} htmlColumn - Name of the column containing HTML
 * @param {Object} options - Additional options
 */
function streamProcessCSV(inputFilePath, outputFilePath, htmlColumn = 'Body HTML', options = {}) {
  const { createReadStream, createWriteStream } = require('fs');
  const { parse } = require('csv-parse');
  const { stringify } = require('csv-stringify');
  const { Transform } = require('stream');
  const { pipeline } = require('stream/promises');
  
  console.log(`Stream processing ${inputFilePath}`);
  
  return new Promise(async (resolve, reject) => {
    try {
      let recordCount = 0;
      let headerSeen = false;
      let columnIndex = -1;
      
      // Create transform stream to process HTML column
      const processor = new Transform({
        objectMode: true,
        transform(record, encoding, callback) {
          try {
            if (!headerSeen) {
              // First row is header - find the column index
              if (Array.isArray(record)) {
                columnIndex = record.findIndex(col => col === htmlColumn);
                if (columnIndex === -1) {
                  console.warn(`Column "${htmlColumn}" not found in CSV file.`);
                }
              }
              headerSeen = true;
              callback(null, record);
              return;
            }
            
            recordCount++;
            
            // Process the HTML column if found
            if (columnIndex !== -1 && Array.isArray(record) && record[columnIndex]) {
              const htmlContent = record[columnIndex];
              
              // Skip empty content
              if (htmlContent && htmlContent.trim()) {
                try {
                  const jsonContent = htmlToJson(htmlContent);
                  record[columnIndex] = JSON.stringify(jsonContent);
                } catch (err) {
                  console.warn(`Warning: Error processing HTML in row ${recordCount}:`, err.message);
                  // Keep original on error
                }
              }
            }
            
            callback(null, record);
          } catch (err) {
            callback(err);
          }
        }
      });
      
      // Create the pipeline
      await pipeline(
        createReadStream(inputFilePath),
        parse(options),
        processor,
        stringify(),
        createWriteStream(outputFilePath)
      );
      
      console.log(`CSV stream processed successfully. Processed ${recordCount} records. Output written to: ${outputFilePath}`);
      
      resolve({
        recordsProcessed: recordCount,
        outputFile: outputFilePath
      });
    } catch (error) {
      console.error('Error in stream processing:', error.message);
      reject(error);
    }
  });
}

// Command-line interface using yargs
function setupCLI() {
  const yargs = require('yargs/yargs');
  const { hideBin } = require('yargs/helpers');
  
  return yargs(hideBin(process.argv))
    .option('verbose', {
      alias: 'v',
      type: 'boolean',
      description: 'Run with verbose logging',
      default: false
    })
    .command('convert', 'Convert HTML string to JSON', (yargs) => {
      return yargs
        .option('html', {
          describe: 'HTML string to convert',
          type: 'string'
        })
        .option('input', {
          alias: 'i',
          describe: 'Input HTML file',
          type: 'string'
        })
        .option('output', {
          alias: 'o',
          describe: 'Output JSON file (stdout if not specified)',
          type: 'string'
        })
        .check((argv) => {
          if (!argv.html && !argv.input) {
            throw new Error('Either --html or --input must be specified');
          }
          return true;
        });
    }, (argv) => {
      if (argv.html) {
        const jsonOutput = htmlToJsonString(argv.html);
        if (argv.output) {
          fs.writeFileSync(argv.output, jsonOutput);
          console.log(`Output written to ${argv.output}`);
        } else {
          console.log(jsonOutput);
        }
      } else if (argv.input) {
        const htmlContent = fs.readFileSync(argv.input, 'utf8');
        const jsonOutput = htmlToJsonString(htmlContent);
        
        if (argv.output) {
          fs.writeFileSync(argv.output, jsonOutput);
          console.log(`Output written to ${argv.output}`);
        } else {
          console.log(jsonOutput);
        }
      }
    })
    .command('csv', 'Process CSV file with HTML content', (yargs) => {
      return yargs
        .option('input', {
          alias: 'i',
          describe: 'Input CSV file',
          type: 'string',
          demandOption: true
        })
        .option('output', {
          alias: 'o',
          describe: 'Output CSV file',
          type: 'string',
          demandOption: true
        })
        .option('column', {
          alias: 'c',
          describe: 'HTML column name',
          type: 'string',
          default: 'Body HTML'
        })
        .option('stream', {
          alias: 's',
          describe: 'Use streaming for large files',
          type: 'boolean',
          default: false
        });
    }, (argv) => {
      if (argv.stream) {
        streamProcessCSV(argv.input, argv.output, argv.column)
          .catch(err => {
            console.error('Error processing CSV:', err);
            process.exit(1);
          });
      } else {
        try {
          processCSV(argv.input, argv.output, argv.column);
        } catch (err) {
          console.error('Error processing CSV:', err);
          process.exit(1);
        }
      }
    })
    .command('batch', 'Process multiple CSV files', (yargs) => {
      return yargs
        .option('pattern', {
          alias: 'p',
          describe: 'Glob pattern for input files',
          type: 'string',
          demandOption: true
        })
        .option('output-dir', {
          alias: 'd',
          describe: 'Output directory',
          type: 'string',
          demandOption: true
        })
        .option('column', {
          alias: 'c',
          describe: 'HTML column name',
          type: 'string',
          default: 'Body HTML'
        });
    }, (argv) => {
      try {
        batchProcessCSV(argv.pattern, argv['output-dir'], argv.column);
      } catch (err) {
        console.error('Error in batch processing:', err);
        process.exit(1);
      }
    })
    .demandCommand(1, 'You must specify a command')
    .help()
    .argv;
}

// Main function
function main() {
  setupCLI();
}

// Run the CLI if this script is executed directly
if (require.main === module) {
  main();
}

// Export the functions for programmatic use
module.exports = {
  htmlToJson,
  htmlToJsonString,
  processCSV,
  batchProcessCSV,
  streamProcessCSV,
  main
};
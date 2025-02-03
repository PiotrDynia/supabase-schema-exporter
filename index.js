#!/usr/bin/env node

const { program } = require('commander');
const dotenv = require('dotenv');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs').promises;
const path = require('path');

dotenv.config();

program
  .name('supabase-schema-export')
  .description('Export Supabase schema information for Cursor')
  .version('1.0.0')
  .requiredOption('-u, --url <url>', 'Supabase project URL')
  .requiredOption('-k, --key <key>', 'Supabase service role key')
  .option('-o, --output <path>', 'Output directory', '.cursor')
  .parse(process.argv);

const options = program.opts();

async function fetchSchemaInfo(supabaseUrl, supabaseKey) {
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  const { data: tables, error: tablesError } = await supabase
    .rpc('get_schema_info')
    .select();

  if (tablesError) {
    throw new Error(`Failed to fetch schema info: ${tablesError.message}`);
  }

  return tables;
}

function generateTypeDefinitions(schemaInfo) {
  const types = {};
  
  for (const table of schemaInfo) {
    const tableTypes = {};
    
    // Generate type for insert operations (all optional fields)
    tableTypes.Insert = {
      description: `Insert type for ${table.table} table`,
      type: 'object',
      properties: {}
    };

    // Generate type for update operations (all fields optional)
    tableTypes.Update = {
      description: `Update type for ${table.table} table`,
      type: 'object',
      properties: {}
    };

    // Generate base row type (with required fields)
    tableTypes.Row = {
      description: `Row type for ${table.table} table`,
      type: 'object',
      required: [],
      properties: {}
    };

    for (const column of table.columns) {
      const columnType = mapPostgresToJSONSchema(column.type);
      const isRequired = !column.is_nullable && !column.column_default;
      
      if (isRequired) {
        tableTypes.Row.required.push(column.name);
      }

      const columnSchema = {
        type: columnType,
        description: column.description || undefined,
        default: column.column_default || undefined
      };

      tableTypes.Row.properties[column.name] = columnSchema;
      tableTypes.Insert.properties[column.name] = { ...columnSchema, required: false };
      tableTypes.Update.properties[column.name] = { ...columnSchema, required: false };
    }

    types[table.table] = tableTypes;
  }

  return types;
}

function mapPostgresToJSONSchema(pgType) {
  const typeMap = {
    'integer': 'integer',
    'bigint': 'integer',
    'numeric': 'number',
    'text': 'string',
    'varchar': 'string',
    'char': 'string',
    'boolean': 'boolean',
    'json': 'object',
    'jsonb': 'object',
    'timestamp': 'string',
    'timestamptz': 'string',
    'date': 'string',
    'uuid': 'string',
  };

  return typeMap[pgType.toLowerCase()] || 'string';
}

async function main() {
  try {
    const schemaInfo = await fetchSchemaInfo(options.url, options.key);
    
    const cursorSchema = {
      $schema: 'http://json-schema.org/draft-07/schema#',
      version: '1.0',
      timestamp: new Date().toISOString(),
      definitions: generateTypeDefinitions(schemaInfo),
      tables: schemaInfo
    };

    // Ensure .cursor directory exists
    const cursorDir = path.join(process.cwd(), options.output);
    await fs.mkdir(cursorDir, { recursive: true });

    // Write schema file
    const schemaPath = path.join(cursorDir, 'supabase-schema.json');
    await fs.writeFile(schemaPath, JSON.stringify(cursorSchema, null, 2));
    
    // Create cursor config file if it doesn't exist
    const configPath = path.join(cursorDir, 'config.json');
    const configExists = await fs.access(configPath).then(() => true).catch(() => false);
    
    if (!configExists) {
      const config = {
        version: '1.0',
        schemas: {
          supabase: {
            path: './supabase-schema.json',
            type: 'postgres'
          }
        }
      };
      await fs.writeFile(configPath, JSON.stringify(config, null, 2));
    }
    
    console.log(`Schema information exported successfully to ${schemaPath}`);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

main(); 
# Supabase Schema Exporter

A CLI tool that exports Supabase database schema information in a format optimized for Cursor IDE integration. The tool generates detailed type information, constraints, and relationships from your Supabase database.

## Features

- Exports complete database schema information
- Generates TypeScript-like type definitions
- Includes table relationships and constraints
- Creates IDE-friendly JSON Schema format
- Supports custom output locations
- Automatically generates Cursor configuration

## Installation

### Install globally

```bash
npm install -g supabase-schema-exporter
```

### Or install locally in your project

```bash
npm install supabase-schema-exporter
```

## Setup

1. First, run the schema function in your Supabase project's SQL editor. Copy the contents of `schema_function.sql` from this repository and execute it in your Supabase dashboard.

2. Get your Supabase credentials:
   - Project URL from your Supabase dashboard
   - Service Role Key from Project Settings > API > service_role key

3. (Optional) Create a `.env` file in your project root:

```env
SUPABASE_URL=your_project_url
SUPABASE_KEY=your_service_role_key
```

## Usage

### Command Line

```bash
# Using command line arguments
supabase-schema-export -u "your-project-url" -k "your-service-role-key"

# Using environment variables
export SUPABASE_URL="your-project-url"
export SUPABASE_KEY="your-service-role-key"
supabase-schema-export -u $SUPABASE_URL -k $SUPABASE_KEY

# Custom output directory (default is .cursor)
supabase-schema-export -u $SUPABASE_URL -k $SUPABASE_KEY -o ".cursor-custom"
```

### Options

```
Options:
  -u, --url <url>      Supabase project URL (required)
  -k, --key <key>      Supabase service role key (required)
  -o, --output <path>  Output directory (default: ".cursor")
  -h, --help          display help for command
```

## Output

The tool generates two files:

1. `.cursor/supabase-schema.json` - Contains the complete schema information:
   - Table definitions
   - Column types and constraints
   - Foreign key relationships
   - Indexes
   - Triggers
   - Type definitions for Row, Insert, and Update operations

2. `.cursor/config.json` - Cursor configuration file:
   - Schema location configuration
   - Type information

Example schema output:
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "version": "1.0",
  "timestamp": "2024-02-20T12:00:00Z",
  "definitions": {
    "users": {
      "Row": {
        "description": "Row type for users table",
        "type": "object",
        "required": ["id", "email"],
        "properties": {
          "id": {
            "type": "string",
            "description": "Primary key"
          },
          "email": {
            "type": "string",
            "description": "User's email address"
          }
        }
      },
      "Insert": {
        "description": "Insert type for users table",
        "type": "object",
        "properties": {
          "email": {
            "type": "string",
            "description": "User's email address"
          }
        }
      }
    }
  }
}
```

## Type Mappings

The tool maps PostgreSQL types to JSON Schema types:

| PostgreSQL Type | JSON Schema Type |
|----------------|------------------|
| integer        | integer         |
| bigint         | integer         |
| numeric        | number          |
| text           | string          |
| varchar        | string          |
| boolean        | boolean         |
| json/jsonb     | object          |
| timestamp      | string          |
| date           | string          |
| uuid           | string          |

## Local Development

```bash
# Clone the repository
git clone https://github.com/PiotrDynia/supabase-schema-exporter.git
cd supabase-schema-exporter

# Install dependencies
npm install

# Create symbolic link for local testing
npm link

# Run the tool
supabase-schema-export -u "your-project-url" -k "your-service-role-key"
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

ISC

## Author

Piotr Dynia

## Repository

[GitHub Repository](https://github.com/PiotrDynia/supabase-schema-exporter)
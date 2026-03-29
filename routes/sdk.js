const express = require('express');
const { auth } = require('../middleware/auth');

const router = express.Router();

// ============================================
// JT Mobamba MCP SDK Generator & Documentation
// Supports: Node.js, Python, Flutter, React Native
// ============================================

// SDK Configuration Templates
const SDK_TEMPLATES = {
    nodejs: {
        name: 'jtmobamba-mcp',
        version: '1.0.0',
        install: 'npm install jtmobamba-mcp',
        language: 'JavaScript/TypeScript',
        packageManager: 'npm',
        example: (apiKey, secretKey, baseUrl) => `
const JTMobamba = require('jtmobamba-mcp');

// Initialize the client
const db = new JTMobamba({
    apiKey: '${apiKey}',
    secretKey: '${secretKey}',
    baseUrl: '${baseUrl}'
});

// Example: Read data from a table
async function getData() {
    const users = await db.table('users').select();
    console.log(users);
}

// Example: Insert data
async function insertData() {
    const result = await db.table('users').insert({
        name: 'John Doe',
        email: 'john@example.com',
        age: 30
    });
    console.log('Inserted:', result);
}

// Example: Update data
async function updateData() {
    const result = await db.table('users')
        .where({ id: 1 })
        .update({ name: 'Jane Doe' });
    console.log('Updated:', result);
}

// Example: Delete data
async function deleteData() {
    const result = await db.table('users')
        .where({ id: 1 })
        .delete();
    console.log('Deleted:', result);
}

// Example: Execute raw SQL
async function rawSQL() {
    const result = await db.sql('SELECT * FROM users WHERE age > 25');
    console.log(result);
}

getData();
`
    },

    python: {
        name: 'jtmobamba-mcp',
        version: '1.0.0',
        install: 'pip install jtmobamba-mcp',
        language: 'Python',
        packageManager: 'pip',
        example: (apiKey, secretKey, baseUrl) => `
from jtmobamba import JTMobamba

# Initialize the client
db = JTMobamba(
    api_key='${apiKey}',
    secret_key='${secretKey}',
    base_url='${baseUrl}'
)

# Example: Read data from a table
def get_data():
    users = db.table('users').select()
    print(users)

# Example: Insert data
def insert_data():
    result = db.table('users').insert({
        'name': 'John Doe',
        'email': 'john@example.com',
        'age': 30
    })
    print('Inserted:', result)

# Example: Update data
def update_data():
    result = db.table('users').where({'id': 1}).update({'name': 'Jane Doe'})
    print('Updated:', result)

# Example: Delete data
def delete_data():
    result = db.table('users').where({'id': 1}).delete()
    print('Deleted:', result)

# Example: Execute raw SQL
def raw_sql():
    result = db.sql('SELECT * FROM users WHERE age > 25')
    print(result)

if __name__ == '__main__':
    get_data()
`
    },

    flutter: {
        name: 'jtmobamba_mcp',
        version: '1.0.0',
        install: 'flutter pub add jtmobamba_mcp',
        language: 'Dart',
        packageManager: 'pub',
        example: (apiKey, secretKey, baseUrl) => `
import 'package:jtmobamba_mcp/jtmobamba_mcp.dart';

// Initialize the client
final db = JTMobamba(
  apiKey: '${apiKey}',
  secretKey: '${secretKey}',
  baseUrl: '${baseUrl}',
);

// Example: Read data from a table
Future<void> getData() async {
  final users = await db.table('users').select();
  print(users);
}

// Example: Insert data
Future<void> insertData() async {
  final result = await db.table('users').insert({
    'name': 'John Doe',
    'email': 'john@example.com',
    'age': 30,
  });
  print('Inserted: \$result');
}

// Example: Update data
Future<void> updateData() async {
  final result = await db.table('users')
    .where({'id': 1})
    .update({'name': 'Jane Doe'});
  print('Updated: \$result');
}

// Example: Delete data
Future<void> deleteData() async {
  final result = await db.table('users')
    .where({'id': 1})
    .delete();
  print('Deleted: \$result');
}

// Example: Execute raw SQL
Future<void> rawSQL() async {
  final result = await db.sql('SELECT * FROM users WHERE age > 25');
  print(result);
}

void main() async {
  await getData();
}
`
    },

    reactnative: {
        name: 'jtmobamba-mcp-react-native',
        version: '1.0.0',
        install: 'npm install jtmobamba-mcp-react-native',
        language: 'JavaScript/TypeScript',
        packageManager: 'npm',
        example: (apiKey, secretKey, baseUrl) => `
import JTMobamba from 'jtmobamba-mcp-react-native';
import { useEffect, useState } from 'react';

// Initialize the client
const db = new JTMobamba({
  apiKey: '${apiKey}',
  secretKey: '${secretKey}',
  baseUrl: '${baseUrl}'
});

// React Hook for data fetching
export function useJTMobamba(tableName) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchData();
  }, [tableName]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const result = await db.table(tableName).select();
      setData(result.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const insert = async (record) => {
    const result = await db.table(tableName).insert(record);
    await fetchData();
    return result;
  };

  const update = async (id, record) => {
    const result = await db.table(tableName).where({ _rowId: id }).update(record);
    await fetchData();
    return result;
  };

  const remove = async (id) => {
    const result = await db.table(tableName).where({ _rowId: id }).delete();
    await fetchData();
    return result;
  };

  return { data, loading, error, insert, update, remove, refresh: fetchData };
}

// Example Component
export function UserList() {
  const { data: users, loading, error, insert } = useJTMobamba('users');

  if (loading) return <Text>Loading...</Text>;
  if (error) return <Text>Error: {error}</Text>;

  return (
    <View>
      {users.map(user => (
        <Text key={user._rowId}>{user.name}</Text>
      ))}
    </View>
  );
}
`
    }
};

// CLI Template
const CLI_TEMPLATE = {
    install: 'npm install -g jtmobamba-cli',
    commands: [
        { cmd: 'jtmobamba init', desc: 'Initialize a new project with JT Mobamba' },
        { cmd: 'jtmobamba connect <api-key> <secret-key>', desc: 'Connect to your database' },
        { cmd: 'jtmobamba tables', desc: 'List all tables in your collection' },
        { cmd: 'jtmobamba query "<sql>"', desc: 'Execute a SQL query' },
        { cmd: 'jtmobamba export <table> --format=json', desc: 'Export table data' },
        { cmd: 'jtmobamba import <table> <file>', desc: 'Import data to table' }
    ],
    example: (apiKey, secretKey) => `
# Install CLI globally
npm install -g jtmobamba-cli

# Connect to your database
jtmobamba connect ${apiKey} ${secretKey}

# List tables
jtmobamba tables

# Query data
jtmobamba query "SELECT * FROM users"

# Insert data
jtmobamba query "INSERT INTO users (name, email) VALUES ('John', 'john@example.com')"

# Export data
jtmobamba export users --format=json > users.json

# Import data
jtmobamba import users data.json
`
};

// Get SDK documentation for a specific platform
router.get('/docs/:platform', (req, res) => {
    const platform = req.params.platform.toLowerCase();
    const template = SDK_TEMPLATES[platform];

    if (!template) {
        return res.status(404).json({
            error: 'Platform not supported',
            supportedPlatforms: Object.keys(SDK_TEMPLATES)
        });
    }

    res.json({
        platform,
        package: template.name,
        version: template.version,
        install: template.install,
        language: template.language,
        packageManager: template.packageManager,
        documentation: `https://docs.jtmobamba.com/sdk/${platform}`,
        example: template.example('YOUR_API_KEY', 'YOUR_SECRET_KEY', 'https://api.jtmobamba.com')
    });
});

// Generate SDK code with user's credentials
router.post('/generate', auth, async (req, res) => {
    try {
        const { platform, apiKey, secretKey, collectionId } = req.body;

        if (!platform || !apiKey || !secretKey) {
            return res.status(400).json({
                error: 'Platform, apiKey, and secretKey are required'
            });
        }

        const template = SDK_TEMPLATES[platform.toLowerCase()];
        if (!template) {
            return res.status(404).json({
                error: 'Platform not supported',
                supportedPlatforms: Object.keys(SDK_TEMPLATES)
            });
        }

        const baseUrl = `${req.protocol}://${req.get('host')}/api/database/v1/data`;

        res.json({
            platform,
            package: template.name,
            install: template.install,
            code: template.example(apiKey, secretKey, baseUrl),
            setupInstructions: getSetupInstructions(platform, template)
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get CLI documentation
router.get('/cli', (req, res) => {
    res.json({
        name: 'jtmobamba-cli',
        install: CLI_TEMPLATE.install,
        commands: CLI_TEMPLATE.commands,
        example: CLI_TEMPLATE.example('YOUR_API_KEY', 'YOUR_SECRET_KEY')
    });
});

// Get all supported platforms
router.get('/platforms', (req, res) => {
    const platforms = Object.entries(SDK_TEMPLATES).map(([key, value]) => ({
        id: key,
        name: value.name,
        language: value.language,
        packageManager: value.packageManager,
        install: value.install
    }));

    res.json({
        platforms,
        cli: {
            name: 'jtmobamba-cli',
            install: CLI_TEMPLATE.install
        }
    });
});

// Helper function for setup instructions
function getSetupInstructions(platform, template) {
    const instructions = {
        nodejs: [
            `1. Install the package: ${template.install}`,
            '2. Import the package in your project',
            '3. Initialize with your API credentials',
            '4. Start making queries!'
        ],
        python: [
            `1. Install the package: ${template.install}`,
            '2. Import the module in your script',
            '3. Initialize with your API credentials',
            '4. Start making queries!'
        ],
        flutter: [
            `1. Add to pubspec.yaml or run: ${template.install}`,
            '2. Run: flutter pub get',
            '3. Import the package in your Dart file',
            '4. Initialize with your API credentials',
            '5. Start making queries!'
        ],
        reactnative: [
            `1. Install the package: ${template.install}`,
            '2. Import the package in your component',
            '3. Initialize with your API credentials',
            '4. Use the provided hooks for data management!'
        ]
    };

    return instructions[platform] || [];
}

module.exports = router;

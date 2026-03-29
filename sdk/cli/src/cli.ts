#!/usr/bin/env node

/**
 * JT Mobamba CLI
 * Command line tool for managing JT Mobamba Cloud Database
 *
 * Usage:
 *   jtmobamba connect <api-key> <secret-key>
 *   jtmobamba tables
 *   jtmobamba query "SELECT * FROM users"
 *   jtmobamba export users --format=json
 */

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import Conf from 'conf';
import JTMobamba from 'jtmobamba-mcp';

const config = new Conf({ projectName: 'jtmobamba-cli' });
const program = new Command();

// Get stored credentials
function getClient(): JTMobamba | null {
    const apiKey = config.get('apiKey') as string;
    const secretKey = config.get('secretKey') as string;
    const baseUrl = config.get('baseUrl') as string;

    if (!apiKey || !secretKey) {
        console.log(chalk.red('Not connected. Run: jtmobamba connect <api-key> <secret-key>'));
        return null;
    }

    return new JTMobamba({ apiKey, secretKey, baseUrl });
}

program
    .name('jtmobamba')
    .description('JT Mobamba CLI - Manage your cloud database from the command line')
    .version('1.0.0');

// Connect command
program
    .command('connect <apiKey> <secretKey>')
    .description('Connect to JT Mobamba database')
    .option('-u, --url <url>', 'API base URL', 'https://api.jtmobamba.com/api/database/v1/data')
    .action(async (apiKey: string, secretKey: string, options: { url: string }) => {
        const spinner = ora('Connecting to JT Mobamba...').start();

        try {
            const client = new JTMobamba({
                apiKey,
                secretKey,
                baseUrl: options.url
            });

            // Test connection
            const info = await client.info();

            // Save credentials
            config.set('apiKey', apiKey);
            config.set('secretKey', secretKey);
            config.set('baseUrl', options.url);

            spinner.succeed(chalk.green('Connected successfully!'));
            console.log(chalk.dim(`Collection: ${info.collection.name}`));
            console.log(chalk.dim(`Tables: ${info.tables.length}`));
        } catch (error: any) {
            spinner.fail(chalk.red(`Connection failed: ${error.message}`));
        }
    });

// Disconnect command
program
    .command('disconnect')
    .description('Disconnect from JT Mobamba')
    .action(() => {
        config.delete('apiKey');
        config.delete('secretKey');
        config.delete('baseUrl');
        console.log(chalk.green('Disconnected successfully'));
    });

// Status command
program
    .command('status')
    .description('Show connection status')
    .action(async () => {
        const client = getClient();
        if (!client) return;

        const spinner = ora('Checking connection...').start();

        try {
            const info = await client.info();
            spinner.succeed(chalk.green('Connected'));
            console.log(`\n${chalk.bold('Collection:')} ${info.collection.name}`);
            console.log(`${chalk.bold('Tables:')} ${info.tables.length}`);
            console.log(`${chalk.bold('API Key:')} ${(config.get('apiKey') as string).substring(0, 12)}...`);
        } catch (error: any) {
            spinner.fail(chalk.red(`Connection error: ${error.message}`));
        }
    });

// Tables command
program
    .command('tables')
    .description('List all tables')
    .action(async () => {
        const client = getClient();
        if (!client) return;

        const spinner = ora('Fetching tables...').start();

        try {
            const { tables } = await client.tables();
            spinner.stop();

            if (tables.length === 0) {
                console.log(chalk.yellow('No tables found'));
                return;
            }

            console.log(chalk.bold('\nTables:\n'));
            tables.forEach((table: any) => {
                console.log(`  ${chalk.cyan(table.name)} ${chalk.dim(`(${table.rowCount} rows)`)}`);
                table.columns?.forEach((col: any) => {
                    console.log(`    ${chalk.dim('├─')} ${col.name} ${chalk.yellow(col.dataType)}`);
                });
            });
        } catch (error: any) {
            spinner.fail(chalk.red(error.message));
        }
    });

// Describe command
program
    .command('describe <table>')
    .description('Show table structure')
    .action(async (tableName: string) => {
        const client = getClient();
        if (!client) return;

        const spinner = ora(`Describing ${tableName}...`).start();

        try {
            const { table } = await client.describe(tableName);
            spinner.stop();

            console.log(chalk.bold(`\nTable: ${table.tableName || tableName}\n`));
            console.log(chalk.dim('Columns:'));
            table.columns?.forEach((col: any) => {
                const flags = [];
                if (col.primaryKey) flags.push(chalk.magenta('PK'));
                if (!col.nullable) flags.push(chalk.red('NOT NULL'));
                console.log(`  ${col.name} ${chalk.yellow(col.dataType)} ${flags.join(' ')}`);
            });
        } catch (error: any) {
            spinner.fail(chalk.red(error.message));
        }
    });

// Query command
program
    .command('query <sql>')
    .description('Execute SQL query')
    .action(async (sql: string) => {
        const client = getClient();
        if (!client) return;

        const spinner = ora('Executing query...').start();

        try {
            const result = await client.sql(sql);
            spinner.stop();

            console.log(chalk.dim(`\nQuery type: ${result.queryType}`));
            console.log(chalk.dim(`Time: ${result.queryTime}\n`));

            if (result.result.rows) {
                // Format as table
                console.table(result.result.rows);
            } else {
                console.log(result.result);
            }
        } catch (error: any) {
            spinner.fail(chalk.red(error.message));
        }
    });

// Select command
program
    .command('select <table>')
    .description('Select rows from a table')
    .option('-l, --limit <n>', 'Limit results', '10')
    .option('-p, --page <n>', 'Page number', '1')
    .action(async (tableName: string, options: { limit: string; page: string }) => {
        const client = getClient();
        if (!client) return;

        const spinner = ora(`Fetching from ${tableName}...`).start();

        try {
            const result = await client.table(tableName)
                .page(parseInt(options.page), parseInt(options.limit))
                .select();

            spinner.stop();

            if (result.data.length === 0) {
                console.log(chalk.yellow('No rows found'));
                return;
            }

            console.table(result.data);
            console.log(chalk.dim(`\nShowing ${result.data.length} of ${result.pagination?.total || 'unknown'} rows`));
        } catch (error: any) {
            spinner.fail(chalk.red(error.message));
        }
    });

// Insert command
program
    .command('insert <table> <json>')
    .description('Insert a row into a table')
    .action(async (tableName: string, jsonData: string) => {
        const client = getClient();
        if (!client) return;

        const spinner = ora(`Inserting into ${tableName}...`).start();

        try {
            const data = JSON.parse(jsonData);
            const result = await client.table(tableName).insert(data);

            spinner.succeed(chalk.green(`Row inserted with ID: ${result.rowId}`));
        } catch (error: any) {
            spinner.fail(chalk.red(error.message));
        }
    });

// Export command
program
    .command('export <table>')
    .description('Export table data')
    .option('-f, --format <format>', 'Output format (json|csv)', 'json')
    .option('-o, --output <file>', 'Output file')
    .action(async (tableName: string, options: { format: string; output?: string }) => {
        const client = getClient();
        if (!client) return;

        const spinner = ora(`Exporting ${tableName}...`).start();

        try {
            const result = await client.table(tableName).limit(10000).select();
            spinner.stop();

            let output: string;

            if (options.format === 'csv') {
                // Convert to CSV
                if (result.data.length === 0) {
                    output = '';
                } else {
                    const headers = Object.keys(result.data[0]).join(',');
                    const rows = result.data.map(row =>
                        Object.values(row).map(v =>
                            typeof v === 'string' ? `"${v}"` : v
                        ).join(',')
                    );
                    output = [headers, ...rows].join('\n');
                }
            } else {
                output = JSON.stringify(result.data, null, 2);
            }

            if (options.output) {
                require('fs').writeFileSync(options.output, output);
                console.log(chalk.green(`Exported to ${options.output}`));
            } else {
                console.log(output);
            }
        } catch (error: any) {
            spinner.fail(chalk.red(error.message));
        }
    });

// Init command
program
    .command('init')
    .description('Initialize a new project with JT Mobamba')
    .action(async () => {
        console.log(chalk.bold('\n🚀 JT Mobamba Project Setup\n'));
        console.log('1. Install the SDK:');
        console.log(chalk.cyan('   npm install jtmobamba-mcp'));
        console.log('\n2. Connect to your database:');
        console.log(chalk.cyan('   jtmobamba connect <your-api-key> <your-secret-key>'));
        console.log('\n3. Start building!');
        console.log(chalk.dim('\nFor more info, visit: https://jtmobamba.com/docs'));
    });

program.parse();

const express = require('express');
const mongoose = require('mongoose');
const crypto = require('crypto');
const { auth } = require('../middleware/auth');

const router = express.Router();

// ============================================
// SQL-Like Database Engine for MongoDB
// Components: Query Processor, Storage Engine, SQLOS API
// Hierarchy: Collections (Databases) -> Tables -> Rows
// ============================================

// Collection Schema Model - Represents a database/collection
const CollectionSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    name: { type: String, required: true },
    description: { type: String, default: '' },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

CollectionSchema.index({ userId: 1, name: 1 }, { unique: true });

// Table Schema Model - Stores table definitions within a collection
const TableSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    collectionId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true, ref: 'DatabaseCollection' },
    tableName: { type: String, required: true },
    columns: [{
        name: { type: String, required: true },
        dataType: { type: String, required: true }, // VARCHAR, INT, FLOAT, BOOLEAN, DATE, TEXT, JSON
        nullable: { type: Boolean, default: true },
        defaultValue: { type: mongoose.Schema.Types.Mixed },
        primaryKey: { type: Boolean, default: false },
        autoIncrement: { type: Boolean, default: false }
    }],
    autoIncrementCounter: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

TableSchema.index({ userId: 1, collectionId: 1, tableName: 1 }, { unique: true });

// Table Data Model - Stores actual row data within a table
const TableDataSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    collectionId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true, ref: 'DatabaseCollection' },
    tableId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true, ref: 'SQLTable' },
    tableName: { type: String, required: true, index: true },
    rowId: { type: Number, required: true },
    data: { type: mongoose.Schema.Types.Mixed, required: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

TableDataSchema.index({ userId: 1, collectionId: 1, tableName: 1, rowId: 1 }, { unique: true });

// API Key Schema - For external developer access
const APIKeySchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    collectionId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true, ref: 'DatabaseCollection' },
    name: { type: String, required: true },
    description: { type: String, default: '' },
    apiKey: { type: String, required: true, unique: true, index: true },
    secretKey: { type: String, required: true },
    secretKeyHash: { type: String, required: true },
    permissions: {
        read: { type: Boolean, default: true },
        insert: { type: Boolean, default: true },
        update: { type: Boolean, default: true },
        delete: { type: Boolean, default: false }
    },
    allowedOrigins: [{ type: String }],
    rateLimit: { type: Number, default: 1000 }, // requests per hour
    requestCount: { type: Number, default: 0 },
    lastRequestAt: { type: Date },
    isActive: { type: Boolean, default: true },
    expiresAt: { type: Date },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

APIKeySchema.index({ apiKey: 1, isActive: 1 });

let CollectionModel, TableModel, TableDataModel, APIKeyModel;

try {
    CollectionModel = mongoose.model('DatabaseCollection');
} catch {
    CollectionModel = mongoose.model('DatabaseCollection', CollectionSchema);
}

try {
    TableModel = mongoose.model('SQLTable');
} catch {
    TableModel = mongoose.model('SQLTable', TableSchema);
}

try {
    TableDataModel = mongoose.model('SQLTableData');
} catch {
    TableDataModel = mongoose.model('SQLTableData', TableDataSchema);
}

try {
    APIKeyModel = mongoose.model('APIKey');
} catch {
    APIKeyModel = mongoose.model('APIKey', APIKeySchema);
}

// ============================================
// SQLOS API - Core Database Operations
// Hierarchy: Collections (Databases) -> Tables -> Rows
// ============================================

class SQLOS {
    constructor(userId, collectionId = null) {
        this.userId = userId;
        this.collectionId = collectionId;
    }

    // Collection (Database) Management
    static async createCollection(userId, name, description = '') {
        const existing = await CollectionModel.findOne({
            userId,
            name: name.toLowerCase()
        });

        if (existing) {
            throw new Error(`Collection '${name}' already exists`);
        }

        const collection = new CollectionModel({
            userId,
            name: name.toLowerCase(),
            description
        });

        await collection.save();
        return { message: `Collection '${name}' created successfully`, collection };
    }

    static async listCollections(userId) {
        const collections = await CollectionModel.find({ userId })
            .sort({ name: 1 });

        // Get table counts for each collection
        const collectionsWithCounts = await Promise.all(collections.map(async (col) => {
            const tableCount = await TableModel.countDocuments({
                userId,
                collectionId: col._id
            });
            return {
                _id: col._id,
                name: col.name,
                description: col.description,
                tableCount,
                createdAt: col.createdAt,
                updatedAt: col.updatedAt
            };
        }));

        return collectionsWithCounts;
    }

    static async getCollection(userId, collectionId) {
        const collection = await CollectionModel.findOne({
            _id: collectionId,
            userId
        });

        if (!collection) {
            throw new Error('Collection not found');
        }

        return collection;
    }

    static async deleteCollection(userId, collectionId) {
        const collection = await CollectionModel.findOne({
            _id: collectionId,
            userId
        });

        if (!collection) {
            throw new Error('Collection not found');
        }

        // Delete all tables in this collection
        const tables = await TableModel.find({ userId, collectionId });
        for (const table of tables) {
            await TableDataModel.deleteMany({ userId, tableId: table._id });
        }
        await TableModel.deleteMany({ userId, collectionId });

        // Delete the collection
        await CollectionModel.findByIdAndDelete(collectionId);

        return { message: `Collection '${collection.name}' and all its tables deleted successfully` };
    }

    // Storage Engine - Table Management
    async createTable(tableName, columns) {
        if (!this.collectionId) {
            throw new Error('Collection ID is required to create a table');
        }

        // Verify collection exists
        const collection = await CollectionModel.findOne({
            _id: this.collectionId,
            userId: this.userId
        });

        if (!collection) {
            throw new Error('Collection not found');
        }

        const existingTable = await TableModel.findOne({
            userId: this.userId,
            collectionId: this.collectionId,
            tableName: tableName.toLowerCase()
        });

        if (existingTable) {
            throw new Error(`Table '${tableName}' already exists in this collection`);
        }

        // Validate columns
        const validTypes = ['VARCHAR', 'INT', 'FLOAT', 'BOOLEAN', 'DATE', 'TEXT', 'JSON', 'TIMESTAMP'];
        for (const col of columns) {
            if (!validTypes.includes(col.dataType.toUpperCase())) {
                throw new Error(`Invalid data type: ${col.dataType}`);
            }
        }

        const table = new TableModel({
            userId: this.userId,
            collectionId: this.collectionId,
            tableName: tableName.toLowerCase(),
            columns: columns.map(col => ({
                name: col.name.toLowerCase(),
                dataType: col.dataType.toUpperCase(),
                nullable: col.nullable !== false,
                defaultValue: col.defaultValue,
                primaryKey: col.primaryKey || false,
                autoIncrement: col.autoIncrement || false
            }))
        });

        await table.save();
        return { message: `Table '${tableName}' created successfully`, table };
    }

    async dropTable(tableName) {
        if (!this.collectionId) {
            throw new Error('Collection ID is required');
        }

        const result = await TableModel.findOneAndDelete({
            userId: this.userId,
            collectionId: this.collectionId,
            tableName: tableName.toLowerCase()
        });

        if (!result) {
            throw new Error(`Table '${tableName}' does not exist`);
        }

        // Delete all rows
        await TableDataModel.deleteMany({
            userId: this.userId,
            tableId: result._id
        });

        return { message: `Table '${tableName}' dropped successfully` };
    }

    async listTables() {
        if (!this.collectionId) {
            throw new Error('Collection ID is required');
        }

        const tables = await TableModel.find({
            userId: this.userId,
            collectionId: this.collectionId
        })
            .select('tableName columns createdAt')
            .sort({ tableName: 1 });

        // Get row counts
        const tablesWithCounts = await Promise.all(tables.map(async (table) => {
            const count = await TableDataModel.countDocuments({
                userId: this.userId,
                tableId: table._id
            });
            return {
                _id: table._id,
                name: table.tableName,
                columns: table.columns,
                rowCount: count,
                createdAt: table.createdAt
            };
        }));

        return tablesWithCounts;
    }

    async describeTable(tableName) {
        if (!this.collectionId) {
            throw new Error('Collection ID is required');
        }

        const table = await TableModel.findOne({
            userId: this.userId,
            collectionId: this.collectionId,
            tableName: tableName.toLowerCase()
        });

        if (!table) {
            throw new Error(`Table '${tableName}' does not exist`);
        }

        return table;
    }

    // Storage Engine - Row Operations
    async insertRow(tableName, data) {
        const table = await this.describeTable(tableName);

        // Validate and transform data
        const rowData = {};
        for (const col of table.columns) {
            let value = data[col.name];

            if (col.autoIncrement && (value === undefined || value === null)) {
                table.autoIncrementCounter++;
                await table.save();
                value = table.autoIncrementCounter;
            }

            if (value === undefined || value === null) {
                if (!col.nullable && col.defaultValue === undefined) {
                    throw new Error(`Column '${col.name}' cannot be null`);
                }
                value = col.defaultValue !== undefined ? col.defaultValue : null;
            }

            // Type validation and conversion
            value = this.validateAndConvert(value, col.dataType, col.name);
            rowData[col.name] = value;
        }

        // Get next row ID
        const lastRow = await TableDataModel.findOne({
            userId: this.userId,
            tableId: table._id
        }).sort({ rowId: -1 });

        const rowId = lastRow ? lastRow.rowId + 1 : 1;

        const row = new TableDataModel({
            userId: this.userId,
            collectionId: this.collectionId,
            tableId: table._id,
            tableName: tableName.toLowerCase(),
            rowId,
            data: rowData
        });

        await row.save();
        return { message: 'Row inserted successfully', rowId, data: rowData };
    }

    async selectRows(tableName, options = {}) {
        const { columns = '*', where = {}, orderBy, limit, offset = 0 } = options;

        const table = await this.describeTable(tableName);

        let query = TableDataModel.find({
            userId: this.userId,
            tableId: table._id
        });

        // Apply WHERE conditions
        if (Object.keys(where).length > 0) {
            const mongoQuery = this.whereToMongo(where);
            query = query.find(mongoQuery);
        }

        // Apply ORDER BY
        if (orderBy) {
            const sortObj = {};
            for (const [col, dir] of Object.entries(orderBy)) {
                sortObj[`data.${col}`] = dir.toUpperCase() === 'DESC' ? -1 : 1;
            }
            query = query.sort(sortObj);
        }

        // Apply LIMIT and OFFSET
        if (offset > 0) query = query.skip(offset);
        if (limit) query = query.limit(limit);

        const rows = await query.lean();

        // Filter columns if specified
        let results = rows.map(row => ({ _rowId: row.rowId, ...row.data }));

        if (columns !== '*' && Array.isArray(columns)) {
            results = results.map(row => {
                const filtered = { _rowId: row._rowId };
                columns.forEach(col => {
                    if (row[col] !== undefined) filtered[col] = row[col];
                });
                return filtered;
            });
        }

        const total = await TableDataModel.countDocuments({
            userId: this.userId,
            tableId: table._id
        });

        return { rows: results, total, count: results.length };
    }

    async updateRows(tableName, data, where = {}) {
        const table = await this.describeTable(tableName);

        // Validate update data
        const updateData = {};
        for (const [key, value] of Object.entries(data)) {
            const col = table.columns.find(c => c.name === key.toLowerCase());
            if (!col) {
                throw new Error(`Column '${key}' does not exist`);
            }
            updateData[`data.${key.toLowerCase()}`] = this.validateAndConvert(value, col.dataType, key);
        }

        updateData.updatedAt = new Date();

        const filter = {
            userId: this.userId,
            tableId: table._id
        };

        if (Object.keys(where).length > 0) {
            Object.assign(filter, this.whereToMongo(where));
        }

        const result = await TableDataModel.updateMany(filter, { $set: updateData });

        return { message: 'Rows updated successfully', modifiedCount: result.modifiedCount };
    }

    async deleteRows(tableName, where = {}) {
        const table = await this.describeTable(tableName);

        const filter = {
            userId: this.userId,
            tableId: table._id
        };

        if (Object.keys(where).length > 0) {
            Object.assign(filter, this.whereToMongo(where));
        }

        const result = await TableDataModel.deleteMany(filter);

        return { message: 'Rows deleted successfully', deletedCount: result.deletedCount };
    }

    // Query Processor - Convert WHERE to MongoDB query
    whereToMongo(where) {
        const mongoQuery = {};

        for (const [key, condition] of Object.entries(where)) {
            const field = `data.${key.toLowerCase()}`;

            if (typeof condition === 'object' && condition !== null) {
                const mongoCondition = {};
                for (const [op, val] of Object.entries(condition)) {
                    switch (op) {
                        case '$eq': mongoCondition.$eq = val; break;
                        case '$ne': mongoCondition.$ne = val; break;
                        case '$gt': mongoCondition.$gt = val; break;
                        case '$gte': mongoCondition.$gte = val; break;
                        case '$lt': mongoCondition.$lt = val; break;
                        case '$lte': mongoCondition.$lte = val; break;
                        case '$like': mongoCondition.$regex = new RegExp(val.replace(/%/g, '.*'), 'i'); break;
                        case '$in': mongoCondition.$in = val; break;
                        case '$nin': mongoCondition.$nin = val; break;
                        default: mongoCondition[op] = val;
                    }
                }
                mongoQuery[field] = mongoCondition;
            } else {
                mongoQuery[field] = condition;
            }
        }

        return mongoQuery;
    }

    // Type validation and conversion
    validateAndConvert(value, dataType, columnName) {
        if (value === null) return null;

        switch (dataType.toUpperCase()) {
            case 'INT':
                const intVal = parseInt(value);
                if (isNaN(intVal)) throw new Error(`Invalid INT value for column '${columnName}'`);
                return intVal;

            case 'FLOAT':
                const floatVal = parseFloat(value);
                if (isNaN(floatVal)) throw new Error(`Invalid FLOAT value for column '${columnName}'`);
                return floatVal;

            case 'BOOLEAN':
                if (typeof value === 'boolean') return value;
                if (value === 'true' || value === '1' || value === 1) return true;
                if (value === 'false' || value === '0' || value === 0) return false;
                throw new Error(`Invalid BOOLEAN value for column '${columnName}'`);

            case 'DATE':
            case 'TIMESTAMP':
                const dateVal = new Date(value);
                if (isNaN(dateVal.getTime())) throw new Error(`Invalid DATE value for column '${columnName}'`);
                return dateVal;

            case 'JSON':
                if (typeof value === 'object') return value;
                try {
                    return JSON.parse(value);
                } catch {
                    throw new Error(`Invalid JSON value for column '${columnName}'`);
                }

            case 'VARCHAR':
            case 'TEXT':
            default:
                return String(value);
        }
    }
}

// ============================================
// Query Processor - SQL Parser
// ============================================

class SQLParser {
    static parse(sql) {
        const trimmed = sql.trim().replace(/;$/, '');
        const upperSQL = trimmed.toUpperCase();

        if (upperSQL.startsWith('CREATE TABLE')) {
            return SQLParser.parseCreateTable(trimmed);
        } else if (upperSQL.startsWith('DROP TABLE')) {
            return SQLParser.parseDropTable(trimmed);
        } else if (upperSQL.startsWith('INSERT INTO')) {
            return SQLParser.parseInsert(trimmed);
        } else if (upperSQL.startsWith('SELECT')) {
            return SQLParser.parseSelect(trimmed);
        } else if (upperSQL.startsWith('UPDATE')) {
            return SQLParser.parseUpdate(trimmed);
        } else if (upperSQL.startsWith('DELETE FROM')) {
            return SQLParser.parseDelete(trimmed);
        } else if (upperSQL.startsWith('SHOW TABLES')) {
            return { type: 'SHOW_TABLES' };
        } else if (upperSQL.startsWith('DESCRIBE') || upperSQL.startsWith('DESC ')) {
            return SQLParser.parseDescribe(trimmed);
        } else {
            throw new Error('Unsupported SQL statement');
        }
    }

    static parseCreateTable(sql) {
        // CREATE TABLE tableName (col1 TYPE, col2 TYPE, ...)
        const match = sql.match(/CREATE\s+TABLE\s+(\w+)\s*\(([\s\S]+)\)/i);
        if (!match) throw new Error('Invalid CREATE TABLE syntax');

        const tableName = match[1];
        const columnDefs = match[2].split(',').map(s => s.trim());

        const columns = columnDefs.map(def => {
            const parts = def.split(/\s+/);
            const name = parts[0];
            const dataType = parts[1] || 'VARCHAR';

            return {
                name,
                dataType: dataType.replace(/\(\d+\)/, ''), // Remove size like VARCHAR(255)
                nullable: !def.toUpperCase().includes('NOT NULL'),
                primaryKey: def.toUpperCase().includes('PRIMARY KEY'),
                autoIncrement: def.toUpperCase().includes('AUTO_INCREMENT') || def.toUpperCase().includes('AUTOINCREMENT')
            };
        });

        return { type: 'CREATE_TABLE', tableName, columns };
    }

    static parseDropTable(sql) {
        const match = sql.match(/DROP\s+TABLE\s+(?:IF\s+EXISTS\s+)?(\w+)/i);
        if (!match) throw new Error('Invalid DROP TABLE syntax');
        return { type: 'DROP_TABLE', tableName: match[1] };
    }

    static parseInsert(sql) {
        // INSERT INTO tableName (col1, col2) VALUES (val1, val2)
        const match = sql.match(/INSERT\s+INTO\s+(\w+)\s*\(([^)]+)\)\s*VALUES\s*\(([^)]+)\)/i);
        if (!match) throw new Error('Invalid INSERT syntax');

        const tableName = match[1];
        const columns = match[2].split(',').map(s => s.trim().toLowerCase());
        const valuesStr = match[3];

        // Parse values (handle strings, numbers, nulls)
        const values = SQLParser.parseValues(valuesStr);

        const data = {};
        columns.forEach((col, i) => {
            data[col] = values[i];
        });

        return { type: 'INSERT', tableName, data };
    }

    static parseSelect(sql) {
        // SELECT col1, col2 FROM tableName [WHERE ...] [ORDER BY ...] [LIMIT ...]
        const selectMatch = sql.match(/SELECT\s+([\s\S]+?)\s+FROM\s+(\w+)/i);
        if (!selectMatch) throw new Error('Invalid SELECT syntax');

        const columnsStr = selectMatch[1].trim();
        const tableName = selectMatch[2];
        const columns = columnsStr === '*' ? '*' : columnsStr.split(',').map(s => s.trim().toLowerCase());

        let where = {};
        let orderBy = null;
        let limit = null;
        let offset = 0;

        // Parse WHERE
        const whereMatch = sql.match(/WHERE\s+([\s\S]+?)(?=ORDER BY|LIMIT|$)/i);
        if (whereMatch) {
            where = SQLParser.parseWhere(whereMatch[1].trim());
        }

        // Parse ORDER BY
        const orderMatch = sql.match(/ORDER\s+BY\s+(\w+)(?:\s+(ASC|DESC))?/i);
        if (orderMatch) {
            orderBy = { [orderMatch[1].toLowerCase()]: orderMatch[2] || 'ASC' };
        }

        // Parse LIMIT
        const limitMatch = sql.match(/LIMIT\s+(\d+)(?:\s+OFFSET\s+(\d+))?/i);
        if (limitMatch) {
            limit = parseInt(limitMatch[1]);
            if (limitMatch[2]) offset = parseInt(limitMatch[2]);
        }

        return { type: 'SELECT', tableName, columns, where, orderBy, limit, offset };
    }

    static parseUpdate(sql) {
        // UPDATE tableName SET col1 = val1, col2 = val2 [WHERE ...]
        const match = sql.match(/UPDATE\s+(\w+)\s+SET\s+([\s\S]+?)(?=WHERE|$)/i);
        if (!match) throw new Error('Invalid UPDATE syntax');

        const tableName = match[1];
        const setClause = match[2].trim();

        const data = {};
        const setParts = setClause.split(',');
        setParts.forEach(part => {
            const [col, val] = part.split('=').map(s => s.trim());
            data[col.toLowerCase()] = SQLParser.parseValue(val);
        });

        let where = {};
        const whereMatch = sql.match(/WHERE\s+([\s\S]+)$/i);
        if (whereMatch) {
            where = SQLParser.parseWhere(whereMatch[1].trim());
        }

        return { type: 'UPDATE', tableName, data, where };
    }

    static parseDelete(sql) {
        // DELETE FROM tableName [WHERE ...]
        const match = sql.match(/DELETE\s+FROM\s+(\w+)/i);
        if (!match) throw new Error('Invalid DELETE syntax');

        const tableName = match[1];

        let where = {};
        const whereMatch = sql.match(/WHERE\s+([\s\S]+)$/i);
        if (whereMatch) {
            where = SQLParser.parseWhere(whereMatch[1].trim());
        }

        return { type: 'DELETE', tableName, where };
    }

    static parseDescribe(sql) {
        const match = sql.match(/(?:DESCRIBE|DESC)\s+(\w+)/i);
        if (!match) throw new Error('Invalid DESCRIBE syntax');
        return { type: 'DESCRIBE', tableName: match[1] };
    }

    static parseWhere(whereStr) {
        const where = {};
        // Simple WHERE parsing: col = val AND col2 > val2
        const conditions = whereStr.split(/\s+AND\s+/i);

        conditions.forEach(cond => {
            const opMatch = cond.match(/(\w+)\s*(=|!=|<>|>=|<=|>|<|LIKE)\s*(.+)/i);
            if (opMatch) {
                const col = opMatch[1].toLowerCase();
                const op = opMatch[2].toUpperCase();
                const val = SQLParser.parseValue(opMatch[3].trim());

                const mongoOp = {
                    '=': '$eq',
                    '!=': '$ne',
                    '<>': '$ne',
                    '>': '$gt',
                    '>=': '$gte',
                    '<': '$lt',
                    '<=': '$lte',
                    'LIKE': '$like'
                }[op];

                where[col] = { [mongoOp]: val };
            }
        });

        return where;
    }

    static parseValues(valuesStr) {
        const values = [];
        let current = '';
        let inString = false;
        let stringChar = '';

        for (let i = 0; i < valuesStr.length; i++) {
            const char = valuesStr[i];

            if ((char === '"' || char === "'") && !inString) {
                inString = true;
                stringChar = char;
            } else if (char === stringChar && inString) {
                inString = false;
                stringChar = '';
            } else if (char === ',' && !inString) {
                values.push(SQLParser.parseValue(current.trim()));
                current = '';
                continue;
            }

            current += char;
        }

        if (current.trim()) {
            values.push(SQLParser.parseValue(current.trim()));
        }

        return values;
    }

    static parseValue(val) {
        if (!val) return null;

        val = val.trim();

        // NULL
        if (val.toUpperCase() === 'NULL') return null;

        // String (quoted)
        if ((val.startsWith("'") && val.endsWith("'")) || (val.startsWith('"') && val.endsWith('"'))) {
            return val.slice(1, -1);
        }

        // Boolean
        if (val.toUpperCase() === 'TRUE') return true;
        if (val.toUpperCase() === 'FALSE') return false;

        // Number
        const num = parseFloat(val);
        if (!isNaN(num)) return num;

        // Default to string
        return val;
    }
}

// ============================================
// API Routes
// Hierarchy: Collections -> Tables -> Rows
// ============================================

// ============================================
// Collection (Database) Routes
// ============================================

// List all collections
router.get('/collections', auth, async (req, res) => {
    try {
        const collections = await SQLOS.listCollections(req.user._id);
        res.json({ collections });
    } catch (error) {
        console.error('List collections error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Create a new collection
router.post('/collections', auth, async (req, res) => {
    try {
        const { name, description } = req.body;

        if (!name) {
            return res.status(400).json({ error: 'Collection name is required' });
        }

        const result = await SQLOS.createCollection(req.user._id, name, description);
        res.status(201).json(result);
    } catch (error) {
        console.error('Create collection error:', error);
        res.status(400).json({ error: error.message });
    }
});

// Get collection details
router.get('/collections/:collectionId', auth, async (req, res) => {
    try {
        const collection = await SQLOS.getCollection(req.user._id, req.params.collectionId);
        const sqlos = new SQLOS(req.user._id, req.params.collectionId);
        const tables = await sqlos.listTables();

        res.json({ collection, tables });
    } catch (error) {
        console.error('Get collection error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Update collection
router.put('/collections/:collectionId', auth, async (req, res) => {
    try {
        const { name, description } = req.body;

        const collection = await CollectionModel.findOneAndUpdate(
            { _id: req.params.collectionId, userId: req.user._id },
            { name: name?.toLowerCase(), description, updatedAt: new Date() },
            { new: true }
        );

        if (!collection) {
            return res.status(404).json({ error: 'Collection not found' });
        }

        res.json({ message: 'Collection updated successfully', collection });
    } catch (error) {
        console.error('Update collection error:', error);
        res.status(400).json({ error: error.message });
    }
});

// Delete collection and all its tables
router.delete('/collections/:collectionId', auth, async (req, res) => {
    try {
        const result = await SQLOS.deleteCollection(req.user._id, req.params.collectionId);
        res.json(result);
    } catch (error) {
        console.error('Delete collection error:', error);
        res.status(500).json({ error: error.message });
    }
});

// ============================================
// Table Routes (within a collection)
// ============================================

// List tables in a collection
router.get('/collections/:collectionId/tables', auth, async (req, res) => {
    try {
        const sqlos = new SQLOS(req.user._id, req.params.collectionId);
        const tables = await sqlos.listTables();
        res.json({ tables });
    } catch (error) {
        console.error('List tables error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Create table in a collection
router.post('/collections/:collectionId/tables', auth, async (req, res) => {
    try {
        const { name, columns } = req.body;

        if (!name || !columns || !Array.isArray(columns)) {
            return res.status(400).json({ error: 'Table name and columns are required' });
        }

        const sqlos = new SQLOS(req.user._id, req.params.collectionId);
        const result = await sqlos.createTable(name, columns);
        res.status(201).json(result);
    } catch (error) {
        console.error('Create table error:', error);
        res.status(400).json({ error: error.message });
    }
});

// Get table structure
router.get('/collections/:collectionId/tables/:name', auth, async (req, res) => {
    try {
        const sqlos = new SQLOS(req.user._id, req.params.collectionId);
        const table = await sqlos.describeTable(req.params.name);
        const rowCount = await TableDataModel.countDocuments({
            userId: req.user._id,
            tableId: table._id
        });
        res.json({ table, rowCount });
    } catch (error) {
        console.error('Get table error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Drop table
router.delete('/collections/:collectionId/tables/:name', auth, async (req, res) => {
    try {
        const sqlos = new SQLOS(req.user._id, req.params.collectionId);
        const result = await sqlos.dropTable(req.params.name);
        res.json(result);
    } catch (error) {
        console.error('Drop table error:', error);
        res.status(500).json({ error: error.message });
    }
});

// ============================================
// Row Routes (within a table)
// ============================================

// Get table data with pagination
router.get('/collections/:collectionId/tables/:name/data', auth, async (req, res) => {
    try {
        const { page = 1, limit = 50, orderBy, orderDir = 'ASC' } = req.query;

        const sqlos = new SQLOS(req.user._id, req.params.collectionId);
        const result = await sqlos.selectRows(req.params.name, {
            limit: parseInt(limit),
            offset: (parseInt(page) - 1) * parseInt(limit),
            orderBy: orderBy ? { [orderBy]: orderDir } : null
        });

        res.json({
            rows: result.rows,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: result.total,
                pages: Math.ceil(result.total / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('Get table data error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Insert row
router.post('/collections/:collectionId/tables/:name/rows', auth, async (req, res) => {
    try {
        const sqlos = new SQLOS(req.user._id, req.params.collectionId);
        const result = await sqlos.insertRow(req.params.name, req.body);
        res.status(201).json(result);
    } catch (error) {
        console.error('Insert row error:', error);
        res.status(400).json({ error: error.message });
    }
});

// Update row
router.put('/collections/:collectionId/tables/:name/rows/:rowId', auth, async (req, res) => {
    try {
        const sqlos = new SQLOS(req.user._id, req.params.collectionId);
        const table = await sqlos.describeTable(req.params.name);

        const result = await TableDataModel.findOneAndUpdate(
            {
                userId: req.user._id,
                tableId: table._id,
                rowId: parseInt(req.params.rowId)
            },
            {
                $set: {
                    data: req.body,
                    updatedAt: new Date()
                }
            },
            { new: true }
        );

        if (!result) {
            return res.status(404).json({ error: 'Row not found' });
        }

        res.json({ message: 'Row updated successfully', row: result });
    } catch (error) {
        console.error('Update row error:', error);
        res.status(400).json({ error: error.message });
    }
});

// Delete row
router.delete('/collections/:collectionId/tables/:name/rows/:rowId', auth, async (req, res) => {
    try {
        const sqlos = new SQLOS(req.user._id, req.params.collectionId);
        const table = await sqlos.describeTable(req.params.name);

        const result = await TableDataModel.findOneAndDelete({
            userId: req.user._id,
            tableId: table._id,
            rowId: parseInt(req.params.rowId)
        });

        if (!result) {
            return res.status(404).json({ error: 'Row not found' });
        }

        res.json({ message: 'Row deleted successfully' });
    } catch (error) {
        console.error('Delete row error:', error);
        res.status(500).json({ error: error.message });
    }
});

// ============================================
// SQL Editor Route (within a collection)
// ============================================

// Execute SQL query within a collection
router.post('/collections/:collectionId/sql', auth, async (req, res) => {
    try {
        const { sql } = req.body;
        if (!sql) {
            return res.status(400).json({ error: 'SQL query is required' });
        }

        const sqlos = new SQLOS(req.user._id, req.params.collectionId);
        const parsed = SQLParser.parse(sql);
        const startTime = Date.now();

        let result;

        switch (parsed.type) {
            case 'CREATE_TABLE':
                result = await sqlos.createTable(parsed.tableName, parsed.columns);
                break;

            case 'DROP_TABLE':
                result = await sqlos.dropTable(parsed.tableName);
                break;

            case 'SHOW_TABLES':
                const tables = await sqlos.listTables();
                result = { tables };
                break;

            case 'DESCRIBE':
                const tableInfo = await sqlos.describeTable(parsed.tableName);
                result = { table: tableInfo };
                break;

            case 'INSERT':
                result = await sqlos.insertRow(parsed.tableName, parsed.data);
                break;

            case 'SELECT':
                result = await sqlos.selectRows(parsed.tableName, {
                    columns: parsed.columns,
                    where: parsed.where,
                    orderBy: parsed.orderBy,
                    limit: parsed.limit,
                    offset: parsed.offset
                });
                break;

            case 'UPDATE':
                result = await sqlos.updateRows(parsed.tableName, parsed.data, parsed.where);
                break;

            case 'DELETE':
                result = await sqlos.deleteRows(parsed.tableName, parsed.where);
                break;

            default:
                throw new Error('Unsupported operation');
        }

        const queryTime = Date.now() - startTime;

        res.json({
            success: true,
            queryType: parsed.type,
            result,
            queryTime: `${queryTime}ms`
        });

    } catch (error) {
        console.error('SQL execution error:', error);
        res.status(400).json({ error: error.message });
    }
});

// ============================================
// API Key Management
// ============================================

class APIKeyManager {
    // Generate a new API key pair
    static generateKeyPair() {
        const apiKey = 'jtm_' + crypto.randomBytes(16).toString('hex');
        const secretKey = 'jtms_' + crypto.randomBytes(32).toString('hex');
        const secretKeyHash = crypto.createHash('sha256').update(secretKey).digest('hex');
        return { apiKey, secretKey, secretKeyHash };
    }

    // Validate API key and secret
    static async validateCredentials(apiKey, secretKey) {
        const keyDoc = await APIKeyModel.findOne({ apiKey, isActive: true });

        if (!keyDoc) {
            return { valid: false, error: 'Invalid API key' };
        }

        // Check expiration
        if (keyDoc.expiresAt && new Date() > keyDoc.expiresAt) {
            return { valid: false, error: 'API key has expired' };
        }

        // Validate secret key
        const secretHash = crypto.createHash('sha256').update(secretKey).digest('hex');
        if (secretHash !== keyDoc.secretKeyHash) {
            return { valid: false, error: 'Invalid secret key' };
        }

        // Check rate limit (reset hourly)
        const now = new Date();
        const hourAgo = new Date(now - 60 * 60 * 1000);

        if (keyDoc.lastRequestAt && keyDoc.lastRequestAt > hourAgo) {
            if (keyDoc.requestCount >= keyDoc.rateLimit) {
                return { valid: false, error: 'Rate limit exceeded' };
            }
            keyDoc.requestCount++;
        } else {
            keyDoc.requestCount = 1;
        }

        keyDoc.lastRequestAt = now;
        await keyDoc.save();

        return { valid: true, keyDoc };
    }
}

// API Key Authentication Middleware
const apiKeyAuth = async (req, res, next) => {
    try {
        const apiKey = req.header('X-API-Key');
        const secretKey = req.header('X-API-Secret');

        if (!apiKey || !secretKey) {
            return res.status(401).json({
                error: 'API credentials required',
                message: 'Include X-API-Key and X-API-Secret headers'
            });
        }

        const validation = await APIKeyManager.validateCredentials(apiKey, secretKey);

        if (!validation.valid) {
            return res.status(401).json({ error: validation.error });
        }

        // Check origin if allowedOrigins is set
        const origin = req.header('Origin') || req.header('Referer');
        if (validation.keyDoc.allowedOrigins && validation.keyDoc.allowedOrigins.length > 0) {
            const allowed = validation.keyDoc.allowedOrigins.some(ao =>
                origin && origin.includes(ao)
            );
            if (!allowed && origin) {
                return res.status(403).json({ error: 'Origin not allowed' });
            }
        }

        req.apiKey = validation.keyDoc;
        req.collectionId = validation.keyDoc.collectionId;
        req.userId = validation.keyDoc.userId;
        next();
    } catch (error) {
        console.error('API Key auth error:', error);
        res.status(500).json({ error: 'Authentication error' });
    }
};

// ============================================
// API Key Management Routes (Dashboard)
// ============================================

// List API keys for a collection
router.get('/collections/:collectionId/api-keys', auth, async (req, res) => {
    try {
        const keys = await APIKeyModel.find({
            userId: req.user._id,
            collectionId: req.params.collectionId
        }).select('-secretKeyHash').sort({ createdAt: -1 });

        // Mask the API keys for security (show only first 8 chars)
        const maskedKeys = keys.map(key => ({
            _id: key._id,
            name: key.name,
            description: key.description,
            apiKey: key.apiKey.substring(0, 12) + '...',
            apiKeyFull: key.apiKey, // Full key for copying
            permissions: key.permissions,
            allowedOrigins: key.allowedOrigins,
            rateLimit: key.rateLimit,
            requestCount: key.requestCount,
            lastRequestAt: key.lastRequestAt,
            isActive: key.isActive,
            expiresAt: key.expiresAt,
            createdAt: key.createdAt
        }));

        res.json({ apiKeys: maskedKeys });
    } catch (error) {
        console.error('List API keys error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Create new API key
router.post('/collections/:collectionId/api-keys', auth, async (req, res) => {
    try {
        const { name, description, permissions, allowedOrigins, rateLimit, expiresAt } = req.body;

        if (!name) {
            return res.status(400).json({ error: 'API key name is required' });
        }

        // Verify collection exists and belongs to user
        const collection = await CollectionModel.findOne({
            _id: req.params.collectionId,
            userId: req.user._id
        });

        if (!collection) {
            return res.status(404).json({ error: 'Collection not found' });
        }

        const { apiKey, secretKey, secretKeyHash } = APIKeyManager.generateKeyPair();

        const apiKeyDoc = new APIKeyModel({
            userId: req.user._id,
            collectionId: req.params.collectionId,
            name,
            description: description || '',
            apiKey,
            secretKey, // Store temporarily for response
            secretKeyHash,
            permissions: permissions || { read: true, insert: true, update: true, delete: false },
            allowedOrigins: allowedOrigins || [],
            rateLimit: rateLimit || 1000,
            expiresAt: expiresAt ? new Date(expiresAt) : null
        });

        await apiKeyDoc.save();

        // Return credentials (only shown once!)
        res.status(201).json({
            message: 'API key created successfully',
            credentials: {
                apiKey,
                secretKey,
                warning: 'Save these credentials! The secret key will not be shown again.'
            },
            apiKeyId: apiKeyDoc._id,
            collectionId: req.params.collectionId,
            collectionName: collection.name
        });
    } catch (error) {
        console.error('Create API key error:', error);
        res.status(400).json({ error: error.message });
    }
});

// Update API key
router.put('/collections/:collectionId/api-keys/:keyId', auth, async (req, res) => {
    try {
        const { name, description, permissions, allowedOrigins, rateLimit, isActive, expiresAt } = req.body;

        const apiKey = await APIKeyModel.findOneAndUpdate(
            {
                _id: req.params.keyId,
                userId: req.user._id,
                collectionId: req.params.collectionId
            },
            {
                name,
                description,
                permissions,
                allowedOrigins,
                rateLimit,
                isActive,
                expiresAt: expiresAt ? new Date(expiresAt) : null,
                updatedAt: new Date()
            },
            { new: true }
        ).select('-secretKeyHash');

        if (!apiKey) {
            return res.status(404).json({ error: 'API key not found' });
        }

        res.json({ message: 'API key updated successfully', apiKey });
    } catch (error) {
        console.error('Update API key error:', error);
        res.status(400).json({ error: error.message });
    }
});

// Regenerate secret key
router.post('/collections/:collectionId/api-keys/:keyId/regenerate', auth, async (req, res) => {
    try {
        const keyDoc = await APIKeyModel.findOne({
            _id: req.params.keyId,
            userId: req.user._id,
            collectionId: req.params.collectionId
        });

        if (!keyDoc) {
            return res.status(404).json({ error: 'API key not found' });
        }

        // Generate new secret
        const secretKey = 'jtms_' + crypto.randomBytes(32).toString('hex');
        const secretKeyHash = crypto.createHash('sha256').update(secretKey).digest('hex');

        keyDoc.secretKeyHash = secretKeyHash;
        keyDoc.updatedAt = new Date();
        await keyDoc.save();

        res.json({
            message: 'Secret key regenerated successfully',
            credentials: {
                apiKey: keyDoc.apiKey,
                secretKey,
                warning: 'Save this secret key! It will not be shown again.'
            }
        });
    } catch (error) {
        console.error('Regenerate secret error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Delete API key
router.delete('/collections/:collectionId/api-keys/:keyId', auth, async (req, res) => {
    try {
        const result = await APIKeyModel.findOneAndDelete({
            _id: req.params.keyId,
            userId: req.user._id,
            collectionId: req.params.collectionId
        });

        if (!result) {
            return res.status(404).json({ error: 'API key not found' });
        }

        res.json({ message: 'API key deleted successfully' });
    } catch (error) {
        console.error('Delete API key error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get API usage statistics
router.get('/collections/:collectionId/api-keys/:keyId/stats', auth, async (req, res) => {
    try {
        const apiKey = await APIKeyModel.findOne({
            _id: req.params.keyId,
            userId: req.user._id,
            collectionId: req.params.collectionId
        });

        if (!apiKey) {
            return res.status(404).json({ error: 'API key not found' });
        }

        res.json({
            stats: {
                requestCount: apiKey.requestCount,
                rateLimit: apiKey.rateLimit,
                lastRequestAt: apiKey.lastRequestAt,
                remainingRequests: Math.max(0, apiKey.rateLimit - apiKey.requestCount),
                isActive: apiKey.isActive
            }
        });
    } catch (error) {
        console.error('Get API stats error:', error);
        res.status(500).json({ error: error.message });
    }
});

// ============================================
// Public Data API Routes (External Access)
// Uses API Key authentication
// ============================================

// Get collection info
router.get('/v1/data/info', apiKeyAuth, async (req, res) => {
    try {
        const collection = await CollectionModel.findById(req.collectionId);
        const sqlos = new SQLOS(req.userId, req.collectionId);
        const tables = await sqlos.listTables();

        res.json({
            collection: {
                id: collection._id,
                name: collection.name,
                description: collection.description
            },
            tables: tables.map(t => ({
                name: t.name,
                columns: t.columns,
                rowCount: t.rowCount
            }))
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// List tables
router.get('/v1/data/tables', apiKeyAuth, async (req, res) => {
    try {
        const sqlos = new SQLOS(req.userId, req.collectionId);
        const tables = await sqlos.listTables();
        res.json({ tables });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get table structure
router.get('/v1/data/tables/:tableName', apiKeyAuth, async (req, res) => {
    try {
        const sqlos = new SQLOS(req.userId, req.collectionId);
        const table = await sqlos.describeTable(req.params.tableName);
        res.json({ table });
    } catch (error) {
        res.status(404).json({ error: error.message });
    }
});

// READ - Get rows from table
router.get('/v1/data/tables/:tableName/rows', apiKeyAuth, async (req, res) => {
    try {
        if (!req.apiKey.permissions.read) {
            return res.status(403).json({ error: 'Read permission not granted' });
        }

        const { page = 1, limit = 50, orderBy, orderDir = 'ASC', ...where } = req.query;

        const sqlos = new SQLOS(req.userId, req.collectionId);

        // Parse where conditions from query params
        const whereConditions = {};
        for (const [key, value] of Object.entries(where)) {
            if (key.startsWith('_')) continue; // Skip internal params
            whereConditions[key] = value;
        }

        const result = await sqlos.selectRows(req.params.tableName, {
            where: whereConditions,
            limit: parseInt(limit),
            offset: (parseInt(page) - 1) * parseInt(limit),
            orderBy: orderBy ? { [orderBy]: orderDir } : null
        });

        res.json({
            data: result.rows,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: result.total,
                pages: Math.ceil(result.total / parseInt(limit))
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// CREATE - Insert row(s)
router.post('/v1/data/tables/:tableName/rows', apiKeyAuth, async (req, res) => {
    try {
        if (!req.apiKey.permissions.insert) {
            return res.status(403).json({ error: 'Insert permission not granted' });
        }

        const sqlos = new SQLOS(req.userId, req.collectionId);
        const data = req.body;

        // Support batch insert
        if (Array.isArray(data)) {
            const results = [];
            for (const row of data) {
                const result = await sqlos.insertRow(req.params.tableName, row);
                results.push(result);
            }
            res.status(201).json({
                message: `${results.length} rows inserted`,
                rows: results
            });
        } else {
            const result = await sqlos.insertRow(req.params.tableName, data);
            res.status(201).json(result);
        }
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// UPDATE - Update rows
router.put('/v1/data/tables/:tableName/rows', apiKeyAuth, async (req, res) => {
    try {
        if (!req.apiKey.permissions.update) {
            return res.status(403).json({ error: 'Update permission not granted' });
        }

        const { data, where } = req.body;

        if (!data || typeof data !== 'object') {
            return res.status(400).json({ error: 'Data object is required' });
        }

        const sqlos = new SQLOS(req.userId, req.collectionId);
        const result = await sqlos.updateRows(req.params.tableName, data, where || {});
        res.json(result);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// UPDATE - Update single row by ID
router.put('/v1/data/tables/:tableName/rows/:rowId', apiKeyAuth, async (req, res) => {
    try {
        if (!req.apiKey.permissions.update) {
            return res.status(403).json({ error: 'Update permission not granted' });
        }

        const sqlos = new SQLOS(req.userId, req.collectionId);
        const table = await sqlos.describeTable(req.params.tableName);

        const result = await TableDataModel.findOneAndUpdate(
            {
                userId: req.userId,
                tableId: table._id,
                rowId: parseInt(req.params.rowId)
            },
            {
                $set: {
                    data: req.body,
                    updatedAt: new Date()
                }
            },
            { new: true }
        );

        if (!result) {
            return res.status(404).json({ error: 'Row not found' });
        }

        res.json({ message: 'Row updated', data: result.data });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// DELETE - Delete rows
router.delete('/v1/data/tables/:tableName/rows', apiKeyAuth, async (req, res) => {
    try {
        if (!req.apiKey.permissions.delete) {
            return res.status(403).json({ error: 'Delete permission not granted' });
        }

        const { where } = req.body || {};

        if (!where || Object.keys(where).length === 0) {
            return res.status(400).json({ error: 'WHERE conditions required for delete' });
        }

        const sqlos = new SQLOS(req.userId, req.collectionId);
        const result = await sqlos.deleteRows(req.params.tableName, where);
        res.json(result);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// DELETE - Delete single row by ID
router.delete('/v1/data/tables/:tableName/rows/:rowId', apiKeyAuth, async (req, res) => {
    try {
        if (!req.apiKey.permissions.delete) {
            return res.status(403).json({ error: 'Delete permission not granted' });
        }

        const sqlos = new SQLOS(req.userId, req.collectionId);
        const table = await sqlos.describeTable(req.params.tableName);

        const result = await TableDataModel.findOneAndDelete({
            userId: req.userId,
            tableId: table._id,
            rowId: parseInt(req.params.rowId)
        });

        if (!result) {
            return res.status(404).json({ error: 'Row not found' });
        }

        res.json({ message: 'Row deleted' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Execute SQL query via API
router.post('/v1/data/sql', apiKeyAuth, async (req, res) => {
    try {
        const { sql } = req.body;

        if (!sql) {
            return res.status(400).json({ error: 'SQL query is required' });
        }

        const parsed = SQLParser.parse(sql);

        // Check permissions based on query type
        const readOperations = ['SELECT', 'SHOW_TABLES', 'DESCRIBE'];
        const writeOperations = ['INSERT'];
        const updateOperations = ['UPDATE'];
        const deleteOperations = ['DELETE', 'DROP_TABLE'];

        if (readOperations.includes(parsed.type) && !req.apiKey.permissions.read) {
            return res.status(403).json({ error: 'Read permission not granted' });
        }
        if (writeOperations.includes(parsed.type) && !req.apiKey.permissions.insert) {
            return res.status(403).json({ error: 'Insert permission not granted' });
        }
        if (updateOperations.includes(parsed.type) && !req.apiKey.permissions.update) {
            return res.status(403).json({ error: 'Update permission not granted' });
        }
        if (deleteOperations.includes(parsed.type) && !req.apiKey.permissions.delete) {
            return res.status(403).json({ error: 'Delete permission not granted' });
        }

        // Prevent CREATE_TABLE via public API
        if (parsed.type === 'CREATE_TABLE') {
            return res.status(403).json({ error: 'Table creation not allowed via API' });
        }

        const sqlos = new SQLOS(req.userId, req.collectionId);
        const startTime = Date.now();

        let result;
        switch (parsed.type) {
            case 'SHOW_TABLES':
                result = { tables: await sqlos.listTables() };
                break;
            case 'DESCRIBE':
                result = { table: await sqlos.describeTable(parsed.tableName) };
                break;
            case 'INSERT':
                result = await sqlos.insertRow(parsed.tableName, parsed.data);
                break;
            case 'SELECT':
                result = await sqlos.selectRows(parsed.tableName, {
                    columns: parsed.columns,
                    where: parsed.where,
                    orderBy: parsed.orderBy,
                    limit: parsed.limit,
                    offset: parsed.offset
                });
                break;
            case 'UPDATE':
                result = await sqlos.updateRows(parsed.tableName, parsed.data, parsed.where);
                break;
            case 'DELETE':
                result = await sqlos.deleteRows(parsed.tableName, parsed.where);
                break;
            default:
                throw new Error('Unsupported operation');
        }

        res.json({
            success: true,
            queryType: parsed.type,
            result,
            queryTime: `${Date.now() - startTime}ms`
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

module.exports = router;

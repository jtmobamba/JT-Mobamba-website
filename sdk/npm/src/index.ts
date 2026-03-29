/**
 * JT Mobamba MCP SDK for Node.js
 * Official SDK for connecting to JT Mobamba Cloud Database
 *
 * @packageDocumentation
 */

export interface JTMobambaConfig {
    apiKey: string;
    secretKey: string;
    baseUrl?: string;
    timeout?: number;
}

export interface QueryOptions {
    columns?: string[];
    where?: Record<string, any>;
    orderBy?: string;
    orderDir?: 'ASC' | 'DESC';
    limit?: number;
    offset?: number;
    page?: number;
}

export interface QueryResult<T = any> {
    data: T[];
    pagination?: {
        page: number;
        limit: number;
        total: number;
        pages: number;
    };
}

export interface InsertResult {
    message: string;
    rowId: number;
    data: Record<string, any>;
}

export interface UpdateResult {
    message: string;
    modifiedCount: number;
}

export interface DeleteResult {
    message: string;
    deletedCount: number;
}

export interface TableInfo {
    name: string;
    columns: Array<{
        name: string;
        dataType: string;
        nullable: boolean;
        primaryKey: boolean;
    }>;
    rowCount: number;
}

class TableQuery {
    private client: JTMobamba;
    private tableName: string;
    private queryOptions: QueryOptions = {};

    constructor(client: JTMobamba, tableName: string) {
        this.client = client;
        this.tableName = tableName;
    }

    /**
     * Specify columns to select
     */
    columns(cols: string[]): this {
        this.queryOptions.columns = cols;
        return this;
    }

    /**
     * Add WHERE conditions
     */
    where(conditions: Record<string, any>): this {
        this.queryOptions.where = { ...this.queryOptions.where, ...conditions };
        return this;
    }

    /**
     * Order results
     */
    orderBy(column: string, direction: 'ASC' | 'DESC' = 'ASC'): this {
        this.queryOptions.orderBy = column;
        this.queryOptions.orderDir = direction;
        return this;
    }

    /**
     * Limit results
     */
    limit(count: number): this {
        this.queryOptions.limit = count;
        return this;
    }

    /**
     * Skip results
     */
    offset(count: number): this {
        this.queryOptions.offset = count;
        return this;
    }

    /**
     * Paginate results
     */
    page(pageNumber: number, pageSize: number = 50): this {
        this.queryOptions.page = pageNumber;
        this.queryOptions.limit = pageSize;
        return this;
    }

    /**
     * Execute SELECT query
     */
    async select<T = any>(): Promise<QueryResult<T>> {
        const params = new URLSearchParams();

        if (this.queryOptions.page) params.set('page', String(this.queryOptions.page));
        if (this.queryOptions.limit) params.set('limit', String(this.queryOptions.limit));
        if (this.queryOptions.orderBy) params.set('orderBy', this.queryOptions.orderBy);
        if (this.queryOptions.orderDir) params.set('orderDir', this.queryOptions.orderDir);

        // Add where conditions as query params
        if (this.queryOptions.where) {
            for (const [key, value] of Object.entries(this.queryOptions.where)) {
                params.set(key, String(value));
            }
        }

        const queryString = params.toString();
        const url = `/tables/${this.tableName}/rows${queryString ? `?${queryString}` : ''}`;

        return this.client.request<QueryResult<T>>(url, 'GET');
    }

    /**
     * Insert a new row
     */
    async insert(data: Record<string, any>): Promise<InsertResult> {
        return this.client.request<InsertResult>(
            `/tables/${this.tableName}/rows`,
            'POST',
            data
        );
    }

    /**
     * Insert multiple rows
     */
    async insertMany(data: Record<string, any>[]): Promise<{ message: string; rows: InsertResult[] }> {
        return this.client.request(
            `/tables/${this.tableName}/rows`,
            'POST',
            data
        );
    }

    /**
     * Update rows matching WHERE conditions
     */
    async update(data: Record<string, any>): Promise<UpdateResult> {
        return this.client.request<UpdateResult>(
            `/tables/${this.tableName}/rows`,
            'PUT',
            { data, where: this.queryOptions.where }
        );
    }

    /**
     * Update a specific row by ID
     */
    async updateById(rowId: number, data: Record<string, any>): Promise<{ message: string; data: Record<string, any> }> {
        return this.client.request(
            `/tables/${this.tableName}/rows/${rowId}`,
            'PUT',
            data
        );
    }

    /**
     * Delete rows matching WHERE conditions
     */
    async delete(): Promise<DeleteResult> {
        if (!this.queryOptions.where || Object.keys(this.queryOptions.where).length === 0) {
            throw new Error('WHERE conditions required for delete. Use deleteById() for single row deletion.');
        }

        return this.client.request<DeleteResult>(
            `/tables/${this.tableName}/rows`,
            'DELETE',
            { where: this.queryOptions.where }
        );
    }

    /**
     * Delete a specific row by ID
     */
    async deleteById(rowId: number): Promise<{ message: string }> {
        return this.client.request(
            `/tables/${this.tableName}/rows/${rowId}`,
            'DELETE'
        );
    }

    /**
     * Count rows matching conditions
     */
    async count(): Promise<number> {
        const result = await this.limit(1).select();
        return result.pagination?.total ?? 0;
    }

    /**
     * Get first row matching conditions
     */
    async first<T = any>(): Promise<T | null> {
        const result = await this.limit(1).select<T>();
        return result.data[0] ?? null;
    }
}

/**
 * JT Mobamba MCP Client
 *
 * @example
 * ```typescript
 * const db = new JTMobamba({
 *     apiKey: 'jtm_your_api_key',
 *     secretKey: 'jtms_your_secret_key'
 * });
 *
 * // Fetch data
 * const users = await db.table('users').select();
 *
 * // Insert data
 * await db.table('users').insert({ name: 'John', email: 'john@example.com' });
 * ```
 */
export class JTMobamba {
    private apiKey: string;
    private secretKey: string;
    private baseUrl: string;
    private timeout: number;

    constructor(config: JTMobambaConfig) {
        if (!config.apiKey || !config.secretKey) {
            throw new Error('apiKey and secretKey are required');
        }

        this.apiKey = config.apiKey;
        this.secretKey = config.secretKey;
        this.baseUrl = config.baseUrl || 'https://api.jtmobamba.com/api/database/v1/data';
        this.timeout = config.timeout || 30000;
    }

    /**
     * Make an API request
     */
    async request<T = any>(endpoint: string, method: string = 'GET', body?: any): Promise<T> {
        const url = `${this.baseUrl}${endpoint}`;

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);

        try {
            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'X-API-Key': this.apiKey,
                    'X-API-Secret': this.secretKey
                },
                body: body ? JSON.stringify(body) : undefined,
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || `Request failed with status ${response.status}`);
            }

            return data;
        } catch (error: any) {
            clearTimeout(timeoutId);

            if (error.name === 'AbortError') {
                throw new Error('Request timeout');
            }
            throw error;
        }
    }

    /**
     * Start a query on a table
     */
    table(tableName: string): TableQuery {
        return new TableQuery(this, tableName);
    }

    /**
     * Execute raw SQL query
     */
    async sql<T = any>(query: string): Promise<{ success: boolean; queryType: string; result: T; queryTime: string }> {
        return this.request('/sql', 'POST', { sql: query });
    }

    /**
     * Get collection info and list of tables
     */
    async info(): Promise<{ collection: { id: string; name: string; description: string }; tables: TableInfo[] }> {
        return this.request('/info');
    }

    /**
     * List all tables
     */
    async tables(): Promise<{ tables: TableInfo[] }> {
        return this.request('/tables');
    }

    /**
     * Get table structure
     */
    async describe(tableName: string): Promise<{ table: TableInfo }> {
        return this.request(`/tables/${tableName}`);
    }

    /**
     * Test connection
     */
    async ping(): Promise<boolean> {
        try {
            await this.info();
            return true;
        } catch {
            return false;
        }
    }
}

// Default export
export default JTMobamba;

// Named exports for CommonJS compatibility
module.exports = JTMobamba;
module.exports.JTMobamba = JTMobamba;
module.exports.default = JTMobamba;

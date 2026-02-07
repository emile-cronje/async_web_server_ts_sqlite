"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sqlite3_1 = __importDefault(require("sqlite3"));
const sqlite_1 = require("sqlite");
const path_1 = __importDefault(require("path"));
let db = null;
// Initialize database connection
async function initDb() {
    if (db)
        return db;
    db = await (0, sqlite_1.open)({
        filename: path_1.default.join(__dirname, "app.db"),
        driver: sqlite3_1.default.Database
    });
    // Enable foreign keys and WAL mode
    await db.exec("PRAGMA foreign_keys = ON");
    await db.exec("PRAGMA journal_mode = WAL");
    return db;
}
class DbWrapper {
    async beginTransaction() {
        const database = await initDb();
        await database.exec("BEGIN TRANSACTION");
    }
    async commit() {
        const database = await initDb();
        await database.exec("COMMIT");
    }
    async rollback() {
        const database = await initDb();
        await database.exec("ROLLBACK");
    }
    async query(sql, params) {
        try {
            const database = await initDb();
            // Trim whitespace from SQL
            sql = sql.trim();
            if (params && params.length > 0) {
                // Convert boolean values to 0/1 for SQLite
                const convertedParams = params.map(param => {
                    if (typeof param === 'boolean') {
                        return param ? 1 : 0;
                    }
                    return param;
                });
                // Convert pg-style placeholders ($1, $2, etc.) to ?
                let convertedSql = sql;
                let paramIndex = 1;
                while (convertedSql.includes(`$${paramIndex}`)) {
                    convertedSql = convertedSql.replace(`$${paramIndex}`, "?");
                    paramIndex++;
                }
                // Handle INSERT/UPDATE/DELETE with RETURNING clause
                if (sql.toUpperCase().includes("RETURNING")) {
                    const result = await database.run(convertedSql, ...convertedParams);
                    // SQLite doesn't support RETURNING, so we need to fetch the data
                    const sqlUpper = sql.toUpperCase();
                    const selectSql = sql.substring(0, sql.toUpperCase().indexOf("RETURNING")).trim();
                    const tableName = this.getTableName(selectSql);
                    let fetchedRow = null;
                    // For INSERT queries, use lastID
                    if (sqlUpper.includes("INSERT")) {
                        if (result.lastID) {
                            fetchedRow = await database.get(`SELECT * FROM ${tableName} WHERE id = ?`, result.lastID);
                        }
                    }
                    // For UPDATE queries, extract the ID from WHERE clause
                    else if (sqlUpper.includes("UPDATE")) {
                        const whereMatch = selectSql.match(/WHERE\s+id\s*=\s*\?/i);
                        if (whereMatch && convertedParams.length > 0) {
                            // The ID is typically the last parameter in an UPDATE WHERE id = ? query
                            const idParam = convertedParams[convertedParams.length - 1];
                            fetchedRow = await database.get(`SELECT * FROM ${tableName} WHERE id = ?`, idParam);
                        }
                    }
                    const rows = fetchedRow ? [fetchedRow] : [];
                    return { rows };
                }
                // Handle SELECT queries
                if (sql.toUpperCase().startsWith("SELECT")) {
                    const rows = await database.all(convertedSql, ...convertedParams);
                    return { rows };
                }
                // Handle INSERT/UPDATE/DELETE
                await database.run(convertedSql, ...convertedParams);
                return { rows: [] };
            }
            else {
                // No parameters
                if (sql.toUpperCase().includes("RETURNING")) {
                    await database.run(sql);
                    return { rows: [] };
                }
                if (sql.toUpperCase().startsWith("SELECT")) {
                    const rows = await database.all(sql);
                    return { rows };
                }
                await database.run(sql);
                return { rows: [] };
            }
        }
        catch (error) {
            console.error("Database error:", error);
            throw error;
        }
    }
    getTableName(sql) {
        const fromMatch = sql.match(/FROM\s+(\w+)/i);
        if (fromMatch)
            return fromMatch[1];
        const updateMatch = sql.match(/UPDATE\s+(\w+)/i);
        if (updateMatch)
            return updateMatch[1];
        const insertMatch = sql.match(/INSERT\s+INTO\s+(\w+)/i);
        if (insertMatch)
            return insertMatch[1];
        return "";
    }
}
const pool = new DbWrapper();
exports.default = pool;
//# sourceMappingURL=dbConfig.js.map
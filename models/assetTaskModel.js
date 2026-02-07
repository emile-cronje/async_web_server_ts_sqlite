"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AssetTaskModel = void 0;
const dbConfig_1 = __importDefault(require("../db/dbConfig"));
const dbMapper_1 = require("../db/dbMapper");
const AssetTaskMapper = new dbMapper_1.DbMapper({
    id: "id",
    version: "version",
    client_id: "clientId",
    message_id: "messageId",
    code: "code",
    description: "description",
    is_rfs: "isRfs",
    asset_id: "assetId"
});
class AssetTaskModel {
    async Initialise() {
        await dbConfig_1.default.query("DROP TABLE IF EXISTS asset_task");
        await dbConfig_1.default.query("CREATE TABLE IF NOT EXISTS asset_task(id INTEGER PRIMARY KEY AUTOINCREMENT, asset_id INTEGER NOT NULL, version INTEGER NOT NULL, client_id INTEGER NOT NULL, message_id TEXT, code TEXT NOT NULL UNIQUE, description TEXT NOT NULL, is_rfs BOOLEAN NOT NULL)");
        await dbConfig_1.default.query("CREATE UNIQUE INDEX IF NOT EXISTS index_asset_task_id_client_id ON asset_task(id, client_id)");
    }
    ;
    async GetAssetTasks() {
        const result = await dbConfig_1.default.query("SELECT * FROM asset_task");
        return result.rows;
    }
    async GetAssetTaskById(id) {
        const result = await dbConfig_1.default.query("SELECT * FROM asset_task WHERE id = ?", [id]);
        let assetTask = null;
        if (result.rows != null && (result.rows.length > 0))
            assetTask = AssetTaskMapper.map(result.rows[0]);
        return assetTask;
    }
    async CreateAssetTask(assetTask) {
        const insertResult = await dbConfig_1.default.query("INSERT INTO asset_task (client_id, version, message_id, asset_id, code, description, is_rfs) VALUES (?, ?, ?, ?, ?, ?, ?) RETURNING *", [assetTask['clientId'], 0, assetTask['messageId'], assetTask['assetId'], assetTask['code'], assetTask['description'], assetTask['isRfs']]);
        let newAssetTask = null;
        if (insertResult.rows != null && (insertResult.rows.length > 0))
            newAssetTask = AssetTaskMapper.map(insertResult.rows[0]);
        return newAssetTask;
    }
    async UpdateAssetTask(id, assetTask) {
        try {
            await dbConfig_1.default.beginTransaction();
            // Read current version
            const versionResult = await dbConfig_1.default.query("SELECT version FROM asset_task WHERE id = ?", [id]);
            if (!versionResult.rows || versionResult.rows.length === 0) {
                await dbConfig_1.default.rollback();
                return null;
            }
            const currentVersion = versionResult.rows[0].version;
            const newVersion = currentVersion + 1;
            // Update record without RETURNING
            await dbConfig_1.default.query("UPDATE asset_task SET code = ?, description = ?, is_rfs = ?, message_id = ?, version = ? WHERE id = ?", [assetTask['code'], assetTask['description'], assetTask['isRfs'], assetTask['messageId'], newVersion, id]);
            // Select the updated record
            const selectResult = await dbConfig_1.default.query("SELECT * FROM asset_task WHERE id = ?", [id]);
            await dbConfig_1.default.commit();
            let updatedAssetTask = null;
            if (selectResult.rows != null && selectResult.rows.length > 0)
                updatedAssetTask = AssetTaskMapper.map(selectResult.rows[0]);
            return updatedAssetTask;
        }
        catch (error) {
            await dbConfig_1.default.rollback();
            throw error;
        }
    }
    async GetAssetTasksCount() {
        const result = await dbConfig_1.default.query("SELECT COUNT(id) as count FROM asset_task");
        return parseInt(result.rows[0].count, 10);
    }
    ;
    async DeleteAllAssetTasks() {
        return await dbConfig_1.default.query("DELETE FROM asset_task");
    }
    ;
    async DeleteAssetTask(id) {
        return await dbConfig_1.default.query("DELETE FROM asset_task WHERE id = ?", [id]);
    }
    ;
    async GetAssetTaskIdsForAsset(assetId) {
        return await dbConfig_1.default.query('SELECT id FROM asset_task WHERE asset_id = ?', [assetId]);
    }
    ;
}
exports.AssetTaskModel = AssetTaskModel;
//# sourceMappingURL=assetTaskModel.js.map
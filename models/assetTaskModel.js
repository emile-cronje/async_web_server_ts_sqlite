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
        await dbConfig_1.default.query("CREATE INDEX IF NOT EXISTS index_asset_task_asset_id ON asset_task(asset_id)");
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
        await dbConfig_1.default.query("UPDATE asset_task SET code = ?, description = ?, is_rfs = ?, message_id = ? WHERE id = ?", [assetTask['code'], assetTask['description'], assetTask['isRfs'], assetTask['messageId'], id]);
        const selectResult = await dbConfig_1.default.query("SELECT * FROM asset_task WHERE id = ?", [id]);
        let updatedAssetTask = null;
        if (selectResult.rows != null && selectResult.rows.length > 0)
            updatedAssetTask = AssetTaskMapper.map(selectResult.rows[0]);
        return updatedAssetTask;
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
    async GetAssetTasksForAsset(assetId) {
        const result = await dbConfig_1.default.query("SELECT * FROM asset_task WHERE asset_id = ?", [assetId]);
        return AssetTaskMapper.mapList(result.rows);
    }
    async DeleteAssetTasksForAsset(assetId) {
        return await dbConfig_1.default.query("DELETE FROM asset_task WHERE asset_id = ?", [assetId]);
    }
}
exports.AssetTaskModel = AssetTaskModel;
//# sourceMappingURL=assetTaskModel.js.map
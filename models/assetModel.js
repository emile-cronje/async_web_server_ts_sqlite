"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AssetModel = void 0;
const dbConfig_1 = __importDefault(require("../db/dbConfig"));
const dbMapper_1 = require("../db/dbMapper");
const AssetMapper = new dbMapper_1.DbMapper({
    id: "id",
    version: "version",
    client_id: "clientId",
    message_id: "messageId",
    guid: "guid",
    code: "code",
    description: "description",
    is_msi: "isMsi"
});
class AssetModel {
    async Initialise() {
        await dbConfig_1.default.query('DROP TABLE IF EXISTS asset_task');
        await dbConfig_1.default.query("DROP TABLE IF EXISTS asset");
        await dbConfig_1.default.query("CREATE TABLE IF NOT EXISTS asset(id INTEGER PRIMARY KEY AUTOINCREMENT, version INTEGER NOT NULL, client_id INTEGER NOT NULL, message_id TEXT, guid TEXT NOT NULL, code TEXT NOT NULL UNIQUE, description TEXT NOT NULL, is_msi BOOLEAN NOT NULL)");
        await dbConfig_1.default.query("CREATE UNIQUE INDEX IF NOT EXISTS index_asset_id_client_id ON asset(id, client_id)");
    }
    ;
    async GetAssets() {
        const result = await dbConfig_1.default.query("SELECT * FROM asset");
        return result.rows;
    }
    async GetAssetById(id) {
        const result = await dbConfig_1.default.query("SELECT * FROM asset WHERE id = ?", [id]);
        let asset = null;
        if (result.rows != null && (result.rows.length > 0))
            asset = AssetMapper.map(result.rows[0]);
        return asset;
    }
    async CreateAsset(asset) {
        const insertResult = await dbConfig_1.default.query("INSERT INTO asset (client_id, guid, version, message_id, code, description, is_msi) VALUES (?, ?, ?, ?, ?, ?, ?) RETURNING *", [asset['clientId'], asset['guid'], 0, asset['messageId'], asset['code'], asset['description'], asset['isMsi']]);
        let newAsset = null;
        if (insertResult.rows != null && (insertResult.rows.length > 0))
            newAsset = AssetMapper.map(insertResult.rows[0]);
        return newAsset;
    }
    async UpdateAsset(id, asset) {
        try {
            await dbConfig_1.default.beginTransaction();
            // Read current version
            const versionResult = await dbConfig_1.default.query("SELECT version FROM asset WHERE id = ?", [id]);
            if (!versionResult.rows || versionResult.rows.length === 0) {
                await dbConfig_1.default.rollback();
                return null;
            }
            const currentVersion = versionResult.rows[0].version;
            const newVersion = currentVersion + 1;
            // Update record without RETURNING
            await dbConfig_1.default.query("UPDATE asset SET code = ?, description = ?, is_msi = ?, message_id = ?, version = ? WHERE id = ?", [asset['code'], asset['description'], asset['isMsi'], asset['messageId'], newVersion, id]);
            // Select the updated record
            const selectResult = await dbConfig_1.default.query("SELECT * FROM asset WHERE id = ?", [id]);
            await dbConfig_1.default.commit();
            let updatedAsset = null;
            if (selectResult.rows != null && selectResult.rows.length > 0)
                updatedAsset = AssetMapper.map(selectResult.rows[0]);
            return updatedAsset;
        }
        catch (error) {
            await dbConfig_1.default.rollback();
            throw error;
        }
    }
    async GetAssetsCount() {
        const result = await dbConfig_1.default.query("SELECT COUNT(id) as count FROM asset");
        return parseInt(result.rows[0].count, 10);
    }
    ;
    async DeleteAllAssets() {
        return await dbConfig_1.default.query("DELETE FROM asset");
    }
    ;
    async DeleteAsset(id) {
        return await dbConfig_1.default.query("DELETE FROM asset WHERE id = ?", [id]);
    }
    ;
}
exports.AssetModel = AssetModel;
//# sourceMappingURL=assetModel.js.map
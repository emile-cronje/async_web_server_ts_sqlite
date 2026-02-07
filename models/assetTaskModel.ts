import pool from "../db/dbConfig"
import {DbMapper} from "../db/dbMapper";

export interface AssetTask {
    id: number;
    version: number;
    clientId: string;
    messageId?: string;
    assetId: number;    
    code: string;
    description: string;
    isRfs: boolean;
}

const AssetTaskMapper = new DbMapper<AssetTask>({
    id: "id",
    version: "version",
    client_id: "clientId",
    message_id: "messageId",
    code: "code",
    description: "description",
    is_rfs: "isRfs",
    asset_id: "assetId"    
});

export class AssetTaskModel {
    async Initialise(): Promise<void> {
        await pool.query("DROP TABLE IF EXISTS asset_task");
        await pool.query(
            "CREATE TABLE IF NOT EXISTS asset_task(id INTEGER PRIMARY KEY AUTOINCREMENT, asset_id INTEGER NOT NULL, version INTEGER NOT NULL, client_id INTEGER NOT NULL, message_id TEXT, code TEXT NOT NULL UNIQUE, description TEXT NOT NULL, is_rfs BOOLEAN NOT NULL)");

        await pool.query("CREATE UNIQUE INDEX IF NOT EXISTS index_asset_task_id_client_id ON asset_task(id, client_id)");
        await pool.query("CREATE INDEX IF NOT EXISTS index_asset_task_asset_id ON asset_task(asset_id)");
    };

    async GetAssetTasks(): Promise<AssetTask[]> {
        const result = await pool.query("SELECT * FROM asset_task");
        return result.rows;
    }

    async GetAssetTaskById(id: number): Promise<AssetTask | null> {
        const result = await pool.query("SELECT * FROM asset_task WHERE id = ?", [id]);

        let assetTask: any = null;

        if (result.rows != null && (result.rows.length > 0))
            assetTask = AssetTaskMapper.map(result.rows[0]);

        return assetTask;
    }

    async CreateAssetTask(assetTask: any): Promise<AssetTask> {
        const insertResult = await pool.query(
            "INSERT INTO asset_task (client_id, version, message_id, asset_id, code, description, is_rfs) VALUES (?, ?, ?, ?, ?, ?, ?) RETURNING *",
            [assetTask['clientId'], 0, assetTask['messageId'], assetTask['assetId'], assetTask['code'], assetTask['description'], assetTask['isRfs']]
        );

        let newAssetTask: any = null;

        if (insertResult.rows != null && (insertResult.rows.length > 0))
            newAssetTask = AssetTaskMapper.map(insertResult.rows[0]);

        return newAssetTask;                        
    }

    async UpdateAssetTask(id: number, assetTask: any): Promise<AssetTask | null> {
        await pool.query(
            "UPDATE asset_task SET code = ?, description = ?, is_rfs = ?, message_id = ? WHERE id = ?",
            [assetTask['code'], assetTask['description'], assetTask['isRfs'], assetTask['messageId'], id]
        );

        const selectResult = await pool.query(
            "SELECT * FROM asset_task WHERE id = ?",
            [id]
        );

        let updatedAssetTask: any = null;

        if (selectResult.rows != null && selectResult.rows.length > 0)
            updatedAssetTask = AssetTaskMapper.map(selectResult.rows[0]);

        return updatedAssetTask;
    }

    async GetAssetTasksCount(): Promise<any> {
        const result = await pool.query("SELECT COUNT(id) as count FROM asset_task");
        return parseInt(result.rows[0].count, 10);
    };

    async DeleteAllAssetTasks(): Promise<any> {
        return await pool.query(
            "DELETE FROM asset_task");
    };

    async DeleteAssetTask(id: number): Promise<any> {
        return await pool.query(
            "DELETE FROM asset_task WHERE id = ?",
            [id]);
    };

    async GetAssetTaskIdsForAsset(assetId: number): Promise<any> {
        return await pool.query('SELECT id FROM asset_task WHERE asset_id = ?', [assetId]);
    };

    async GetAssetTasksForAsset(assetId: number): Promise<AssetTask[]> {
        const result = await pool.query("SELECT * FROM asset_task WHERE asset_id = ?", [assetId]);
        return AssetTaskMapper.mapList(result.rows);
    }

    async DeleteAssetTasksForAsset(assetId: number): Promise<any> {
        return await pool.query("DELETE FROM asset_task WHERE asset_id = ?", [assetId]);
    }
}

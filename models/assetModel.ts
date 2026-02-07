import pool from "../db/dbConfig"
import {DbMapper} from "../db/dbMapper";

export interface Asset {
    id: number;
    version: number;
    clientId: string;
    messageId?: string;
    guid: string;
    code: string;
    description: string;
    isMsi: boolean;
}

const AssetMapper = new DbMapper<Asset>({
    id: "id",
    version: "version",
    client_id: "clientId",
    message_id: "messageId",
    guid: "guid",    
    code: "code",
    description: "description",
    is_msi: "isMsi"
});

export class AssetModel {
    async Initialise(): Promise<void> {
        await pool.query('DROP TABLE IF EXISTS asset_task')        
        await pool.query("DROP TABLE IF EXISTS asset");
        await pool.query(
            "CREATE TABLE IF NOT EXISTS asset(id INTEGER PRIMARY KEY AUTOINCREMENT, version INTEGER NOT NULL, client_id INTEGER NOT NULL, message_id TEXT, guid TEXT NOT NULL, code TEXT NOT NULL UNIQUE, description TEXT NOT NULL, is_msi BOOLEAN NOT NULL)");

        await pool.query("CREATE UNIQUE INDEX IF NOT EXISTS index_asset_id_client_id ON asset(id, client_id)");
    };

    async GetAssets(): Promise<Asset[]> {
        const result = await pool.query("SELECT * FROM asset");
        return result.rows;
    }

    async GetAssetById(id: number): Promise<Asset | null> {
        const result = await pool.query("SELECT * FROM asset WHERE id = ?", [id]);

        let asset: any = null;

        if (result.rows != null && (result.rows.length > 0))
            asset = AssetMapper.map(result.rows[0]);

        return asset;
    }

    async CreateAsset(asset: any): Promise<Asset> {
        const insertResult = await pool.query(
            "INSERT INTO asset (client_id, guid, version, message_id, code, description, is_msi) VALUES (?, ?, ?, ?, ?, ?, ?) RETURNING *",
            [asset['clientId'], asset['guid'], 0, asset['messageId'], asset['code'], asset['description'], asset['isMsi']]
        );

        let newAsset: any = null;

        if (insertResult.rows != null && (insertResult.rows.length > 0))
            newAsset = AssetMapper.map(insertResult.rows[0]);

        return newAsset;                
    }

    async UpdateAsset(id: number, asset: any): Promise<Asset | null> {
        await pool.query(
            "UPDATE asset SET code = ?, description = ?, is_msi = ?, message_id = ? WHERE id = ?",
            [asset['code'], asset['description'], asset['isMsi'], asset['messageId'], id]
        );

        const selectResult = await pool.query(
            "SELECT * FROM asset WHERE id = ?",
            [id]
        );

        let updatedAsset: any = null;

        if (selectResult.rows != null && selectResult.rows.length > 0)
            updatedAsset = AssetMapper.map(selectResult.rows[0]);

        return updatedAsset;
    }

    async GetAssetsCount(): Promise<any> {
        const result = await pool.query("SELECT COUNT(id) as count FROM asset");
        return parseInt(result.rows[0].count, 10);
    };

    async DeleteAllAssets(): Promise<any> {
        return await pool.query(
            "DELETE FROM asset");
    };

    async DeleteAsset(id: number): Promise<any> {
        return await pool.query(
            "DELETE FROM asset WHERE id = ?",
            [id]);
    };
}

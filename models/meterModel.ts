import pool from "../db/dbConfig"
import {DbMapper} from "../db/dbMapper";

export interface Meter {
    id: number;
    version: number;
    clientId: string;
    messageId?: string;
    guid?: string;
    code: string;
    description: string;
    isPaused: boolean;
    adr: number;
}

const MeterMapper = new DbMapper<Meter>({
    id: "id",
    version: "version",
    client_id: "clientId",
    message_id: "messageId",
    guid: "guid",    
    code: "code",
    description: "description",
    is_paused: "isPaused",
    adr: "adr"
});

export class MeterModel {
    async Initialise(): Promise<void> {
        await pool.query('DROP TABLE IF EXISTS meter_reading');
        await pool.query("DROP TABLE IF EXISTS meter");
        await pool.query(
            "CREATE TABLE IF NOT EXISTS meter(id INTEGER PRIMARY KEY AUTOINCREMENT, version INTEGER NOT NULL, client_id INTEGER NOT NULL, message_id TEXT UNIQUE, guid TEXT NOT NULL, code TEXT NOT NULL UNIQUE, description TEXT NOT NULL, adr REAL, is_paused BOOLEAN NOT NULL)");

        await pool.query("CREATE UNIQUE INDEX IF NOT EXISTS index_meter_message_id ON meter(message_id)");
    };

    async GetMeters(): Promise<Meter[]> {
        const result = await pool.query("SELECT * FROM meter");
        return result.rows;
    }

    async GetMeterById(id: number): Promise<Meter | null> {
        const result = await pool.query("SELECT * FROM meter WHERE id = ?", [id]);

        let meter: any = null;

        if (result.rows != null && (result.rows.length > 0))
            meter = MeterMapper.map(result.rows[0]);

        return meter;
    }

    async GetMeterAdr(id: number): Promise<number | null> {
        const result = await pool.query(`
SELECT AVG(COALESCE(daily_rate, 0)) AS average_daily_rate
FROM (
    SELECT
        (reading - LAG(reading) OVER (ORDER BY reading_on)) * 1.0
        /
        NULLIF(
            julianday(date(reading_on)) -
            julianday(date(LAG(reading_on) OVER (ORDER BY reading_on))),
            0
        ) AS daily_rate
    FROM meter_reading
    WHERE meter_id = ?
) AS daily_rates;
        `, [id]);

        let adr = result.rows[0]?.average_daily_rate ?? 0
        return parseFloat(adr);
    }    

    async CreateMeter(meter: any): Promise<Meter> {
        const insertResult = await pool.query(
            "INSERT INTO meter (client_id, guid, version, message_id, code, description, is_paused, adr) VALUES (?, ?, ?, ?, ?, ?, ?, ?) RETURNING *",
            [meter['clientId'], meter['guid'], 0, meter['messageId'], meter['code'], meter['description'], false, 0]
        );

        let newMeter: any = null;

        if (insertResult.rows != null && (insertResult.rows.length > 0))
            newMeter = MeterMapper.map(insertResult.rows[0]);

        return newMeter;                
    }

    async UpdateMeter(id: number, meter: any): Promise<Meter | null> {
        await pool.query(
            "UPDATE meter SET code = ?, description = ?, is_paused = ?, message_id = ? WHERE id = ?",
            [meter['code'], meter['description'], meter['isPaused'], meter['messageId'], id]
        );

        const selectResult = await pool.query(
            "SELECT * FROM meter WHERE id = ?",
            [id]
        );

        let updatedMeter: any = null;

        if (selectResult.rows != null && selectResult.rows.length > 0)
            updatedMeter = MeterMapper.map(selectResult.rows[0]);

        return updatedMeter;
    }

    async GetMetersCount(): Promise<any> {
        const result = await pool.query("SELECT COUNT(id) as count FROM meter");
        return parseInt(result.rows[0].count, 10);
    };

    async DeleteAllMeters(): Promise<any> {
        return await pool.query(
            "DELETE FROM meter");
    };

    async DeleteMeter(id: number): Promise<any> {
        return await pool.query(
            "DELETE FROM meter WHERE id = ?",
            [id]);
    };
}

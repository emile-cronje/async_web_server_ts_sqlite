import pool from "../db/dbConfig"
import {DbMapper} from "../db/dbMapper";

export interface MeterReading {
    id: number;
    version: number;
    clientId: string;
    messageId?: string;
    meterId: number;
    reading: number;
    readingOn: Date
}

const MeterReadingMapper = new DbMapper<MeterReading>({
    id: "id",
    version: "version",
    client_id: "clientId",
    message_id: "messageId",
    meter_id: "meterId",
    reading: "reading",
    reading_on: "readingOn"
});

export class MeterReadingModel {
    async Initialise(): Promise<void> {
        await pool.query('DROP TABLE IF EXISTS meter_reading')
        await pool.query('CREATE TABLE IF NOT EXISTS meter_reading(id INTEGER PRIMARY KEY AUTOINCREMENT, version INTEGER NOT NULL, client_id INTEGER NOT NULL, message_id TEXT UNIQUE, meter_id INTEGER NOT NULL, reading REAL, reading_on TIMESTAMP, CONSTRAINT fk_meter FOREIGN KEY(meter_id) REFERENCES meter(id))')

        await pool.query('CREATE UNIQUE INDEX IF NOT EXISTS index_meter_reading_id_client_id ON meter_reading(id, client_id)')
        await pool.query("CREATE UNIQUE INDEX IF NOT EXISTS index_meter_reading_message_id ON meter_reading(message_id)");
        await pool.query('CREATE INDEX IF NOT EXISTS index_meter_reading_meter_id ON meter_reading(meter_id)');
        await pool.query('CREATE INDEX IF NOT EXISTS index_meter_reading_meter_id_reading_on ON meter_reading(meter_id, reading_on)');                                
    };

    async GetMeterReadings(): Promise<MeterReading[]> {
        const result = await pool.query("SELECT * FROM meter_reading");
        return result.rows;
    }

    async GetMeterReadingById(id: number): Promise<MeterReading | null> {
        const result = await pool.query("SELECT * FROM meter_reading WHERE id = ?", [id]);

        let reading: any = null;

        if (result.rows != null && (result.rows.length > 0))
            reading = MeterReadingMapper.map(result.rows[0]);

        return reading;
    }

    async CreateMeterReading(meterReading: any): Promise<MeterReading> {
        const insertResult = await pool.query(
            "INSERT INTO meter_reading (client_id, version, message_id, meter_id, reading, reading_on) VALUES (?, ?, ?, ?, ?, ?) RETURNING *",
            [meterReading['clientId'], 0, meterReading['messageId'], meterReading['meterId'], meterReading['reading'], meterReading['readingOn']]
        );

        let newMeterReading: any = null;

        if (insertResult.rows != null && (insertResult.rows.length > 0))
            newMeterReading = MeterReadingMapper.map(insertResult.rows[0]);

        return newMeterReading;                
    }

    async UpdateMeterReading(id: number, meterReading: any): Promise<MeterReading | null> {
        try {
            await pool.beginTransaction();
            
            // Read current version
            const versionResult = await pool.query(
                "SELECT version FROM meter_reading WHERE id = ?",
                [id]
            );
            
            if (!versionResult.rows || versionResult.rows.length === 0) {
                await pool.rollback();
                return null;
            }
            
            const currentVersion = versionResult.rows[0].version;
            const newVersion = currentVersion + 1;
            
            // Update record without RETURNING
            await pool.query(
                "UPDATE meter_reading SET reading = ?, reading_on = ?, message_id = ?, version = ? WHERE id = ?",
                [meterReading['reading'], meterReading['readingOn'], meterReading['messageId'], newVersion, id]
            );
            
            // Select the updated record
            const selectResult = await pool.query(
                "SELECT * FROM meter_reading WHERE id = ?",
                [id]
            );
            
            await pool.commit();
            
            let updatedMeterReading: any = null;
            
            if (selectResult.rows != null && selectResult.rows.length > 0)
                updatedMeterReading = MeterReadingMapper.map(selectResult.rows[0]);
            
            return updatedMeterReading;
        } catch (error) {
            await pool.rollback();
            throw error;
        }
    }

    async GetMeterReadingsCount(): Promise<any> {
        const result = await pool.query("SELECT COUNT(id) as count FROM meter_reading");
        return parseInt(result.rows[0].count, 10);
    };

    async DeleteAllMeterReadings(): Promise<any> {
        return await pool.query(
            "DELETE FROM meter_reading");
    };

    async DeleteMeterReading(id: number): Promise<any> {
        return await pool.query(
            "DELETE FROM meter_reading WHERE id = ?",
            [id]);
    };

    async GetMeterReadingIdsForMeter(meterId: number): Promise<any> {
        return await pool.query('SELECT * FROM meter_reading WHERE meter_id = ?', [meterId]);
    };
}
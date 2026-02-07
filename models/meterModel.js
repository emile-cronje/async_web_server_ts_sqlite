"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MeterModel = void 0;
const dbConfig_1 = __importDefault(require("../db/dbConfig"));
const dbMapper_1 = require("../db/dbMapper");
const MeterMapper = new dbMapper_1.DbMapper({
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
class MeterModel {
    async Initialise() {
        await dbConfig_1.default.query('DROP TABLE IF EXISTS meter_reading');
        await dbConfig_1.default.query("DROP TABLE IF EXISTS meter");
        await dbConfig_1.default.query("CREATE TABLE IF NOT EXISTS meter(id INTEGER PRIMARY KEY AUTOINCREMENT, version INTEGER NOT NULL, client_id INTEGER NOT NULL, message_id TEXT UNIQUE, guid TEXT NOT NULL, code TEXT NOT NULL UNIQUE, description TEXT NOT NULL, adr REAL, is_paused BOOLEAN NOT NULL)");
        await dbConfig_1.default.query("CREATE UNIQUE INDEX IF NOT EXISTS index_meter_message_id ON meter(message_id)");
    }
    ;
    async GetMeters() {
        const result = await dbConfig_1.default.query("SELECT * FROM meter");
        return result.rows;
    }
    async GetMeterById(id) {
        const result = await dbConfig_1.default.query("SELECT * FROM meter WHERE id = ?", [id]);
        let meter = null;
        if (result.rows != null && (result.rows.length > 0))
            meter = MeterMapper.map(result.rows[0]);
        return meter;
    }
    async GetMeterAdr(id) {
        const result = await dbConfig_1.default.query(`
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
        let adr = result.rows[0]?.average_daily_rate ?? 0;
        return parseFloat(adr);
    }
    async CreateMeter(meter) {
        const insertResult = await dbConfig_1.default.query("INSERT INTO meter (client_id, guid, version, message_id, code, description, is_paused, adr) VALUES (?, ?, ?, ?, ?, ?, ?, ?) RETURNING *", [meter['clientId'], meter['guid'], 0, meter['messageId'], meter['code'], meter['description'], false, 0]);
        let newMeter = null;
        if (insertResult.rows != null && (insertResult.rows.length > 0))
            newMeter = MeterMapper.map(insertResult.rows[0]);
        return newMeter;
    }
    async UpdateMeter(id, meter) {
        try {
            await dbConfig_1.default.beginTransaction();
            // Read current version
            const versionResult = await dbConfig_1.default.query("SELECT version FROM meter WHERE id = ?", [id]);
            if (!versionResult.rows || versionResult.rows.length === 0) {
                await dbConfig_1.default.rollback();
                return null;
            }
            const currentVersion = versionResult.rows[0].version;
            const newVersion = currentVersion + 1;
            // Update record without RETURNING
            await dbConfig_1.default.query("UPDATE meter SET code = ?, description = ?, is_paused = ?, message_id = ?, version = ? WHERE id = ?", [meter['code'], meter['description'], meter['isPaused'], meter['messageId'], newVersion, id]);
            // Select the updated record
            const selectResult = await dbConfig_1.default.query("SELECT * FROM meter WHERE id = ?", [id]);
            await dbConfig_1.default.commit();
            let updatedMeter = null;
            if (selectResult.rows != null && selectResult.rows.length > 0)
                updatedMeter = MeterMapper.map(selectResult.rows[0]);
            return updatedMeter;
        }
        catch (error) {
            await dbConfig_1.default.rollback();
            throw error;
        }
    }
    async GetMetersCount() {
        const result = await dbConfig_1.default.query("SELECT COUNT(id) as count FROM meter");
        return parseInt(result.rows[0].count, 10);
    }
    ;
    async DeleteAllMeters() {
        return await dbConfig_1.default.query("DELETE FROM meter");
    }
    ;
    async DeleteMeter(id) {
        return await dbConfig_1.default.query("DELETE FROM meter WHERE id = ?", [id]);
    }
    ;
}
exports.MeterModel = MeterModel;
//# sourceMappingURL=meterModel.js.map
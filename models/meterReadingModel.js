"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MeterReadingModel = void 0;
const dbConfig_1 = __importDefault(require("../db/dbConfig"));
const dbMapper_1 = require("../db/dbMapper");
const MeterReadingMapper = new dbMapper_1.DbMapper({
    id: "id",
    version: "version",
    client_id: "clientId",
    message_id: "messageId",
    meter_id: "meterId",
    reading: "reading",
    reading_on: "readingOn"
});
class MeterReadingModel {
    async Initialise() {
        await dbConfig_1.default.query('DROP TABLE IF EXISTS meter_reading');
        await dbConfig_1.default.query('CREATE TABLE IF NOT EXISTS meter_reading(id INTEGER PRIMARY KEY AUTOINCREMENT, version INTEGER NOT NULL, client_id INTEGER NOT NULL, message_id TEXT UNIQUE, meter_id INTEGER NOT NULL, reading REAL, reading_on TIMESTAMP, CONSTRAINT fk_meter FOREIGN KEY(meter_id) REFERENCES meter(id))');
        await dbConfig_1.default.query('CREATE UNIQUE INDEX IF NOT EXISTS index_meter_reading_id_client_id ON meter_reading(id, client_id)');
        await dbConfig_1.default.query("CREATE UNIQUE INDEX IF NOT EXISTS index_meter_reading_message_id ON meter_reading(message_id)");
        await dbConfig_1.default.query('CREATE INDEX IF NOT EXISTS index_meter_reading_meter_id ON meter_reading(meter_id)');
        await dbConfig_1.default.query('CREATE INDEX IF NOT EXISTS index_meter_reading_meter_id_reading_on ON meter_reading(meter_id, reading_on)');
    }
    ;
    async GetMeterReadings() {
        const result = await dbConfig_1.default.query("SELECT * FROM meter_reading");
        return result.rows;
    }
    async GetMeterReadingById(id) {
        const result = await dbConfig_1.default.query("SELECT * FROM meter_reading WHERE id = ?", [id]);
        let reading = null;
        if (result.rows != null && (result.rows.length > 0))
            reading = MeterReadingMapper.map(result.rows[0]);
        return reading;
    }
    async CreateMeterReading(meterReading) {
        const insertResult = await dbConfig_1.default.query("INSERT INTO meter_reading (client_id, version, message_id, meter_id, reading, reading_on) VALUES (?, ?, ?, ?, ?, ?) RETURNING *", [meterReading['clientId'], 0, meterReading['messageId'], meterReading['meterId'], meterReading['reading'], meterReading['readingOn']]);
        let newMeterReading = null;
        if (insertResult.rows != null && (insertResult.rows.length > 0))
            newMeterReading = MeterReadingMapper.map(insertResult.rows[0]);
        return newMeterReading;
    }
    async UpdateMeterReading(id, meterReading) {
        await dbConfig_1.default.query("UPDATE meter_reading SET reading = ?, reading_on = ?, message_id = ? WHERE id = ?", [meterReading['reading'], meterReading['readingOn'], meterReading['messageId'], id]);
        const selectResult = await dbConfig_1.default.query("SELECT * FROM meter_reading WHERE id = ?", [id]);
        let updatedMeterReading = null;
        if (selectResult.rows != null && selectResult.rows.length > 0)
            updatedMeterReading = MeterReadingMapper.map(selectResult.rows[0]);
        return updatedMeterReading;
    }
    async GetMeterReadingsCount() {
        const result = await dbConfig_1.default.query("SELECT COUNT(id) as count FROM meter_reading");
        return parseInt(result.rows[0].count, 10);
    }
    ;
    async DeleteAllMeterReadings() {
        return await dbConfig_1.default.query("DELETE FROM meter_reading");
    }
    ;
    async DeleteMeterReading(id) {
        return await dbConfig_1.default.query("DELETE FROM meter_reading WHERE id = ?", [id]);
    }
    ;
    async GetMeterReadingIdsForMeter(meterId) {
        return await dbConfig_1.default.query('SELECT id FROM meter_reading WHERE meter_id = ?', [meterId]);
    }
    ;
}
exports.MeterReadingModel = MeterReadingModel;
//# sourceMappingURL=meterReadingModel.js.map
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeleteMeterReadingsForMeter = exports.DeleteMeterReading = exports.DeleteAllMeterReadings = exports.GetMeterReadingsCount = exports.UpdateMeterReading = exports.CreateMeterReading = exports.GetMeterReadingById = void 0;
const meterReadingModel_1 = require("../models/meterReadingModel");
const mqtt_1 = __importDefault(require("mqtt"));
class MeterReadingController {
    constructor() {
        this.mqttClient = null;
        this.meterReadingModel = new meterReadingModel_1.MeterReadingModel();
        this.SetupProcessExitHandlers();
    }
    Initialise(broker) {
        this.InitializeMqttClient(broker);
    }
    InitializeMqttClient(mqttBroker) {
        let brokerConnectionString = "mqtt://" + mqttBroker + ":1883";
        this.mqttClient = mqtt_1.default.connect(brokerConnectionString);
        this.mqttClient.on("connect", () => {
            console.log("Meter Controller: Connected to MQTT broker: " + mqttBroker);
        });
    }
    async GetMeterReadingById(req, res) {
        try {
            const id = parseInt(req.params.id);
            const meterReading = await this.meterReadingModel.GetMeterReadingById(id);
            if (!meterReading) {
                return res.status(404).json({ message: "Meter Reading not found" });
            }
            res.json(meterReading);
        }
        catch (error) {
            console.error(error);
            res.status(500).json({ message: "Internal server error" });
        }
    }
    async CreateMeterReading(req, res) {
        let meterReadingData = JSON.parse(req.body.meterReadingData);
        let mqttSessionId = req.body.mqttSessionId;
        try {
            const createdMeterReading = await this.meterReadingModel.CreateMeterReading(meterReadingData);
            if (createdMeterReading != null) {
                const meterReadingData = {
                    mqttSessionId: mqttSessionId,
                    messageId: createdMeterReading.messageId,
                    clientId: createdMeterReading.clientId,
                    entityType: "MeterReading",
                    operation: "Create",
                    entity: JSON.stringify(createdMeterReading),
                    entityId: createdMeterReading.id
                };
                this.mqttClient?.publish("/entities", JSON.stringify(meterReadingData));
            }
            res.status(201).json(createdMeterReading);
        }
        catch (error) {
            console.error(error);
            res.status(500).json({ message: "Internal server error" });
        }
    }
    async UpdateMeterReading(req, res) {
        let meterReadingData = JSON.parse(req.body.meterReadingData);
        let mqttSessionId = req.body.mqttSessionId;
        try {
            const id = parseInt(req.params.id);
            // Check if the meter reading exists before attempting to update
            const existingMeterReading = await this.meterReadingModel.GetMeterReadingById(id);
            if (!existingMeterReading) {
                return res.status(404).json({ message: "Meter Reading not found" });
            }
            // Meter reading exists, proceed with update
            const updatedMeterReading = await this.meterReadingModel.UpdateMeterReading(id, meterReadingData);
            if (updatedMeterReading == null) {
                return res.status(404).json({ message: "Meter Reading not found" });
            }
            else {
                const meterReadingData = {
                    mqttSessionId: mqttSessionId,
                    messageId: updatedMeterReading.messageId,
                    clientId: updatedMeterReading.clientId,
                    entityType: "MeterReading",
                    operation: "Update",
                    entity: JSON.stringify(updatedMeterReading),
                    entityId: updatedMeterReading.id
                };
                this.mqttClient?.publish("/entities", JSON.stringify(meterReadingData));
                res.json(updatedMeterReading);
            }
        }
        catch (error) {
            console.error(error);
            res.status(500).json({ message: "Internal server error" });
        }
    }
    async GetMeterReadingsCount(req, res) {
        try {
            const count = await this.meterReadingModel.GetMeterReadingsCount();
            res.json(count);
        }
        catch (error) {
            res.status(500).json({ message: "Internal server error" });
        }
    }
    async DeleteAllMeterReadings(req, res) {
        try {
            const result = await this.meterReadingModel.DeleteAllMeterReadings();
            res.json(result);
        }
        catch (error) {
            res.status(500).json({ message: "Internal server error" });
        }
    }
    async DeleteMeterReading(req, res) {
        let mqttSessionId = req.body.mqttSessionId;
        try {
            const id = parseInt(req.params.id);
            const savedMeterReading = await this.meterReadingModel.GetMeterReadingById(id);
            if (savedMeterReading == null) {
                return res.status(404).json({ message: "Meter Reading not found" });
            }
            else {
                await this.meterReadingModel.DeleteMeterReading(id);
                const meterReadingData = {
                    mqttSessionId: mqttSessionId,
                    messageId: req.body.messageId,
                    clientId: savedMeterReading.clientId,
                    entityType: 'MeterReading',
                    operation: 'Delete',
                    entity: JSON.stringify(savedMeterReading),
                    entityId: id
                };
                this.mqttClient?.publish('/entities', JSON.stringify(meterReadingData));
                res.json(savedMeterReading);
            }
        }
        catch (error) {
            res.status(500).json({ message: "Internal server error" });
        }
    }
    async DeleteMeterReadingsForMeter(meterId, req, res) {
        try {
            let queryResult = await this.meterReadingModel.GetMeterReadingIdsForMeter(meterId);
            const meterReadingIds = Array.from(queryResult.rows);
            for (const row of meterReadingIds) {
                let readingId = row.id;
                const savedMeterReading = await this.meterReadingModel.GetMeterReadingById(readingId);
                if (savedMeterReading == null)
                    continue;
                await this.meterReadingModel.DeleteMeterReading(readingId);
                const meterReadingData = {
                    messageId: req.body.messageId,
                    clientId: savedMeterReading.clientId,
                    entityType: 'MeterReading',
                    operation: 'Delete',
                    entity: JSON.stringify(savedMeterReading),
                    entityId: readingId
                };
                this.mqttClient?.publish('/entities', JSON.stringify(meterReadingData));
            }
        }
        catch (error) {
            res.status(500).json({ message: "Internal server error" });
        }
    }
    SetupProcessExitHandlers() {
        process.on('exit', this.Cleanup.bind(this));
        process.on('SIGINT', this.Cleanup.bind(this));
        process.on('SIGTERM', this.Cleanup.bind(this));
        process.on('uncaughtException', this.Cleanup.bind(this));
    }
    async Cleanup() {
        console.log("Cleaning up resources...");
        if (this.mqttClient) {
            this.mqttClient.end();
            console.log("Disconnected MQTT client");
        }
        process.exit();
    }
}
const meterReadingController = new MeterReadingController();
meterReadingController.Initialise("192.168.10.174");
const GetMeterReadingById = (req, res) => meterReadingController.GetMeterReadingById(req, res);
exports.GetMeterReadingById = GetMeterReadingById;
const CreateMeterReading = (req, res) => meterReadingController.CreateMeterReading(req, res);
exports.CreateMeterReading = CreateMeterReading;
const UpdateMeterReading = (req, res) => meterReadingController.UpdateMeterReading(req, res);
exports.UpdateMeterReading = UpdateMeterReading;
const GetMeterReadingsCount = (req, res) => meterReadingController.GetMeterReadingsCount(req, res);
exports.GetMeterReadingsCount = GetMeterReadingsCount;
const DeleteAllMeterReadings = (req, res) => meterReadingController.DeleteAllMeterReadings(req, res);
exports.DeleteAllMeterReadings = DeleteAllMeterReadings;
const DeleteMeterReading = (req, res) => meterReadingController.DeleteMeterReading(req, res);
exports.DeleteMeterReading = DeleteMeterReading;
const DeleteMeterReadingsForMeter = (meterId, req, res) => meterReadingController.DeleteMeterReadingsForMeter(meterId, req, res);
exports.DeleteMeterReadingsForMeter = DeleteMeterReadingsForMeter;
exports.default = exports.DeleteMeterReadingsForMeter;
//# sourceMappingURL=meterReadingController.js.map
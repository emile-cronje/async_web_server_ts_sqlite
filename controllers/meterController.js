"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeleteMeter = exports.DeleteAllMeters = exports.GetMetersCount = exports.UpdateMeter = exports.CreateMeter = exports.GetMeterAdr = exports.GetMeterById = exports.GetMeters = void 0;
const meterModel_1 = require("../models/meterModel");
const mqtt_1 = __importDefault(require("mqtt"));
const meterReadingController_1 = __importDefault(require("./meterReadingController"));
class MeterController {
    constructor() {
        this.mqttClient = null;
        this.meterModel = new meterModel_1.MeterModel();
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
    async GetMeters(req, res) {
        try {
            const meters = await this.meterModel.GetMeters();
            res.json(meters);
        }
        catch (error) {
            console.error(error);
            res.status(500).json({ message: "Internal server error" });
        }
    }
    async GetMeterById(req, res) {
        try {
            const id = parseInt(req.params.id);
            const meter = await this.meterModel.GetMeterById(id);
            if (!meter) {
                return res.status(404).json({ message: "Meter not found" });
            }
            res.json(meter);
        }
        catch (error) {
            console.error(error);
            res.status(500).json({ message: "Internal server error" });
        }
    }
    async GetMeterAdr(req, res) {
        try {
            const id = parseInt(req.params.id);
            const adr = await this.meterModel.GetMeterAdr(id);
            if (adr == null) {
                return res.status(404).json({ message: "Meter not found" });
            }
            res.json(adr);
        }
        catch (error) {
            console.error(error);
            res.status(500).json({ message: "Internal server error" });
        }
    }
    ;
    async CreateMeter(req, res) {
        let meterData = JSON.parse(req.body.meterData);
        let mqttSessionId = req.body.mqttSessionId;
        try {
            const createdMeter = await this.meterModel.CreateMeter(meterData);
            if (createdMeter != null) {
                const meterData = {
                    mqttSessionId: mqttSessionId,
                    messageId: createdMeter.messageId,
                    clientId: createdMeter.clientId,
                    entityType: "Meter",
                    operation: "Create",
                    entity: JSON.stringify(createdMeter),
                    entityId: createdMeter.id
                };
                this.mqttClient?.publish("/entities", JSON.stringify(meterData));
            }
            res.status(201).json(createdMeter);
        }
        catch (error) {
            console.error(error);
            res.status(500).json({ message: "Internal server error" });
        }
    }
    async UpdateMeter(req, res) {
        let meterData = JSON.parse(req.body.meterData);
        let mqttSessionId = req.body.mqttSessionId;
        try {
            const id = parseInt(req.params.id);
            // Check if the meter exists before attempting to update
            const existingMeter = await this.meterModel.GetMeterById(id);
            if (!existingMeter) {
                return res.status(404).json({ message: "Meter not found" });
            }
            // Meter exists, proceed with update
            const updatedMeter = await this.meterModel.UpdateMeter(id, meterData);
            if (updatedMeter == null) {
                return res.status(404).json({ message: "Meter not found" });
            }
            else {
                const meterData = {
                    mqttSessionId: mqttSessionId,
                    messageId: updatedMeter.messageId,
                    clientId: updatedMeter.clientId,
                    entityType: "Meter",
                    operation: "Update",
                    entity: JSON.stringify(updatedMeter),
                    entityId: updatedMeter.id
                };
                this.mqttClient?.publish("/entities", JSON.stringify(meterData));
                res.json(updatedMeter);
            }
        }
        catch (error) {
            console.error(error);
            res.status(500).json({ message: "Internal server error" });
        }
    }
    async GetMetersCount(req, res) {
        try {
            const count = await this.meterModel.GetMetersCount();
            res.json(count);
        }
        catch (error) {
            res.status(500).json({ message: "Internal server error" });
        }
    }
    async DeleteAllMeters(req, res) {
        try {
            const result = await this.meterModel.DeleteAllMeters();
            res.json(result);
        }
        catch (error) {
            res.status(500).json({ message: "Internal server error" });
        }
    }
    async DeleteMeter(req, res) {
        let mqttSessionId = req.body.mqttSessionId;
        try {
            const id = parseInt(req.params.id);
            const savedMeter = await this.meterModel.GetMeterById(id);
            if (savedMeter == null) {
                return res.status(404).json({ message: "Meter not found" });
            }
            else {
                await (0, meterReadingController_1.default)(id, req, res);
                await this.meterModel.DeleteMeter(id);
                const meterData = {
                    mqttSessionId: mqttSessionId,
                    messageId: req.body.messageId,
                    clientId: savedMeter.clientId,
                    entityType: "Meter",
                    operation: "Delete",
                    entity: JSON.stringify(savedMeter),
                    entityId: id
                };
                this.mqttClient?.publish("/entities", JSON.stringify(meterData));
                res.json(savedMeter);
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
const meterController = new MeterController();
meterController.Initialise("192.168.10.124");
const GetMeters = (req, res) => meterController.GetMeters(req, res);
exports.GetMeters = GetMeters;
const GetMeterById = (req, res) => meterController.GetMeterById(req, res);
exports.GetMeterById = GetMeterById;
const GetMeterAdr = (req, res) => meterController.GetMeterAdr(req, res);
exports.GetMeterAdr = GetMeterAdr;
const CreateMeter = (req, res) => meterController.CreateMeter(req, res);
exports.CreateMeter = CreateMeter;
const UpdateMeter = (req, res) => meterController.UpdateMeter(req, res);
exports.UpdateMeter = UpdateMeter;
const GetMetersCount = (req, res) => meterController.GetMetersCount(req, res);
exports.GetMetersCount = GetMetersCount;
const DeleteAllMeters = (req, res) => meterController.DeleteAllMeters(req, res);
exports.DeleteAllMeters = DeleteAllMeters;
const DeleteMeter = (req, res) => meterController.DeleteMeter(req, res);
exports.DeleteMeter = DeleteMeter;
//# sourceMappingURL=meterController.js.map
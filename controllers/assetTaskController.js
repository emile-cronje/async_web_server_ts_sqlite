"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeleteAssetTasksForAsset = exports.DeleteAssetTask = exports.DeleteAllAssetTasks = exports.GetAssetTasksCount = exports.UpdateAssetTask = exports.CreateAssetTask = exports.GetAssetTaskById = void 0;
const assetTaskModel_1 = require("../models/assetTaskModel");
const mqtt_1 = __importDefault(require("mqtt"));
class AssetTaskController {
    constructor() {
        this.mqttClient = null;
        this.assetTaskModel = new assetTaskModel_1.AssetTaskModel();
        this.SetupProcessExitHandlers();
    }
    Initialise(broker) {
        this.InitializeMqttClient(broker);
    }
    InitializeMqttClient(mqttBroker) {
        let brokerConnectionString = "mqtt://" + mqttBroker + ":1883";
        this.mqttClient = mqtt_1.default.connect(brokerConnectionString);
        this.mqttClient.on("connect", () => {
            console.log("Asset Task Controller: Connected to MQTT broker: " + mqttBroker);
        });
    }
    async GetAssetTaskById(req, res) {
        try {
            const id = parseInt(req.params.id);
            const assetTask = await this.assetTaskModel.GetAssetTaskById(id);
            if (!assetTask) {
                return res.status(404).json({ message: "Asset Task not found" });
            }
            res.json(assetTask);
        }
        catch (error) {
            console.error(error);
            res.status(500).json({ message: "Internal server error" });
        }
    }
    async CreateAssetTask(req, res) {
        let assetTaskData = JSON.parse(req.body.assetTaskData);
        let mqttSessionId = req.body.mqttSessionId;
        try {
            const createdAssetTask = await this.assetTaskModel.CreateAssetTask(assetTaskData);
            if (createdAssetTask != null) {
                const assetTaskData = {
                    mqttSessionId: mqttSessionId,
                    messageId: createdAssetTask.messageId,
                    clientId: createdAssetTask.clientId,
                    entityType: "AssetTask",
                    operation: "Create",
                    entity: JSON.stringify(createdAssetTask),
                    entityId: createdAssetTask.id
                };
                this.mqttClient?.publish("/entities", JSON.stringify(assetTaskData));
            }
            res.status(201).json(createdAssetTask);
        }
        catch (error) {
            console.error(error);
            res.status(500).json({ message: "Internal server error" });
        }
    }
    async UpdateAssetTask(req, res) {
        let assetTaskData = JSON.parse(req.body.assetTaskData);
        let mqttSessionId = req.body.mqttSessionId;
        try {
            const id = parseInt(req.params.id);
            // Check if the task exists before attempting to update
            const existingTask = await this.assetTaskModel.GetAssetTaskById(id);
            if (!existingTask) {
                return res.status(404).json({ message: "Asset Task not found" });
            }
            // Task exists, proceed with update
            const updatedAssetTask = await this.assetTaskModel.UpdateAssetTask(id, assetTaskData);
            if (updatedAssetTask != null) {
                const assetTaskData = {
                    mqttSessionId: mqttSessionId,
                    messageId: updatedAssetTask.messageId,
                    clientId: updatedAssetTask.clientId,
                    entityType: "AssetTask",
                    operation: "Update",
                    entity: JSON.stringify(updatedAssetTask),
                    entityId: updatedAssetTask.id
                };
                this.mqttClient?.publish("/entities", JSON.stringify(assetTaskData));
                res.json(updatedAssetTask);
            }
        }
        catch (error) {
            console.error(error);
            res.status(500).json({ message: "Internal server error" });
        }
    }
    async GetAssetTasksCount(req, res) {
        try {
            const count = await this.assetTaskModel.GetAssetTasksCount();
            res.json(count);
        }
        catch (error) {
            res.status(500).json({ message: "Internal server error" });
        }
    }
    async DeleteAllAssetTasks(req, res) {
        try {
            const result = await this.assetTaskModel.DeleteAllAssetTasks();
            res.json(result);
        }
        catch (error) {
            res.status(500).json({ message: "Internal server error" });
        }
    }
    async DeleteAssetTask(req, res) {
        let mqttSessionId = req.body.mqttSessionId;
        try {
            const id = parseInt(req.params.id);
            const savedAssetTask = await this.assetTaskModel.GetAssetTaskById(id);
            if (savedAssetTask == null) {
                return res.status(404).json({ message: "Asset Task not found" });
            }
            else {
                await this.assetTaskModel.DeleteAssetTask(id);
                const assetTaskData = {
                    mqttSessionId: mqttSessionId,
                    messageId: req.body.messageId,
                    clientId: savedAssetTask.clientId,
                    entityType: 'AssetTask',
                    operation: 'Delete',
                    entity: JSON.stringify(savedAssetTask),
                    entityId: id
                };
                this.mqttClient?.publish('/entities', JSON.stringify(assetTaskData));
                res.json(savedAssetTask);
            }
        }
        catch (error) {
            res.status(500).json({ message: "Internal server error" });
        }
    }
    async DeleteAssetTasksForAsset(assetId, req, res) {
        try {
            let queryResult = await this.assetTaskModel.GetAssetTaskIdsForAsset(assetId);
            const taskIds = Array.from(queryResult.rows);
            for (const row of taskIds) {
                let taskId = row.id;
                const savedAssetTask = await this.assetTaskModel.GetAssetTaskById(taskId);
                if (savedAssetTask == null)
                    continue;
                await this.assetTaskModel.DeleteAssetTask(taskId);
                const assetTaskData = {
                    messageId: req.body.messageId,
                    clientId: savedAssetTask.clientId,
                    entityType: 'AssetTask',
                    operation: 'Delete',
                    entity: JSON.stringify(savedAssetTask),
                    entityId: taskId
                };
                this.mqttClient?.publish('/entities', JSON.stringify(assetTaskData));
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
const assetTaskController = new AssetTaskController();
assetTaskController.Initialise("192.168.10.124");
const GetAssetTaskById = (req, res) => assetTaskController.GetAssetTaskById(req, res);
exports.GetAssetTaskById = GetAssetTaskById;
const CreateAssetTask = (req, res) => assetTaskController.CreateAssetTask(req, res);
exports.CreateAssetTask = CreateAssetTask;
const UpdateAssetTask = (req, res) => assetTaskController.UpdateAssetTask(req, res);
exports.UpdateAssetTask = UpdateAssetTask;
const GetAssetTasksCount = (req, res) => assetTaskController.GetAssetTasksCount(req, res);
exports.GetAssetTasksCount = GetAssetTasksCount;
const DeleteAllAssetTasks = (req, res) => assetTaskController.DeleteAllAssetTasks(req, res);
exports.DeleteAllAssetTasks = DeleteAllAssetTasks;
const DeleteAssetTask = (req, res) => assetTaskController.DeleteAssetTask(req, res);
exports.DeleteAssetTask = DeleteAssetTask;
const DeleteAssetTasksForAsset = (assetId, req, res) => assetTaskController.DeleteAssetTasksForAsset(assetId, req, res);
exports.DeleteAssetTasksForAsset = DeleteAssetTasksForAsset;
exports.default = exports.DeleteAssetTasksForAsset;
//# sourceMappingURL=assetTaskController.js.map
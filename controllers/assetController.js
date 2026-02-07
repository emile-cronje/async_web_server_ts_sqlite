"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeleteAsset = exports.DeleteAllAssets = exports.GetAssetsCount = exports.UpdateAsset = exports.CreateAsset = exports.GetAssetById = exports.GetAssets = void 0;
const assetModel_1 = require("../models/assetModel");
const mqtt_1 = __importDefault(require("mqtt"));
const assetTaskController_1 = __importDefault(require("../controllers/assetTaskController"));
class AssetController {
    constructor() {
        this.mqttClient = null;
        this.assetModel = new assetModel_1.AssetModel();
        this.SetupProcessExitHandlers();
    }
    Initialise(broker) {
        this.InitializeMqttClient(broker);
    }
    InitializeMqttClient(mqttBroker) {
        let brokerConnectionString = "mqtt://" + mqttBroker + ":1883";
        this.mqttClient = mqtt_1.default.connect(brokerConnectionString);
        this.mqttClient.on("connect", () => {
            console.log("Asset Controller: Connected to MQTT broker: " + mqttBroker);
        });
    }
    async GetAssets(req, res) {
        try {
            const assets = await this.assetModel.GetAssets();
            res.json(assets);
        }
        catch (error) {
            console.error(error);
            res.status(500).json({ message: "Internal server error" });
        }
    }
    async GetAssetById(req, res) {
        try {
            const id = parseInt(req.params.id);
            const asset = await this.assetModel.GetAssetById(id);
            if (!asset) {
                return res.status(404).json({ message: "Asset not found" });
            }
            res.json(asset);
        }
        catch (error) {
            console.error(error);
            res.status(500).json({ message: "Internal server error" });
        }
    }
    async CreateAsset(req, res) {
        let assetData = JSON.parse(req.body.assetData);
        let mqttSessionId = req.body.mqttSessionId;
        try {
            const createdAsset = await this.assetModel.CreateAsset(assetData);
            if (createdAsset != null) {
                const assetData = {
                    mqttSessionId: mqttSessionId,
                    messageId: createdAsset.messageId,
                    clientId: createdAsset.clientId,
                    entityType: "Asset",
                    operation: "Create",
                    entity: JSON.stringify(createdAsset),
                    entityId: createdAsset.id
                };
                this.mqttClient?.publish("/entities", JSON.stringify(assetData));
            }
            res.status(201).json(createdAsset);
        }
        catch (error) {
            console.error(error);
            res.status(500).json({ message: "Internal server error" });
        }
    }
    async UpdateAsset(req, res) {
        let assetData = JSON.parse(req.body.assetData);
        let mqttSessionId = req.body.mqttSessionId;
        try {
            const id = parseInt(req.params.id);
            // Check if the asset exists before attempting to update
            const existingAsset = await this.assetModel.GetAssetById(id);
            if (!existingAsset) {
                return res.status(404).json({ message: "Asset not found" });
            }
            // Asset exists, proceed with update
            const updatedAsset = await this.assetModel.UpdateAsset(id, assetData);
            if (updatedAsset == null) {
                return res.status(404).json({ message: "Asset not found" });
            }
            else {
                const assetData = {
                    mqttSessionId: mqttSessionId,
                    messageId: updatedAsset.messageId,
                    clientId: updatedAsset.clientId,
                    entityType: "Asset",
                    operation: "Update",
                    entity: JSON.stringify(updatedAsset),
                    entityId: updatedAsset.id
                };
                this.mqttClient?.publish("/entities", JSON.stringify(assetData));
                res.json(updatedAsset);
            }
        }
        catch (error) {
            console.error(error);
            res.status(500).json({ message: "Internal server error" });
        }
    }
    async GetAssetsCount(req, res) {
        try {
            const count = await this.assetModel.GetAssetsCount();
            res.json(count);
        }
        catch (error) {
            res.status(500).json({ message: "Internal server error" });
        }
    }
    async DeleteAllAssets(req, res) {
        try {
            const result = await this.assetModel.DeleteAllAssets();
            res.json(result);
        }
        catch (error) {
            res.status(500).json({ message: "Internal server error" });
        }
    }
    async DeleteAsset(req, res) {
        let mqttSessionId = req.body.mqttSessionId;
        try {
            const id = parseInt(req.params.id);
            const savedAsset = await this.assetModel.GetAssetById(id);
            if (savedAsset == null) {
                return res.status(404).json({ message: "Asset not found" });
            }
            else {
                await (0, assetTaskController_1.default)(id, req, res);
                await this.assetModel.DeleteAsset(id);
                const assetData = {
                    mqttSessionId: mqttSessionId,
                    messageId: req.body.messageId,
                    clientId: savedAsset.clientId,
                    entityType: 'Asset',
                    operation: 'Delete',
                    entity: JSON.stringify(savedAsset),
                    entityId: id
                };
                this.mqttClient?.publish('/entities', JSON.stringify(assetData));
                res.json(savedAsset);
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
const assetController = new AssetController();
assetController.Initialise("192.168.10.124");
const GetAssets = (req, res) => assetController.GetAssets(req, res);
exports.GetAssets = GetAssets;
const GetAssetById = (req, res) => assetController.GetAssetById(req, res);
exports.GetAssetById = GetAssetById;
const CreateAsset = (req, res) => assetController.CreateAsset(req, res);
exports.CreateAsset = CreateAsset;
const UpdateAsset = (req, res) => assetController.UpdateAsset(req, res);
exports.UpdateAsset = UpdateAsset;
const GetAssetsCount = (req, res) => assetController.GetAssetsCount(req, res);
exports.GetAssetsCount = GetAssetsCount;
const DeleteAllAssets = (req, res) => assetController.DeleteAllAssets(req, res);
exports.DeleteAllAssets = DeleteAllAssets;
const DeleteAsset = (req, res) => assetController.DeleteAsset(req, res);
exports.DeleteAsset = DeleteAsset;
//# sourceMappingURL=assetController.js.map
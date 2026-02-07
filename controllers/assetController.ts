import { AssetModel } from "../models/assetModel";
import { Request, Response } from "express";
import mqtt from "mqtt";
import DeleteAssetTasksForAsset from '../controllers/assetTaskController';

class AssetController {
    private mqttClient: mqtt.MqttClient | null = null;
    private assetModel: AssetModel;

    constructor() {
        this.assetModel = new AssetModel();
        this.SetupProcessExitHandlers();
    }

    public Initialise(broker: string) {
        this.InitializeMqttClient(broker);
    }

    private InitializeMqttClient(mqttBroker: string) {
        let brokerConnectionString = "mqtt://" + mqttBroker + ":1883"
        this.mqttClient = mqtt.connect(brokerConnectionString);
        this.mqttClient.on("connect", () => {
            console.log("Asset Controller: Connected to MQTT broker: " + mqttBroker);
        });
    }

    public async GetAssets(req: Request, res: Response): Promise<any> {
        try {
            const assets = await this.assetModel.GetAssets();
            res.json(assets);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Internal server error" });
        }
    }

    public async GetAssetById(req: Request, res: Response): Promise<any> {
        try {
            const id = parseInt(req.params.id);
            const asset = await this.assetModel.GetAssetById(id);

            if (!asset) {
                return res.status(404).json({ message: "Asset not found" });
            }

            res.json(asset);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Internal server error" });
        }
    }

    public async CreateAsset(req: Request, res: Response): Promise<void> {
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
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Internal server error" });
        }
    }

    public async UpdateAsset(req: Request, res: Response): Promise<any> {
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
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Internal server error" });
        }
    }

    public async GetAssetsCount(req: Request, res: Response): Promise<any> {
        try {
            const count = await this.assetModel.GetAssetsCount();
            res.json(count);
        } catch (error) {
            res.status(500).json({ message: "Internal server error" });
        }
    }

    public async DeleteAllAssets(req: Request, res: Response): Promise<any> {
        try {
            const result = await this.assetModel.DeleteAllAssets();

            res.json(result);
        } catch (error) {
            res.status(500).json({ message: "Internal server error" });
        }
    }

    public async DeleteAsset(req: Request, res: Response): Promise<any> {
        let mqttSessionId = req.body.mqttSessionId;

        try {
            const id = parseInt(req.params.id);
            const savedAsset = await this.assetModel.GetAssetById(id);

            if (savedAsset == null) {
                return res.status(404).json({ message: "Asset not found" });
            } else {
                await DeleteAssetTasksForAsset(id, req, res)                
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
        } catch (error) {
            res.status(500).json({ message: "Internal server error" });
        }
    }

    private SetupProcessExitHandlers() {
        process.on('exit', this.Cleanup.bind(this));
        process.on('SIGINT', this.Cleanup.bind(this));
        process.on('SIGTERM', this.Cleanup.bind(this));
        process.on('uncaughtException', this.Cleanup.bind(this));
    }

    private async Cleanup() {
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

export const GetAssets = (req: Request, res: Response) => assetController.GetAssets(req, res);
export const GetAssetById = (req: Request, res: Response) => assetController.GetAssetById(req, res);
export const CreateAsset = (req: Request, res: Response) => assetController.CreateAsset(req, res);
export const UpdateAsset = (req: Request, res: Response) => assetController.UpdateAsset(req, res);
export const GetAssetsCount = (req: Request, res: Response) => assetController.GetAssetsCount(req, res);
export const DeleteAllAssets = (req: Request, res: Response) => assetController.DeleteAllAssets(req, res);
export const DeleteAsset = (req: Request, res: Response) => assetController.DeleteAsset(req, res);
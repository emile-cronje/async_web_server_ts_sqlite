import { AssetTask, AssetTaskModel } from "../models/assetTaskModel";
import { Request, Response } from "express";
import mqtt from "mqtt";

class AssetTaskController {
    private mqttClient: mqtt.MqttClient | null = null;
    private assetTaskModel: AssetTaskModel;

    constructor() {
        this.assetTaskModel = new AssetTaskModel();
        this.SetupProcessExitHandlers();
    }

    public Initialise(broker: string) {
        this.InitializeMqttClient(broker);
    }

    private InitializeMqttClient(mqttBroker: string) {
        let brokerConnectionString = "mqtt://" + mqttBroker + ":1883"
        this.mqttClient = mqtt.connect(brokerConnectionString);
        this.mqttClient.on("connect", () => {
            console.log("Asset Task Controller: Connected to MQTT broker: " + mqttBroker);
        });
    }

    public async GetAssetTaskById(req: Request, res: Response): Promise<any> {
        try {
            const id = parseInt(req.params.id);
            const assetTask = await this.assetTaskModel.GetAssetTaskById(id);

            if (!assetTask) {
                return res.status(404).json({ message: "Asset Task not found" });
            }

            res.json(assetTask);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Internal server error" });
        }
    }

    public async CreateAssetTask(req: Request, res: Response): Promise<void> {
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
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Internal server error" });
        }
    }

    public async UpdateAssetTask(req: Request, res: Response): Promise<any> {
        let assetTaskData = JSON.parse(req.body.assetTaskData);
        let mqttSessionId = req.body.mqttSessionId;

        try {
            const id = parseInt(req.params.id);
            const updatedAssetTask = await this.assetTaskModel.UpdateAssetTask(id, assetTaskData);

            if (updatedAssetTask == null) {
                return res.status(404).json({ message: "Asset Task not found" });
            }

            const assetTaskPayload = {
                mqttSessionId: mqttSessionId,                                        
                messageId: updatedAssetTask.messageId,
                clientId: updatedAssetTask.clientId,
                entityType: "AssetTask",
                operation: "Update",
                entity: JSON.stringify(updatedAssetTask),
                entityId: updatedAssetTask.id
            };

            this.mqttClient?.publish("/entities", JSON.stringify(assetTaskPayload));
            res.json(updatedAssetTask);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Internal server error" });
        }
    }

    public async GetAssetTasksCount(req: Request, res: Response): Promise<any> {
        try {
            const count = await this.assetTaskModel.GetAssetTasksCount();
            res.json(count);
        } catch (error) {
            res.status(500).json({ message: "Internal server error" });
        }
    }

    public async DeleteAllAssetTasks(req: Request, res: Response): Promise<any> {
        try {
            const result = await this.assetTaskModel.DeleteAllAssetTasks();

            res.json(result);
        } catch (error) {
            res.status(500).json({ message: "Internal server error" });
        }
    }

    public async DeleteAssetTask(req: Request, res: Response): Promise<any> {
        let mqttSessionId = req.body.mqttSessionId;

        try {
            const id = parseInt(req.params.id);
            const savedAssetTask = await this.assetTaskModel.GetAssetTaskById(id);

            if (savedAssetTask == null) {
                return res.status(404).json({ message: "Asset Task not found" });
            } else {
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
        } catch (error) {
            res.status(500).json({ message: "Internal server error" });
        }
    }

    public async DeleteAssetTasksForAsset(assetId: number, req: Request, res: Response): Promise<any> {
        try {
            const savedAssetTasks = await this.assetTaskModel.GetAssetTasksForAsset(assetId);
            await this.assetTaskModel.DeleteAssetTasksForAsset(assetId);

            for (const savedAssetTask of savedAssetTasks) {
                const taskId = savedAssetTask.id;

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

const assetTaskController = new AssetTaskController();
assetTaskController.Initialise("192.168.10.124");

export const GetAssetTaskById = (req: Request, res: Response) => assetTaskController.GetAssetTaskById(req, res);
export const CreateAssetTask = (req: Request, res: Response) => assetTaskController.CreateAssetTask(req, res);
export const UpdateAssetTask = (req: Request, res: Response) => assetTaskController.UpdateAssetTask(req, res);
export const GetAssetTasksCount = (req: Request, res: Response) => assetTaskController.GetAssetTasksCount(req, res);
export const DeleteAllAssetTasks = (req: Request, res: Response) => assetTaskController.DeleteAllAssetTasks(req, res);
export const DeleteAssetTask = (req: Request, res: Response) => assetTaskController.DeleteAssetTask(req, res);
export const DeleteAssetTasksForAsset = (assetId: number, req: Request, res: Response) => assetTaskController.DeleteAssetTasksForAsset(assetId, req, res);
export default DeleteAssetTasksForAsset;

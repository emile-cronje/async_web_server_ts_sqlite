import { MeterReading, MeterReadingModel } from "../models/meterReadingModel";
import { Request, Response } from "express";
import mqtt from "mqtt";

class MeterReadingController {
    private mqttClient: mqtt.MqttClient | null = null;
    private meterReadingModel: MeterReadingModel;

    constructor() {
        this.meterReadingModel = new MeterReadingModel();
        this.SetupProcessExitHandlers();
    }

    public Initialise(broker: string) {
        this.InitializeMqttClient(broker);
    }

    private InitializeMqttClient(mqttBroker: string) {
        let brokerConnectionString = "mqtt://" + mqttBroker + ":1883"
        this.mqttClient = mqtt.connect(brokerConnectionString);
        this.mqttClient.on("connect", () => {
            console.log("Meter Controller: Connected to MQTT broker: " + mqttBroker);
        });
    }

    public async GetMeterReadingById(req: Request, res: Response): Promise<any> {
        try {
            const id = parseInt(req.params.id);
            const meterReading = await this.meterReadingModel.GetMeterReadingById(id);

            if (!meterReading) {
                return res.status(404).json({ message: "Meter Reading not found" });
            }

            res.json(meterReading);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Internal server error" });
        }
    }

    public async CreateMeterReading(req: Request, res: Response): Promise<void> {
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
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Internal server error" });
        }
    }

    public async UpdateMeterReading(req: Request, res: Response): Promise<any> {
        let meterReadingData = JSON.parse(req.body.meterReadingData);
        let mqttSessionId = req.body.mqttSessionId;

        try {
            const id = parseInt(req.params.id);
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
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Internal server error" });
        }
    }

    public async GetMeterReadingsCount(req: Request, res: Response): Promise<any> {
        try {
            const count = await this.meterReadingModel.GetMeterReadingsCount();
            res.json(count);
        } catch (error) {
            res.status(500).json({ message: "Internal server error" });
        }
    }

    public async DeleteAllMeterReadings(req: Request, res: Response): Promise<any> {
        try {
            const result = await this.meterReadingModel.DeleteAllMeterReadings();

            res.json(result);
        } catch (error) {
            res.status(500).json({ message: "Internal server error" });
        }
    }

    public async DeleteMeterReading(req: Request, res: Response): Promise<any> {
        let mqttSessionId = req.body.mqttSessionId;

        try {
            const id = parseInt(req.params.id);
            const savedMeterReading = await this.meterReadingModel.GetMeterReadingById(id);

            if (savedMeterReading == null) {
                return res.status(404).json({ message: "Meter Reading not found" });
            } else {
                await this.deleteMeterReadingAndPublish(savedMeterReading, req.body.messageId, mqttSessionId);
                res.json(savedMeterReading);
            }
        } catch (error) {
            res.status(500).json({ message: "Internal server error" });
        }
    }

    public async DeleteMeterReadingsForMeter(meterId: number, req: Request, res: Response): Promise<any> {
        try {
            let queryResult = await this.meterReadingModel.GetMeterReadingIdsForMeter(meterId);

            const meterReadingIds = Array.from(queryResult.rows) as MeterReading[];

            for (const meterReadingId of meterReadingIds) {
                const savedMeterReading = await this.meterReadingModel.GetMeterReadingById(meterReadingId.id);                

                if (savedMeterReading)
                    await this.deleteMeterReadingAndPublish(savedMeterReading, req.body.messageId);
            }
        } catch (error) {
            res.status(500).json({ message: "Internal server error" });
        }
    }

    private async deleteMeterReadingAndPublish(
        savedMeterReading: MeterReading,
        messageId: string,
        mqttSessionId?: string
    ): Promise<void> {
        await this.meterReadingModel.DeleteMeterReading(savedMeterReading.id);

        const meterReadingData = {
            ...(mqttSessionId ? { mqttSessionId } : {}),
            messageId: messageId,
            clientId: savedMeterReading.clientId,
            entityType: 'MeterReading',
            operation: 'Delete',
            entity: JSON.stringify(savedMeterReading),
            entityId: savedMeterReading.id
        };

        this.mqttClient?.publish('/entities', JSON.stringify(meterReadingData));
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

const meterReadingController = new MeterReadingController();
meterReadingController.Initialise("192.168.10.135");

export const GetMeterReadingById = (req: Request, res: Response) => meterReadingController.GetMeterReadingById(req, res);
export const CreateMeterReading = (req: Request, res: Response) => meterReadingController.CreateMeterReading(req, res);
export const UpdateMeterReading = (req: Request, res: Response) => meterReadingController.UpdateMeterReading(req, res);
export const GetMeterReadingsCount = (req: Request, res: Response) => meterReadingController.GetMeterReadingsCount(req, res);
export const DeleteAllMeterReadings = (req: Request, res: Response) => meterReadingController.DeleteAllMeterReadings(req, res);
export const DeleteMeterReading = (req: Request, res: Response) => meterReadingController.DeleteMeterReading(req, res);
export const DeleteMeterReadingsForMeter = (meterId: number, req: Request, res: Response) => meterReadingController.DeleteMeterReadingsForMeter(meterId, req, res);

export default DeleteMeterReadingsForMeter;

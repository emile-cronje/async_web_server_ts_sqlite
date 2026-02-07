import { MeterModel } from "../models/meterModel";
import { Request, Response } from "express";
import mqtt from "mqtt";
import DeleteMeterReadingsForMeter from "./meterReadingController";

class MeterController {
    private mqttClient: mqtt.MqttClient | null = null;
    private meterModel: MeterModel;

    constructor() {
        this.meterModel = new MeterModel();
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

    public async GetMeters(req: Request, res: Response): Promise<any> {
        try {
            const meters = await this.meterModel.GetMeters();
            res.json(meters);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Internal server error" });
        }
    }

    public async GetMeterById(req: Request, res: Response): Promise<any> {
        try {
            const id = parseInt(req.params.id);
            const meter = await this.meterModel.GetMeterById(id);

            if (!meter) {
                return res.status(404).json({ message: "Meter not found" });
            }

            res.json(meter);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Internal server error" });
        }
    }

    public async GetMeterAdr(req: Request, res: Response): Promise<any> {
        try {
            const id = parseInt(req.params.id);
            const adr = await this.meterModel.GetMeterAdr(id);

            if (adr == null) {
                return res.status(404).json({ message: "Meter not found" });
            }

            res.json(adr);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Internal server error" });
        }
    };

    public async CreateMeter(req: Request, res: Response): Promise<void> {
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
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Internal server error" });
        }
    }

    public async UpdateMeter(req: Request, res: Response): Promise<any> {
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
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Internal server error" });
        }
    }

    public async GetMetersCount(req: Request, res: Response): Promise<any> {
        try {
            const count = await this.meterModel.GetMetersCount();
            res.json(count);
        } catch (error) {
            res.status(500).json({ message: "Internal server error" });
        }
    }

    public async DeleteAllMeters(req: Request, res: Response): Promise<any> {
        try {
            const result = await this.meterModel.DeleteAllMeters();

            res.json(result);
        } catch (error) {
            res.status(500).json({ message: "Internal server error" });
        }
    }

    public async DeleteMeter(req: Request, res: Response): Promise<any> {
        let mqttSessionId = req.body.mqttSessionId;

        try {
            const id = parseInt(req.params.id);
            const savedMeter = await this.meterModel.GetMeterById(id);

            if (savedMeter == null) {
                return res.status(404).json({ message: "Meter not found" });
            } else {
                await DeleteMeterReadingsForMeter(id, req, res)                
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

const meterController = new MeterController();
meterController.Initialise("192.168.10.124");

export const GetMeters = (req: Request, res: Response) => meterController.GetMeters(req, res);
export const GetMeterById = (req: Request, res: Response) => meterController.GetMeterById(req, res);
export const GetMeterAdr = (req: Request, res: Response) => meterController.GetMeterAdr(req, res);
export const CreateMeter = (req: Request, res: Response) => meterController.CreateMeter(req, res);
export const UpdateMeter = (req: Request, res: Response) => meterController.UpdateMeter(req, res);
export const GetMetersCount = (req: Request, res: Response) => meterController.GetMetersCount(req, res);
export const DeleteAllMeters = (req: Request, res: Response) => meterController.DeleteAllMeters(req, res);
export const DeleteMeter = (req: Request, res: Response) => meterController.DeleteMeter(req, res);
import { ToDoModel } from "../models/todoModel";
import { Request, Response } from "express";
import mqtt from "mqtt"

class ToDoController {
    private mqttClient: mqtt.MqttClient | null = null;
    private todoModel: ToDoModel;

    constructor() {
        this.todoModel = new ToDoModel();
        this.SetupProcessExitHandlers();
    }

    public Initialise(broker: string) {
        this.InitializeMqttClient(broker);
    }

    public async GetToDos(req: Request, res: Response): Promise<any> {
        try {
            const todos = await this.todoModel.GetTodos();
            res.json(todos);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Internal server error" });
        }
    }

    public async GetToDoById(req: Request, res: Response): Promise<any> {
        try {
            const id = parseInt(req.params.id);
            const todo = await this.todoModel.GetTodoById(id);

            if (!todo) {
                return res.status(404).json({ message: "Todo not found" });
            }

            res.json(todo);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Internal server error" });
        }
    }

    public async CreateToDo(req: Request, res: Response): Promise<void> {
        let itemData = JSON.parse(req.body.itemData);
        let mqttSessionId = req.body.mqttSessionId;

        try {
            const createdTodo = await this.todoModel.CreateTodo(itemData);

            if (createdTodo != null) {
                const itemData = {
                    mqttSessionId: mqttSessionId,
                    messageId: createdTodo.messageId,
                    clientId: createdTodo.clientId,
                    entityType: "ToDoItem",
                    operation: "Create",
                    entity: JSON.stringify(createdTodo),
                    entityId: createdTodo.id
                };

                this.mqttClient?.publish("/entities", JSON.stringify(itemData));
            }

            res.status(201).json(createdTodo);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Internal server error" });
        }
    }

    public async UpdateToDo(req: Request, res: Response): Promise<any> {
        let itemData = JSON.parse(req.body.itemData);
        let mqttSessionId = req.body.mqttSessionId;

        try {
            const id = parseInt(req.params.id);
            
            // Check if the todo exists before attempting to update
            const existingTodo = await this.todoModel.GetTodoById(id);
            
            if (!existingTodo) {
                return res.status(404).json({ message: "Todo not found" });
            }
            
            // Todo exists, proceed with update
            const updatedTodo = await this.todoModel.UpdateTodo(id, itemData);

            if (updatedTodo == null) {
                return res.status(404).json({ message: "Todo not found" });
            }
            else {
                const itemData = {
                    mqttSessionId: mqttSessionId,
                    messageId: updatedTodo.messageId,
                    clientId: updatedTodo.clientId,
                    entityType: "ToDoItem",
                    operation: "Update",
                    entity: JSON.stringify(updatedTodo),
                    entityId: updatedTodo.id
                };

                this.mqttClient?.publish("/entities", JSON.stringify(itemData));
                res.json(updatedTodo);
            }
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Internal server error" });
        }
    }

    public async GetToDoItemsCount(req: Request, res: Response): Promise<any> {
        try {
            const count = await this.todoModel.GetTodoItemsCount();
            res.json(count);
        } catch (error) {
            res.status(500).json({ message: "Internal server error" });
        }
    }

    public async DeleteAllToDoItems(req: Request, res: Response): Promise<any> {
        try {
            const result = await this.todoModel.DeleteAllTodoItems();

            res.json(result);
        } catch (error) {
            res.status(500).json({ message: "Internal server error" });
        }
    }

    public async DeleteToDoItem(req: Request, res: Response): Promise<any> {
        let mqttSessionId = req.body.mqttSessionId;

        try {
            const id = parseInt(req.params.id);
            const savedTodo = await this.todoModel.GetTodoById(id);

            if (savedTodo == null) {
                return res.status(404).json({ message: "Todo not found" });
            } else {
                await this.todoModel.DeleteTodo(id);

                const toDoData = {
                    mqttSessionId: mqttSessionId,
                    messageId: req.body.messageId,
                    clientId: savedTodo.clientId,
                    entityType: 'ToDoItem',
                    operation: 'Delete',
                    entity: JSON.stringify(savedTodo),
                    entityId: id
                };

                this.mqttClient?.publish('/entities', JSON.stringify(toDoData));

                res.json(savedTodo);
            }
        } catch (error) {
            res.status(500).json({ message: "Internal server error" });
        }
    }

    private InitializeMqttClient(mqttBroker: string) {
        let brokerConnectionString = "mqtt://" + mqttBroker + ":1883"
        this.mqttClient = mqtt.connect(brokerConnectionString);
        this.mqttClient.on("connect", () => {
            console.log("ToDoItem Controller: Connected to MQTT broker: " + mqttBroker);
        });
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

const todoController = new ToDoController();
todoController.Initialise("192.168.10.174");

export const GetToDos = todoController.GetToDos.bind(todoController);
export const GetToDoById = todoController.GetToDoById.bind(todoController);
export const CreateToDo = todoController.CreateToDo.bind(todoController);
export const UpdateToDo = todoController.UpdateToDo.bind(todoController);
export const GetToDoItemsCount = todoController.GetToDoItemsCount.bind(todoController);
export const DeleteAllToDoItems = todoController.DeleteAllToDoItems.bind(todoController);
export const DeleteToDoItem = todoController.DeleteToDoItem.bind(todoController);

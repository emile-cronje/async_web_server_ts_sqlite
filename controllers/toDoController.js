"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeleteToDoItem = exports.DeleteAllToDoItems = exports.GetToDoItemsCount = exports.UpdateToDo = exports.CreateToDo = exports.GetToDoById = exports.GetToDos = void 0;
const todoModel_1 = require("../models/todoModel");
const mqtt_1 = __importDefault(require("mqtt"));
class ToDoController {
    constructor() {
        this.mqttClient = null;
        this.todoModel = new todoModel_1.ToDoModel();
        this.SetupProcessExitHandlers();
    }
    Initialise(broker) {
        this.InitializeMqttClient(broker);
    }
    async GetToDos(req, res) {
        try {
            const todos = await this.todoModel.GetTodos();
            res.json(todos);
        }
        catch (error) {
            console.error(error);
            res.status(500).json({ message: "Internal server error" });
        }
    }
    async GetToDoById(req, res) {
        try {
            const id = parseInt(req.params.id);
            const todo = await this.todoModel.GetTodoById(id);
            if (!todo) {
                return res.status(404).json({ message: "Todo not found" });
            }
            res.json(todo);
        }
        catch (error) {
            console.error(error);
            res.status(500).json({ message: "Internal server error" });
        }
    }
    async CreateToDo(req, res) {
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
        }
        catch (error) {
            console.error(error);
            res.status(500).json({ message: "Internal server error" });
        }
    }
    async UpdateToDo(req, res) {
        let itemData = JSON.parse(req.body.itemData);
        let mqttSessionId = req.body.mqttSessionId;
        try {
            const id = parseInt(req.params.id);
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
        }
        catch (error) {
            console.error(error);
            res.status(500).json({ message: "Internal server error" });
        }
    }
    async GetToDoItemsCount(req, res) {
        try {
            const count = await this.todoModel.GetTodoItemsCount();
            res.json(count);
        }
        catch (error) {
            res.status(500).json({ message: "Internal server error" });
        }
    }
    async DeleteAllToDoItems(req, res) {
        try {
            const result = await this.todoModel.DeleteAllTodoItems();
            res.json(result);
        }
        catch (error) {
            res.status(500).json({ message: "Internal server error" });
        }
    }
    async DeleteToDoItem(req, res) {
        let mqttSessionId = req.body.mqttSessionId;
        try {
            const id = parseInt(req.params.id);
            const savedTodo = await this.todoModel.GetTodoById(id);
            if (savedTodo == null) {
                return res.status(404).json({ message: "Todo not found" });
            }
            else {
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
        }
        catch (error) {
            res.status(500).json({ message: "Internal server error" });
        }
    }
    InitializeMqttClient(mqttBroker) {
        let brokerConnectionString = "mqtt://" + mqttBroker + ":1883";
        this.mqttClient = mqtt_1.default.connect(brokerConnectionString);
        this.mqttClient.on("connect", () => {
            console.log("ToDoItem Controller: Connected to MQTT broker: " + mqttBroker);
        });
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
const todoController = new ToDoController();
todoController.Initialise("192.168.10.135");
exports.GetToDos = todoController.GetToDos.bind(todoController);
exports.GetToDoById = todoController.GetToDoById.bind(todoController);
exports.CreateToDo = todoController.CreateToDo.bind(todoController);
exports.UpdateToDo = todoController.UpdateToDo.bind(todoController);
exports.GetToDoItemsCount = todoController.GetToDoItemsCount.bind(todoController);
exports.DeleteAllToDoItems = todoController.DeleteAllToDoItems.bind(todoController);
exports.DeleteToDoItem = todoController.DeleteToDoItem.bind(todoController);
//# sourceMappingURL=toDoController.js.map
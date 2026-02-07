"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ToDoModel = void 0;
const dbConfig_1 = __importDefault(require("../db/dbConfig"));
const dbMapper_1 = require("../db/dbMapper");
const TodoMapper = new dbMapper_1.DbMapper({
    id: "id",
    version: "version",
    client_id: "clientId",
    message_id: "messageId",
    name: "name",
    description: "description",
    is_complete: "isComplete"
});
class ToDoModel {
    async Initialise() {
        await dbConfig_1.default.query("DROP TABLE IF EXISTS todo_item");
        await dbConfig_1.default.query("CREATE TABLE IF NOT EXISTS todo_item(id INTEGER PRIMARY KEY AUTOINCREMENT, version INTEGER NOT NULL, client_id INTEGER NOT NULL, message_id TEXT, name TEXT NOT NULL UNIQUE, description TEXT NOT NULL, is_complete BOOLEAN NOT NULL)");
        await dbConfig_1.default.query("CREATE UNIQUE INDEX IF NOT EXISTS index_todo_item_id_client_id ON todo_item(id, client_id)");
    }
    ;
    async GetTodos() {
        const result = await dbConfig_1.default.query("SELECT * FROM todo_item");
        return result.rows;
    }
    async GetTodoById(id) {
        const result = await dbConfig_1.default.query("SELECT * FROM todo_item WHERE id = ?", [id]);
        let todoItem = null;
        if (result.rows != null && (result.rows.length > 0))
            todoItem = TodoMapper.map(result.rows[0]);
        return todoItem;
    }
    async CreateTodo(todoItem) {
        const insertResult = await dbConfig_1.default.query("INSERT INTO todo_item (client_id, version, message_id, name, description, is_complete) VALUES (?, ?, ?, ?, ?, ?) RETURNING *", [todoItem['clientId'], 0, todoItem['messageId'], todoItem['name'], todoItem['description'], false]);
        let newToDoItem = null;
        if (insertResult.rows != null && (insertResult.rows.length > 0))
            newToDoItem = TodoMapper.map(insertResult.rows[0]);
        return newToDoItem;
    }
    async UpdateTodo(id, todoItem) {
        await dbConfig_1.default.query("UPDATE todo_item SET name = ?, description = ?, is_complete = ?, message_id = ? WHERE id = ?", [todoItem['name'], todoItem['description'], todoItem['isComplete'], todoItem['messageId'], id]);
        const selectResult = await dbConfig_1.default.query("SELECT * FROM todo_item WHERE id = ?", [id]);
        let updatedTodoItem = null;
        if (selectResult.rows != null && selectResult.rows.length > 0)
            updatedTodoItem = TodoMapper.map(selectResult.rows[0]);
        return updatedTodoItem;
    }
    async GetTodoItemsCount() {
        const result = await dbConfig_1.default.query("SELECT COUNT(id) as count FROM todo_item");
        return parseInt(result.rows[0].count, 10);
    }
    ;
    async DeleteAllTodoItems() {
        return await dbConfig_1.default.query("DELETE FROM todo_item");
    }
    ;
    async DeleteTodo(id) {
        return await dbConfig_1.default.query('DELETE FROM todo_item WHERE id = ?', [id]);
    }
    ;
}
exports.ToDoModel = ToDoModel;
//# sourceMappingURL=todoModel.js.map
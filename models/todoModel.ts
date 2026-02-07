import pool from "../db/dbConfig"
import {DbMapper} from "../db/dbMapper";

export interface Todo {
    id: number;
    version: number;
    clientId: string;
    messageId?: string;
    name: string;
    description: string;
    isComplete: boolean;
}

const TodoMapper = new DbMapper<Todo>({
    id: "id",
    version: "version",
    client_id: "clientId",
    message_id: "messageId",
    name: "name",
    description: "description",
    is_complete: "isComplete"
});

export class ToDoModel {
    async Initialise(): Promise<void> {
        await pool.query("DROP TABLE IF EXISTS todo_item");
        await pool.query(
            "CREATE TABLE IF NOT EXISTS todo_item(id INTEGER PRIMARY KEY AUTOINCREMENT, version INTEGER NOT NULL, client_id INTEGER NOT NULL, message_id TEXT, name TEXT NOT NULL UNIQUE, description TEXT NOT NULL, is_complete BOOLEAN NOT NULL)");

        await pool.query("CREATE UNIQUE INDEX IF NOT EXISTS index_todo_item_id_client_id ON todo_item(id, client_id)");
    };

    async GetTodos(): Promise<Todo[]> {
        const result = await pool.query("SELECT * FROM todo_item");
        return result.rows;
    }

    async GetTodoById(id: number): Promise<Todo | null> {
        const result = await pool.query("SELECT * FROM todo_item WHERE id = ?", [id]);

        let todoItem: any = null;

        if (result.rows != null && (result.rows.length > 0))
            todoItem = TodoMapper.map(result.rows[0]);

        return todoItem;
    }

    async CreateTodo(todoItem: any): Promise<Todo> {
        const insertResult = await pool.query(
            "INSERT INTO todo_item (client_id, version, message_id, name, description, is_complete) VALUES (?, ?, ?, ?, ?, ?) RETURNING *",
            [todoItem['clientId'], 0, todoItem['messageId'], todoItem['name'], todoItem['description'], false]
        );

        let newToDoItem: any = null;

        if (insertResult.rows != null && (insertResult.rows.length > 0))
            newToDoItem = TodoMapper.map(insertResult.rows[0]);

        return newToDoItem;        
    }

    async UpdateTodo(id: number, todoItem: any): Promise<Todo | null> {
        try {
            await pool.beginTransaction();
            
            // Read current version
            const versionResult = await pool.query(
                "SELECT version FROM todo_item WHERE id = ?",
                [id]
            );
            
            if (!versionResult.rows || versionResult.rows.length === 0) {
                await pool.rollback();
                return null;
            }
            
            const currentVersion = versionResult.rows[0].version;
            const newVersion = currentVersion + 1;
            
            // Update record without RETURNING
            await pool.query(
                "UPDATE todo_item SET name = ?, description = ?, is_complete = ?, message_id = ?, version = ? WHERE id = ?",
                [todoItem['name'], todoItem['description'], todoItem['isComplete'], todoItem['messageId'], newVersion, id]
            );
            
            // Select the updated record
            const selectResult = await pool.query(
                "SELECT * FROM todo_item WHERE id = ?",
                [id]
            );
            
            await pool.commit();
            
            let updatedTodoItem: any = null;
            
            if (selectResult.rows != null && selectResult.rows.length > 0)
                updatedTodoItem = TodoMapper.map(selectResult.rows[0]);
            
            return updatedTodoItem;
        } catch (error) {
            await pool.rollback();
            throw error;
        }
    }

    async GetTodoItemsCount(): Promise<any> {
        const result = await pool.query("SELECT COUNT(id) as count FROM todo_item");
        return parseInt(result.rows[0].count, 10);
    };

    async DeleteAllTodoItems(): Promise<any> {
        return await pool.query(
            "DELETE FROM todo_item");
    };

    async DeleteTodo(id: number): Promise<any> {
        return await pool.query(
            'DELETE FROM todo_item WHERE id = ?', [id]);
    };
}

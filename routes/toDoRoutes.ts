import {Router} from "express";
import {
    CreateToDo,
    DeleteAllToDoItems,
    DeleteToDoItem,
    GetToDoById,
    GetToDoItemsCount,
    UpdateToDo
} from "../controllers/toDoController";

const router: Router = Router();

router.post("/todoitems", CreateToDo);

// router.get("/todos", getTodos);

router.delete('/todoitems', DeleteAllToDoItems);
router.delete('/todoitems/:id', DeleteToDoItem);
router.get("/todoitems/count", GetToDoItemsCount);
router.get("/todoitems/:id", GetToDoById);
router.put("/todoitems/:id", UpdateToDo);

// router.delete("/todos/:_id", deleteTodoById);

export default router;

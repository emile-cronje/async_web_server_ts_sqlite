"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const toDoController_1 = require("../controllers/toDoController");
const router = (0, express_1.Router)();
router.post("/todoitems", toDoController_1.CreateToDo);
// router.get("/todos", getTodos);
router.delete('/todoitems', toDoController_1.DeleteAllToDoItems);
router.delete('/todoitems/:id', toDoController_1.DeleteToDoItem);
router.get("/todoitems/count", toDoController_1.GetToDoItemsCount);
router.get("/todoitems/:id", toDoController_1.GetToDoById);
router.put("/todoitems/:id", toDoController_1.UpdateToDo);
// router.delete("/todos/:_id", deleteTodoById);
exports.default = router;
//# sourceMappingURL=toDoRoutes.js.map
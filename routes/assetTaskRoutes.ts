import {Router} from "express";
import {
    CreateAssetTask,
    DeleteAllAssetTasks,
    DeleteAssetTask,
    GetAssetTaskById,
    GetAssetTasksCount,
    UpdateAssetTask
} from "../controllers/assetTaskController";

const router: Router = Router();

router.post("/assettasks", CreateAssetTask);
router.delete('/assettasks', DeleteAllAssetTasks);
router.delete('/assettasks/:id', DeleteAssetTask);
router.get("/assettasks/count", GetAssetTasksCount);
router.get("/assettasks/:id", GetAssetTaskById);
router.put("/assettasks/:id", UpdateAssetTask);

export default router;

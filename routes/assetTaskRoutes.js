"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const assetTaskController_1 = require("../controllers/assetTaskController");
const router = (0, express_1.Router)();
router.post("/assettasks", assetTaskController_1.CreateAssetTask);
router.delete('/assettasks', assetTaskController_1.DeleteAllAssetTasks);
router.delete('/assettasks/:id', assetTaskController_1.DeleteAssetTask);
router.get("/assettasks/count", assetTaskController_1.GetAssetTasksCount);
router.get("/assettasks/:id", assetTaskController_1.GetAssetTaskById);
router.put("/assettasks/:id", assetTaskController_1.UpdateAssetTask);
exports.default = router;
//# sourceMappingURL=assetTaskRoutes.js.map
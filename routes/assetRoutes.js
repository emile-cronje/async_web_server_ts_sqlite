"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const assetController_1 = require("../controllers/assetController");
const router = (0, express_1.Router)();
router.post("/assets", assetController_1.CreateAsset);
router.delete('/assets', assetController_1.DeleteAllAssets);
router.delete('/assets/:id', assetController_1.DeleteAsset);
router.get("/assets/count", assetController_1.GetAssetsCount);
router.get("/assets/:id", assetController_1.GetAssetById);
router.put("/assets/:id", assetController_1.UpdateAsset);
exports.default = router;
//# sourceMappingURL=assetRoutes.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const meterController_1 = require("../controllers/meterController");
const router = (0, express_1.Router)();
router.post("/meters", meterController_1.CreateMeter);
router.delete("/meters", meterController_1.DeleteAllMeters);
router.delete("/meters/:id", meterController_1.DeleteMeter);
router.get("/meters/count", meterController_1.GetMetersCount);
router.get("/meters/:id", meterController_1.GetMeterById);
router.put("/meters/:id", meterController_1.UpdateMeter);
router.get("/meters/:id/adr/", meterController_1.GetMeterAdr);
exports.default = router;
//# sourceMappingURL=meterRoutes.js.map
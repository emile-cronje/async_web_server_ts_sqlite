"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const meterReadingController_1 = require("../controllers/meterReadingController");
const router = (0, express_1.Router)();
router.post("/meterreadings", meterReadingController_1.CreateMeterReading);
router.delete('/meterreadings', meterReadingController_1.DeleteAllMeterReadings);
router.delete('/meterreadings/:id', meterReadingController_1.DeleteMeterReading);
router.get("/meterreadings/count", meterReadingController_1.GetMeterReadingsCount);
router.get("/meterreadings/:id", meterReadingController_1.GetMeterReadingById);
router.put("/meterreadings/:id", meterReadingController_1.UpdateMeterReading);
exports.default = router;
//# sourceMappingURL=meterReadingRoutes.js.map
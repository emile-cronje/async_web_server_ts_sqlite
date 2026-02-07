import {Router} from "express";
import {
    CreateMeterReading,
    DeleteAllMeterReadings,
    DeleteMeterReading,
    GetMeterReadingById,
    GetMeterReadingsCount,
    UpdateMeterReading
} from "../controllers/meterReadingController";

const router: Router = Router();

router.post("/meterreadings", CreateMeterReading);
router.delete('/meterreadings', DeleteAllMeterReadings);
router.delete('/meterreadings/:id', DeleteMeterReading);
router.get("/meterreadings/count", GetMeterReadingsCount);
router.get("/meterreadings/:id", GetMeterReadingById);
router.put("/meterreadings/:id", UpdateMeterReading);

export default router;

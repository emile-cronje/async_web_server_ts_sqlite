import {Router} from "express";
import {
    CreateMeter,
    DeleteAllMeters,
    DeleteMeter,
    GetMeterById,
    GetMetersCount,
    UpdateMeter,
    GetMeterAdr
} from "../controllers/meterController";

const router: Router = Router();

router.post("/meters", CreateMeter);
router.delete("/meters", DeleteAllMeters);
router.delete("/meters/:id", DeleteMeter);
router.get("/meters/count", GetMetersCount);
router.get("/meters/:id", GetMeterById);
router.put("/meters/:id", UpdateMeter);
router.get("/meters/:id/adr/", GetMeterAdr);

export default router;
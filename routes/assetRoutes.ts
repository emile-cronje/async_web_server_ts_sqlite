import {Router} from "express";
import {
    CreateAsset,
    DeleteAllAssets,
    DeleteAsset,
    GetAssetById,
    GetAssetsCount,
    UpdateAsset
} from "../controllers/assetController";

const router: Router = Router();

router.post("/assets", CreateAsset);
router.delete('/assets', DeleteAllAssets);
router.delete('/assets/:id', DeleteAsset);
router.get("/assets/count", GetAssetsCount);
router.get("/assets/:id", GetAssetById);
router.put("/assets/:id", UpdateAsset);

export default router;

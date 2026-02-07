import express, {Request, Response} from "express";
import todoRoutes from "./routes/toDoRoutes";
import assetRoutes from "./routes/assetRoutes";
import assetTaskRoutes from "./routes/assetTaskRoutes";
import meterRoutes from "./routes/meterRoutes";
import meterReadingRoutes from "./routes/meterReadingRoutes";
import {ToDoModel} from "./models/todoModel"
import {AssetModel} from "./models/assetModel"
import {MeterModel} from "./models/meterModel"
import {MeterReadingModel} from "./models/meterReadingModel"
import {AssetTaskModel} from "./models/assetTaskModel"

const PORT = 3002;

const app = express();

app.use(express.json());

app.get("/", (req: Request, res: Response) => {
    res.json({
        message: "Rest API using node",
    });
});

app.use('/api', todoRoutes);
app.use('/api', assetRoutes);
app.use('/api', assetTaskRoutes);
app.use('/api', meterRoutes);
app.use('/api', meterReadingRoutes);

const todoModel = new ToDoModel();
const assetModel = new AssetModel();
const assetTaskModel = new AssetTaskModel();
const meterModel = new MeterModel();
const meterReadingModel = new MeterReadingModel();

(async () => {
    try {
        await todoModel.Initialise();
        await assetModel.Initialise();
        await assetTaskModel.Initialise();        
        await meterModel.Initialise();
        await meterReadingModel.Initialise();        

        app.listen(PORT, () => {
            console.log("Server listening on port 3002");
        });
    } catch (error) {
        console.error('Error during startup:', error);
    }
})();

export default app;

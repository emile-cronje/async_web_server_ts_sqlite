"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const toDoRoutes_1 = __importDefault(require("./routes/toDoRoutes"));
const assetRoutes_1 = __importDefault(require("./routes/assetRoutes"));
const assetTaskRoutes_1 = __importDefault(require("./routes/assetTaskRoutes"));
const meterRoutes_1 = __importDefault(require("./routes/meterRoutes"));
const meterReadingRoutes_1 = __importDefault(require("./routes/meterReadingRoutes"));
const todoModel_1 = require("./models/todoModel");
const assetModel_1 = require("./models/assetModel");
const meterModel_1 = require("./models/meterModel");
const meterReadingModel_1 = require("./models/meterReadingModel");
const assetTaskModel_1 = require("./models/assetTaskModel");
const PORT = 3002;
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.get("/", (req, res) => {
    res.json({
        message: "Rest API using node",
    });
});
app.use('/api', toDoRoutes_1.default);
app.use('/api', assetRoutes_1.default);
app.use('/api', assetTaskRoutes_1.default);
app.use('/api', meterRoutes_1.default);
app.use('/api', meterReadingRoutes_1.default);
const todoModel = new todoModel_1.ToDoModel();
const assetModel = new assetModel_1.AssetModel();
const assetTaskModel = new assetTaskModel_1.AssetTaskModel();
const meterModel = new meterModel_1.MeterModel();
const meterReadingModel = new meterReadingModel_1.MeterReadingModel();
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
    }
    catch (error) {
        console.error('Error during startup:', error);
    }
})();
exports.default = app;
//# sourceMappingURL=app.js.map
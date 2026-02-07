"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DbMapper = void 0;
class DbMapper {
    constructor(columnToPropertyMap) {
        this.columnToPropertyMap = columnToPropertyMap;
    }
    map(dbObject) {
        const result = {};
        for (const column in this.columnToPropertyMap) {
            const property = this.columnToPropertyMap[column];
            result[property] = dbObject[column];
        }
        return result;
    }
    mapList(dbObjects) {
        return dbObjects.map((dbObject) => this.map(dbObject));
    }
}
exports.DbMapper = DbMapper;
//# sourceMappingURL=dbMapper.js.map
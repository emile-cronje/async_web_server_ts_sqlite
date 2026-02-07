export class DbMapper<T> {
    private columnToPropertyMap: { [key: string]: keyof T };

    constructor(columnToPropertyMap: { [key: string]: keyof T }) {
        this.columnToPropertyMap = columnToPropertyMap;
    }

    map(dbObject: any): T {
        const result: Partial<T> = {};
        for (const column in this.columnToPropertyMap) {
            const property = this.columnToPropertyMap[column];
            result[property] = dbObject[column];
        }
        return result as T;
    }

    mapList(dbObjects: any[]): T[] {
        return dbObjects.map((dbObject) => this.map(dbObject));
    }
}
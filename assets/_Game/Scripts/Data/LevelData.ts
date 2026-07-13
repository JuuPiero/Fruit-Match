import { _decorator, Component, JsonAsset, Node } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('FruitData')
export class FruitData {
    @property positionX: number = 0;
    @property positionY: number = 0;
}


@ccclass('TreeData')
export class TreeData {
    @property treeType: number = 0;
    @property positionX: number = 0;
    @property positionY: number = 0;
    @property width: number = 0;
    @property height: number = 0;
}

@ccclass('LevelData')
export class LevelData {
    @property(TreeData) tree: TreeData = new TreeData();
    @property(FruitData) fruits: FruitData[] = [];


    static parseFromJson(jsonAsset: JsonAsset): LevelData {
        const levelData = new LevelData();

        // Kiểm tra xem file JSON có dữ liệu hợp lệ không
        if (!jsonAsset || !jsonAsset.json) {
            console.warn("LevelData: JsonAsset trống hoặc không hợp lệ!");
            return levelData;
        }

        const data: any = jsonAsset.json;

        // 1. Gắn dữ liệu cho Tree
        if (data.tree) {
            levelData.tree.treeType = data.tree.treeType ?? 0;
            levelData.tree.positionX = data.tree.positionX ?? 0;
            levelData.tree.positionY = data.tree.positionY ?? 0;
            levelData.tree.width = data.tree.width ?? 0;
            levelData.tree.height = data.tree.height ?? 0;
        }

        // 2. Gắn dữ liệu cho mảng Fruits
        if (data.fruits && Array.isArray(data.fruits)) {
            levelData.fruits = data.fruits.map((f: any) => {
                const fruit = new FruitData();
                fruit.positionX = f.positionX ?? 0;
                fruit.positionY = f.positionY ?? 0;
                return fruit;
            });
        }

        return levelData;
    }


}

import { _decorator, Component, JsonAsset, Node } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('FruitData')
export class FruitData {
    // Tên sprite icon thật (vd "red_apple"), khớp tên file .png trong FruitConfigSA — khoá tra
    // cứu ổn định thay cho fruitType (Unity dùng enum thưa, không phải index liền mạch).
    // Rỗng nếu JSON cũ chưa có field này (level tự author trong Cocos) — khi đó fallback sang
    // fruitType như một index thẳng vào mảng sprite (xem Fruit.initialize).
    @property fruitName: string = '';
    @property fruitType: number = 0;
    @property positionX: number = 0;
    @property positionY: number = 0;
    /** Thứ tự render trong Tree: số lớn hơn sẽ được vẽ nằm trên số nhỏ hơn. -1 = JSON cũ. */
    @property renderOrder: number = -1;
}


@ccclass('TreeData')
export class TreeData {
    @property treeType: number = 0;
    @property positionX: number = 0;
    @property positionY: number = 0;
    @property width: number = 0;
    @property height: number = 0;
}

@ccclass('SlotsFruit')
export class SlotsFruit {
    @property(FruitData) fruits: FruitData[] = [];
}

@ccclass('LevelData')
export class LevelData {
    @property(TreeData) tree: TreeData = new TreeData();

    @property(SlotsFruit) slots: SlotsFruit[] = []

    get fruits(): FruitData[] {
        return this.slots.reduce((acc: FruitData[], slot: SlotsFruit) => acc.concat(slot.fruits), []);
    }

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

        const parseFruit = (f: any): FruitData => {
            const fruit = new FruitData();
            fruit.fruitName = f.fruitName ?? '';
            fruit.fruitType = f.fruitType ?? 0
            fruit.positionX = f.positionX ?? 0;
            fruit.positionY = f.positionY ?? 0;
            fruit.renderOrder = f.renderOrder ?? -1;
            return fruit;
        };

        // 2. Gắn dữ liệu cho mảng Slots (mỗi slot chứa nhiều fruits)
        if (data.slots && Array.isArray(data.slots)) {
            levelData.slots = data.slots.map((s: any) => {
                const slot = new SlotsFruit();
                slot.fruits = Array.isArray(s.fruits) ? s.fruits.map(parseFruit) : [];
                return slot;
            });
        }
        // 2b. Tương thích ngược với format cũ (mảng fruits phẳng ở cấp root, không có khái niệm stack)
        // Mỗi fruit tách thành 1 slot riêng để tất cả đều active/mở khoá ngay từ đầu, không bị stack chồng nhau
        else if (data.fruits && Array.isArray(data.fruits)) {
            levelData.slots = data.fruits.map((f: any) => {
                const slot = new SlotsFruit();
                slot.fruits = [parseFruit(f)];
                return slot;
            });
        }

        return levelData;
    }


}

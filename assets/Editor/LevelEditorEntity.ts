import { _decorator, Canvas, CCBoolean, Component, Node, Sprite, SpriteFrame, UITransform } from 'cc';
import { FruitConfigSA } from '../_Game/Scripts/Data/FruitConfigSA';
import { FruitData, LevelData, SlotsFruit, TreeData } from '../_Game/Scripts/Data/LevelData';
import { GameConfigSA } from '../_Game/Scripts/Data/GameConfigSA';
const { ccclass, property } = _decorator;

@ccclass('DebugFruitCount')
export class DebugFruitCount {
    @property(SpriteFrame) fruit: SpriteFrame = null;
    // @property fruitName: string = "";
    @property count: number = 0;

    constructor(spriteFrame: SpriteFrame = null, count: number = 0) {
        this.fruit = spriteFrame;
        this.count = count;
    }
}

@ccclass('LevelEditorEntity')
export class LevelEditorEntity extends Component {
    @property(GameConfigSA) gameConfig: GameConfigSA = null;
    @property(FruitConfigSA) fruitConfig: FruitConfigSA = null;

    @property(Canvas) canvas: Canvas = null;

    /** Kéo đúng 3 node fruit cần tutorial chỉ vào đây. Tutorial sẽ trỏ theo thứ tự spawn trong level. */
    @property({ type: [Node], tooltip: 'Kéo đúng 3 node Fruit tutorial vào đây. Tutorial trỏ theo thứ tự spawn trong level.' })
    tutorialFruits: Node[] = [];

    @property(DebugFruitCount) fruitCountDebug: DebugFruitCount[] = []

    private _countingFruits: boolean;
    @property(CCBoolean) public get countingFruits(): boolean {
        return this._countingFruits;
    }
    public set countingFruits(v: boolean) {
        this.fruitCountDebug = [];

        const treeSprite = this.canvas.getComponent(Sprite);
        const allFruitSprites = this.canvas.getComponentsInChildren(Sprite)
        const treeIndex = allFruitSprites.indexOf(treeSprite);
        if (treeIndex > -1) {
            allFruitSprites.splice(treeIndex, 1); // 1 means remove exactly one item
        }

        const countMap = new Map<SpriteFrame, number>();

        for (const fruitSprite of allFruitSprites) {
            // Lấy tên theo SpriteFrame (nếu có) hoặc tên Node
            // const name = fruitSprite.spriteFrame ? fruitSprite.spriteFrame.name : fruitSprite.node.name;

            const currentCount = countMap.get(fruitSprite.spriteFrame) || 0;
            countMap.set(fruitSprite.spriteFrame, currentCount + 1);
        }

        // 4. Chuyển kết quả từ Map sang mảng DebugFruitCount
        countMap.forEach((count, fruitName) => {
            this.fruitCountDebug.push(new DebugFruitCount(fruitName, count));
        });

        console.log("Lậy bố");
    }




    private _saveLevel = false;
    @property(CCBoolean)
    public get saveLevel(): boolean {
        return this._saveLevel;
    }
    public set saveLevel(v: boolean) {
        const tutorialFruitNodes = this.getTutorialFruitNodes();
        const level = new LevelData();
        const treeData = new TreeData();
        const uiTree: UITransform = this.canvas.getComponent(UITransform);
        const treeSprite = this.canvas.getComponent(Sprite);
        treeData.height = uiTree.contentSize.height;
        treeData.width = uiTree.contentSize.width;
        treeData.treeType = parseInt(treeSprite.spriteFrame.name);
        // treeData.positionX = this.tree.node.position.x;
        // treeData.positionY = this.tree.node.position.y;
        level.tree = treeData;

        level.slots = []
        level.slots.push(new SlotsFruit())

        const allFruitSprites = this.canvas.getComponentsInChildren(Sprite)
        const treeIndex = allFruitSprites.indexOf(treeSprite);
        if (treeIndex > -1) {
            allFruitSprites.splice(treeIndex, 1); // 1 means remove exactly one item
        }
        for (const fruitSprite of allFruitSprites) {
            const fruit = new FruitData()
            fruit.fruitName = fruitSprite.spriteFrame.name;
            fruit.fruitType = this.fruitConfig.fruits.indexOf(fruitSprite.spriteFrame);
            fruit.positionX = fruitSprite.node.position.x;
            fruit.positionY = fruitSprite.node.position.y;
            fruit.isTut = tutorialFruitNodes.has(fruitSprite.node);
            level.slots[0].fruits.push(fruit)
        }

        console.log("Hello world");

        const json = JSON.stringify(level)

        const blob = new Blob([json], { type: 'application/json' });
        this.saveBlobToFile(blob, 'data.json');

    }

    private getTutorialFruitNodes(): Set<Node> {
        const nodes = this.tutorialFruits.filter(node => node?.isValid);
        const uniqueNodes = new Set(nodes);
        if (uniqueNodes.size > 0 && uniqueNodes.size !== 3) {
            console.warn(`LevelEditorEntity: Tutorial Fruits cần đúng 3 node; hiện có ${uniqueNodes.size}. Level xuất ra sẽ không có tutorial cố định.`);
        }
        return uniqueNodes;
    }


    saveBlobToFile(blob: Blob, fileName: string): void {
        // Create an object URL pointing to the blob data
        const url = URL.createObjectURL(blob);

        // Create a temporary hidden link element
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = fileName;

        // Append to DOM, click it to trigger download, then remove it
        document.body.appendChild(anchor);
        anchor.click();
        document.body.removeChild(anchor);

        // Release the object URL memory
        URL.revokeObjectURL(url);
    }
}



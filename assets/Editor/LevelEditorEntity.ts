import { _decorator, Canvas, CCBoolean, Component, Node, Sprite, UITransform } from 'cc';
import { FruitConfigSA } from '../_Game/Scripts/Data/FruitConfigSA';
import { FruitData, LevelData, SlotsFruit, TreeData } from '../_Game/Scripts/Data/LevelData';
import { GameConfigSA } from '../_Game/Scripts/Data/GameConfigSA';
const { ccclass, property } = _decorator;

@ccclass('LevelEditorEntity')
export class LevelEditorEntity extends Component {
    @property(GameConfigSA) gameConfig: GameConfigSA = null;
    @property(FruitConfigSA) fruitConfig: FruitConfigSA = null;

    @property(Canvas) canvas: Canvas = null;


    private _saveLevel = false;

    @property(CCBoolean)
    public get saveLevel(): boolean {
        return this._saveLevel;
    }
    public set saveLevel(v: boolean) {
        // if (!this.tree || !this.gameConfig) {
        //     console.warn('LevelEditor: tree or gameConfig is not assigned.');
        //     return;
        // }
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
            fruit.fruitType =  this.fruitConfig.fruits.indexOf(fruitSprite.spriteFrame);
            fruit.positionX = fruitSprite.node.position.x;
            fruit.positionY = fruitSprite.node.position.y;
            level.slots[0].fruits.push(fruit)
        }

        console.log("Hello world");

        const json = JSON.stringify(level)

        const blob = new Blob([json], { type: 'application/json' });
        this.saveBlobToFile(blob, 'data.json');

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



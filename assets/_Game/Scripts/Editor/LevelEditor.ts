import { _decorator, CCBoolean, Component, Sprite, UITransform } from 'cc';
import { Tree } from '../Tree';
import { FruitData, LevelData, SlotsFruit, TreeData } from '../Data/LevelData';
import { GameConfigSA } from '../Data/GameConfigSA';
import { FruitConfigSA } from '../Data/FruitConfigSA';
import { Fruit } from '../Fruit';
const { ccclass, property, executeInEditMode } = _decorator;
// const fs = require('fs');
// const path = require('path');

@ccclass('LevelEditor')
@executeInEditMode
export class LevelEditor extends Component {
    @property(Tree) tree: Tree = null;

    @property(GameConfigSA) gameConfig: GameConfigSA = null;
    @property(FruitConfigSA) fruitConfig: FruitConfigSA = null;

    private _saveLevel = false;

    @property(CCBoolean)
    public get saveLevel(): boolean {
        return this._saveLevel;
    }

    public set saveLevel(v: boolean) {
        if (this._saveLevel === v) {
            return;
        }

        this._saveLevel = v;
        if (!v) {
            return;
        }

        this.saveCurrentLevelToJson();
        this._saveLevel = false;
    }

    private saveCurrentLevelToJson(): void {
        if (!this.tree || !this.gameConfig) {
            console.warn('LevelEditor: tree or gameConfig is not assigned.');
            return;
        }

        const level = new LevelData();

        const treeData = new TreeData();
        const uiTree: UITransform = this.tree.getComponent(UITransform);
        const treeSprite = this.tree.getComponent(Sprite);
        treeData.height = uiTree.contentSize.height;
        treeData.width = uiTree.contentSize.width;
        treeData.treeType = this.gameConfig.trees.indexOf(treeSprite.spriteFrame);
        treeData.positionX = this.tree.node.position.x;
        treeData.positionY = this.tree.node.position.y;

        level.tree = treeData;

        // Gom các fruit theo stackIndex thành từng slot (stack). stackIndex = -1 => đứng riêng (slot 1 quả).
        const stackGroups = new Map<number, { fruit: Fruit; data: FruitData }[]>();
        let standaloneKey = -1;

        const fruits = this.getComponentsInChildren(Fruit);
        for (const item of fruits) {
            const fruitData = new FruitData();
            fruitData.positionX = item.node.position.x / treeData.width;
            fruitData.positionY = item.node.position.y / treeData.height;

            const fruitSprite = item.getComponent(Sprite);
            fruitData.fruitType = this.fruitConfig.fruits.indexOf(fruitSprite.spriteFrame);
            if (fruitData.fruitType < 0) {
                console.warn(`LevelEditor: không tìm thấy fruitType cho node "${item.node.name}" trong fruitConfig.`);
            }

            const key = item.stackIndex >= 0 ? item.stackIndex : standaloneKey--;
            if (!stackGroups.has(key)) {
                stackGroups.set(key, []);
            }
            stackGroups.get(key).push({ fruit: item, data: fruitData });
        }

        const slots: SlotsFruit[] = Array.from(stackGroups.entries())
            .sort(([a], [b]) => a - b)
            .map(([, entries]) => {
                entries.sort((a, b) => a.fruit.orderInStack - b.fruit.orderInStack);
                const slot = new SlotsFruit();
                slot.fruits = entries.map(e => e.data);
                return slot;
            });

        level.slots = slots;


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



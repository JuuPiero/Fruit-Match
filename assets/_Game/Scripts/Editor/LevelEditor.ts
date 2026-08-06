import { _decorator, CCBoolean, Color, Component, Sprite, UITransform } from 'cc';
import { Tree } from '../Tree';
import { FruitData, LevelData, SlotsFruit, TreeData } from '../Data/LevelData';
import { GameConfigSA } from '../Data/GameConfigSA';
import { FruitConfigSA } from '../Data/FruitConfigSA';
import { Fruit } from '../Fruit';
const { ccclass, property, executeInEditMode } = _decorator;
// const fs = require('fs');
// const path = require('path');

/** Giống LOCKED_COLOR trong Fruit.ts, dùng để preview màu tối của fruit bị khoá trong editor. */
const LOCKED_PREVIEW_COLOR = new Color(120, 120, 120, 255);

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

    private _previewStackLock = false;

    @property(CCBoolean)
    public get previewStackLock(): boolean {
        return this._previewStackLock;
    }

    public set previewStackLock(v: boolean) {
        if (this._previewStackLock === v) {
            return;
        }

        this._previewStackLock = v;
        if (!v) {
            return;
        }

        this.applyStackLockPreview();
        this._previewStackLock = false;
    }

    /** Gom các fruit theo stackIndex thành từng stack (mảng con), đã sắp theo orderInStack (0 = trên cùng). stackIndex = -1 => đứng riêng (stack 1 quả). */
    private getFruitStacks(): Fruit[][] {
        const groups = new Map<number, Fruit[]>();
        let standaloneKey = -1;

        for (const item of this.getComponentsInChildren(Fruit)) {
            const key = item.stackIndex >= 0 ? item.stackIndex : standaloneKey--;
            if (!groups.has(key)) {
                groups.set(key, []);
            }
            groups.get(key).push(item);
        }

        return Array.from(groups.entries())
            .sort(([a], [b]) => a - b)
            .map(([, stack]) => stack.sort((a, b) => a.orderInStack - b.orderInStack));
    }

    /** Tô tối các fruit không phải trên cùng của mỗi stack, giống lúc chơi thật (Fruit.setLocked). Không dùng setLocked() trực tiếp vì Fruit không chạy onLoad ở edit mode nên _sprite chưa được cache. */
    private applyStackLockPreview(): void {
        for (const stack of this.getFruitStacks()) {
            stack.forEach((fruit, i) => {
                const sprite = fruit.getComponent(Sprite);
                if (sprite) sprite.color = i !== 0 ? LOCKED_PREVIEW_COLOR : Color.WHITE;
            });
        }
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

        const slots: SlotsFruit[] = this.getFruitStacks().map(stack => {
            const slot = new SlotsFruit();
            slot.fruits = stack.map(item => {
                const fruitData = new FruitData();
                fruitData.positionX = item.node.position.x / treeData.width;
                fruitData.positionY = item.node.position.y / treeData.height;

                const fruitSprite = item.getComponent(Sprite);
                fruitData.fruitName = fruitSprite.spriteFrame?.name ?? '';
                fruitData.fruitType = this.fruitConfig.fruits.indexOf(fruitSprite.spriteFrame);
                if (fruitData.fruitType < 0) {
                    console.warn(`LevelEditor: không tìm thấy fruitType cho node "${item.node.name}" trong fruitConfig.`);
                }

                return fruitData;
            });
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



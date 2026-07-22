import { _decorator, Component, instantiate, Node, Size, Sprite, UITransform, Vec2, Vec3 } from 'cc';
import { LevelData, TreeData } from './Data/LevelData';
import { GameBehaviour } from '../../_iKame/Scripts/Commons/GameBehaviour';
import { ServiceLocator } from '../../_iKame/Scripts/ServiceLocator';
import { GameConfigSA } from './Data/GameConfigSA';
import { Fruit } from './Fruit';
import { FruitConfigSA } from './Data/FruitConfigSA';
const { ccclass, property } = _decorator;


@ccclass('Tree')
export class Tree extends GameBehaviour {

    private static readonly FRUIT_SPAWN_INTERVAL = 0.01;

    _uiTransform: UITransform = null;

    _sprite: Sprite = null;


    @property(TreeData) data: TreeData = null;

    protected onLoad(): void {
        this._uiTransform = this.getComponent(UITransform)
        this._sprite = this.getComponent(Sprite)
    }

    initialize(levelData: LevelData) {
        // this.node.destroyAllChildren()
        const allFruitsSpriteFrame = ServiceLocator.get(FruitConfigSA).fruits


        this.clearChildren()
        this.data = levelData.tree;
        this._uiTransform.setContentSize(new Size(this.data.width, this.data.height))
        this.node.setPosition(new Vec3(this.data.positionX, this.data.positionY, 0))


        // console.log("Cây: " + ServiceLocator.get(GameConfigSA).treeMap.size);

        this._sprite.spriteFrame = ServiceLocator.get(GameConfigSA).getTree(this.data.treeType)

        const fruitPrefab = ServiceLocator.get(GameConfigSA).fruitPrefab

        const fruitIds = this.generateFruitIds(levelData.fruits.length, allFruitsSpriteFrame.length)


        const slots = levelData.slots;

        const height = this._uiTransform.contentSize.height;
        const width = this._uiTransform.contentSize.width;

        let spawnIndex = 0; // index = 0 is on top of stack
        slots.forEach((slot, index) => {
            const stackFruits: Fruit[] = new Array(slot.fruits.length)

            for (let i = slot.fruits.length - 1; i >= 0; i--) {
                const fruitData = slot.fruits[i]
                const node = instantiate(fruitPrefab)
                node.setParent(this.node)
                node.setPosition(new Vec3(fruitData.positionX * width, fruitData.positionY * height, 0))
                const fruit = node.getComponent(Fruit)
                node.name = `Slot: ${index}, Index: ${spawnIndex}`
                fruit.initialize(fruitData, spawnIndex * Tree.FRUIT_SPAWN_INTERVAL)
                stackFruits[i] = fruit
                spawnIndex++
            }

            this.setupStackLocking(stackFruits)
        })
    }

    /** Chỉ quả trên cùng (index 0) của stack được phép tương tác, các quả dưới bị khoá (tối màu) cho tới khi lộ ra */
    private setupStackLocking(stack: Fruit[]) {
        if (stack.length === 0) return

        stack.forEach((fruit, i) => {
            fruit.setLocked(i !== 0, true)
            fruit.onPicked = () => {
                const next = stack[i + 1]
                if (next) next.setLocked(false)
            }
        })
    }

    private generateFruitIds(fruitCount: number, fruitTypeCount: number): number[] {
        if (fruitCount % 3 !== 0) {
            console.warn(`Tree: số lượng quả (${fruitCount}) không chia hết cho 3, sẽ thừa ${fruitCount % 3} quả không thể match! Hãy sửa lại level.`)
        }

        const fruitIds: number[] = []

        // Mỗi nhóm 3 quả dùng chung 1 loại random
        const groupCount = Math.floor(fruitCount / 3)
        for (let i = 0; i < groupCount; i++) {
            const id = Math.floor(Math.random() * fruitTypeCount)
            fruitIds.push(id, id, id)
        }

        // Quả thừa (level sai) vẫn gán random để không bị lỗi
        while (fruitIds.length < fruitCount) {
            fruitIds.push(Math.floor(Math.random() * fruitTypeCount))
        }

        // Shuffle (Fisher-Yates) để các quả cùng loại không nằm cạnh nhau
        for (let i = fruitIds.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [fruitIds[i], fruitIds[j]] = [fruitIds[j], fruitIds[i]]
        }

        return fruitIds
    }
}



import { _decorator, Component, instantiate, Node, Size, Sprite, UITransform, Vec2, Vec3 } from 'cc';
import { LevelData, SlotsFruit, TreeData } from './Data/LevelData';
import { GameBehaviour } from '../../_iKame/Scripts/Commons/GameBehaviour';
import { ServiceLocator } from '../../_iKame/Scripts/ServiceLocator';
import { GameConfigSA } from './Data/GameConfigSA';
import { Fruit } from './Fruit';
import { FruitConfigSA } from './Data/FruitConfigSA';
import { Tutorial } from './Tutorial';
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

    initialize(levelData: LevelData, randomizeFruitTypes = false) {
        // this.node.destroyAllChildren()
        const allFruitsSpriteFrame = ServiceLocator.get(FruitConfigSA).fruits


        this.clearChildren()
        this.data = levelData.tree;
        this._uiTransform.setContentSize(new Size(this.data.width, this.data.height))
        this.node.setPosition(new Vec3(this.data.positionX, this.data.positionY, 0))


        // console.log("Cây: " + ServiceLocator.get(GameConfigSA).treeMap.size);

        this._sprite.spriteFrame = ServiceLocator.get(GameConfigSA).getTree(this.data.treeType)

        const fruitPrefab = ServiceLocator.get(GameConfigSA).fruitPrefab

        const fruitIds = randomizeFruitTypes
            ? this.generateFruitIds(levelData.fruits.length, allFruitsSpriteFrame.length)
            : null

        if (fruitIds) {
            // Đảm bảo luôn có ít nhất 1 nhóm 3 quả cùng loại nằm ở đầu stack (đang active) để tutorial luôn chạy được
            this.ensureTopStackMatchExists(fruitIds, this.getTopSpawnIndices(levelData.slots))
        }


        const slots = levelData.slots;

        const height = this._uiTransform.contentSize.height;
        const width = this._uiTransform.contentSize.width;

        const totalFruits = levelData.fruits.length
        let spawnedCount = 0

        let spawnIndex = 0; // index = 0 is on top of stack
        const topFruits: Fruit[] = []
        slots.forEach((slot, index) => {
            const stackFruits: Fruit[] = new Array(slot.fruits.length)

            for (let i = slot.fruits.length - 1; i >= 0; i--) {
                const fruitData = slot.fruits[i]
                if (fruitIds) {
                    fruitData.fruitType = fruitIds[spawnIndex]
                }
                const node = instantiate(fruitPrefab)
                node.setParent(this.node)
                node.setPosition(new Vec3(fruitData.positionX * width, fruitData.positionY * height, 0))
                const fruit = node.getComponent(Fruit)
                node.name = `Slot: ${index}, Index: ${spawnIndex}`
                fruit.initialize(fruitData, spawnIndex * Tree.FRUIT_SPAWN_INTERVAL, () => {
                    spawnedCount++
                    if (spawnedCount === totalFruits) {
                        ServiceLocator.get(Tutorial).begin(this.node.children)
                    }
                })
                stackFruits[i] = fruit
                spawnIndex++
            }

            this.setupStackLocking(stackFruits)
            topFruits.push(stackFruits[0])
        })

        // Dồn các quả trên cùng (index 0) của mọi stack xuống cuối danh sách sibling để luôn render đè lên các quả bị khoá
        topFruits.forEach(fruit => fruit.node.setSiblingIndex(-1))
    }

    /** Chỉ quả trên cùng (index 0) của stack được phép tương tác, các quả dưới bị khoá (tối màu) cho tới khi lộ ra */
    private setupStackLocking(stack: Fruit[]) {
        if (stack.length === 0) return

        stack.forEach((fruit, i) => {
            fruit.setLocked(i !== 0, true)
            fruit.onPicked = () => {
                const next = stack[i + 1]
                if (next) {
                    next.setLocked(false)
                    // Quả vừa lộ ra cũng là quả trên cùng mới của stack, đẩy xuống cuối sibling để render đè lên
                    next.node.setSiblingIndex(-1)
                }
            }
        })
    }

    /** Vị trí (spawnIndex) của quả trên cùng (i = 0) mỗi stack, theo đúng thứ tự spawnIndex được gán trong initialize() */
    private getTopSpawnIndices(slots: SlotsFruit[]): number[] {
        const topIndices: number[] = []
        let cumulative = 0
        for (const slot of slots) {
            cumulative += slot.fruits.length
            if (slot.fruits.length > 0) topIndices.push(cumulative - 1)
        }
        return topIndices
    }

    /** Khi random loại quả, đảm bảo luôn có ít nhất 3 quả cùng loại nằm ở đầu stack (đang active) để tutorial luôn tìm được nhóm để chỉ */
    private ensureTopStackMatchExists(fruitIds: number[], topSpawnIndices: number[]) {
        if (topSpawnIndices.length < 3) return

        const countAtTopByType = new Map<number, number>()
        for (const idx of topSpawnIndices) {
            const type = fruitIds[idx]
            countAtTopByType.set(type, (countAtTopByType.get(type) ?? 0) + 1)
        }
        if ([...countAtTopByType.values()].some(count => count >= 3)) return

        const totalCountByType = new Map<number, number>()
        for (const id of fruitIds) totalCountByType.set(id, (totalCountByType.get(id) ?? 0) + 1)
        const targetType = [...totalCountByType.entries()].find(([, count]) => count >= 3)?.[0]
        if (targetType === undefined) return

        const topSet = new Set(topSpawnIndices)
        const alreadyMatching = topSpawnIndices.filter(idx => fruitIds[idx] === targetType)
        const topSlotsToFill = topSpawnIndices
            .filter(idx => fruitIds[idx] !== targetType)
            .slice(0, 3 - alreadyMatching.length)

        // Đổi chỗ (không thay đổi tổng số lượng mỗi loại) với các quả khác đang giữ targetType nhưng không nằm ở đầu stack
        const donorIndices = fruitIds
            .map((id, idx) => ({ id, idx }))
            .filter(({ id, idx }) => id === targetType && !topSet.has(idx))
            .map(({ idx }) => idx)

        topSlotsToFill.forEach((topIdx, i) => {
            const donorIdx = donorIndices[i]
            if (donorIdx === undefined) return
            const tmp = fruitIds[topIdx]
            fruitIds[topIdx] = fruitIds[donorIdx]
            fruitIds[donorIdx] = tmp
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



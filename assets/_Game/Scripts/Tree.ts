import { _decorator, Component, instantiate, Node, Size, Sprite, UITransform, Vec2, Vec3 } from 'cc';
import { LevelData, SlotsFruit, TreeData } from './Data/LevelData';
import { GameBehaviour } from '../../_iKame/Scripts/Commons/GameBehaviour';
import { ServiceLocator } from '../../_iKame/Scripts/ServiceLocator';
import { GameConfigSA } from './Data/GameConfigSA';
import { Fruit } from './Fruit';
import { FruitConfigSA } from './Data/FruitConfigSA';
import { Tutorial } from './Tutorial';
import { CoverPoint, isBlocked } from './CoverageRule';
import { PREVIEW } from 'cc/env';
const { ccclass, property } = _decorator;

interface CoverageItem extends CoverPoint {
    fruit: Fruit
}


@ccclass('Tree')
export class Tree extends GameBehaviour {

    private static readonly FRUIT_SPAWN_INTERVAL = 0.01;

    _uiTransform: UITransform = null;

    _sprite: Sprite = null;


    @property(TreeData) data: TreeData = null;

    @property({ tooltip: 'Giống LevelDef.blockCountThreshold (C#): block count đạt ngưỡng này thì quả MỚI có thể bị chặn — rồi coverDistance quyết định. Áp dụng bất cứ khi nào flattenFruits tắt (kể cả khi randomizeFruitTypes bật).' })
    blockCountThreshold: number = 2;

    @property({ tooltip: 'Giống LevelDef.coverDistance (C#): quả bị block-count đánh dấu chỉ thực sự bị chặn nếu có quả tầng trên trong khoảng cách này (đơn vị pixel, theo scale của cây này — không copy thẳng số từ Unity, cần tự tune lại). 0 = block-count thuần.' })
    coverDistance: number = 0;


    fruitSet: Set<string> = new Set()

    protected onLoad(): void {
        this._uiTransform = this.getComponent(UITransform)
        this._sprite = this.getComponent(Sprite)
    }

    initialize(
        levelData: LevelData,
        randomizeFruitTypes = false,
        flattenFruits = false,
        fruitRandomSeed = '0',
        randomFruitTypeCount = 0,
    ) {
        // this.node.destroyAllChildren()
        const allFruitsSpriteFrame = ServiceLocator.get(FruitConfigSA).fruits


        this.clearChildren()
        this.data = levelData.tree;
        this._uiTransform.setContentSize(new Size(this.data.width, this.data.height))
        this.node.setPosition(new Vec3(this.data.positionX, this.data.positionY, 0))


        // console.log("Cây: " + ServiceLocator.get(GameConfigSA).treeMap.size);

        this._sprite.spriteFrame = ServiceLocator.get(GameConfigSA).getTree(this.data.treeType)

        const fruitPrefab = ServiceLocator.get(GameConfigSA).fruitPrefab

        const slots = levelData.slots;
        const fruitDatas = this.getFruitDatasInSpawnOrder(slots)

        // 0 nghĩa là dùng tất cả loại fruit. Giá trị lớn hơn số sprite sẽ tự giới hạn về số sprite hiện có.
        const fruitTypeCount = randomFruitTypeCount > 0
            ? Math.min(randomFruitTypeCount, allFruitsSpriteFrame.length)
            : allFruitsSpriteFrame.length
        const fruitTypes = randomizeFruitTypes
            ? this.generateFruitIds(levelData.fruits.length, fruitTypeCount, fruitRandomSeed)
            : fruitDatas.map(data => data.fruitType)
        // Với level không random, fruitName quyết định sprite hiển thị. Giữ một bản
        // song song để khi đổi loại hai quả, sprite của chúng cũng đổi theo.
        const fruitNames = fruitDatas.map(data => data.fruitName)

        // Ưu tiên 3 quả được level designer đánh dấu isTut. Chỉ số này theo thứ tự
        // spawn/JSON: từng slot từ trên xuống, và trong mỗi slot là top -> bottom.
        // Nếu không đánh dấu, giữ nguyên hành vi cũ: khi random + flatten thì dùng 3 quả cuối.
        const markedTutorialIndices = fruitDatas
            .map((fruit, index) => fruit.isTut ? index : -1)
            .filter(index => index >= 0)
        const hasExplicitTutorialGroup = markedTutorialIndices.length === 3
        if (markedTutorialIndices.length > 0 && !hasExplicitTutorialGroup) {
            console.warn(`Tree: isTut phải được đánh dấu trên đúng 3 quả; hiện có ${markedTutorialIndices.length}. Bỏ qua cấu hình tutorial này.`)
        }

        const targetIndices = hasExplicitTutorialGroup
            ? markedTutorialIndices
            : randomizeFruitTypes && flattenFruits
                ? [fruitTypes.length - 1, fruitTypes.length - 2, fruitTypes.length - 3].filter(idx => idx >= 0)
                : null
        // Nhóm isTut luôn phải là một bộ có thể match. Nếu ba quả chưa cùng loại,
        // forceFruitsMatch hoán đổi data với quả khác, nên không làm thay đổi tổng
        // số lượng của mỗi loại trong level. Khi random, vẫn áp dụng quy tắc này
        // cho nhóm fallback cũ.
        const tutorialSpawnIndices = targetIndices
            ? this.forceFruitsMatch(fruitTypes, targetIndices, fruitNames)
            : null

        fruitDatas.forEach((data, idx) => {
            data.fruitType = fruitTypes[idx]

            // Khi random, Fruit.initialize ưu tiên fruitName để hiển thị sprite.
            // Xóa tên gốc để sprite cũng dùng fruitType vừa được random, đồng bộ
            // với fruitId dùng cho logic match. Không random thì dùng fruitName
            // đã hoán đổi cùng fruitType (nếu nhóm tutorial cần được ép cùng loại).
            if (randomizeFruitTypes) data.fruitName = ''
            else data.fruitName = fruitNames[idx]
        })


        const height = this._uiTransform.contentSize.height;
        const width = this._uiTransform.contentSize.width;

        const totalFruits = levelData.fruits.length
        let spawnedCount = 0

        // Trừ flattenFruits (mở hết ngay từ đầu), mọi trường hợp còn lại — kể cả khi
        // randomizeFruitTypes bật — đều dùng đúng cơ chế khoá của C# (CoverageRule:
        // block-count + cover-distance, xét cả stack khác), không còn khoá tuần tự theo stack.
        const useCoverageRule = !flattenFruits

        // Spawn theo đúng thứ tự trong JSON: slot.fruits[0] là quả trên cùng.
        // Render order được chỉnh riêng bên dưới, không dùng thứ tự spawn để đảo layer nữa.
        let spawnIndex = 0;
        const topFruits: Fruit[] = []
        const fruitsBySpawnIndex: Fruit[] = new Array(totalFruits)
        const coverageItems: CoverageItem[] = []
        const fruitsByRenderOrder: { fruit: Fruit, renderOrder: number }[] = []
        slots.forEach((slot, index) => {
            const stackFruits: Fruit[] = new Array(slot.fruits.length)

            for (let i = 0; i < slot.fruits.length; i++) {
                const fruitData = slot.fruits[i]
                const node = instantiate(fruitPrefab)
                node.setParent(this.node)
                node.setPosition(new Vec3(fruitData.positionX * width, fruitData.positionY * height, 0))
                const fruit = node.getComponent(Fruit)
                node.name = `Slot: ${index}, Index: ${spawnIndex}`
                    this.fruitSet.add(fruitData.fruitName)

                fruit.initialize(fruitData, spawnIndex * Tree.FRUIT_SPAWN_INTERVAL, () => {
                    spawnedCount++

                    if (spawnedCount === totalFruits) {
                        const tutorialGroup = tutorialSpawnIndices?.map(idx => fruitsBySpawnIndex[idx])
                        this.scheduleOnce(() => {
                            ServiceLocator.get(Tutorial).begin(this.node.children, tutorialGroup)
                        })
                    }
                })
                stackFruits[i] = fruit
                fruitsBySpawnIndex[spawnIndex] = fruit
                if (fruitData.renderOrder >= 0) {
                    fruitsByRenderOrder.push({ fruit, renderOrder: fruitData.renderOrder })
                }
                spawnIndex++
            }

            // Cocos render sibling phía sau lên trên. Dù spawn theo JSON (top -> bottom),
            // vẫn cần đưa đáy lên trước và top lên sau để hình hiển thị đúng lớp.
            stackFruits.slice().reverse().forEach(fruit => {
                fruit.node.setSiblingIndex(this.node.children.length - 1)
            })

            if (flattenFruits) {
                stackFruits.forEach(fruit => fruit.setLocked(false, true))
            } else {
                stackFruits.forEach((fruit, layer) => {
                    coverageItems.push({
                        fruit,
                        stackId: index,
                        layer,
                        x: slot.fruits[layer].positionX * width,
                        y: slot.fruits[layer].positionY * height,
                    })
                })
            }
            topFruits.push(stackFruits[0])
        })

        // Chỉ cần dồn quả top lên trước khi đang dùng stack. Với flattenFruits,
        // thao tác này sẽ phá thứ tự spawn/render cuối dùng để chọn target tutorial.
        if (!flattenFruits) {
            topFruits.forEach(fruit => {
                fruit.node.setSiblingIndex(this.node.children.length - 1)
            })
        }

        // JSON mới lưu sibling index từ editor. Khôi phục sau cùng để tuyệt đối giữ layer
        // mà level designer đã nhìn thấy, bất kể thứ tự spawn/slot/stack.
        if (fruitsByRenderOrder.length === totalFruits) {
            fruitsByRenderOrder
                .sort((a, b) => a.renderOrder - b.renderOrder)
                .forEach(({ fruit }, siblingIndex) => fruit.node.setSiblingIndex(siblingIndex))
        }

        // Cần đủ toàn bộ items (mọi stack) mới tính coverage được, nên setup sau khi spawn xong.
        if (useCoverageRule) {
            this.setupCoverageLocking(coverageItems)
        }


        // if(PREVIEW) {
        //     this.fruitSet.forEach(f => console.log(f)
        //     )

        // }

    }

    /**
     * Giống C# (CoverageRule + MatchSession.RefreshBlockTints): khoá/mở lại toàn bộ quả còn
     * sống mỗi khi có 1 quả được nhấc, thay vì chỉ mở quả kế tiếp trong cùng stack — nên 1 quả
     * có thể mở dù quả "trên" nó trong stack chưa được nhấc, miễn nó không thực sự bị che.
     */
    private setupCoverageLocking(items: CoverageItem[]) {
        if (items.length === 0) return

        const alive = items.slice()

        const refresh = (immediate: boolean) => {
            for (const item of alive) {
                const blocked = isBlocked(item, alive, this.blockCountThreshold, this.coverDistance)
                item.fruit.setLocked(blocked, immediate)
            }
        }

        items.forEach(item => {
            item.fruit.onPicked = () => {
                const idx = alive.indexOf(item)
                if (idx >= 0) alive.splice(idx, 1)
                refresh(false)
            }
        })

        refresh(true) // đặt ngay từ đầu, không tween — giống ItemPiece.Init(blocked, animate:false)
    }

    /** Vị trí (spawnIndex) của quả trên cùng (i = 0) mỗi stack, theo đúng thứ tự JSON/spawn. */
    private getTopSpawnIndices(slots: SlotsFruit[]): number[] {
        const topIndices: number[] = []
        let cumulative = 0
        for (const slot of slots) {
            if (slot.fruits.length > 0) topIndices.push(cumulative)
            cumulative += slot.fruits.length
        }
        return topIndices
    }

    /** FruitData theo đúng thứ tự JSON/spawn (top -> bottom trong mỗi stack). */
    private getFruitDatasInSpawnOrder(slots: SlotsFruit[]) {
        const fruitDatas: { fruitType: number }[] = []
        for (const slot of slots) {
            for (let i = 0; i < slot.fruits.length; i++) {
                fruitDatas.push(slot.fruits[i])
            }
        }
        return fruitDatas
    }

    /** Đổi chỗ (không đổi tổng số lượng mỗi loại) để các quả tại targetIndices đều cùng 1 loại, dùng cho tutorial luôn tìm được nhóm để chỉ */
    private forceFruitsMatch(fruitTypes: number[], targetIndices: number[], fruitNames?: string[]): number[] {
        if (targetIndices.length < 3) return null

        const totalCountByType = new Map<number, number>()
        for (const type of fruitTypes) totalCountByType.set(type, (totalCountByType.get(type) ?? 0) + 1)

        const countAtTargetByType = new Map<number, number>()
        for (const idx of targetIndices) {
            const type = fruitTypes[idx]
            countAtTargetByType.set(type, (countAtTargetByType.get(type) ?? 0) + 1)
        }

        // Không dùng spread Map.entries() ở đây. Khi build Web, Babel của Cocos có thể
        // transpile `[...map.entries()]` thành `[].concat(map.entries())`, khiến không
        // duyệt được entry và targetType luôn undefined dù Editor vẫn chạy đúng.
        let targetType: number = undefined
        countAtTargetByType.forEach((count, type) => {
            if (targetType === undefined && count === targetIndices.length) {
                targetType = type
            }
        })

        if (targetType === undefined) {
            totalCountByType.forEach((count, type) => {
                if (targetType === undefined && count >= targetIndices.length) {
                    targetType = type
                }
            })
        }
        if (targetType === undefined) return null

        const targetSet = new Set(targetIndices)
        const indicesToFill = targetIndices.filter(idx => fruitTypes[idx] !== targetType)

        // Đổi chỗ với các quả khác đang giữ targetType nhưng không nằm trong targetIndices
        const donorIndices = fruitTypes
            .map((type, idx) => ({ type, idx }))
            .filter(({ type, idx }) => type === targetType && !targetSet.has(idx))
            .map(({ idx }) => idx)

        indicesToFill.forEach((idx, i) => {
            const donorIdx = donorIndices[i]
            if (donorIdx === undefined) return
            const tmp = fruitTypes[idx]
            fruitTypes[idx] = fruitTypes[donorIdx]
            fruitTypes[donorIdx] = tmp

            // fruitName không có ở level cũ; lúc đó Fruit.initialize tự fallback
            // sang fruitType. Level mới có fruitName thì phải đổi kèm để hình và
            // fruitId luôn là cùng một loại.
            if (fruitNames) {
                const tmpName = fruitNames[idx]
                fruitNames[idx] = fruitNames[donorIdx]
                fruitNames[donorIdx] = tmpName
            }
        })

        return targetIndices
    }

    private generateFruitIds(fruitCount: number, fruitTypeCount: number, seed: string): number[] {
        if (fruitCount % 3 !== 0) {
            console.warn(`Tree: số lượng quả (${fruitCount}) không chia hết cho 3, sẽ thừa ${fruitCount % 3} quả không thể match! Hãy sửa lại level.`)
        }

        const fruitIds: number[] = []
        const random = this.createSeededRandom(seed)

        // Mỗi nhóm 3 quả dùng chung 1 loại. Dùng hết các loại trước khi lặp lại
        // để số bộ 3 cùng loại là ít nhất có thể.
        const groupCount = Math.floor(fruitCount / 3)
        const availableTypes = Array.from({ length: fruitTypeCount }, (_, index) => index)
        let typeIndex = availableTypes.length
        for (let i = 0; i < groupCount; i++) {
            // Mỗi lượt dùng hết tất cả loại fruit sẽ shuffle lại thứ tự để vẫn có tính random.
            if (typeIndex >= availableTypes.length) {
                for (let j = availableTypes.length - 1; j > 0; j--) {
                    const swapIndex = Math.floor(random() * (j + 1))
                    const currentType = availableTypes[j]
                    availableTypes[j] = availableTypes[swapIndex]
                    availableTypes[swapIndex] = currentType
                }
                typeIndex = 0
            }

            const id = availableTypes[typeIndex++]
            fruitIds.push(id, id, id)
        }

        // Quả thừa (level sai) vẫn gán random để không bị lỗi
        while (fruitIds.length < fruitCount) {
            fruitIds.push(Math.floor(random() * fruitTypeCount))
        }

        // Shuffle (Fisher-Yates) để các quả cùng loại không nằm cạnh nhau
        for (let i = fruitIds.length - 1; i > 0; i--) {
            const j = Math.floor(random() * (i + 1));
            [fruitIds[i], fruitIds[j]] = [fruitIds[j], fruitIds[i]]
        }

        return fruitIds
    }

    /** PRNG xác định: cùng seed luôn sinh ra cùng dãy số, không phụ thuộc Math.random(). */
    private createSeededRandom(seed: string): () => number {
        let state = 2166136261
        for (let i = 0; i < seed.length; i++) {
            state ^= seed.charCodeAt(i)
            state = Math.imul(state, 16777619)
        }

        return () => {
            state += 0x6D2B79F5
            let value = state
            value = Math.imul(value ^ (value >>> 15), value | 1)
            value ^= value + Math.imul(value ^ (value >>> 7), value | 61)
            return ((value ^ (value >>> 14)) >>> 0) / 4294967296
        }
    }
}



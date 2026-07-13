import { _decorator, Component, Node, tween, Tween, Vec3 } from 'cc';
import { Fruit, FRUIT_MATCH_DURATION, MATCH_FLY_UP_HEIGHT } from './Fruit';
import { EventBus } from '../../_iKame/Scripts/EventBus';
import { GameEvents } from './GameEvents';
import { VFXManager } from '../../Scripts/VFXManager';
import { AudioManager } from '../../_iKame/Scripts/AudioManager';
import { ServiceLocator } from '../../_iKame/Scripts/ServiceLocator';
import { NavigationContainer } from '../../_iKame/Scripts/Navigation/NavigationContainer';
const { ccclass, property } = _decorator;

@ccclass('Tray')
export class Tray extends Component {
    @property(Node) slots: Node[] = []

    private fruits: Fruit[] = []
    private totalFruits: number = 0
    private matchedCount: number = 0
    private gameEnded: boolean = false


    initialize(totalFruits: number) {
        for (const fruit of this.fruits) {
            if (fruit?.node?.isValid) fruit.node.destroy()
        }
        this.fruits = []
        this.totalFruits = totalFruits
        this.matchedCount = 0
        this.gameEnded = false
    }

    protected onEnable(): void {
        EventBus.on(GameEvents.FRUIT_CLICKED, this.onFruitClicked)
    }

    protected onDisable(): void {
        EventBus.off(GameEvents.FRUIT_CLICKED, this.onFruitClicked)
    }

    onFruitClicked = (fruit: Fruit) => {
        if (this.gameEnded) return
        if (this.fruits.length >= this.slots.length) return
        if (this.fruits.indexOf(fruit) !== -1) return

        // Chèn ngay sau quả cùng loại cuối cùng để các quả giống nhau nằm cạnh nhau
        let insertIndex = this.fruits.length
        for (let i = this.fruits.length - 1; i >= 0; i--) {
            if (this.fruits[i].fruitId === fruit.fruitId) {
                insertIndex = i + 1
                break
            }
        }
        this.fruits.splice(insertIndex, 0, fruit)
        this.layoutFruits()
    }

    private layoutFruits() {
        for (let i = 0; i < this.fruits.length; i++) {
            const slot = this.slots[i]
            if (this.fruits[i].node.parent !== slot) {
                this.fruits[i].moveToTray(slot, this.onFruitArrived)
            }
        }
    }

    // Mỗi khi có quả đáp xuống slot mới kiểm tra match / thắng thua
    private onFruitArrived = () => {
        this.bounce()
        this.resolveMatches()
    }

    // Cả tray nhún nhẹ khi có quả đáp xuống
    private bounce() {
        Tween.stopAllByTarget(this.node)
        this.node.setScale(1, 1, 1)

        tween(this.node)
            .to(0.08, { scale: new Vec3(1.04, 0.92, 1) }, { easing: 'quadOut' })
            .to(0.2, { scale: new Vec3(1, 1, 1) }, { easing: 'backOut' })
            .start()
    }

    private resolveMatches() {
        if (this.gameEnded) return

        let matchedSomething = true
        while (matchedSomething) {
            matchedSomething = false

            for (const fruit of this.fruits) {
                const same = this.fruits.filter(f => f.fruitId === fruit.fruitId)
                if (same.length < 3) continue

                // Chỉ match khi cả 3 quả đã nằm yên trong slot
                const matched = same.slice(0, 3)
                if (matched.some(f => f.moving)) continue

                this.fruits = this.fruits.filter(f => matched.indexOf(f) === -1)
                this.matchedCount += matched.length

                // Vị trí nổ VFX: trung điểm 3 quả, tại độ cao chúng bay lên rồi biến mất
                const vfxPos = new Vec3()
                for (const f of matched) {
                    vfxPos.add(f.node.worldPosition)
                }
                vfxPos.multiplyScalar(1 / matched.length)
                vfxPos.y += MATCH_FLY_UP_HEIGHT

                for (const f of matched) {
                    f.matchDestroy()
                }
                AudioManager.instance.playOneShot('Completed')


                this.layoutFruits()

                matchedSomething = true
                break
            }
        }

        if (this.matchedCount >= this.totalFruits) {
            this.gameEnded = true
            // Đợi 3 quả cuối chạy xong animation giải phóng rồi mới báo win
            this.scheduleOnce(() => {
                console.log("Tray: WIN - đã match hết quả trên cây!")
                EventBus.emit(GameEvents.WIN)
                // VFXManager.Instance.play()
                AudioManager.instance.playOneShot('Win')

            }, FRUIT_MATCH_DURATION)
            return
        }

        // Chỉ kết luận thua khi tray đầy và mọi quả đã đáp xuống slot
        if (this.fruits.length >= this.slots.length && !this.fruits.some(f => f.moving)) {
            this.gameEnded = true
            console.log("Tray: LOSE - tray đầy mà không match được!")
            AudioManager.instance.playOneShot('Lose')

            EventBus.emit(GameEvents.LOSE)
            // ServiceLocator.get(NavigationContainer).stack.navigate('EndGameScreen')

        }
    }
}

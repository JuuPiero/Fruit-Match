import { _decorator, Component, Node, tween, Tween, Vec3 } from 'cc';
import { ServiceLocator } from '../../_iKame/Scripts/ServiceLocator';
import { EventBus } from '../../_iKame/Scripts/EventBus';
import { GameEvents } from './GameEvents';
import { Fruit } from './Fruit';
const { ccclass, property } = _decorator;

@ccclass('Tutorial')
export class Tutorial extends Component {

    /** Lệch vị trí giữa tay tutorial và quả được chỉ, chỉnh trong editor nếu cần */
    @property(Vec3) offset: Vec3 = new Vec3(0, 0, 0);

    private targetFruits: Fruit[] = [];

    /** Quả đang được tay trỏ vào và bật sprite outline */
    private currentTarget: Fruit = null;

    /** Một khi người dùng bấm sai theo hướng dẫn, tutorial dừng hẳn không tự bật lại */
    private stopped: boolean = false;

    protected onLoad(): void {
        ServiceLocator.register(Tutorial, this)
        this.node.active = false
    }

    protected onEnable(): void {
        EventBus.on(GameEvents.FRUIT_CLICKED, this.onFruitClicked)
    }

    protected onDisable(): void {
        EventBus.off(GameEvents.FRUIT_CLICKED, this.onFruitClicked)
    }

    /** Chọn 3 quả giống nhau, ưu tiên nhóm nằm ở child cuối / bên phải (lộ nhất) của cây rồi bắt đầu chỉ.
     *  Nếu truyền sẵn forcedGroup (vd. 3 quả cuối được fix cứng cùng loại khi randomize + flatten), dùng luôn nhóm đó. */
    begin(treeChildren: Node[], forcedGroup?: Fruit[]) {
        if (this.stopped) return

        const group = forcedGroup ?? this.selectTargetGroup(treeChildren)
        if (!group) return

        this.targetFruits = group
        this.node.active = true
        this.pointToCurrentTarget()
    }

    private selectTargetGroup(treeChildren: Node[]): Fruit[] | null {
        type Candidate = { fruit: Fruit, indexRank: number, xRank: number }
        const candidates: Candidate[] = []

        for (let i = 0; i < treeChildren.length; i++) {
            const fruit = treeChildren[i].getComponent(Fruit)
            if (!fruit || fruit.picked || fruit.locked) continue
            // indexRank càng nhỏ càng là child cuối (lộ nhất)
            candidates.push({ fruit, indexRank: treeChildren.length - 1 - i, xRank: 0 })
        }

        // xRank càng nhỏ càng nằm bên phải
        const byX = [...candidates].sort((a, b) => b.fruit.node.position.x - a.fruit.node.position.x)
        byX.forEach((c, rank) => c.xRank = rank)

        // Ưu tiên quả vừa lộ nhất vừa nằm bên phải: tổng rank càng nhỏ càng ưu tiên
        candidates.sort((a, b) => (a.indexRank + a.xRank) - (b.indexRank + b.xRank))

        const groups = new Map<number, Fruit[]>()
        for (const { fruit } of candidates) {
            let group = groups.get(fruit.fruitId)
            if (!group) {
                group = []
                groups.set(fruit.fruitId, group)
            }
            group.push(fruit)

            if (group.length === 3) return group
        }

        return null
    }

    private pointToCurrentTarget() {
        const fruit = this.targetFruits[0]
        if (!fruit?.node?.isValid) return

        this.currentTarget?.setHighlighted(false)
        this.currentTarget = fruit
        this.currentTarget.setHighlighted(true)

        // Dừng tween lắc trước khi đổi vị trí, nếu không nó sẽ kéo tay về vị trí gốc cũ mỗi frame
        Tween.stopAllByTarget(this.node)
        this.node.setWorldPosition(fruit.node.worldPosition.clone().add(this.offset))
        this.playTapAnimation()
    }

    private onFruitClicked = (fruit: Fruit) => {
        if (this.stopped || !this.node.active) return

        // Bấm đúng quả đang được chỉ -> chuyển sang chỉ quả tiếp theo cùng loại
        if (this.targetFruits[0] !== fruit) {
            this.stop()
            return
        }

        this.targetFruits.shift()

        if (this.targetFruits.length === 0) {
            this.clearHighlight()
            this.node.active = false
        } else {
            this.pointToCurrentTarget()
        }
    }

    public stop() {
        this.stopped = true
        this.targetFruits = []
        this.clearHighlight()
        this.node.active = false
    }

    private clearHighlight() {
        this.currentTarget?.setHighlighted(false)
        this.currentTarget = null
    }

    playTapAnimation() {
        tween(this.node)
            .by(0.4, { position: new Vec3(0, -40, 0) })
            .by(0.4, { position: new Vec3(0, 40, 0) })
            .union()
            .repeatForever()
            .start();
    }
}



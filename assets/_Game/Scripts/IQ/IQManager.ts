import { _decorator, Canvas, Component, instantiate, Label, Node, NodePool, Prefab, tween, Tween, Vec3 } from 'cc';
import { EventBus } from 'db://assets/_iKame/Scripts/EventBus';
import { GameEvents } from '../GameEvents';
const { ccclass, property } = _decorator;

const IQ_SPAWN_DURATION = 0.15;
const IQ_FLY_DURATION = 0.5;
const IQ_FLY_ARC_HEIGHT = 150;
const IQ_FLY_ARC_SIDE_OFFSET = 80;

const LABEL_PUNCH_DURATION = 0.18;

@ccclass('IQManager')
export class IQManager extends Component {
    @property(Label) iqLabel: Label = null;

    @property(Prefab) iqPrefab: Prefab = null;

    @property(Canvas) gameplayCanvas: Canvas = null;

    @property({ readonly: true }) currentIQ: number = 0;

    @property iqBonus: number = 20;

    private _iqPool: NodePool = new NodePool();

    protected onEnable(): void {
        EventBus.on(GameEvents.MATCHED, this.onMatched)
    }

    protected onDisable(): void {
        EventBus.off(GameEvents.MATCHED, this.onMatched)
    }

    onMatched = (fromWorldPos?: Vec3) => {
        this.flyIQ(fromWorldPos ?? this.iqLabel.node.worldPosition)
    }

    // Lấy 1 Node iq từ pool, tạo mới từ prefab nếu pool đang rỗng
    private getIQNode(): Node {
        return this._iqPool.size() > 0 ? this._iqPool.get() : instantiate(this.iqPrefab)
    }

    // Trả Node iq về pool để tái sử dụng cho lần match sau
    private releaseIQNode(node: Node) {
        Tween.stopAllByTarget(node)
        this._iqPool.put(node)
    }

    // Bay 1 icon IQ theo đường cong tới iq label rồi cộng dồn iqBonus + trả về pool
    private flyIQ(fromWorldPos: Vec3) {
        if (!this.iqPrefab || !this.gameplayCanvas) return

        const iqNode = this.getIQNode()
        iqNode.getComponent(Label).string = "+" + this.iqBonus.toFixed();
        this.gameplayCanvas.node.addChild(iqNode)
        iqNode.setWorldPosition(fromWorldPos)
        iqNode.setScale(0, 0, 1)

        // Pop-in nhẹ lúc vừa xuất hiện
        tween(iqNode)
            .to(IQ_SPAWN_DURATION, { scale: new Vec3(1.2, 1.2, 1) }, { easing: 'backOut' })
            .to(IQ_SPAWN_DURATION * 0.5, { scale: Vec3.ONE }, { easing: 'quadOut' })
            .start()

        // Bay theo đường cong (quadratic bezier) tới label, thu nhỏ dần khi tới gần
        const startPos = fromWorldPos.clone()
        const endPos = this.iqLabel.node.worldPosition.clone()
        const arcSide = startPos.x <= endPos.x ? -1 : 1
        const controlPos = new Vec3(
            (startPos.x + endPos.x) * 0.5 + arcSide * IQ_FLY_ARC_SIDE_OFFSET,
            Math.max(startPos.y, endPos.y) + IQ_FLY_ARC_HEIGHT,
            0
        )

        const flyProgress = { t: 0 }
        tween(flyProgress)
            .delay(IQ_SPAWN_DURATION * 1.5)
            .to(IQ_FLY_DURATION, { t: 1 }, {
                easing: 'quadIn',
                onUpdate: () => {
                    const t = flyProgress.t
                    const oneMinusT = 1 - t
                    const x = oneMinusT * oneMinusT * startPos.x + 2 * oneMinusT * t * controlPos.x + t * t * endPos.x
                    const y = oneMinusT * oneMinusT * startPos.y + 2 * oneMinusT * t * controlPos.y + t * t * endPos.y
                    iqNode.setWorldPosition(x, y, startPos.z)
                    iqNode.setScale(1 - 0.6 * t, 1 - 0.6 * t, 1)
                }
            })
            .call(() => {
                this.releaseIQNode(iqNode)

                this.currentIQ += this.iqBonus
                this.iqLabel.string = "IQ : " + this.currentIQ.toFixed()
                this.punchLabel()
            })
            .start()
    }

    private punchLabel() {
        Tween.stopAllByTarget(this.iqLabel.node)
        this.iqLabel.node.setScale(1, 1, 1)

        tween(this.iqLabel.node)
            .to(LABEL_PUNCH_DURATION * 0.4, { scale: new Vec3(1.25, 1.25, 1) }, { easing: 'quadOut' })
            .to(LABEL_PUNCH_DURATION * 0.6, { scale: Vec3.ONE }, { easing: 'backOut' })
            .start()
    }
}



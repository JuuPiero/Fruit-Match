import { _decorator, Canvas, Component, instantiate, Label, Node, NodePool, Prefab, tween, Tween, Vec3 } from 'cc';
import { EventBus } from 'db://assets/_iKame/Scripts/EventBus';
import { GameEvents } from '../GameEvents';
import { AudioManager } from 'db://assets/_iKame/Scripts/AudioManager';
const { ccclass, property } = _decorator;

const COIN_MIN_COUNT = 3;
const COIN_MAX_COUNT = 6;
const COIN_SPREAD_RADIUS = 40;
const COIN_STAGGER_DELAY = 0.06;

const COIN_SPAWN_DURATION = 0.15;
const COIN_FLY_DURATION = 0.5;
const COIN_FLY_ARC_HEIGHT = 150;
const COIN_FLY_ARC_SIDE_OFFSET = 80;

const LABEL_PUNCH_DURATION = 0.18;

@ccclass('CoinManager')
export class CoinManager extends Component {
    @property(Prefab) coinPrefab: Prefab = null;

    @property({ readonly: true }) currentCoin: number = 0;
    @property coinReward: number = 20;

    @property(Label) coinLabel: Label = null;
    @property(Canvas) gameplayCanvas: Canvas = null;

    private _coinPool: NodePool = new NodePool();

    protected onEnable(): void {
        EventBus.on(GameEvents.NEW_LEVEL, this.onNewGame)
        EventBus.on(GameEvents.MATCHED, this.onMatched)

    }

    protected onDisable(): void {
        EventBus.off(GameEvents.NEW_LEVEL, this.onNewGame)
        EventBus.off(GameEvents.MATCHED, this.onMatched)
    }

    onNewGame = () => {
        this.currentCoin = 0;
        this.updateUI()
    }

    onMatched = (fromWorldPos?: Vec3) => {
        AudioManager.instance.playOneShot('Coin')
        this.spawnCoins(fromWorldPos ?? this.coinLabel.node.worldPosition)
    }

    updateUI = () => {
        this.coinLabel.string = this.currentCoin.toString()
    }

    // Lấy 1 Node coin từ pool, tạo mới từ prefab nếu pool đang rỗng
    private getCoinNode(): Node {
        return this._coinPool.size() > 0 ? this._coinPool.get() : instantiate(this.coinPrefab)
    }

    // Trả Node coin về pool để tái sử dụng cho lần match sau
    private releaseCoinNode(node: Node) {
        Tween.stopAllByTarget(node)
        this._coinPool.put(node)
    }

    // Tách reward thành vài đồng coin bay ra từ vị trí match, mỗi đồng lệch nhau 1 chút để tạo hiệu ứng rải tiền
    private spawnCoins(fromWorldPos: Vec3) {
        if (!this.coinPrefab || !this.gameplayCanvas) return

        const count = COIN_MIN_COUNT + Math.floor(Math.random() * (COIN_MAX_COUNT - COIN_MIN_COUNT + 1))
        const baseReward = Math.floor(this.coinReward / count)
        let rewardLeft = this.coinReward

        for (let i = 0; i < count; i++) {
            const reward = i === count - 1 ? rewardLeft : baseReward
            rewardLeft -= reward

            const spawnPos = new Vec3(
                fromWorldPos.x + (Math.random() * 2 - 1) * COIN_SPREAD_RADIUS,
                fromWorldPos.y + (Math.random() * 2 - 1) * COIN_SPREAD_RADIUS,
                fromWorldPos.z
            )

            this.scheduleOnce(() => {
                this.flyCoin(spawnPos, reward)
            }, i * COIN_STAGGER_DELAY)
        }
    }

    // Bay 1 đồng coin theo đường cong tới coin label rồi cộng dồn reward + trả về pool
    private flyCoin(fromWorldPos: Vec3, reward: number) {
        const coinNode = this.getCoinNode()
        this.gameplayCanvas.node.addChild(coinNode)
        coinNode.setWorldPosition(fromWorldPos)
        coinNode.setScale(0, 0, 1)

        // Pop-in nhẹ lúc vừa xuất hiện
        tween(coinNode)
            .to(COIN_SPAWN_DURATION, { scale: new Vec3(1.2, 1.2, 1) }, { easing: 'backOut' })
            .to(COIN_SPAWN_DURATION * 0.5, { scale: Vec3.ONE }, { easing: 'quadOut' })
            .start()

        // Bay theo đường cong (quadratic bezier) tới label, thu nhỏ dần khi tới gần
        const startPos = fromWorldPos.clone()
        const endPos = this.coinLabel.node.worldPosition.clone()
        const arcSide = startPos.x <= endPos.x ? -1 : 1
        const controlPos = new Vec3(
            (startPos.x + endPos.x) * 0.5 + arcSide * COIN_FLY_ARC_SIDE_OFFSET,
            Math.max(startPos.y, endPos.y) + COIN_FLY_ARC_HEIGHT,
            0
        )

        const flyProgress = { t: 0 }
        tween(flyProgress)
            .delay(COIN_SPAWN_DURATION * 1.5)
            .to(COIN_FLY_DURATION, { t: 1 }, {
                easing: 'quadIn',
                onUpdate: () => {
                    const t = flyProgress.t
                    const oneMinusT = 1 - t
                    const x = oneMinusT * oneMinusT * startPos.x + 2 * oneMinusT * t * controlPos.x + t * t * endPos.x
                    const y = oneMinusT * oneMinusT * startPos.y + 2 * oneMinusT * t * controlPos.y + t * t * endPos.y
                    coinNode.setWorldPosition(x, y, startPos.z)
                    coinNode.setScale(1 - 0.6 * t, 1 - 0.6 * t, 1)
                }
            })
            .call(() => {
                this.releaseCoinNode(coinNode)

                this.currentCoin += reward
                this.updateUI()
                this.punchLabel()
            })
            .start()
    }

    private punchLabel() {
        Tween.stopAllByTarget(this.coinLabel.node)
        this.coinLabel.node.setScale(1, 1, 1)

        tween(this.coinLabel.node)
            .to(LABEL_PUNCH_DURATION * 0.4, { scale: new Vec3(1.25, 1.25, 1) }, { easing: 'quadOut' })
            .to(LABEL_PUNCH_DURATION * 0.6, { scale: Vec3.ONE }, { easing: 'backOut' })
            .start()
    }
}



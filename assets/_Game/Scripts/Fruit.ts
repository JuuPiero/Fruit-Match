import { _decorator, Button, CCInteger, Component, EventMouse, Material, Node, Sprite, SpriteFrame, tween, Tween, Vec3 } from 'cc';
import { FruitData } from './Data/LevelData';
import { VFXManager } from '../../Scripts/VFXManager';
import { ServiceLocator } from '../../_iKame/Scripts/ServiceLocator';
import { FruitConfigSA } from './Data/FruitConfigSA';
import { EventBus } from '../../_iKame/Scripts/EventBus';
import { GameEvents } from './GameEvents';
import { AudioManager } from '../../_iKame/Scripts/AudioManager';
const { ccclass, property } = _decorator;

export const FRUIT_FLY_DURATION = 0.3;
const HOVER_SCALE_DURATION = 0.15;
const MATCH_FLY_UP_DURATION = 0.25;
const MATCH_VANISH_DURATION = 0.15;
export const FRUIT_MATCH_DURATION = MATCH_FLY_UP_DURATION + MATCH_VANISH_DURATION;
export const MATCH_FLY_UP_HEIGHT = 120;

const SWAY_ANGLE = 6;
const SWAY_DURATION = 0.8;

const LAND_PUNCH_DURATION = 0.32;
const SPAWN_SCALE_IN_DURATION = 0.28;
const SPAWN_RISE_DURATION = 0.24;
const SPAWN_BOUNCE_HEIGHT = 10;

@ccclass('Fruit')
export class Fruit extends Component {


    private _button: Button = null;

    private _sprite: Sprite = null;
    @property(FruitData) data: FruitData = null;

    swayingTween: Tween = null;


    @property({ type: CCInteger, readonly: true }) fruitId: number = -1;

    picked: boolean = false;

    /** Đang bay/di chuyển tới slot, chưa được phép match */
    moving: boolean = false;

    @property(Material) outlineMaterial: Material = null;

    @property({ tooltip: 'Scale mặc định của fruit khi spawn và khi trở về trạng thái bình thường' })
    originScale: Vec3 = new Vec3(1, 1, 1);


    private _spriteFrame: SpriteFrame = null;
    private _outlineSpriteFrame: SpriteFrame = null;



    protected onLoad(): void {
        this._sprite = this.getComponent(Sprite)
        this._button = this.getComponent(Button)
    }

    protected onEnable(): void {
        // this.node.on(Node.EventType.TOUCH_START, this.onClick);
        this._button.node.on(Button.EventType.CLICK, this.onClick, this);

        this._button.node.on(Node.EventType.MOUSE_ENTER, this.onMouseEnter, this);
        // Triggered when mouse moves out of the node bounding box
        this._button.node.on(Node.EventType.MOUSE_LEAVE, this.onMouseLeave, this);
    }

    protected onDisable(): void {
        // this.node.off(Node.EventType.TOUCH_START, this.onClick);

        this._button.node.off(Button.EventType.CLICK, this.onClick, this);

        this._button.node.off(Node.EventType.MOUSE_LEAVE, this.onMouseLeave, this);
        this._button.node.off(Node.EventType.MOUSE_LEAVE, this.onMouseEnter, this);
    }



    
    onMouseEnter(event: EventMouse) {
        if (this.picked ) return
        // console.log('Mouse hovered over the node!');
        tween(this.node)
            .to(HOVER_SCALE_DURATION, { worldScale: this.originScale.clone().add3f(0.1, 0.1, 0.1) }, { easing: 'quadOut' })
            .start()
        this._sprite.spriteFrame = this._outlineSpriteFrame

    }

    onMouseLeave(event: EventMouse) {
        if (this.picked) return
        // console.log('Mouse left the node!');
        tween(this.node)
            .to(HOVER_SCALE_DURATION, { worldScale: this.originScale }, { easing: 'quadOut' })
            .start()
        this._sprite.spriteFrame = this._spriteFrame

    }



    initialize(data: FruitData, fruitId: number, spawnDelay = 0, onSpawned?: () => void) {
        this.data = data;

        this.fruitId = fruitId;

        this.picked = false;

        this.moving = false;

        this._spriteFrame = ServiceLocator.get(FruitConfigSA).fruits[fruitId]
        this._outlineSpriteFrame = ServiceLocator.get(FruitConfigSA).fruitsOutline[fruitId]

        this._sprite.spriteFrame = this._spriteFrame;

        this.playSpawnAnimation(spawnDelay, onSpawned)
    }


    moveToTray(slot: Node, onArrived?: () => void) {
        this.picked = true;
        this.moving = true;
        VFXManager.Instance.play('ModularBuff', this.node, 0.1)

        // this._sprite.customMaterial = this.outlineMaterial

        this._sprite.spriteFrame = this._outlineSpriteFrame

        // Đổi parent sang slot nhưng giữ nguyên vị trí world, rồi tween về tâm slot
        const worldPos = this.node.worldPosition.clone()
        this.node.setParent(slot)
        this.node.setWorldPosition(worldPos)

        // Dừng đung đưa, trả quả về thẳng đứng và scale gốc trước khi bay
        Tween.stopAllByTarget(this.node)
        this.node.angle = 0
        this.node.setScale(this.originScale)

        // Phồng nhẹ lúc bay để tạo đà (chạy song song với tween bay)
        tween(this.node)
            .to(FRUIT_FLY_DURATION * 0.5, { scale: new Vec3(1.15, 1.15, 1) }, { easing: 'quadOut' })
            .to(FRUIT_FLY_DURATION * 0.5, { scale: new Vec3(1, 1, 1) }, { easing: 'quadIn' })
            .start()

        tween(this.node)
            .to(FRUIT_FLY_DURATION, { position: new Vec3(0, 0, 0) }, { easing: 'quadOut' })
            .call(() => {
                this.moving = false;
                AudioManager.instance.playOneShot('Pop')
                // VFXManager.Instance.play('LightGlowHalf', this.node)
                VFXManager.Instance.play('ModularBuff', this.node, 1)
                // this._sprite.customMaterial = null
                this._sprite.spriteFrame = this._spriteFrame

                onArrived?.();

            })
            // Punch 3 nhịp: bẹp mạnh -> vồng ngược lên -> lún về scale gốc
            .to(LAND_PUNCH_DURATION * 0.3, { scale: new Vec3(1.3, 0.7, 1) }, { easing: 'quadOut' })
            .to(LAND_PUNCH_DURATION * 0.35, { scale: new Vec3(0.9, 1.12, 1) }, { easing: 'quadInOut' })
            .to(LAND_PUNCH_DURATION * 0.35, { scale: new Vec3(1, 1, 1) }, { easing: 'quadOut' })
            .start().call(() => {
                // this._sprite.customMaterial = null

            })
    }

    matchDestroy() {
        Tween.stopAllByTarget(this.node)

        // Bay thẳng lên cao rồi thu nhỏ biến mất
        const worldPos = this.node.worldPosition
        const upPos = new Vec3(worldPos.x, worldPos.y + MATCH_FLY_UP_HEIGHT, worldPos.z)

        tween(this.node)
            .to(MATCH_FLY_UP_DURATION, { worldPosition: upPos }, { easing: 'quadOut' })
            .call(() => {
                VFXManager.Instance.playAt("FlashSparkle", upPos, 1)

            })
            .to(MATCH_VANISH_DURATION, { scale: new Vec3(0, 0, 0) }, { easing: 'backIn' })
            .call(() => {
                this.node.destroy()
            })
            .start()
    }

    private playSpawnAnimation(spawnDelay: number, onSpawned?: () => void) {
        Tween.stopAllByTarget(this.node)

        const startPos = this.node.position.clone()
        const peakPos = new Vec3(startPos.x, startPos.y + SPAWN_BOUNCE_HEIGHT, startPos.z)

        this.node.setScale(0.0, 0.0, 1)
        this.node.setPosition(startPos)

        const targetScale = new Vec3(
            this.originScale.x * 1.05,
            this.originScale.y * 1.05,
            this.originScale.z
        )

        tween(this.node)
            .delay(spawnDelay)
            .to(SPAWN_SCALE_IN_DURATION, { scale: targetScale }, { easing: 'smooth' })
            .to(SPAWN_RISE_DURATION, { position: peakPos }, { easing: 'smooth' })
            .to(SPAWN_RISE_DURATION, { position: startPos, scale: this.originScale }, { easing: 'smooth' })
            .call(() => {
                this.swaying()
                onSpawned?.()
            })
            .start()
    }

    swaying() {
        this.swayingTween?.stop()

        const half = SWAY_DURATION / 2

        // Lệch pha ngẫu nhiên để các quả không lắc đồng loạt
        this.swayingTween = tween(this.node)
            .delay(Math.random() * SWAY_DURATION)
            .to(half, { angle: SWAY_ANGLE }, { easing: 'sineOut' })
            .repeatForever(
                tween(this.node)
                    .to(SWAY_DURATION, { angle: -SWAY_ANGLE }, { easing: 'sineInOut' })
                    .to(SWAY_DURATION, { angle: SWAY_ANGLE }, { easing: 'sineInOut' })
            )
            .start()
    }

    setHighlighted(highlighted: boolean) {
        if (this.picked) return
        this._sprite.spriteFrame = highlighted ? this._outlineSpriteFrame : this._spriteFrame
    }

    onClick = () => {

        if (this.picked) return;

        AudioManager.instance.playOneShot('Click')

        EventBus.emit(GameEvents.FRUIT_CLICKED, this)
    }
}


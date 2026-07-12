import { _decorator, Component, Node, Sprite, Tween } from 'cc';
import { FruitData } from './Data/LevelData';
import { VFXManager } from '../../Scripts/VFXManager';
const { ccclass, property } = _decorator;

@ccclass('Fruit')
export class Fruit extends Component {

    private _sprite: Sprite = null;
    @property(FruitData) data: FruitData = null;

    swayingTween: Tween = null;


    initialize(data: FruitData) {
        this.data = data;
    }

    protected onEnable(): void {
        this.node.on(Node.EventType.TOUCH_START, this.onClick);
    }

    protected onDisable(): void {
        this.node.off(Node.EventType.TOUCH_START, this.onClick);
    }

    moveToTray(slot: Node) {

    }
    swaying() {
        
    }

    onClick = () => {
        console.log("Hello world");
        VFXManager.Instance.play(this.node)
    }
}



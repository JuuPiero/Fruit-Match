import { _decorator, Component, Label, Node } from 'cc';
import { EventBus } from 'db://assets/_iKame/Scripts/EventBus';
import { GameEvents } from '../GameEvents';
const { ccclass, property } = _decorator;

@ccclass('IQManager')
export class IQManager extends Component {
    @property(Label) iqLabel: Label = null;


    @property({readonly: true}) currentIQ: number = 0;

    @property({readonly: true}) iqBonus: number = 20;


    protected onEnable(): void {
        EventBus.on(GameEvents.MATCHED, this.onMatched)
    }

    protected onDisable(): void {
        EventBus.off(GameEvents.MATCHED, this.onMatched)
    }

    onMatched = () => {
        this.currentIQ += this.iqBonus;
        this.iqLabel.string = "IQ : " + this.currentIQ.toString()
    }

}



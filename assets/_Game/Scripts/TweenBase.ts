import { _decorator, CCFloat, Component, Node } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('TweenBase')
export abstract class TweenBase<T> extends Component {
    abstract resetTo(value: T) : void
    abstract playAsync(duration: number, endValue: T, delay: number): Promise<void>

    abstract reset(): void
    abstract playDefaultAsync(): Promise<void>
    
    @property(CCFloat) duration: number;
    @property(CCFloat) delay: number;
}



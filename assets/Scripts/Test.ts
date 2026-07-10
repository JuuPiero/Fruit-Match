import { _decorator, Component, EventMouse, EventTouch, Node, SerializationContext } from 'cc';
import { IPointerDownHandler } from '../_iKame/Scripts/Systems/PointerEvent';
import { GameBehaviour } from '../_iKame/Scripts/Commons/GameBehaviour';
import { Action } from '../_iKame/Scripts/Delegates/Action';
const { ccclass, property } = _decorator;

@ccclass('Test')
export class Test extends GameBehaviour implements IPointerDownHandler {
    // private _click = new Action<number>


    // test = (a: number) => {
    //     console.log(a);
    //     A.ABC.test()

    //     this.invoke(() => {
    //         console.log("hello delay");

    //     }, 2)
    // }

    protected onLoad(): void {
        // this._click.on(this.test)
    }
    protected onDisable(): void {
        // this._click.off(this.test)
    }

    onPointerDown(event: EventTouch | EventMouse): void {
        // this._click.emit(123)
        console.log("Pointer Down Event Triggered " + event.getLocationX());
          this.node.destroy();
        // this.scheduleOnce(() => {
        //     if (this.node && this.node.isValid) {
              
        //     }
        // }, 0.01);
    }
    // onPointerUp(event: any): void {
    //     console.log("Pointer Up Event Triggered");
    // }
}

namespace A {
    export function test() {
        console.log("hello world");
    }
    export class ABC {
        static test() {
            console.log("hello world ABC");
        }
    }
}
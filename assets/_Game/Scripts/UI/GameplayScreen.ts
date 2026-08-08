import { _decorator, Button, Component, Node } from 'cc';
import { ScreenBase } from 'db://assets/_iKame/Scripts/Navigation/ScreenBase';
import { PlayableAdsManager } from 'db://assets/_iKame/Scripts/PlayableAdsManager';
import { ETrackingEvent, TrackingManager } from 'db://assets/_iKame/Scripts/TrackingManager';
const { ccclass, property } = _decorator;

@ccclass('GameplayScreen')
export class GameplayScreen extends ScreenBase {
    @property(Node) headline: Node = null;
    @property(Button) downloadBtn: Button = null;
    protected start(): void {
        // this.downloadBtn.getComponent(TweenScale).playDefaultAsync()
        // this.logo.getComponent(TweenScale).playDefaultAsync()
        this.downloadBtn.node.on(Button.EventType.CLICK, () => {
            TrackingManager.TrackEvent(ETrackingEvent.CTA_CLICKED)
            PlayableAdsManager.OpenStore()
        })
    }
}



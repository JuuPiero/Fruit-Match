import { _decorator, Button, Component, Node } from 'cc';
import { ScreenBase } from 'db://assets/_iKame/Scripts/Navigation/ScreenBase';
import { TweenScale } from '../TweenScale';
import { PlayableAdsManager } from 'db://assets/_iKame/Scripts/PlayableAdsManager';
import { ETrackingEvent, TrackingManager } from 'db://assets/_iKame/Scripts/TrackingManager';
const { ccclass, property } = _decorator;

@ccclass('EndGameScreen')
export class EndGameScreen extends ScreenBase {
    @property(Button) downloadBtn: Button = null;
    @property(Node) logo: Node = null;
   


    protected start(): void {
        TrackingManager.TrackEvent(ETrackingEvent.ENDCARD_SHOWN)
        // this.downloadBtn.getComponent(TweenScale).playDefaultAsync()
        // this.logo.getComponent(TweenScale).playDefaultAsync()
        this.downloadBtn.node.on(Button.EventType.CLICK, () => {
            TrackingManager.TrackEvent(ETrackingEvent.CTA_CLICKED)
            PlayableAdsManager.OpenStore()
        })
    }   

}



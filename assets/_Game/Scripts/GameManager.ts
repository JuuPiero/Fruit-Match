import { _decorator, Button, Component, EventKeyboard, Input, input, KeyCode, Node } from 'cc';
import { LevelManager } from './LevelManager';
import { GameConfigSA } from './Data/GameConfigSA';
import { FruitConfigSA } from './Data/FruitConfigSA';
import { ServiceLocator } from '../../_iKame/Scripts/ServiceLocator';
import { EventBus } from '../../_iKame/Scripts/EventBus';
import { GameEvents } from './GameEvents';
import { PlayableAdsManager } from '../../_iKame/Scripts/PlayableAdsManager';
import { ETrackingEvent, TrackingManager } from '../../_iKame/Scripts/TrackingManager';
import { NavigationContainer } from '../../_iKame/Scripts/Navigation/NavigationContainer';
import { AudioManager } from '../../_iKame/Scripts/AudioManager';
import { Tutorial } from './Tutorial';
import { PREVIEW } from 'cc/env';
const { ccclass, property } = _decorator;

@ccclass('GameManager')
export class GameManager extends Component {


    @property(GameConfigSA) gameConfig: GameConfigSA = null;
    @property(FruitConfigSA) fruitConfig: FruitConfigSA = null;


    @property(LevelManager) levelManager: LevelManager = null;


    @property(Node) confettiNode: Node = null

    @property(Node) sad: Node = null;
    @property(Node) win: Node = null;
    protected onLoad(): void {
        ServiceLocator.register(GameConfigSA, this.gameConfig)
        ServiceLocator.register(FruitConfigSA, this.fruitConfig)
        ServiceLocator.register(GameManager, this)
        ServiceLocator.register(LevelManager, this.levelManager)

        PlayableAdsManager.SetupLinkStore()
    }

    protected start(): void {
        EventBus.emit(GameEvents.NEW_LEVEL)

    }

    protected onEnable(): void {
        EventBus.on(GameEvents.NEW_LEVEL, this.onNewGame)
        EventBus.on(GameEvents.WIN, this.onWinGame)
        EventBus.on(GameEvents.LOSE, this.onLoseGame)

        EventBus.on(GameEvents.MATCHED, this.onProgress)

        input.on(Input.EventType.KEY_DOWN, this.toggleMusic, this);

    }

    isPlayMusic = true;
    toggleMusic(event: EventKeyboard) {
        if (event.keyCode === KeyCode.F12) {
            console.log('Move Forward');
            if (this.isPlayMusic) {
                AudioManager.instance.stopMusic()
                this.isPlayMusic = false;
                ServiceLocator.get(Tutorial).stop()

                this.dowloadButton.node.active = false
            }
            else {
                AudioManager.instance.playMusic('BGM')
                this.isPlayMusic = true;
                this.dowloadButton.node.active = true

            }
            this.levelManager.tray.moveToNewPosition()

        }
    }

    protected onDisable(): void {
        EventBus.off(GameEvents.NEW_LEVEL, this.onNewGame)
        EventBus.off(GameEvents.WIN, this.onWinGame)
        EventBus.off(GameEvents.LOSE, this.onLoseGame)
        EventBus.off(GameEvents.MATCHED, this.onProgress)

        input.off(Input.EventType.KEY_DOWN, this.toggleMusic, this);
    }

    onNewGame = () => {
        TrackingManager.TrackEvent(ETrackingEvent.LOADING)
        this.levelManager.initialize()
        TrackingManager.TrackEvent(ETrackingEvent.LOADED)
        TrackingManager.TrackEvent(ETrackingEvent.DISPLAYED)
        TrackingManager.TrackEvent(ETrackingEvent.CHALLENGE_STARTED)

        AudioManager.instance.playMusic('BGM')

        this.total = this.levelManager.levelData.fruits.length / 3



        this.dowloadButton.node.on(Button.EventType.CLICK, () => {
            TrackingManager.TrackEvent(ETrackingEvent.CTA_CLICKED)
            PlayableAdsManager.OpenStore()
        })

    }


    onWinGame = () => {
        this.confettiNode.active = true;
        this.dowloadButton.node.active = false

        ServiceLocator.get(NavigationContainer).stack.navigate('EndGameScreen', { isWin: true })
        this.win.active = true


        this,this.scheduleOnce(() => {
            PlayableAdsManager.OpenStore()
        }, 3)
    }
    onLoseGame = () => {
        this.dowloadButton.node.active = false
        ServiceLocator.get(NavigationContainer).stack.navigate('EndGameScreen', { isWin: false })
        this.sad.active = true
         this,this.scheduleOnce(() => {
            PlayableAdsManager.OpenStore()
        }, 3)
    }


    openStore() {
        PlayableAdsManager.OpenStore()
    }


    @property(Button) dowloadButton: Button = null;

    onToggleVideo = () => {

    }


    @property({ readonly: true }) public progress: number = 0
    @property({ readonly: true }) public total: number = 0
    progressTracked = {
        quarter: false,  // 25%
        half: false,     // 50%
        threeQuarter: false  // 75%
    }
    onProgress = () => {
        this.progress++

        const percentage = (this.progress / this.total) * 100

        if (PREVIEW) {
            console.log("progress " + percentage)

        }
        if (!this.progressTracked.quarter && percentage >= 25) {
            this.progressTracked.quarter = true
            TrackingManager.TrackEvent(ETrackingEvent.CHALLENGE_PASS_25)
        }

        if (!this.progressTracked.half && percentage >= 50) {
            this.progressTracked.half = true
            TrackingManager.TrackEvent(ETrackingEvent.CHALLENGE_PASS_50)
        }

        if (!this.progressTracked.threeQuarter && percentage >= 75) {
            this.progressTracked.threeQuarter = true
            TrackingManager.TrackEvent(ETrackingEvent.CHALLENGE_PASS_75)
        }

        if (this.progress === this.total) {
            TrackingManager.TrackEvent(ETrackingEvent.CHALLENGE_SOLVED)
        }
    }


}



import { _decorator, Component, Node } from 'cc';
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
const { ccclass, property } = _decorator;

@ccclass('GameManager')
export class GameManager extends Component {


    @property(GameConfigSA) gameConfig: GameConfigSA = null;
    @property(FruitConfigSA) fruitConfig: FruitConfigSA = null;


    @property(LevelManager) levelManager: LevelManager = null;


    @property(Node) confettiNode: Node = null


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



    }

    protected onDisable(): void {
        EventBus.off(GameEvents.NEW_LEVEL, this.onNewGame)
        EventBus.off(GameEvents.WIN, this.onWinGame)
        EventBus.off(GameEvents.LOSE, this.onLoseGame)
        EventBus.off(GameEvents.MATCHED, this.onProgress)
    }

    onNewGame = () => {
        TrackingManager.TrackEvent(ETrackingEvent.LOADING)
        this.levelManager.initialize()
        TrackingManager.TrackEvent(ETrackingEvent.LOADED)
        TrackingManager.TrackEvent(ETrackingEvent.DISPLAYED)
        TrackingManager.TrackEvent(ETrackingEvent.CHALLENGE_STARTED)

        AudioManager.instance.playMusic('BGM')

        this.total = this.levelManager.levelData.fruits.length / 3

    }


    onWinGame = () => {
        PlayableAdsManager.OpenStore()
        this.confettiNode.active = true;

        ServiceLocator.get(NavigationContainer).stack.navigate('EndGameScreen')

    }
    onLoseGame = () => {
        PlayableAdsManager.OpenStore()
        ServiceLocator.get(NavigationContainer).stack.navigate('EndGameScreen')
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
        console.log("progress " + percentage)

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



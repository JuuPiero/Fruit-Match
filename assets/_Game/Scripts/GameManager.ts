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


    }

    protected onDisable(): void {
        EventBus.off(GameEvents.NEW_LEVEL, this.onNewGame)
        EventBus.off(GameEvents.WIN, this.onWinGame)
        EventBus.off(GameEvents.LOSE, this.onLoseGame)

    }

    onNewGame = () => {
        TrackingManager.TrackEvent(ETrackingEvent.LOADING)
        this.levelManager.initialize()
        TrackingManager.TrackEvent(ETrackingEvent.LOADED)
        TrackingManager.TrackEvent(ETrackingEvent.DISPLAYED)
        TrackingManager.TrackEvent(ETrackingEvent.CHALLENGE_STARTED)

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
}



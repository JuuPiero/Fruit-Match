import { _decorator, Component, JsonAsset, Node } from 'cc';
import { Tree } from './Tree';
import { Tray } from './Tray';
import { LevelData } from './Data/LevelData';
import { CameraFit } from './CameraFit';
const { ccclass, property } = _decorator;

@ccclass('LevelManager')
export class LevelManager extends Component {
    @property(Tree) tree: Tree = null;
    @property(Tray) tray: Tray = null;

    @property(JsonAsset) levelJson: JsonAsset = null;

    // @property(CameraFit) cameraFit: CameraFit = null;

    @property(LevelData) levelData: LevelData = null;

    public initialize() {

        this.levelData = LevelData.parseFromJson(this.levelJson)

        this.tree.initialize(this.levelData)
        this.tray.initialize(this.levelData.fruits.length)

        // this.cameraFit?.fit()
    }
}



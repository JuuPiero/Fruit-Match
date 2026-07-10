import { _decorator, Component, Node } from 'cc';
import { Tree } from './Tree';
import { Tray } from './Tray';
const { ccclass, property } = _decorator;

@ccclass('GameManager')
export class GameManager extends Component {
    
    @property(Tree) tree: Tree = null;
    @property(Tray) tray: Tray = null;


    onNewGame = () => {



    }
}



import { _decorator, Component, Node } from 'cc';
import { Tree } from '../Tree';
const { ccclass, property } = _decorator;

@ccclass('LevelEditor')
export class LevelEditor extends Component {
    @property(Tree) tree: Tree = null;


}



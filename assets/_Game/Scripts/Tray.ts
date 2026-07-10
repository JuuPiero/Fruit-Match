import { _decorator, Component, Node } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('Tray')
export class Tray extends Component {
    @property(Node) slots: Node[] = []
}

import {
    _decorator,
    Component,
    Node,
    UITransform,
    view
} from 'cc';

const { ccclass, property } = _decorator;

@ccclass('BackgroundCover')
export class BackgroundCover extends Component {
    @property(Node)
    background: Node = null!;

    protected onLoad() {
        this.resizeBackground();

        view.on('canvas-resize', this.resizeBackground, this);
        view.on('design-resolution-changed', this.resizeBackground, this);
    }

    protected onDestroy() {
        view.off('canvas-resize', this.resizeBackground, this);
        view.off('design-resolution-changed', this.resizeBackground, this);
    }

    private resizeBackground() {
        const bgTransform = this.background.getComponent(UITransform);

        if (!bgTransform) {
            return;
        }

        const visibleSize = view.getVisibleSize();

        const scaleX = visibleSize.width / bgTransform.width;
        const scaleY = visibleSize.height / bgTransform.height;

        // Lấy thằng lớn hơn để BG luôn phủ kín toàn bộ Camera
        const scale = Math.max(scaleX, scaleY);

        this.background.setScale(scale, scale, 1);
    }
}
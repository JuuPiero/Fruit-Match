import { _decorator, Camera, Component, Node, UITransform, view, screen } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('CameraFit')
export class CameraFit extends Component {
    @property(Camera) public camera: Camera = null;

    /** Node dùng để tính bounding box nội dung cần luôn hiển thị đủ (vd: Tree) */
    @property(Node) public content: Node = null;

    @property public padding: number = 100;

    private _minOrthoHeight: number;

    onLoad() {
        if (!this.camera) this.camera = this.getComponent(Camera);
        this._minOrthoHeight = this.camera.orthoHeight; // orthoHeight tối thiểu đã tune sẵn trong Editor

        screen.on('window-resize', this.fit, this);
        screen.on('orientation-change', this.fit, this);
    }

    onDestroy() {
        screen.off('window-resize', this.fit, this);
        screen.off('orientation-change', this.fit, this);
    }

    /**
     * Tính lại orthoHeight sao cho content (Tree) luôn nằm trọn trong camera dù level nào hay tỉ lệ màn hình nào.
     * Gọi lại mỗi khi nội dung level thay đổi (spawn xong cây + quả) hoặc màn hình resize/xoay.
     */
    public fit = () => {
        if (!this.content || !this.camera) return;

        const uiTransform = this.content.getComponent(UITransform);
        if (!uiTransform) return;

        const box = uiTransform.getBoundingBoxToWorld();
        const camPos = this.camera.node.worldPosition;

        const halfHeightNeeded = Math.max(
            Math.abs(box.yMax - camPos.y),
            Math.abs(camPos.y - box.yMin)
        ) + this.padding;

        const halfWidthNeeded = Math.max(
            Math.abs(box.xMax - camPos.x),
            Math.abs(camPos.x - box.xMin)
        ) + this.padding;

        const visibleSize = view.getVisibleSize();
        const aspect = visibleSize.width / visibleSize.height;

        const orthoHeightForWidth = halfWidthNeeded / aspect;

        this.camera.orthoHeight = Math.max(this._minOrthoHeight, halfHeightNeeded, orthoHeightForWidth);
    }
}

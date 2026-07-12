import {
    _decorator,
    Camera,
    Component,
    instantiate,
    Node,
    Prefab,
    Vec3,
} from 'cc';

const { ccclass, property } = _decorator;

@ccclass('VFXManager')
export class VFXManager extends Component {

    public static Instance: VFXManager;

    @property(Camera)
    canvasCamera: Camera = null!;

    @property(Camera)
    vfxCamera: Camera = null!;

    @property(Node)
    vfxRoot: Node = null!;

    @property(Prefab) vfx: Prefab = null

    protected onLoad(): void {
        VFXManager.Instance = this;
    }

    play(target: Node) {

        // UI World -> Screen
        const screenPos = new Vec3();
        this.canvasCamera.worldToScreen(
            target.worldPosition,
            screenPos
        );

        // Screen -> VFX World
        const worldPos = new Vec3();
        this.vfxCamera.screenToWorld(
            screenPos,
            worldPos
        );

        // Z cố định
        worldPos.z = 983;

        const fx = instantiate(this.vfx);
        fx.parent = this.vfxRoot;
        fx.setWorldPosition(worldPos);
    }
}
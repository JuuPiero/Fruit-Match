import {
    _decorator,
    Camera,
    Component,
    director,
    instantiate,
    Node,
    NodePool,
    ParticleSystem,
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

    @property({ type: [Prefab] })
    public effects: Prefab[] = [];

    // Lưu trữ Prefab gốc để tạo mới khi pool rỗng
    private _effectMap: Map<string, Prefab> = new Map();

    // Lưu trữ các Node đang rảnh rỗi (chưa sử dụng)
    private _poolMap: Map<string, NodePool> = new Map();

    protected onLoad(): void {
        VFXManager.Instance = this;

        // Khởi tạo danh sách Prefab và NodePool
        for (const prefab of this.effects) {
            if (prefab) {
                this._effectMap.set(prefab.name, prefab);
                this._poolMap.set(prefab.name, new NodePool());
            }
        }
    }

    /**
     * Lấy một hiệu ứng từ Pool
     */
    public getVFX(name: string): Node | null {
        if (!this._effectMap.has(name)) {
            console.warn(`[VFXManager] Không tìm thấy hiệu ứng có tên: ${name}`);
            return null;
        }

        const pool = this._poolMap.get(name);
        let node: Node = null;

        // Nếu pool còn Node rảnh, lấy ra dùng. Nếu không, tạo mới từ Prefab.
        if (pool && pool.size() > 0) {
            node = pool.get();
        } else {
            node = instantiate(this._effectMap.get(name));
        }

        return node;
    }

    /**
     * Trả hiệu ứng về Pool sau khi dùng xong
     */
    public returnVFX(name: string, node: Node) {
        const pool = this._poolMap.get(name);
        if (pool) {
            pool.put(node); // NodePool sẽ tự động gỡ node khỏi parent hiện tại
        } else {
            node.destroy(); // Nếu không có pool tương ứng thì xóa luôn
        }
    }

    public playVfx(name: string, parent: Node, position: Vec3, duration: number) {
        const node = this.getVFX(name);
        if (!node) return;

        if (parent) {
            node.parent = parent;
        }
        else {
            node.setParent(director.getScene())
        }

        node.setPosition(position);

        const particles: ParticleSystem[] = [...node.getComponentsInChildren(ParticleSystem)]

        // Chạy Particle System
        const particle = node.getComponent(ParticleSystem);

        if (particle) {
            particles.push(particle)

            particles.forEach(p => {
                p.play();
            })

            // Thu hồi Node về pool sau khi Particle chạy xong
            this.scheduleOnce(() => {
                this.returnVFX(name, node);
            }, duration);
        }
    }

    play(name: string, target: Node) {
        this.playAt(name, target.worldPosition)
    }


    playAt(name: string, pos: Vec3) {

        // UI World -> Screen
        const screenPos = new Vec3();
        this.canvasCamera.worldToScreen(
            pos,
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

        const fx = this.getVFX(name);
        if (!fx) return;

        fx.parent = this.vfxRoot;
        fx.setWorldPosition(worldPos);
    }
}

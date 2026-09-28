import {
    _decorator,
    Component,
    Node,
    UIOpacity,
    Tween,
    tween,
} from 'cc';

import { GameEvents } from './GameEvents';
import { EventBus } from '../../_iKame/Scripts/EventBus';

const { ccclass, property } = _decorator;

@ccclass('BackgroundManager')
export class BackgroundManager extends Component {
    @property([Node])
    backgrounds: Node[] = [];


    @property([Node])
    effects: Node[] = [];

    @property({
        min: 0.05,
        tooltip: 'Thời gian fade khi đổi background, tính bằng giây',
    })
    fadeDuration: number = 0.5;

    private opacities: UIOpacity[] = [];

    private currentIndex: number = 0;
    private pendingMatches: number = 0;
    private isFading: boolean = false;

    protected onLoad(): void {
        // Bỏ các ô trống và các Node bị kéo trùng trong Inspector.
        this.backgrounds = this.backgrounds.filter(
            (bg, index, array) =>
                bg && bg.isValid && array.indexOf(bg) === index
        );

        this.opacities = this.backgrounds.map((bg, index) => {
            // Dùng lại component nếu đã có, tránh add trùng.
            const opacity =
                bg.getComponent(UIOpacity) ?? bg.addComponent(UIOpacity);

            // Ban đầu chỉ hiển thị background đầu tiên.
            opacity.opacity = index === 0 ? 255 : 0;
            bg.active = index === 0;

            return opacity;
        });

        // Effect dùng cùng index với background tương ứng trong Inspector.
        this.setActiveEffect(this.currentIndex);
    }

    protected onEnable(): void {
        EventBus.on(GameEvents.MATCHED, this.onMatched);
    }

    protected onDisable(): void {
        EventBus.off(GameEvents.MATCHED, this.onMatched);

        this.pendingMatches = 0;
        this.isFading = false;

        // Dừng fade và giữ background hiện tại hiển thị hoàn toàn.
        this.opacities.forEach((opacity, index) => {
            if (!opacity.isValid || !opacity.node.isValid) return;

            Tween.stopAllByTarget(opacity);

            const isCurrent = index === this.currentIndex;
            opacity.opacity = isCurrent ? 255 : 0;
            opacity.node.active = isCurrent;
        });

        this.setActiveEffect(this.currentIndex);
    }

    onMatched = (): void => {
        if (this.opacities.length < 2) return;

        // Match trong lúc đang fade vẫn được ghi nhận.
        this.pendingMatches++;
        this.fadeToNext();
    };

    private fadeToNext(): void {
        if (this.isFading || this.pendingMatches <= 0) return;

        this.pendingMatches--;
        this.isFading = true;

        const previousOpacity = this.opacities[this.currentIndex];

        this.currentIndex =
            (this.currentIndex + 1) % this.opacities.length;

        this.setActiveEffect(this.currentIndex);

        const nextOpacity = this.opacities[this.currentIndex];
        const duration = Math.max(0.05, this.fadeDuration);

        // Chuẩn bị background mới trước khi hiển thị.
        nextOpacity.opacity = 0;
        nextOpacity.node.active = true;

        // Background cũ mờ dần.
        tween(previousOpacity)
            .to(duration, { opacity: 0 }, { easing: 'sineInOut' })
            .start();

        // Background mới hiện dần cùng lúc.
        tween(nextOpacity)
            .to(duration, { opacity: 255 }, { easing: 'sineInOut' })
            .call(() => {
                // Chốt trạng thái ảnh cũ trước lượt chuyển tiếp theo.
                Tween.stopAllByTarget(previousOpacity);
                previousOpacity.opacity = 0;
                previousOpacity.node.active = false;

                this.isFading = false;

                // Tiếp tục nếu có match đang chờ.
                this.fadeToNext();
            })
            .start();
    }

    /** Chỉ giữ effect có index trùng với background hiện tại đang bật. */
    private setActiveEffect(backgroundIndex: number): void {
        this.effects.forEach((effect, effectIndex) => {
            if (!effect || !effect.isValid) return;

            effect.active = effectIndex === backgroundIndex;
        });
    }
}

import { _decorator, CCBoolean, SpriteFrame } from 'cc';
import { bh } from 'db://scriptable-asset/scriptable_runtime';

const { ccclass, property } = _decorator;

@bh.createAssetMenu('FruitConfigSA', 'Config/FruitConfigSA')
@bh.scriptable('FruitConfigSA')
export class FruitConfigSA extends bh.ScriptableAsset {
    @property(SpriteFrame) public fruits: SpriteFrame[] = [];
    @property(SpriteFrame) public fruitsOutline: SpriteFrame[] = [];


    
    private _shuffle : boolean;
    @property(CCBoolean) public get shuffle() : boolean {
        return this._shuffle;
    }
    public set shuffle(v : boolean) {
        // Fisher-Yates: áp cùng 1 chuỗi hoán vị cho cả 2 mảng để fruits[i] và fruitsOutline[i] vẫn tương ứng nhau sau khi xáo trộn
        const length = Math.min(this.fruits.length, this.fruitsOutline.length);
        for (let i = length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            ;[this.fruits[i], this.fruits[j]] = [this.fruits[j], this.fruits[i]];
            ;[this.fruitsOutline[i], this.fruitsOutline[j]] = [this.fruitsOutline[j], this.fruitsOutline[i]];
        }
    }
    
    // private 

    private fruitsMap: Map<string, FruitAssetItem> = new Map();


    onLoaded(): void {
        for (let i = 0; i < this.fruits.length; i++) {
            const data = new FruitAssetItem();
            data.fruitSpriteFrame = this.fruits[i];
            data.fruitfruitSpriteFrameOutline = this.fruitsOutline[i];
            this.fruitsMap.set(this.fruits[i].name, data)
        }
    }


    public getFruit(name: string): FruitAssetItem {
        return this.fruitsMap.get(name);
    }
}


class FruitAssetItem {
    fruitSpriteFrame: SpriteFrame;
    fruitfruitSpriteFrameOutline: SpriteFrame;
}

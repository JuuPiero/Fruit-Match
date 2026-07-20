import { _decorator, SpriteFrame } from 'cc';
import { bh } from 'db://scriptable-asset/scriptable_runtime';

const { ccclass, property } = _decorator;

@bh.createAssetMenu('FruitConfigSA', 'Config/FruitConfigSA')
@bh.scriptable('FruitConfigSA')
export class FruitConfigSA extends bh.ScriptableAsset {
    @property(SpriteFrame) public fruits: SpriteFrame[] = [];
    @property(SpriteFrame) public fruitsOutline: SpriteFrame[] = [];



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

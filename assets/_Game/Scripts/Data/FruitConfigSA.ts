import { _decorator, SpriteFrame } from 'cc';
import { bh } from 'db://scriptable-asset/scriptable_runtime';

const { ccclass, property } = _decorator;

@bh.createAssetMenu('FruitConfigSA', 'Config/FruitConfigSA')
@bh.scriptable('FruitConfigSA')
export class FruitConfigSA extends bh.ScriptableAsset {
    @property(SpriteFrame) public fruits: SpriteFrame[] = []
}



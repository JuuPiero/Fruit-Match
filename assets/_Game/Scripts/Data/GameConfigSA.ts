import { _decorator, Component, Node, Prefab, SpriteFrame } from 'cc';
import { bh } from 'db://scriptable-asset/scriptable_runtime';
const { ccclass, property } = _decorator;


@bh.createAssetMenu('GameConfigSA', 'Config/GameConfigSA')
@bh.scriptable('GameConfigSA')
export class GameConfigSA extends bh.ScriptableAsset {
    @property(Prefab) fruitPrefab: Prefab = null;

    @property(SpriteFrame) trees: SpriteFrame[] = []

}

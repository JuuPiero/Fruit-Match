import { _decorator, Component, Node, Prefab, SpriteFrame } from 'cc';
import { bh } from 'db://scriptable-asset/scriptable_runtime';
const { ccclass, property } = _decorator;


@bh.createAssetMenu('GameConfigSA', 'Config/GameConfigSA')
@bh.scriptable('GameConfigSA')
export class GameConfigSA extends bh.ScriptableAsset {
    @property(Prefab) fruitPrefab: Prefab = null;

    @property(SpriteFrame) trees: SpriteFrame[] = []


    public treeMap: Map<string, SpriteFrame> = new Map();

    onLoaded(): void {
        
        for (const item of this.trees) {
            this.treeMap.set(item.name, item);
        }
    }

    public getTreeByName(name: string): SpriteFrame {
        return this.treeMap.get(name);
    }


    public getTree(treeType: number): SpriteFrame {
        // if (this.treeMap == null) {
        //     this.treeMap = new Map();
        //     for (const item of this.trees) {
        //         this.treeMap.set(item.name, item);
        //     }
        // }

        return this.treeMap.get(treeType.toString());
    }

}

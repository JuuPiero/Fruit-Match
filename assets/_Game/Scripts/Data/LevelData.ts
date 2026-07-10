import { _decorator, Component, Node } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('FruitData')
export class FruitData {
    @property fruitType: number = 0;
    @property positionX: number = 0;
    @property positionY: number = 0;
    @property positionZ: number = 0;
}

@ccclass('LevelData')
export class LevelData {
    @property treeType: number = 0;
    @property(FruitData) fruits: FruitData[] = []
}



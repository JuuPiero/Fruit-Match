import { _decorator, CCBoolean, Component, Sprite, UITransform } from 'cc';
import { Tree } from '../Tree';
import { FruitData, LevelData, TreeData } from '../Data/LevelData';
import { GameConfigSA } from '../Data/GameConfigSA';
import { FruitConfigSA } from '../Data/FruitConfigSA';
import { Fruit } from '../Fruit';
const { ccclass, property, executeInEditMode } = _decorator;
// const fs = require('fs');
// const path = require('path');

@ccclass('LevelEditor')
@executeInEditMode
export class LevelEditor extends Component {
    @property(Tree) tree: Tree = null;

    @property(GameConfigSA) gameConfig: GameConfigSA = null;
    @property(FruitConfigSA) fruitConfig: FruitConfigSA = null;

    private _saveLevel = false;

    @property(CCBoolean)
    public get saveLevel(): boolean {
        return this._saveLevel;
    }

    public set saveLevel(v: boolean) {
        if (this._saveLevel === v) {
            return;
        }

        this._saveLevel = v;
        if (!v) {
            return;
        }

        this.saveCurrentLevelToJson();
        this._saveLevel = false;
    }

    private saveCurrentLevelToJson(): void {
        if (!this.tree || !this.gameConfig) {
            console.warn('LevelEditor: tree or gameConfig is not assigned.');
            return;
        }

        const level = new LevelData();
        const fruits = this.getComponentsInChildren(Fruit)
        for (const item of fruits) {
            const fruitData = new FruitData();
            fruitData.positionX = item.node.position.x;
            fruitData.positionY = item.node.position.y;
            level.fruits.push(fruitData);
        }

        const treeData = new TreeData();
        const uiTree: UITransform = this.tree.getComponent(UITransform);
        const treeSprite = this.tree.getComponent(Sprite);
        treeData.height = uiTree.contentSize.height;
        treeData.width = uiTree.contentSize.width;
        treeData.treeType = this.gameConfig.trees.indexOf(treeSprite.spriteFrame);
        treeData.positionX = this.tree.node.position.x;
        treeData.positionY = this.tree.node.position.y;

        level.tree = treeData;


        const json = JSON.stringify(level)

        const blob = new Blob([json], { type: 'application/json' });
        this.saveBlobToFile(blob, 'data.json');

        // const projectPath = (globalThis as any).Editor?.Project?.path ?? process.cwd();
        // const outputDir = path.join(projectPath, 'assets', '_Game', 'Levels');
        // const outputPath = path.join(outputDir, 'level.json');

        // fs.mkdirSync(outputDir, { recursive: true });
        // fs.writeFileSync(outputPath, JSON.stringify(level, null, 2), 'utf8');

        // console.log(`Saved level JSON: ${outputPath}`);
    }

    saveBlobToFile(blob: Blob, fileName: string): void {
        // Create an object URL pointing to the blob data
        const url = URL.createObjectURL(blob);

        // Create a temporary hidden link element
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = fileName;

        // Append to DOM, click it to trigger download, then remove it
        document.body.appendChild(anchor);
        anchor.click();
        document.body.removeChild(anchor);

        // Release the object URL memory
        URL.revokeObjectURL(url);
    }
}



import {CellProps} from "./CellProps";
import {Input} from "./Input";
import {Block} from "./Block";

class Cell {
    public filled: boolean = false;
    public tint: number = 0xffffff;
};

export class Grid {

    private _grid: Cell[];

    private _container: PIXI.Container;
    private _cellSprites: PIXI.Sprite[];
    private _gameWidth: number; 
    private _gameHeight: number; 

    private _mouseTrackingPiece: Block;
    private _mirrorBlocks: Block[]; 
    private _ghostBlock: Block;

    public constructor (parentContainer: PIXI.Container, textures: any, gameWidth: number, gameHeight: number) {
        this._container = new PIXI.Container();
        parentContainer.addChild(this._container);

        this._gameWidth = gameWidth;
        this._gameHeight = gameHeight;

        this._grid = [];
        for (let i = 0; i < CellProps.CELL_DIM; ++i) {
            for (let j = 0; j < CellProps.CELL_DIM; ++j) {
                let cell = new Cell();
                this._grid.push(cell);
            }
        }

        this._cellSprites = [];
        for (let i = 0; i < CellProps.CELL_DIM; ++i) {
            for (let j = 0; j < CellProps.CELL_DIM; ++j) {
                let cellSprite = new PIXI.Sprite(textures["cell.png"]);
                this._container.addChild(cellSprite);
                this._cellSprites.push(cellSprite);
            }
        }

        let gridLength = CellProps.CELL_DIM * CellProps.CELL_SIZE;
        let gridMask = new PIXI.Graphics();
        gridMask.beginFill(0xff0000);
        gridMask.drawRect(2, 2, gridLength+5, gridLength+5);
        gridMask.endFill();
        this._container.addChild(gridMask);
        //gridMask.x = -gridLength/2;
        //gridMask.y = -gridLength/2;

        this._ghostBlock = new Block(this._container, textures);
        this._ghostBlock.alpha = 0.5;
        this._mouseTrackingPiece = new Block(this._container, textures, gridMask);
        this._mirrorBlocks = [];
        for (let i = 0; i < 8; ++i){
            let mirrorBlock = new Block(this._container, textures, gridMask);
            this._mouseTrackingPiece.copyShapeAndTintIntoBlock(mirrorBlock);
            this._mirrorBlocks.push(mirrorBlock);
        }
        this._mouseTrackingPiece.copyShapeAndTintIntoBlock(this._ghostBlock);
    }

    public update (input: Input) {
        let gridLength = CellProps.CELL_DIM * CellProps.CELL_SIZE;
        this._container.x = (this._gameWidth / 2) - (gridLength / 2);
        this._container.y = (this._gameHeight / 2) - (gridLength / 2);

        for (let i = 0; i < CellProps.CELL_DIM; ++i) {
            for (let j = 0; j < CellProps.CELL_DIM; ++j) {
                let cellSprite = this._cellSprites[i * CellProps.CELL_DIM + j];
                cellSprite.x = j * CellProps.CELL_SIZE;
                cellSprite.y = i * CellProps.CELL_SIZE;

                let cell = this._grid[i * CellProps.CELL_DIM + j];
                cellSprite.tint = cell.tint;
            }
        }

        this._mouseTrackingPiece.x = input.pointerX - this._container.x;
        this._mouseTrackingPiece.y = input.pointerY - this._container.y;

        for (let i = 0; i < 3; ++i) {
            for (let j = 0; j < 3; ++j) {
                let index = i * 3 + j;
                if (index == 4) { continue; }
                if (index > 4) { --index; }
                let mirrorBlock = this._mirrorBlocks[index];
                mirrorBlock.x = this._mouseTrackingPiece.x;
                mirrorBlock.y = this._mouseTrackingPiece.y;
                mirrorBlock.x += (j-1) * CellProps.CELL_DIM * CellProps.CELL_SIZE;
                mirrorBlock.y += (i-1) * CellProps.CELL_DIM * CellProps.CELL_SIZE;
            }
        }
        this._ghostBlock.x = this._mouseTrackingPiece.x;
        this._ghostBlock.y = this._mouseTrackingPiece.y;

        if (input.pointerJustDown) {
            let gridCopy = [];
            gridCopy.length = CellProps.CELL_DIM * CellProps.CELL_DIM;

            let cellRow = Math.floor((input.pointerY - this._container.y) / CellProps.CELL_SIZE);
            let cellCol = Math.floor((input.pointerX - this._container.x) / CellProps.CELL_SIZE);
            let doesntFit = false;
            for (let i = -2; i <= 2; ++i) {
                for (let j = -2; j <= 2; ++j) {
                    let row = i+cellRow;
                    if (row < 0) { row += CellProps.CELL_DIM; }
                    row = row % CellProps.CELL_DIM;

                    let col = j+cellCol;
                    if (col < 0) { col += CellProps.CELL_DIM; }
                    col = col % CellProps.CELL_DIM;

                    if (this._mouseTrackingPiece.filledAtRowCol(i+2, j+2)) {
                        let cell = this._grid[row * CellProps.CELL_DIM + col];
                        if (cell.filled) {
                            doesntFit = true;
                            break;
                        }
                        else {
                            gridCopy[row * CellProps.CELL_DIM + col] = true;
                        }
                    }
                }
                if (doesntFit) { break; }
            }

            if (!doesntFit) {
                for (let i = 0; i < CellProps.CELL_DIM; ++i) {
                    for (let j = 0; j < CellProps.CELL_DIM; ++j) {
                        if (gridCopy[i * CellProps.CELL_DIM + j]) {
                            let cell = this._grid[i * CellProps.CELL_DIM + j];
                            cell.filled = true;
                            cell.tint = this._mouseTrackingPiece.tint;
                        }
                    }
                }
                this._mouseTrackingPiece.changeShape();
                this._mouseTrackingPiece.randomizeTint();
                for (let i = 0; i < 8; ++i){
                    this._mouseTrackingPiece.copyShapeAndTintIntoBlock(this._mirrorBlocks[i]);
                }
                this._mouseTrackingPiece.copyShapeAndTintIntoBlock(this._ghostBlock);
            }
        }


        let gridCopy = [];
        gridCopy.length = CellProps.CELL_DIM * CellProps.CELL_DIM;
        for (let i = 0; i < CellProps.CELL_DIM; ++i) {
            let shouldClearRow = true;
            for (let j = 0; j < CellProps.CELL_DIM; ++j) {
                let cell = this._grid[i * CellProps.CELL_DIM + j];
                if (!cell.filled) {
                    shouldClearRow = false;
                    break;
                }
            }
            if (shouldClearRow) {
                for (let j = 0; j < CellProps.CELL_DIM; ++j) {
                    gridCopy[i * CellProps.CELL_DIM + j] = true;
                }
            }
        }
        for (let j = 0; j < CellProps.CELL_DIM; ++j) {
            let shouldClearCol = true;
            for (let i = 0; i < CellProps.CELL_DIM; ++i) {
                let cell = this._grid[i * CellProps.CELL_DIM + j];
                if (!cell.filled) {
                    shouldClearCol = false;
                    break;
                }
            }
            if (shouldClearCol) {
                for (let i = 0; i < CellProps.CELL_DIM; ++i) {
                    gridCopy[i * CellProps.CELL_DIM + j] = true;
                }
            }
        }
        for (let i = 0; i < CellProps.CELL_DIM; ++i) {
            for (let j = 0; j < CellProps.CELL_DIM; ++j) {
                if (gridCopy[i * CellProps.CELL_DIM + j]) {
                    let cell = this._grid[i * CellProps.CELL_DIM + j];
                    cell.filled = false;
                    cell.tint = 0xffffff;
                }
            }
        }
    }

}

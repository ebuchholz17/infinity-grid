import {CellProps} from "./CellProps";
import {Input} from "./Input";
import {Block} from "./Block";

class Cell {
    public filled: boolean = false;
    public tint: number = 0x999999;
};

export class GridUpdateResult{
    pointsEarned: number = 0;
    noMoreMoves: boolean = false;
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

    private _addFingerOffset: boolean = false;
    private _draggingBlock: boolean = true;
    private _dragOffsetX: number = 0;
    private _dragOffsetY: number = 0;

    private _selectableBlocks: Block[];
    private _selectableBlockUsed: boolean[];
    private _selectedIndex = -1;

    public constructor (parentContainer: PIXI.Container, textures: any, 
                        gameWidth: number, gameHeight: number, addFingerOffset: boolean) 
    {
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

        this._selectableBlocks = [];
        this._selectableBlockUsed = [];
        for (let i = 0; i < 3; ++i){
            let selectableBlock = new Block(this._container, textures);
            this._selectableBlocks.push(selectableBlock);
            this._selectableBlockUsed.push(false);
        }

        this._ghostBlock = new Block(this._container, textures);
        this._ghostBlock.alpha = 0.5;
        this._ghostBlock.visible = false;

        this._mouseTrackingPiece = new Block(this._container, textures, gridMask);
        this._mouseTrackingPiece.visible = false;
        this._mirrorBlocks = [];
        for (let i = 0; i < 8; ++i){
            let mirrorBlock = new Block(this._container, textures, gridMask);
            this._mouseTrackingPiece.copyShapeAndTintIntoBlock(mirrorBlock);
            this._mirrorBlocks.push(mirrorBlock);
        }
        this._mouseTrackingPiece.copyShapeAndTintIntoBlock(this._ghostBlock);

        this._draggingBlock = false;
        this._addFingerOffset = addFingerOffset;
    }

    public update (input: Input): GridUpdateResult {
        let result = new GridUpdateResult();
        result.pointsEarned = 0;
        result.noMoreMoves = false;

        let lineMulitplier = 0;
        let gridLength = CellProps.CELL_DIM * CellProps.CELL_SIZE;
        this._container.x = (this._gameWidth / 2) - (gridLength / 2);
        this._container.y = (this._gameHeight / 2) - (gridLength / 2) - 150;

        if (input.pointerJustDown) {
            let blockLocalPointerX = input.pointerX - this._container.x;
            let blockLocalPointerY = input.pointerY - this._container.y;
            for (let i = 0; i < this._selectableBlocks.length; ++i) {
                let selectableBlock = this._selectableBlocks[i];
                if (!this._selectableBlockUsed[i] && 
                    selectableBlock.intersectsBoundingBox(blockLocalPointerX, 
                                                          blockLocalPointerY)) 
                {
                    selectableBlock.copyShapeAndTintIntoBlock(this._mouseTrackingPiece);
                    this._mouseTrackingPiece.visible = true;
                    selectableBlock.copyShapeAndTintIntoBlock(this._ghostBlock);
                    this._ghostBlock.visible = true;
                    this._mouseTrackingPiece.x = selectableBlock.x;
                    this._mouseTrackingPiece.y = selectableBlock.y;
                    this._selectableBlockUsed[i] = true;
                    this._selectedIndex = i;

                    for (let i = 0; i < 8; ++i){
                        this._mouseTrackingPiece.copyShapeAndTintIntoBlock(this._mirrorBlocks[i]);
                    }
                    this._mouseTrackingPiece.copyShapeAndTintIntoBlock(this._ghostBlock);

                    this._draggingBlock = true; 
                    this._dragOffsetX = this._mouseTrackingPiece.x - (input.pointerX - this._container.x);
                    this._dragOffsetY = this._mouseTrackingPiece.y - (input.pointerY - this._container.y);
                    break;
                }
            }
        }

        if (this._draggingBlock) {
            let fingerOffset = this._addFingerOffset ? 225 : 0;
            this._mouseTrackingPiece.x = input.pointerX - this._container.x + this._dragOffsetX;
            this._mouseTrackingPiece.y = input.pointerY - this._container.y + this._dragOffsetY - fingerOffset;

            for (let i = 0; i < 3; ++i) {
                for (let j = 0; j < 3; ++j) {
                    let index = i * 3 + j;
                    if (index == 4) { continue; }
                    if (index > 4) { --index; }
                    let mirrorBlock = this._mirrorBlocks[index];
                    mirrorBlock.visible = true;
                    mirrorBlock.x = this._mouseTrackingPiece.x;
                    mirrorBlock.y = this._mouseTrackingPiece.y;
                    mirrorBlock.x += (j-1) * CellProps.CELL_DIM * CellProps.CELL_SIZE;
                    mirrorBlock.y += (i-1) * CellProps.CELL_DIM * CellProps.CELL_SIZE;
                }
            }
            this._ghostBlock.x = this._mouseTrackingPiece.x;
            this._ghostBlock.y = this._mouseTrackingPiece.y;

            let gridChanged = false;
            if (!input.pointerDown) {
                this._draggingBlock = false;

                let gridCopy = [];
                gridCopy.length = CellProps.CELL_DIM * CellProps.CELL_DIM;

                let cellRow = Math.floor(this._mouseTrackingPiece.y / CellProps.CELL_SIZE);
                let cellCol = Math.floor(this._mouseTrackingPiece.x / CellProps.CELL_SIZE);
                if (this.blockFitsAtRowCol(this._mouseTrackingPiece, cellRow, cellCol, gridCopy)) {
                    for (let i = 0; i < CellProps.CELL_DIM; ++i) {
                        for (let j = 0; j < CellProps.CELL_DIM; ++j) {
                            if (gridCopy[i * CellProps.CELL_DIM + j]) {
                                let cell = this._grid[i * CellProps.CELL_DIM + j];
                                cell.filled = true;
                                cell.tint = this._mouseTrackingPiece.tint;
                                gridChanged = true;
                            }
                        }
                    }
                }
                else {
                    this._selectableBlockUsed[this._selectedIndex] = false;
                    this._selectedIndex = -1;
                }

                this.onBlockDropped();
                if (gridChanged) {
                    // Clear rows/cols
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
                            lineMulitplier += 1;
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
                            lineMulitplier += 1;
                        }
                    }
                    for (let i = 0; i < CellProps.CELL_DIM; ++i) {
                        for (let j = 0; j < CellProps.CELL_DIM; ++j) {
                            if (gridCopy[i * CellProps.CELL_DIM + j]) {
                                let cell = this._grid[i * CellProps.CELL_DIM + j];
                                cell.filled = false;
                                cell.tint = 0x999999;
                                result.pointsEarned += 1;
                            }
                        }
                    }

                    // Check for remaining matches
                    let allBlocksUsed = true;
                    for (let i = 0; i < this._selectableBlockUsed.length; ++i) {
                        if (!this._selectableBlockUsed[i]) {
                            allBlocksUsed = false;
                            break;
                        }
                    }
                    if (!allBlocksUsed) {
                        if (this.noBlocksCanFit()) {
                            result.noMoreMoves = true;
                        }
                    }
                }
            }
        }
        else {
            this.onBlockDropped();
        }

        if (!this._draggingBlock) {
            let allBlocksUsed = true;
            for (let i = 0; i < this._selectableBlockUsed.length; ++i) {
                if (!this._selectableBlockUsed[i]) {
                    allBlocksUsed = false;
                    break;
                }
            }
            if (allBlocksUsed) {
                for (let i = 0; i < this._selectableBlocks.length; ++i) {
                    let selectableBlock = this._selectableBlocks[i];
                    this._selectableBlockUsed[i] = false;
                    selectableBlock.randomizeTint();
                    selectableBlock.changeShape();
                }
                if (this.noBlocksCanFit()) {
                    result.noMoreMoves = true;
                }
            }
        }

        for (let i = 0; i < this._selectableBlocks.length; ++i) {
            let selectableBlock = this._selectableBlocks[i];
            selectableBlock.x = (i-1) * (235) + CellProps.CELL_SIZE * CellProps.CELL_DIM * 0.5;
            selectableBlock.y = 900;
            selectableBlock.scale.set(0.66, 0.66);
            selectableBlock.visible = !this._selectableBlockUsed[i];
        }

        for (let i = 0; i < CellProps.CELL_DIM; ++i) {
            for (let j = 0; j < CellProps.CELL_DIM; ++j) {
                let cellSprite = this._cellSprites[i * CellProps.CELL_DIM + j];
                cellSprite.x = j * CellProps.CELL_SIZE;
                cellSprite.y = i * CellProps.CELL_SIZE;

                let cell = this._grid[i * CellProps.CELL_DIM + j];
                cellSprite.tint = cell.tint;
            }
        }
        result.pointsEarned *= lineMulitplier;
        return result;
    }

    private noBlocksCanFit (): boolean {
        let gridCopy = [];
        gridCopy.length = CellProps.CELL_DIM * CellProps.CELL_DIM;
        let blockCanFit = false;
        for (let blockIndex = 0; blockIndex < this._selectableBlocks.length; ++blockIndex) {
            if (this._selectableBlockUsed[blockIndex]) { continue; }

            let selectableBlock = this._selectableBlocks[blockIndex];
            for (let i = 0; i < CellProps.CELL_DIM; ++i) { 
                for (let j = 0; j < CellProps.CELL_DIM; ++j) { 
                    if (this.blockFitsAtRowCol(selectableBlock, i, j, gridCopy)) {
                        blockCanFit = true;
                        break;
                    }
                }
                if (blockCanFit) { break; }
            }
        }
        return !blockCanFit;
    }

    private blockFitsAtRowCol (block: Block, row: number, col: number, 
                               gridCopy: boolean[]): boolean 
    {
        let fits = true;
        for (let i = -2; i <= 2; ++i) {
            for (let j = -2; j <= 2; ++j) {
                let gridRow = i+row;
                if (gridRow < 0) { gridRow += CellProps.CELL_DIM; }
                gridRow = gridRow % CellProps.CELL_DIM;

                let gridCol = j+col;
                if (gridCol < 0) { gridCol += CellProps.CELL_DIM; }
                gridCol = gridCol % CellProps.CELL_DIM;

                if (block.filledAtRowCol(i+2, j+2)) {
                    let cell = this._grid[gridRow * CellProps.CELL_DIM + gridCol];
                    if (cell.filled) {
                        fits = false;
                        break;
                    }
                    else {
                        gridCopy[gridRow * CellProps.CELL_DIM + gridCol] = true;
                    }
                }
            }
            if (!fits) { break; }
        }
        return fits;
    }

    public reset (): void {
        for (let i = 0; i < CellProps.CELL_DIM; ++i) {
            for (let j = 0; j < CellProps.CELL_DIM; ++j) {
                let cell = this._grid[i * CellProps.CELL_DIM + j];
                cell.filled = false;
                cell.tint = 0x999999;
            }
        }
        this._selectedIndex = -1;
        for (let i = 0; i < this._selectableBlocks.length; ++i) {
            let selectableBlock = this._selectableBlocks[i];
            this._selectableBlockUsed[i] = false;
            selectableBlock.randomizeTint();
            selectableBlock.changeShape();
        }
        this.onBlockDropped();
    }

    private onBlockDropped (): void {
        this._mouseTrackingPiece.visible = false;
        this._ghostBlock.visible = false;

        for (let i = 0; i < 8; ++i) {
            let mirrorBlock = this._mirrorBlocks[i];
            mirrorBlock.visible = false;
        }
    }
}

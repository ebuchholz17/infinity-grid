import {CellProps} from "./CellProps";

export class Block {

    private _cellSprites: PIXI.Sprite[];
    private _filledCells: boolean[];
    private _tint: number = 0xffffff;
    private _container: PIXI.Container;

    public get tint (): number { return this._tint; }

    public get x (): number { return this._container.x; }
    public set x (value: number) { this._container.x = value; }

    public get y (): number { return this._container.y; }
    public set y (value: number) { this._container.y = value; }

    public get alpha (): number { return this._container.alpha; }
    public set alpha (value: number) { this._container.alpha = value; }

    public constructor (parentContainer: PIXI.Container, textures: any, mask?: PIXI.Graphics) {
        this._container = new PIXI.Container();
        parentContainer.addChild(this._container);

        if (mask) {
            this._container.mask = mask;
        }

        this._cellSprites = [];
        for (let i = 0; i < 5; ++i) {
            for (let j = 0; j < 5; ++j) {
                let cellSprite = new PIXI.Sprite(textures["cell.png"]);
                cellSprite.x = -CellProps.CELL_SIZE * 2.5 + j * CellProps.CELL_SIZE;
                cellSprite.y = -CellProps.CELL_SIZE * 2.5 + i * CellProps.CELL_SIZE;
                this._container.addChild(cellSprite);
                this._cellSprites.push(cellSprite);
            }
        }
        this.randomizeTint();

        this._filledCells = [
            false, false, false, false, false,
            false, false, false, false, false,
            false, false, false, false, false,
            false, false, false, false, false,
            false, false, false, false, false
        ];
        this.changeShape();
    }

    public randomizeTint (): void {
        this._tint = (Math.floor(Math.random() * 2) * 0xcf + 0x30) + 
                     ((Math.floor(Math.random() * 2) * 0xcf + 0x30) << 8) + 
                     ((Math.floor(Math.random() * 2) * 0xcf + 0x30) << 16);
        for (let i = 0; i < this._cellSprites.length; ++i) {
            this._cellSprites[i].tint = this._tint;
        }
    }

    public changeShape (): void {
        let possibleShapes = [
            [
                0, 0, 0, 0, 0,
                0, 0, 0, 0, 0,
                0, 0, 1, 0, 0,
                0, 0, 0, 0, 0,
                0, 0, 0, 0, 0
            ],
            [
                0, 0, 0, 0, 0,
                0, 0, 0, 0, 0,
                0, 0, 1, 1, 0,
                0, 0, 0, 0, 0,
                0, 0, 0, 0, 0
            ],
            [
                0, 0, 0, 0, 0,
                0, 0, 1, 0, 0,
                0, 0, 1, 0, 0,
                0, 0, 0, 0, 0,
                0, 0, 0, 0, 0
            ],
            [
                0, 0, 0, 0, 0,
                0, 0, 1, 0, 0,
                0, 1, 1, 0, 0,
                0, 0, 0, 0, 0,
                0, 0, 0, 0, 0
            ],
            [
                0, 0, 0, 0, 0,
                0, 0, 0, 0, 0,
                0, 1, 1, 0, 0,
                0, 0, 1, 0, 0,
                0, 0, 0, 0, 0
            ],
            [
                0, 0, 0, 0, 0,
                0, 0, 0, 0, 0,
                0, 0, 1, 1, 0,
                0, 0, 1, 0, 0,
                0, 0, 0, 0, 0
            ],
            [
                0, 0, 0, 0, 0,
                0, 0, 1, 0, 0,
                0, 0, 1, 1, 0,
                0, 0, 0, 0, 0,
                0, 0, 0, 0, 0
            ],
            [
                0, 0, 0, 0, 0,
                0, 0, 1, 0, 0,
                0, 0, 1, 0, 0,
                0, 0, 1, 0, 0,
                0, 0, 0, 0, 0
            ],
            [
                0, 0, 0, 0, 0,
                0, 0, 0, 0, 0,
                0, 1, 1, 1, 0,
                0, 0, 0, 0, 0,
                0, 0, 0, 0, 0
            ],
            [
                0, 0, 0, 0, 0,
                0, 0, 1, 1, 0,
                0, 0, 1, 1, 0,
                0, 0, 0, 0, 0,
                0, 0, 0, 0, 0
            ],
            [
                0, 0, 0, 0, 0,
                0, 1, 1, 1, 0,
                0, 1, 1, 1, 0,
                0, 1, 1, 1, 0,
                0, 0, 0, 0, 0
            ],
            [
                0, 0, 0, 0, 0,
                0, 1, 1, 1, 0,
                0, 1, 0, 0, 0,
                0, 1, 0, 0, 0,
                0, 0, 0, 0, 0
            ],
            [
                0, 0, 0, 0, 0,
                0, 1, 1, 1, 0,
                0, 0, 0, 1, 0,
                0, 0, 0, 1, 0,
                0, 0, 0, 0, 0
            ],
            [
                0, 0, 0, 0, 0,
                0, 1, 0, 0, 0,
                0, 1, 0, 0, 0,
                0, 1, 1, 1, 0,
                0, 0, 0, 0, 0
            ],
            [
                0, 0, 0, 0, 0,
                0, 0, 0, 1, 0,
                0, 0, 0, 1, 0,
                0, 1, 1, 1, 0,
                0, 0, 0, 0, 0
            ],
            [
                0, 0, 0, 0, 0,
                0, 0, 0, 0, 0,
                0, 1, 1, 1, 1,
                0, 0, 0, 0, 0,
                0, 0, 0, 0, 0
            ],
            [
                0, 0, 1, 0, 0,
                0, 0, 1, 0, 0,
                0, 0, 1, 0, 0,
                0, 0, 1, 0, 0,
                0, 0, 0, 0, 0
            ],
            [
                0, 0, 0, 0, 0,
                0, 0, 0, 0, 0,
                1, 1, 1, 1, 1,
                0, 0, 0, 0, 0,
                0, 0, 0, 0, 0
            ],
            [
                0, 0, 1, 0, 0,
                0, 0, 1, 0, 0,
                0, 0, 1, 0, 0,
                0, 0, 1, 0, 0,
                0, 0, 1, 0, 0
            ]
        ];

        let randomShape = possibleShapes[Math.floor(Math.random() * possibleShapes.length)];
        for (let i = 0; i < this._filledCells.length; ++i) {
            this._filledCells[i] = randomShape[i] == 1;
            this._cellSprites[i].visible = this._filledCells[i];
        }
    }

    public filledAtRowCol (row: number, col: number): boolean {
        return this._filledCells[row * 5 + col];
    }

    public copyShapeAndTintIntoBlock (block: Block): void {
        for (let i = 0; i < this._filledCells.length; ++i) {
            block._filledCells[i] = this._filledCells[i];
        }
        block._tint = this._tint;
        for (let i = 0; i < this._cellSprites.length; ++i) {
            block._cellSprites[i].visible = this._cellSprites[i].visible;
            block._cellSprites[i].tint = this._cellSprites[i].tint;
        }

    }

    public intersectsBoundingBox (x: number, y: number): boolean {
        let minX = this._container.x - CellProps.CELL_SIZE * 2.5;
        let maxX = this._container.x + CellProps.CELL_SIZE * 2.5;
        let minY = this._container.y - CellProps.CELL_SIZE * 2.5;
        let maxY = this._container.y + CellProps.CELL_SIZE * 2.5;

        if (x >= minX && x < maxX && y >= minY && y < maxY) {
            return true;
        }
        else {
            return false;
        }
    }

}

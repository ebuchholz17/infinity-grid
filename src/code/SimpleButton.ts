import {Input} from "./Input";

export class SimpleButton {

    private _container: PIXI.Container;
    private _sprite: PIXI.Sprite;
    private _label: PIXI.Text;
    private _pointerDown: boolean = false;

    public get x (): number { return this._container.x; }
    public set x (value: number) { this._container.x = value; }

    public get y (): number { return this._container.y; }
    public set y (value: number) { this._container.y = value; }

    public get visible (): boolean { return this._container.visible; }
    public set visible (value: boolean) { this._container.visible = value; }

    public constructor (parentContainer: PIXI.Container, texture: any) {
        this._container = new PIXI.Container();
        parentContainer.addChild(this._container);

        this._sprite = new PIXI.Sprite(texture);
        this._sprite.anchor.set(0.5, 0.5);
        this._container.addChild(this._sprite);

        this._label= new PIXI.Text("", {
            fontFamily: "LabelFont",
            fontSize: 72,
            fill: 0xffffff
        });
        this._label.anchor.set(0.5, 0.5);
        this._container.addChild(this._label);
    }

    public setText (text: string): void {
        this._label.text = text;
    }

    public update (input: Input): boolean {
        let clicked = false;
        if (!this._pointerDown) {
            if (this.pointerInBounds(input.pointerX, input.pointerY)) {
                if (input.pointerJustDown) {
                    this._pointerDown = true;
                    this._sprite.tint = 0xaaaaaa;
                }
                else {
                    this._sprite.tint = 0xcccccc;
                }
            }
            else {
                this._sprite.tint = 0xffffff;
            }
        }
        else {
            if (this.pointerInBounds(input.pointerX, input.pointerY)) {
                if (!input.pointerDown) {
                    this._pointerDown = false;
                    this._sprite.tint = 0xffffff;
                    clicked = true;
                }
                else {
                    this._sprite.tint = 0xaaaaaa;
                }
            }
            else {
                this._sprite.tint = 0xffffff;
            }
        }
        return clicked;
    }

    private pointerInBounds (pointerX: number, pointerY: number): boolean {
        let minX = this._container.x - this._sprite.width/2
        let maxX = this._container.x + this._sprite.width/2
        let minY = this._container.y - this._sprite.height/2
        let maxY = this._container.y + this._sprite.height/2
        if (pointerX >= minX && pointerX < maxX && pointerY >= minY && pointerY < maxY) {
            return true;
        }
        return false;
    }

}

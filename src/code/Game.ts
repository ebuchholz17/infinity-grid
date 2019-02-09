import {Promise} from "es6-promise";
import FontFaceObserver from "FontFaceObserver";
import MobileDetect from "mobile-detect";

import {Grid} from "./Grid";
import {Input} from "./Input";

export class Game {

    private _parentContainer: any; // Parent HTML element of the game canvas
    private _renderer: PIXI.WebGLRenderer | PIXI.CanvasRenderer;
    private _resizeCallback: (this: this, ev: Event) => any;
    private _stage: PIXI.Container;
    private _doneLoading: boolean = false;
    private _loadingText: PIXI.Text;
    private _pixelRatio: number = 1;

    private _resourcePath: string = "";

    private _resizeDelay: number = 2;
    private _resizeDelayTween: TWEEN.Tween;

    private _input: Input;
    private _mobileInputs: boolean = false;
    private _width: number = 0;
    private _height: number = 0;

    private _textures: any;

    private _wholeGameContainer: PIXI.Container;
    private _nativeWidth: number = 720;
    private _nativeHeight: number = 1280;

    private _grid: Grid;
    private _scoreText: PIXI.Text;
    private _score: number = 0;

    public constructor () {
        this._resizeDelayTween = new TWEEN.Tween(this)
            .to({_resizeDelay: 0}, 100)
            .onComplete(function () {
                this.resize();
                this._resizeDelay = 2;
            }.bind(this));
    }

    public init (elementID: string, devicePixelRatio: number) {
        this._parentContainer = document.getElementById(elementID);
        this._parentContainer.style.display = "none";

        this._pixelRatio = devicePixelRatio;
        let rendererOptions = {
            autoResize: true,
            backgroundColor: 0x241f4d,
            resolution: this._pixelRatio,
            //roundPixels: true
        };
        this._renderer = PIXI.autoDetectRenderer(10, 10, rendererOptions);
        this._stage = new PIXI.Container();
        this._parentContainer.insertAdjacentElement("afterbegin", this._renderer.view);

        this._parentContainer.style.display = "block";

        // Removes highlight when canvas is tapped, and prevents scrolling on the canvas
        this._renderer.view.draggable = false;
        this._renderer.view.style['-webkit-user-select'] = 'none';
        this._renderer.view.style['-khtml-user-select'] = 'none';
        this._renderer.view.style['-moz-user-select'] = 'none';
        this._renderer.view.style['-ms-user-select'] = 'none';
        this._renderer.view.style['user-select'] = 'none';
        this._renderer.view.style['outline'] = 'none';
        this._renderer.view.style['-webkit-tap-highlight-color'] = 'rgba(255, 255, 255, 0)';

        let mobileDetect = new MobileDetect(window.navigator.userAgent);
        this._input = new Input();
        this._mobileInputs = !!(mobileDetect.mobile() || mobileDetect.tablet());
        if (this._mobileInputs) {
            document.addEventListener("touchstart", this.onTouchStart.bind(this), false);
            document.addEventListener("touchmove", this.onTouchMove.bind(this), false);
            document.addEventListener("touchend", this.onTouchEnd.bind(this), false);
        }
        else {
            document.addEventListener("mousedown", this.onMouseDown.bind(this));
            document.addEventListener("mouseup", this.onMouseUp.bind(this));
            document.addEventListener("mousemove", this.onMouseMove.bind(this));
        }

        this._wholeGameContainer = new PIXI.Container();
        this._stage.addChild(this._wholeGameContainer);

        this._loadingText = new PIXI.Text("Loading...", {
            fontFamily: "sans-serif",
            fontSize: 60,
            fill: 0xffffff
        });
        this._loadingText.anchor.set(0.5, 0.5);
        this._loadingText.x = this._nativeWidth / 2;
        this._loadingText.y = this._nativeHeight / 2;
        this._wholeGameContainer.addChild(this._loadingText);

        // Resize when the window changes size
        this._resizeCallback = this.resize.bind(this);
        window.addEventListener("orientationchange", this._resizeCallback, false);
        this.resize(true);

        this.loadAssets().then(
            function () {
                this.startGame();
            }.bind(this),
            function (error) {
                console.log("error loading assets :", error);
            }.bind(this)
        );

        this.update();
    }

    private onTouchStart (e: any): void {
        if (!this._input.pointerDown) {
            this._input.pointerJustDown = true;
        }
        this._input.pointerDown = true;
        this.setMouseXY(e.touches[0].clientX, e.touches[0].clientY);
    }

    private onTouchMove (e: any): void {
        this.setMouseXY(e.touches[0].clientX, e.touches[0].clientY);
    }

    private onTouchEnd (e: any) {
        this._input.pointerDown = false;
    }

    private onMouseDown (e: any): void {
        if (!this._input.pointerDown) {
            this._input.pointerJustDown = true;
        }
        this._input.pointerDown = true;
    }

    private onMouseUp (e: any): void {
        this._input.pointerDown = false;
    }

    private onMouseMove (e: any): void {
        this.setMouseXY(e.clientX, e.clientY);
    }

    private setMouseXY (x: number, y: number): void {
        let canvas = this._renderer.view;
        let scaleX = (canvas.width / this._pixelRatio) / canvas.clientWidth;
        let scaleY = (canvas.height / this._pixelRatio) / canvas.clientHeight;
        var mouseX = (x - canvas.clientLeft) * scaleX;
        var mouseY = (y - canvas.clientTop) * scaleY;
        this._input.pointerX = mouseX;
        this._input.pointerY = mouseY;

        this._input.pointerX -= this._wholeGameContainer.x;
        this._input.pointerX /= this._wholeGameContainer.scale.x;
        this._input.pointerY -= this._wholeGameContainer.y;
        this._input.pointerY /= this._wholeGameContainer.scale.y;
        console.log(this._input.pointerX, this._input.pointerY);
    }

    private loadAssets (): Promise<any> {
        return new Promise<any>(function (resolve, reject) {
            Promise.all([
                this.loadTextures(),
                this.loadFonts()
            ]).then(
                function () {
                    resolve();
                }.bind(this),
                function (error) {
                    reject(error);
                }
            );
        }.bind(this));
    }

    private loadTextures (): Promise<any> {
        return new Promise<any>(function (resolve, reject) {
            let onLoaded = function (loader: any, resources: any) {
                this._textures = resources["atlas"].textures;
                resolve();
            };
            let onError = function (error) {
                reject(error);
            };
            PIXI.loader.add("atlas", this._resourcePath + "assets/images/atlas.json");
            PIXI.loader.once("complete", onLoaded, this);
            PIXI.loader.on("error", onError, this);
            PIXI.loader.load();
        }.bind(this));
    }

    private loadFonts (): Promise<any> {
        return new Promise<any>(function (resolve, reject) {
        // Fonts
        let fontStyle = require("../styles/fonts.less");
        fontStyle = fontStyle.replace(/%RESOURCE_PATH%/g, this._resourcePath);

        let css = document.createElement("style");
        css.setAttribute("type", "text/css");
        css.innerHTML = fontStyle;
        document.getElementsByTagName("head")[0].appendChild(css);

        new FontFaceObserver("LabelFont").load(null, 1000 * 60 * 5).then(
            function () {
                resolve();
            }.bind(this),
            function (error) {
                reject(error);
            }
        );
        }.bind(this));
    }

    private startGame (): void {
        this._wholeGameContainer.removeChild(this._loadingText);

        let addFingerOffset = this._mobileInputs;
        this._scoreText = new PIXI.Text("0", {
            fontFamily: "sans-serif",
            fontSize: 84,
            fill: 0xffffff
        });
        this._scoreText.anchor.set(0.5, 0.5);
        this._scoreText.x = this._nativeWidth / 2;
        this._scoreText.y = 70;
        this._wholeGameContainer.addChild(this._scoreText);
        this._grid = new Grid(this._wholeGameContainer, this._textures, 
                              this._nativeWidth, this._nativeHeight, addFingerOffset);
        this._doneLoading = true;
    }

    private queueResize () {
        if (this._resizeDelay < 2) {
            return;
        }
        this._resizeDelayTween.start();
    }

    private resize (force: boolean = false) {
        let newWidth = this._parentContainer.clientWidth;
        let newHeight = this._parentContainer.clientHeight;

        if ((this._width != newWidth) || (this._height != newHeight) || force) {
            this._width = newWidth;
            this._height = newHeight;

            let canvas = this._renderer.view;
            canvas.width = newWidth;
            canvas.height = newHeight;
            canvas.style.width = newWidth + "px";
            canvas.style.height = newHeight + "px";

            this._renderer.resize(newWidth, newHeight);

            let nativeAspectRatio = this._nativeWidth / this._nativeHeight;
            let containerAspectRatio = this._width / this._height;

            if (containerAspectRatio < nativeAspectRatio) {
                let scale = this._width / this._nativeWidth;
                this._wholeGameContainer.scale.set(scale, scale);
                let heightDiff = this._height - (this._nativeHeight * scale);
                this._wholeGameContainer.x = 0;
                this._wholeGameContainer.y = heightDiff / 2;
            }
            else {
                let scale = this._height / this._nativeHeight;
                this._wholeGameContainer.scale.set(scale, scale);
                let widthDiff = this._width - (this._nativeWidth * scale);
                this._wholeGameContainer.x = widthDiff / 2;
                this._wholeGameContainer.y = 0;
            }

        }
    }

    private update ()  {
        let newWidth = this._parentContainer.clientWidth;
        let newHeight = this._parentContainer.clientHeight;

        if ((this._width != newWidth) || (this._height != newHeight)) {
            this.queueResize();
        }
        requestAnimationFrame(() => { this.update(); });

        if (this._doneLoading) {
            this._score += this._grid.update(this._input);
            this._scoreText.text = this._score.toString();

        }
        this._input.pointerJustDown = false;
        
        TWEEN.update();
        this._renderer.render(this._stage);
    }
}

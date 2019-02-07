import {Promise} from "es6-promise";
import FontFaceObserver from "FontFaceObserver";
import MobileDetect from "mobile-detect";

export class Game {

    private _parentContainer: any; // Parent HTML element of the game canvas
    private _renderer: PIXI.WebGLRenderer | PIXI.CanvasRenderer;
    private _resizeCallback: (this: this, ev: Event) => any;
    private _stage: PIXI.Container;
    private _doneLoading: boolean = false;
    private _loadingText: PIXI.Text;

    private _resourcePath: string = "";

    private _resizeDelay: number = 2;
    private _resizeDelayTween: TWEEN.Tween;

    private _useMobileInputEvents: boolean = false;
    private _width: number = 0;
    private _height: number = 0;

    private _textures: any;

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

        let rendererOptions = {
            autoResize: true,
            backgroundColor: 0x000000,
            resolution: devicePixelRatio,
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
        this._useMobileInputEvents = !!(mobileDetect.mobile() || mobileDetect.tablet());

        this._loadingText = new PIXI.Text("Loading...", {
            fontFamily: "Sans-Serif",
            fontSize: 24,
            fill: 0xffffff
        });
        this._loadingText.anchor.set(0.5, 0.5);
        this._stage.addChild(this._loadingText);

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
        this._stage.removeChild(this._loadingText);

        for (let i = 0; i < 10; ++i) {
            for (let j = 0; j < 10; ++j) {
                let gridCell = new PIXI.Sprite(this._textures["cell.png"]);
                gridCell.x = j * 60;
                gridCell.y = i * 60;
                this._stage.addChild(gridCell);
            }
        }
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

            if (!this._doneLoading) {
                this._loadingText.style.fontSize = (newHeight / 720) * 60 + 1;
                this._loadingText.x = newWidth / 2;
                this._loadingText.y = newHeight / 2;
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
        
        TWEEN.update();
        this._renderer.render(this._stage);
    }
}

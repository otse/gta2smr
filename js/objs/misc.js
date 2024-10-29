import sprite from "../sprite.js";
import gtasmr from "../gtasmr.js";
import baseobj from "./baseobj.js";
var objects;
(function (objects) {
    class floor extends baseobj {
        constructor(sprops) {
            super({ name: 'a floor' });
            this.sprops = sprops;
            this.sty = 'sty/floors/mixed/78.bmp';
            this.size = [64, 64];
        }
        _delete() {
            var _a;
            (_a = this.sprite) === null || _a === void 0 ? void 0 : _a.dispose();
        }
        _create() {
            let sprops = Object.assign(Object.assign({}, this.sprops), { bind: this });
            sprops.color = gtasmr.sample(['red', 'salmon', 'pink', 'cyan']);
            new sprite(sprops);
            //this.sprite!.rposoffset = pts.mult([0.5, 0], lod.size);
            this.sprite.create();
        }
    }
    objects.floor = floor;
})(objects || (objects = {}));
export default objects;
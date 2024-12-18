import lod from "../lod.js";
import sprite from "../sprite.js";
import baseobj from "./baseobj.js";
var objects;
(function (objects) {
    class floor extends baseobj {
        constructor(props) {
            super(Object.assign(Object.assign({ name: 'a floor' }, props), { _type: 'floor' }));
            this.sty = 'sty/floors/mixed/78.bmp';
            this.sprops = Object.assign(Object.assign({}, props.extra), { bind: this });
            this.size = [64, 64];
        }
        _delete() {
            var _a;
            (_a = this.sprite) === null || _a === void 0 ? void 0 : _a.dispose();
        }
        _create() {
            this.sprops = Object.assign(Object.assign({}, this.sprops), { bind: this });
            // sprops.color = gtasmr.sample(['red', 'salmon', 'pink', 'cyan'])
            new sprite(this.sprops);
            this.sprite.rposoffset = lod.project([0.5, 0.5]);
            this.sprite.create();
        }
    }
    objects.floor = floor;
    class block extends baseobj {
        constructor(props) {
            super(Object.assign(Object.assign({}, props), { _type: 'block' }));
            this.size = [64, 64];
        }
        _delete() {
        }
        _create() {
            this.geometry = new THREE.BoxGeometry(64, 64, 64);
        }
    }
    objects.block = block;
})(objects || (objects = {}));
export default objects;

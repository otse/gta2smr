import city from "../city.js";
import sprite from "../sprite.js";
import lod from "../lod.js";
import renderer from "../renderer.js";
import baseobj from "./baseobj.js";
import glob from "../dep/glob.js";

const ped_uv = [0.125, 0.043478260869565216] as vec2;

 
export class ped extends baseobj {
	remap = -1
	timer = 0
	row = 0
	column = 0
	walking = false
	running = false
	idling = false
	sprite?: sprite
	constructor(props: propz) {
		super({
			name: 'a pedestrian',
			...props,
			_type: 'ped',
		});
		this.size = [33, 33];
	}
	protected override _delete() {
		console.log('delete ped');
		this.sprite?.dispose();
	}
	protected override _create() {
		//console.log(' ped create ');
		if (this.remap == -1)
			this.remap = Math.floor(Math.random() * 53);
		new sprite({
			bind: this,
			sty: `sty/ped/template_${this.remap}.png`,
			blur: `sty/ped/blur.png`,
			repeat: ped_uv,
			make_shadow_sprite: true,
			transparent: true,
			z: 2,
			shadow_length: [4, -4]
		});
		this.sprite!.create();
	}
	protected override _step() {
		this.timer += renderer.delta;
		if ((this.walking || this.running) && this.timer >= (this.walking ? 0.12 : 0.09)) {
			this.column = (this.column < 7) ? this.column + 1 : 0;
			this.timer = 0;
			if (this.column == 1 || this.column == 5)
				city.sounds.footsteps[Math.floor(Math.random() * 4)].play();
		}
		else if (this.idling && this.timer >= 0.14) {
			if (this.column == 7)
				this.row = 8;
			this.column = (this.column < 7) ? this.column + 1 : 0;
			this.timer = 0;
			if (this.column == 4 && this.row == 8)
				this.idling = false;
		}
		if ((!this.idling && !this.walking && !this.running)) {
			this.column = 0;
			this.row = 7;
		}
		if (this.timer >= 3) {
			this.idling = true;
			this.column = 0;
			this.row = 7;
			this.timer = 0;
		}
		this.sprite!.sprops.offset = [ped_uv[0] * this.column, -ped_uv[1] * this.row];
		this.sprite?.step();
		super._step();
		lod.chunk.swap(this);
	}
}

export default ped;
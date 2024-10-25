import App from "./app.js";

import pts from "./pts.js";
import Core from "./core.js";
import Renderer from "./renderer.js";
import View from "./view.js";
import Game from "./game.js";
import GTA from "./gta.js";
import City from "./city.js";

namespace Objects {

	const ped_uv = [0.125, 0.043478260869565216];
	export class Ped extends Core.Obj {
		remap = -1;
		timer = 0;
		row = 0;
		column = 0;
		walking = false;
		running = false;
		idling = false;
		constructor() {
			super(undefined);
			this.size = [33, 33];
		}
		make() {
			if (this.remap == -1)
				this.remap = Math.floor(Math.random() * 53);
			new Game.Sprite({
				bind: this,
				sty: `ped/template_${this.remap}.png`,
				blur: `ped/blur.png`,
				repeat: [ped_uv[0], ped_uv[1]],
				z: 1
			});
		}
		tick() {
			this.timer += Renderer.delta;
			if ((this.walking || this.running) && this.timer > (this.walking ? 0.11 : 0.08)) {
				this.column = (this.column < 7) ? this.column + 1 : 0;
				this.timer = 0;
				if (this.column == 1 || this.column == 5)
					City.sounds.footsteps[Math.floor(Math.random() * 4)].play();
			}
			else if (this.idling && this.timer > 0.14) {
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
			if (this.timer > 3) {
				this.idling = true;
				this.column = 0;
				this.row = 7;
				this.timer = 0;
			}
			let shape = this.shape as Game.Sprite;
			shape.properties.offset = [ped_uv[0] * this.column, -ped_uv[1] * this.row];
			super.update();
			this.sector?.swap(this);
		}
	}

	export class Ply extends Ped {
		stopped = false;
		static instance() {
			let ply = new Ply;
			ply.make();
			return ply;
		}
		constructor() {
			super();
		}
		make() {
			// 9, 52
			this.remap = 52;
			super.make();
		}
		tick() {
			this.walking = false;
			this.running = false;
			let dist = pts.dist(this.rpos, GTA.view.mrpos);
			const range = 48;
			if (App.key('c') == 1)
				this.stopped = !this.stopped;
			if (!this.stopped && dist > range) {
				this.idling = false
				let velocity = -0.75;
				if (App.button(0) >= 1) {
					velocity = -1.5;
					this.running = true;
					this.row = 1;
				}
				else {
					this.walking = true;
					this.row = 0;
				}
				this.rz = -Math.atan2(
					this.rpos[0] - GTA.view.mrpos[0],
					this.rpos[1] - GTA.view.mrpos[1]);
				velocity *= Renderer.delta;
				this.wpos = pts.add(this.wpos, [
					velocity * Math.sin(-this.rz),
					velocity * Math.cos(-this.rz)
				]);
			}
			super.tick();
		}
	}

	/*
	export class Rock extends Core.Obj {
		static slowness = 12;
		rate: number
		float: vec2
		constructor() {
			super();
			this.size = [100, 100];
			this.float = pts.make(
				(Math.random() - 0.5) / Rock.slowness,
				(Math.random() - 0.5) / Rock.slowness
			);
			this.rate = (Math.random() - 0.5) / (Rock.slowness * 6);
		}
		make() {
			this.size = [200, 200];
			let shape = new Game.Sprite({
				bind: this,
				sty: 'grav/pngwing.com',
				offset: [0, 0],
				scale: [1, 1],
				z: 0
			});
		}
		tick() {
			this.wpos[0] += this.float[0];
			this.wpos[1] -= this.float[1];
			this.rz += this.rate;
			super.update();
			this.sector?.swap(this);
		}
	}*/
}

export default Objects;
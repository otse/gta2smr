import aabb2 from "./dep/aabb2.js";
import pts from "./dep/pts.js";

import gtasmr from "./gtasmr.js";
import renderer from "./renderer.js";

export namespace Counts {
	export type Count = [active: number, total: number];

	export var Sectors: Count = [0, 0];
	export var Objs: Count = [0, 0];
	export var Sprites: Count = [0, 0];
	export var Blocks: Count = [0, 0];
};

class toggle {
	protected active = false;
	isActive() { return this.active };
	on() {
		if (this.active) {
			console.warn('already on');
			return true;
			// it was on before
		}
		this.active = true;
		return false;
		// it wasn't on before
	}
	off() {
		if (!this.active) {
			console.warn('already off');
			return true;
		}
		this.active = false;
		return false;
	}
}

namespace lod_old {
	type units = vec2;
	type sectorUnits = vec2;
	type pixels = vec2;

	export class world {
		static readonly Unit = 64;
		static readonly SectorSpan = 2;
		arrays: chunk[][] = [];
		readonly grid: grid;
		constructor(span) {
			this.grid = new grid(3, 4, this);
		}
		update(wpos: units) {
			this.grid.big = world.big(wpos);
			this.grid.offs();
			this.grid.crawl();
		}
		lookup(x, y): chunk | undefined {
			if (this.arrays[y] == undefined)
				this.arrays[y] = [];
			return this.arrays[y][x];
		}
		at(x, y): chunk {
			return this.lookup(x, y) || this.make(x, y);
		}
		atwpos(wpos: units): chunk {
			let big = world.big(wpos);
			return this.at(big[0], big[1]);
		}
		protected make(x, y): chunk {
			let s = this.lookup(x, y);
			if (s)
				return s;
			s = this.arrays[y][x] = new chunk(x, y, this);
			return s;
		}
		static big(wpos: units): sectorUnits {
			return pts.floor(pts.divide(wpos, world.SectorSpan));
		}
		static unproject(rpos: pixels): units {
			return pts.divide(rpos, lod_old.world.Unit);
		}
	}
	interface SectorHooks {
		onCreate: (Sector) => any;
		onTick: (Sector) => any;
	};

	export class chunk extends toggle {
		static hooks?: SectorHooks | undefined;
		group
		//readonly span = 2000;
		readonly big: sectorUnits;
		private readonly objs: Obj[] = [];
		objs_(): ReadonlyArray<Obj> { return this.objs; }
		constructor(
			public readonly x,
			public readonly y,
			readonly galaxy: world
		) {
			super();
			this.big = [x, y];
			this.group = new THREE.Group;
			Counts.Sectors[1]++;
			chunk.hooks?.onCreate(this);
		}
		add(obj: Obj) {
			let i = this.objs.indexOf(obj);
			if (i == -1) {
				this.objs.push(obj);
				obj.sector = this;
				if (this.isActive())
					obj.show();
			}
		}
		remove(obj: Obj): boolean | undefined {
			let i = this.objs.indexOf(obj);
			if (i > -1) {
				obj.sector = null;
				return !!this.objs.splice(i, 1).length;
			}
		}
		swap(obj: Obj) {
			let sector = this.galaxy.atwpos(obj.wpos);
			if (obj.sector != sector) {
				// console.warn('obj sector not sector');
				obj.sector?.remove(obj);
				sector.add(obj);
				if (!this.galaxy.grid.visible(sector)) {
					obj.hide();
				}
			}
		}
		tick() {
			chunk.hooks?.onTick(this);
			//for (let obj of this.objs)
			//	obj.tick();
		}
		show() {
			if (this.on())
				return;
			Counts.Sectors[0]++;
			Util.SectorShow(this);
			//console.log(' sector show ');
			for (let obj of this.objs)
				obj.show();
			renderer.scene.add(this.group);
		}
		hide() {
			if (this.off())
				return;
			Counts.Sectors[0]--;
			Util.SectorHide(this);
			//console.log(' sector hide ');
			for (let obj of this.objs)
				obj.hide();
			renderer.scene.remove(this.group);
		}
	}
	export class grid {
		big: vec2 = [0, 0];
		public shown: chunk[] = [];
		constructor(
			public readonly spread,
			public readonly outside,
			readonly galaxy: world
		) {
		}
		visible(sector: chunk) {
			return pts.dist(sector.big, this.big) < this.spread;
		}
		crawl() {
			for (let y = -this.spread; y < this.spread; y++) {
				for (let x = -this.spread; x < this.spread; x++) {
					let pos = pts.add(this.big, [x, y]);
					let sector = this.galaxy.lookup(pos[0], pos[1]);
					if (!sector)
						continue;
					if (!sector.isActive()) {
						this.shown.push(sector);
						sector.show();
					}
				}
			}

		}
		offs() {
			let allObjs: Obj[] = [];
			let i = this.shown.length;
			while (i--) {
				let sector: chunk;
				sector = this.shown[i];
				allObjs = allObjs.concat(sector.objs_());
				sector.tick();
				if (pts.dist(sector.big, this.big) > this.outside) {
					sector.hide();
					this.shown.splice(i, 1);
				}
			}
			for (let obj of allObjs)
				obj.tick();
		}
	}
	interface ObjStuffs {

	};
	export class Obj extends toggle {
		wpos: units = [0, 0];
		rpos: pixels = [0, 0];
		size: vec2 = [64, 64];
		shape: Shape | null;
		sector: chunk | null;
		stuffs: ObjStuffs;
		rz = 0;
		constructor(stuffs: ObjStuffs | undefined = undefined) {
			super();
			Counts.Objs[1]++;
		}
		finalize() {
			this.hide();
			Counts.Objs[1]--;
		}
		show() {
			if (this.on())
				return;
			Counts.Objs[0]++;
			this.update();
			this.shape?.show();
		}
		hide() {
			if (this.off())
				return;
			Counts.Objs[0]--;
			this.shape?.hide();
		}
		wtorpos() {
			this.rpos = pts.mult(this.wpos, world.Unit);
		}
		tick() { // implement me
		}
		make() { // implement me
			console.warn('obj.make');
		}
		update() {
			this.wtorpos();
			this.bound();
			this.shape?.update();
		}
		aabb: aabb2 | undefined;
		bound() {
			let div = pts.divide(this.size, 2);
			this.aabb = new aabb2(pts.inv(div), div);
			this.aabb.translate(this.rpos);
		}
		moused(mouse: vec2) {
			if (this.aabb?.test(new aabb2(mouse, mouse)))
				return true;
		}
	}

	export namespace Shape {
		export type Parameters = Shape['properties'];
	};

	export class Shape extends toggle {
		constructor(
			public readonly properties: { bind: Obj },
			public readonly counts
		) {
			super();
			this.properties.bind.shape = this;
			this.counts[1]++;
		}
		update() { // implement me
		}
		create() { // implement me
		}
		dispose() { // implement me
		}
		finalize() {
			this.hide();
			this.counts[1]--;
		}
		show() {
			if (this.on())
				return;
			this.create();
			this.counts[0]++;
		}
		hide() {
			if (this.off())
				return;
			this.dispose();
			this.counts[0]--;
		}
	}
}

export namespace Util {
	export function SectorShow(sector: lod_old.chunk) {
		let breadth = lod_old.world.Unit * lod_old.world.SectorSpan;
		let any = sector as any;
		any.geometry = new THREE.PlaneGeometry(breadth, breadth, 2, 2);
		any.material = new THREE.MeshBasicMaterial({
			wireframe: true,
			transparent: true,
			color: 'red'
		});
		any.mesh = new THREE.Mesh(any.geometry, any.material);
		any.mesh.position.fromArray([sector.x * breadth + breadth / 2, sector.y * breadth + breadth / 2, 0]);
		any.mesh.updateMatrix();
		any.mesh.frustumCulled = false;
		any.mesh.matrixAutoUpdate = false;
		//Renderer.scene.add(any.mesh);
	}
	export function SectorHide(sector: lod_old.chunk) {
		let any = sector as any;
		renderer.scene.remove(any.mesh);
	}
}
export default lod_old;
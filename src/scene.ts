import { MeshGenerator } from "./compute"
import { Mesh } from "./mesh"
import { Camera } from "./camera"
import { vec3 } from "wgpu-matrix"
import * as Globals from "./globalParameters"
import { on } from "events"

type Location = string;

export class Scene {

	private meshGenerator: MeshGenerator;
	private meshMap: Map<Location, Mesh>; // from location to mesh
	private camera: Camera;

	constructor(
		private renderDevice: GPUDevice
	) {

		this.meshGenerator = new MeshGenerator();
		this.meshMap = new Map<Location, Mesh>();
		this.camera = new Camera(
			vec3.create(0.0, 0.0, -20.0),	//position
			vec3.create(0.0, 1.0, 0.0),	//up
			vec3.create(0.0, 0.0, 1.0),	//forward
			2,		//fovy
			<HTMLCanvasElement>document.getElementById("screen")
		);	
	}

	public async init(): Promise<void> {
		await this.meshGenerator.init();
	}

	public getMeshes(): IterableIterator<Mesh> {
		return this.meshMap.values();
	}

	public async tick(): Promise<void> {
		this.camera.tick();
		console.log(1);
		
		const position = this.camera.getPosition();
		const x: number = position[0];
		const z: number = position[2];

		const chunkCenterX = x - (x % Globals.CUBES_PER_CHUNK_H) + (Globals.CUBES_PER_CHUNK_H / 2);
		const chunkCenterZ = z - (z % Globals.CUBES_PER_CHUNK_H) + (Globals.CUBES_PER_CHUNK_H / 2);
		const delta = Math.ceil(Globals.RENDER_RADIOUS) * Globals.CUBES_PER_CHUNK_H;
		
		const startX: number = chunkCenterX - delta;
		const startZ: number = chunkCenterZ - delta;
		const endX: number = chunkCenterX + delta;
		const endZ: number = chunkCenterZ + delta;

		
		for (var i = startX; i < endX; i += Globals.CUBES_PER_CHUNK_H) {
			for (var j = startZ; j < endZ; j += Globals.CUBES_PER_CHUNK_H) {
				const location: Location = [i, j].toString();
				const dx = i - x;
				const dz = j - z;
				const dist = Math.sqrt(dx * dx + dz * dz) / Globals.CUBES_PER_CHUNK_H;
				if (this.meshMap.has(location)) {
					if (dist > Globals.RENDER_RADIOUS + Globals.UN_RENDER_DELTA) {
						this.meshMap.delete(location);
					}
				} else {
					if (dist <= Globals.RENDER_RADIOUS) {
						this.meshMap.set(location, await this.meshGenerator.generateMesh([i,0,j], [1,1,1], this.renderDevice));
					}
				}
			}
		}
		
	//	this.meshMap.set("0,0", await this.meshGenerator.generateMesh([0,0,0], [1,1,1], this.renderDevice));

	}

	public getCamera(): Camera {
		return this.camera;
	}

};

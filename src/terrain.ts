import { Mesh } from "./mesh"
import { MeshGenerator } from "./compute";
import * as Globals from "./globalParameters"
import { Queue } from "./queue"

export type TerrainLocationString = string;
export type TerrainLocation = [number, number];


export class Terrain {

	private meshGenerator: MeshGenerator;
	private meshMap: Map<TerrainLocationString, Mesh>;
	private todo: Queue<TerrainLocation>;
	private pending: Set<TerrainLocationString>;


	constructor(
		private renderDevice: GPUDevice
	) {

		this.meshMap = new Map<TerrainLocationString, Mesh>;
		this.todo = new Queue<TerrainLocation>();
		this.pending = new Set<TerrainLocationString>();
		this.meshGenerator = new MeshGenerator();

	}

	public async init(): Promise<void> {
		await this.meshGenerator.init();
	}


	public tick(position: [number, number, number]): void {
		const x: number = position[0];
		const z: number = position[2];

		const chunkCenterX = x - (x % Globals.CUBES_PER_CHUNK_H) + (Globals.CUBES_PER_CHUNK_H / 2);
		const chunkCenterZ = z - (z % Globals.CUBES_PER_CHUNK_H) + (Globals.CUBES_PER_CHUNK_H / 2);
		const delta = Math.ceil(Globals.RENDER_RADIOUS) * Globals.CUBES_PER_CHUNK_H;

		const startX: number = chunkCenterX - delta;
		const startZ: number = chunkCenterZ - delta;
		const endX: number = chunkCenterX + delta;
		const endZ: number = chunkCenterZ + delta;

		this.meshMap.forEach((value: Mesh, key: TerrainLocationString) => {
			const dx: number = value.getLocation()[0] - x;
			const dz: number = value.getLocation()[2] - z;
			const dist = Math.sqrt(dx * dx + dz * dz) / Globals.CUBES_PER_CHUNK_H;
			if (dist > Globals.RENDER_RADIOUS + Globals.UN_RENDER_DELTA) {
				this.meshMap.delete(key);
			}
		});

		for (var i = startX; i < endX; i += Globals.CUBES_PER_CHUNK_H) {
			for (var j = startZ; j < endZ; j += Globals.CUBES_PER_CHUNK_H) {
				const location: TerrainLocationString = [i, j].toString();
				if (this.pending.has(location) || this.meshMap.has(location)) continue;
				const dx: number = i - x;
				const dz: number = j - z;
				const dist = Math.sqrt(dx * dx + dz * dz) / Globals.CUBES_PER_CHUNK_H;
				if (dist <= Globals.RENDER_RADIOUS) {
					

					this.pending.add(location);
					this.todo.push([i,j]);
					
				}
			}
		}

		

		if (!this.meshGenerator.busy && !this.todo.empty()) {

			const [i, j] = this.todo.pop();
			const location: TerrainLocationString = [i, j].toString();
			this.meshGenerator.generateMesh([i, 0, j], [1, 1, 1], this.renderDevice).then((mesh: Mesh) => {
				this.meshMap.set(location, mesh);
				this.pending.delete(location);
			});
		}

	}

	public getMeshes(): IterableIterator<Mesh> {
		return this.meshMap.values();	
	}

}

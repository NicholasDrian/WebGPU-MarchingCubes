import { Mesh } from "./mesh"
import { Camera } from "./camera"
import { Terrain, TerrainLocation, TerrainLocationString } from "./terrain"
import { vec3 } from "wgpu-matrix"
import * as Globals from "./globalParameters"

export class Scene {

	private camera: Camera;
	private terrain: Terrain;

	constructor(
		private renderDevice: GPUDevice
	) {

		this.terrain = new Terrain(this.renderDevice);
		this.camera = new Camera(
			vec3.create(0.0, 0.0, -20.0),	//position
			vec3.create(0.0, 1.0, 0.0),	//up
			vec3.create(0.0, 0.0, 1.0),	//forward
			2,		//fovy
			<HTMLCanvasElement>document.getElementById("screen")
		);	
	}

	public async init(): Promise<void> {
		await this.terrain.init();
	}


	public getMeshes(): IterableIterator<Mesh> {
		return this.terrain.getMeshes();
	}

	public tick(): void {

		this.camera.tick();
		this.terrain.tick([this.camera.getPosition()[0], this.camera.getPosition()[1], this.camera.getPosition()[2]]);
		//todo use all vecN and no [number...]

		
	}

	public getCamera(): Camera {
		return this.camera;
	}

};

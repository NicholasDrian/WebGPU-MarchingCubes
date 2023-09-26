import { MeshGenerator } from "./compute";
import { Mesh } from "./mesh"
import { Camera } from "./camera";
import { vec3, Vec3 } from "wgpu-matrix"

export class Scene {

	private meshGenerator: MeshGenerator;
	private meshMap: Map<string, Mesh>; // from location to mesh
	private camera: Camera;

	constructor(
		private renderDevice: GPUDevice
	) {

		this.meshGenerator = new MeshGenerator();
		this.meshMap = new Map<string, Mesh>();
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
		const position = this.camera.getPosition();
		const x: number = position[0];
		const y: number = position[1];
		const z: number = position[2];
		
		this.meshMap.set("0,0", await this.meshGenerator.generateMesh([x, y, z], [1,1,1], this.renderDevice));
	}

	public getCamera(): Camera {
		return this.camera;
	}

};

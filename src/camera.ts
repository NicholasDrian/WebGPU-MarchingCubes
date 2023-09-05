import { mat4, Mat4 } from "wgpu-matrix"


export class Camera {
	constructor(
		private position: [number, number, number], 
		private up: [number, number, number], 
		private focus: [number, number, number], 
		private fovy: number,
		private aspect: number) {
	}

	getViewProj() : Float32Array {
		const view = new Float32Array(16);
		const proj = new Float32Array(16);
		const viewProj = new Float32Array(16);

		mat4.aim(this.position, this.focus, this.up, view);
		mat4.perspective(this.fovy, this.aspect, 0.1, 1000.0, proj);
		mat4.multiply(proj, view, viewProj);

		return viewProj;

	}
}



class Camera {
//delete up
	constructor(Position, Up, Focus, FOVY) {
		printVec3(Position);
		printVec3(Focus);
		printVec3(normalize(subVec3(Focus, Position)));
		this.position = Position;
		this.up = normalize(Up);
		this.forward = normalize(subVec3(Focus, Position));
		this.fovy = FOVY;
	}

	getViewProj() {

		const view = new  Float32Array(16);
		const proj = new Float32Array(16);
		const viewProj = new Float32Array(16);
		aim(this.position, sumVec3(this.position, this.forward), this.up, view);
		perspective(this.fovy, this.getAspect(), 0.1, 1000.0, proj);
		multiply$2(proj, view, viewProj);
		return viewProj;
	}	

	getAspect() {
		return canvas.clientWidth / canvas.clientHeight;
	} 

};

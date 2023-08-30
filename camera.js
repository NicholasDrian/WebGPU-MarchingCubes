

class Camera {

	constructor(Position, Up, Forward, FOVY) {
		this.position = Position;
		this.up = normalize(Up);
		this.forward = normalize(Forward);
		this.fovy = FOVY;
	}

	getViewProj() {
		var view = new Float32Array(16);
		var proj = new Float32Array(16);
		var projView = new Float32Array(16);
		mat4.lookAt(view, this.position, sumVec3(this.position, this.forward), this.up);
		mat4.perspective(proj, glMatrix.toRadian(this.fovy), this.getAspect(), 0.1, 1000.0);
		mat4.mul(projView, proj, view);
		return projView;
	}	

	getAspect() {
		return canvas.clientWidth / canvas.clientHeight;
	} 

};

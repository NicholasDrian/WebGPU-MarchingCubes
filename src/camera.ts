import { mat4 } from "wgpu-matrix"
import { normalize, sum, sub, size, scale } from "./math";
import { printMat4, printVec3 } from "./print"

export class Camera {

	private lastFrameTime: number;
	private forward: [number, number, number];
	private isTurningRight: boolean = false;
	private isTurningLeft: boolean = false;
	private isMovingForward: boolean = false;
	private isMovingBackward: boolean = false;
	private isLookingUp: boolean = false;
	private isLookingDown: boolean  = false;

	constructor(
		private position: [number, number, number], 
		private up: [number, number, number], 
		private focus: [number, number, number], 
		private fovy: number,
		private aspect: number) 
	{
		normalize(this.up);
		this.forward = normalize(sub(this.focus, this.position));
		this.lastFrameTime = performance.now(); 
		this.addEvents();

	}

	getViewProj() : Float32Array {
		const view = new Float32Array(16);
		const proj = new Float32Array(16);
		const viewProj = new Float32Array(16);

		mat4.aim(this.position, this.focus, this.up, view);
		mat4.perspective(this.fovy, this.aspect, 0.1, 1000.0, proj);
		mat4.multiply(proj, view, viewProj);

		//printMat4(viewProj);
		//printVec3(this.forward);
		printVec3(this.position);

		return viewProj;

	}

	addEvents() {

		document.addEventListener('keydown', (event) => {
	  		switch (event.code) {
  			case 'ArrowLeft':
  				this.isTurningLeft = true;
  				break;
  			case 'ArrowRight':
  				this.isTurningRight = true;
  				break;
  			case 'ArrowUp':
  				this.isLookingUp = true;
  				break;
  			case 'ArrowDown':
  				this.isLookingDown = true;
  				break;
  			case 'KeyW':
  				this.isMovingForward = true;
  				break;
  			case 'KeyS':
  				this.isMovingBackward = true;
  				break;
	  		}
  		}, false);

  		document.addEventListener('keyup', (event) => {
	  		switch (event.code) {
  			case 'ArrowLeft':
  				this.isTurningLeft = false;
  				break;
  			case 'ArrowRight':
  				this.isTurningRight = false;
  				break;
	  		case 'ArrowUp':
  				this.isLookingUp = false;
  				break;
  			case 'ArrowDown':
  				this.isLookingDown = false;
  				break;
  			case 'KeyW':
  				this.isMovingForward = false;
  				break;
  			case 'KeyS':
  				this.isMovingBackward = false;
  				break;
	  		}
  		}, false);

	}


	tick(): void {
		var now : number = performance.now();
		if (this.isTurningLeft) {
			console.log("left");
			this.turnRight((this.lastFrameTime - now) / 50);
		} else if (this.isTurningRight == true) {
			this.turnRight((now - this.lastFrameTime) / 50);
		}

		if (this.isLookingUp) {
			this.lookUp((now - this.lastFrameTime) / 50);
		} else if (this.isLookingDown) {
			
			this.lookUp((this.lastFrameTime - now) / 50);
		}

		if (this.isMovingForward) {
			this.goForward((now - this.lastFrameTime) / 50);
		} else if (this.isMovingBackward) {
			this.goForward((this.lastFrameTime - now) / 50);
		}

		this.lastFrameTime = now;
	}

	turnRight(amount: number): void {
		var sin = Math.sin(amount);
		var cos = Math.cos(amount);
		this.forward = [
			cos * this.forward[0] + -sin * this.forward[2],
			this.forward[1],
			sin * this.forward[0] + cos * this.forward[2]
		]
	}

	lookUp(amount: number): void{
		if (amount > 0 && this.forward[1] > 0.9) return;
		if (amount < 0 && this.forward[1] < -0.9) return;
		this.forward[1] += amount;
		normalize(this.forward);
	}

	goForward(amount: number): void {
		this.position = sum(this.position, scale(this.forward, amount));
		this.focus = sum(this.focus, scale(this.forward, amount));
	}
	
}

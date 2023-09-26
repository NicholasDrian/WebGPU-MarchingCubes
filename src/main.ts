import { Renderer } from "./renderer"
import { MeshGenerator } from "./compute"
import { Mesh } from "./mesh";
import { Scene } from "./scene";


const init = async function() {

	const renderer : Renderer = new Renderer();
	await renderer.init();
	

	const scene: Scene = new Scene(renderer.getDevice());
	await scene.init();

	while (true) {

		await scene.tick();
		await renderer.render(scene);
	}
}

init();

















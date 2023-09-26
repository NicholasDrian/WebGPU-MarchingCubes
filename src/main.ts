import { Renderer } from "./renderer"
import { Scene } from "./scene";


console.log("wtf");
const init = async function() {

	const renderer : Renderer = new Renderer();
	await renderer.init();
	
console.log(0);
	const scene: Scene = new Scene(renderer.getDevice());
	await scene.init();

	while (true) {

		await scene.tick();
		await renderer.render(scene);
	}
}

init();

















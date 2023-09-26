import { Renderer } from "./renderer"
import { MeshGenerator } from "./compute"
import { Mesh } from "./mesh";


const init = async function() {

	const renderer : Renderer = new Renderer();
	await renderer.init();
	
	const meshGenerator : MeshGenerator = new MeshGenerator();
	await meshGenerator.init();


	while (true) {

		const mesh: Mesh = await meshGenerator.generateMesh([0, 0, 0], [1, 1, 1], renderer.getDevice());
		await renderer.render(mesh);
	}
}

init();

















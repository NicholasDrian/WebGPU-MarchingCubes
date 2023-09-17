import { Renderer } from "./renderer"
import { MeshGenerator } from "./compute"



const init = async function() {
	
	const compute : MeshGenerator = new MeshGenerator();
	compute.init();

	const renderer : Renderer = new Renderer();
	renderer.init();

}

init();

















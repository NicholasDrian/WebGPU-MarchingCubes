import { Renderer } from "./renderer"
import { MeshGenerator } from "./compute"


const init = async function() {

/*	var str: string = '';
	for (var i : number = 0; i < TriangleTable.length; i++) {
		for (var j : number = 0; j < 12; j++) {
			if (TriangleTable[i].length <= j) str += '-1, ';
			else str += TriangleTable[i][j] + ', ';
		}
		str += '\n';
	}
	console.log(str);
	return;
*/
	const compute : MeshGenerator = new MeshGenerator();
	await compute.init();
	const sparseMeshArray: Float32Array = await compute.generateMesh();
	const renderer : Renderer = new Renderer(sparseMeshArray);
	renderer.init();

}

init();

















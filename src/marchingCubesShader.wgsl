@binding(0) @group(0) var<storage, read> points: array<vec4<f32>>;
@binding(1) @group(0) var<storage, read_write> sparseMesh: array<vec4<f32>>;


const THRESHOLD: f32 = 0.5; 

fn getPointIndex(x: u32, y: u32, z: u32, groupCount: vec3<u32>) -> u32 {
	return
		x +
		y * (groupCount.x + 1) +
		z * (groupCount.x + 1) * (groupCount.y + 1);
}


fn interp(edges: array<vec2<u32>, 12>, pointIndices: array<u32, 8>) -> array<vec4<f32>, 12> {
	var res : array<vec4<f32>, 12>;
	for (var i: u32 = 0; i < 12; i++) {
		var a: vec4<f32> = points[pointIndices[edges[i][0]]];
		var b: vec4<f32> = points[pointIndices[edges[i][1]]];
		var deltaS: f32 = b.w - a.w;
		var deltaT: f32 = THRESHOLD - a.w;
		res[i] = a + (b - a) * deltaT / deltaS;
		res[i].w = 1.0;
	}
	return res;
}

fn getBitMap() -> u32 {
	return 0;
}

@compute @workgroup_size(1, 1, 1)
fn main(@builtin(global_invocation_id) id: vec3<u32>, 
	@builtin(num_workgroups) groupCount : vec3<u32>) {

	var edges: array<vec2<u32>, 12>;
	edges[0] = vec2(0, 1);
        edges[1] = vec2(1, 3);
        edges[2] = vec2(3, 2);
        edges[3] = vec2(2, 0);
        edges[4] = vec2(4, 5);
        edges[5] = vec2(5, 7);
        edges[6] = vec2(7, 6);
        edges[7] = vec2(6, 4);
        edges[8] = vec2(0, 4);
        edges[9] = vec2(1, 5);
        edges[10] = vec2(3, 7);
        edges[11] = vec2(2, 6);

	var pointIndices : array<u32, 8>;
	pointIndices[0] = getPointIndex(id.x, id.y, id.z, groupCount); // TODO figure out how to pass by ref  
	pointIndices[1] = getPointIndex(id.x + 1, id.y, id.z, groupCount); 
	pointIndices[2] = getPointIndex(id.x, id.y + 1, id.z, groupCount); 
	pointIndices[3] = getPointIndex(id.x + 1, id.y + 1, id.z, groupCount); 
	pointIndices[4] = getPointIndex(id.x, id.y, id.z + 1, groupCount); 
	pointIndices[5] = getPointIndex(id.x + 1, id.y, id.z + 1, groupCount); 
	pointIndices[6] = getPointIndex(id.x, id.y + 1, id.z + 1, groupCount); 
	pointIndices[7] = getPointIndex(id.x + 1, id.y + 1, id.z + 1, groupCount); 

	var interpolations: array<vec4<f32>, 12> = interp(edges, pointIndices);

}








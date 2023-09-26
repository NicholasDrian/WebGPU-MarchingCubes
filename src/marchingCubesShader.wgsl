@binding(0) @group(0) var<storage, read> points: array<vec4<f32>>;
@binding(1) @group(0) var<storage, read> triangulationTable: array<i32>;
@binding(2) @group(0) var<storage, read_write> sparseMesh: array<vec4<f32>>;


const THRESHOLD: f32 = 0.5; 

fn getPointIndex(x: u32, y: u32, z: u32, groupCount: vec3<u32>) -> u32 {
	return
		x +
		y * (groupCount.x + 1) +
		z * (groupCount.x + 1) * (groupCount.y + 1);
}


fn interp(edges: array<vec2<u32>, 12>, pointsLocal: array<vec4<f32>, 8>) -> array<vec4<f32>, 12> {
	
	var res : array<vec4<f32>, 12>;
	for (var i: u32 = 0; i < 12; i++) {
		var a: vec4<f32> = pointsLocal[edges[i][0]];
		var b: vec4<f32> = pointsLocal[edges[i][1]];
		var deltaS: f32 = b.w - a.w;
		var deltaT: f32 = THRESHOLD - a.w;
		res[i] = a + (b - a) * (deltaT / deltaS);
		res[i].w = 1.0;
	}
	return res;
	
}

fn getBitMap(pointsLocal: array<vec4<f32>, 8>) -> u32 {
	var res: u32 = 0;
	for (var i : u32 = 0; i < 8; i++) {
		res >>= 1;
		if (pointsLocal[i].w > THRESHOLD) {
			res |= 1 << 7;
		}
	}
	return res;
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

	var pointsLocal : array<vec4<f32>, 8>;
	pointsLocal[0] = points[getPointIndex(id.x, id.y, id.z, groupCount)]; // TODO figure out how to pass by ref  
	pointsLocal[1] = points[getPointIndex(id.x + 1, id.y, id.z, groupCount)]; 
	pointsLocal[2] = points[getPointIndex(id.x, id.y + 1, id.z, groupCount)]; 
	pointsLocal[3] = points[getPointIndex(id.x + 1, id.y + 1, id.z, groupCount)]; 
	pointsLocal[4] = points[getPointIndex(id.x, id.y, id.z + 1, groupCount)]; 
	pointsLocal[5] = points[getPointIndex(id.x + 1, id.y, id.z + 1, groupCount)]; 
	pointsLocal[6] = points[getPointIndex(id.x, id.y + 1, id.z + 1, groupCount)]; 
	pointsLocal[7] = points[getPointIndex(id.x + 1, id.y + 1, id.z + 1, groupCount)]; 

	var interpolations: array<vec4<f32>, 12> = interp(edges, pointsLocal);
	var triangulationTableOffset: u32 = getBitMap(pointsLocal) * 12;
	var sparseMeshOffset = (id.x + id.y * groupCount.x + id.z * groupCount.x * groupCount.y) * 16;


	for (var i: u32 = 0; i < 4; i++) { // for each triangle
		if (triangulationTable[triangulationTableOffset + 3 * i] != -1) {
			var a : vec4<f32> = interpolations[triangulationTable[triangulationTableOffset + 3 * i]];
			var b : vec4<f32> = interpolations[triangulationTable[triangulationTableOffset + 3 * i + 1]];
			var c : vec4<f32> = interpolations[triangulationTable[triangulationTableOffset + 3 * i + 2]];
			sparseMesh[sparseMeshOffset + (4 * i)] = a;
			sparseMesh[sparseMeshOffset + (4 * i + 1)] = b;
			sparseMesh[sparseMeshOffset + (4 * i + 2)] = c;
			sparseMesh[sparseMeshOffset + (4 * i + 3)] = vec4(cross((b - a).xyz, (c - a).xyz), 1.0);
		} else {
			sparseMesh[sparseMeshOffset + (4 * i)] = vec4<f32>(0.0, 0.0, 0.0, 0.0);
		}

	}


}








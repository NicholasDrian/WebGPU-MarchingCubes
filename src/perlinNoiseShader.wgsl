@binding(0) @group(0) var<storage, read_write> points: array<vec4<f32>>;

fn hash(point: vec3<f32>) -> u32 {
	// TODO: use bitcast<T>
	var x : u32 = u32(point.x * 1323.0); 
	var y : u32 = u32(point.y * 14385.0); // needs improvement!	
	var z : u32 = u32(point.z * 115437.0);	
	// TODO: choose better magic values, should be coprime. 
	return x ^ y ^ z; 
}

fn random(seed: u32) -> f32 {
	return f32(seed % 10000) / 9999.0;	
}

fn lerp(a: f32, b: f32, alpha: f32) -> f32 {
	return a * alpha + b * (1.0 - alpha);
}

fn samplePerlin(point: vec4<f32>, scale: f32) -> f32 {

	var dx: f32 = point.x % scale;
	var dy: f32 = point.y % scale;
	var dz: f32 = point.z % scale;

	var xMin: f32 = point.x - dx;
	var yMin: f32 = point.y - dy;
	var zMin: f32 = point.z - dz;

	var xMax: f32 = point.x + scale - dx;
	var yMax: f32 = point.y + scale - dy;
	var zMax: f32 = point.z + scale - dz;
	
	var lll: f32 = random(hash(vec3<f32>(xMin, yMin, zMin)));
	var llh: f32 = random(hash(vec3<f32>(xMin, yMin, zMax)));
	var lhl: f32 = random(hash(vec3<f32>(xMin, yMax, zMin)));
	var lhh: f32 = random(hash(vec3<f32>(xMin, yMax, zMax)));
	var hll: f32 = random(hash(vec3<f32>(xMax, yMin, zMin)));
	var hlh: f32 = random(hash(vec3<f32>(xMax, yMin, zMax)));
	var hhl: f32 = random(hash(vec3<f32>(xMax, yMax, zMin)));
	var hhh: f32 = random(hash(vec3<f32>(xMax, yMax, zMax)));

	var dxNorm = dx / scale;
	var dyNorm = dy / scale;
	var dzNorm = dz / scale;

	var ll : f32 =  lerp(lll, llh, dzNorm);	
	var lh : f32 =  lerp(lhl, lhh, dzNorm);	
	var hl : f32 =  lerp(hll, hlh, dzNorm);	
	var hh : f32 =  lerp(hhl, hhh, dzNorm);	

	var l : f32 = lerp(ll, lh, dyNorm);
	var h : f32 = lerp(hl, hh, dyNorm);

	return lerp(l, h, dxNorm);

	// TODO: hashing is doing 4x redundant work because 4 points share same x... etc
	// TODO: also, could use vector operations for a lot of this.

}

fn sample(point : vec4<f32>) -> f32 {

	var res: f32 = 0.0;
	res += samplePerlin(point, 100.0) * 0.3;
	res += samplePerlin(point, 10.0) * 0.4;
	res += samplePerlin(point, 1.0) * 0.3;
	return res;
	
}

@compute @workgroup_size(1, 1, 1)
fn main(
	@builtin(global_invocation_id) grid: vec3<u32>,
	@builtin(num_workgroups) groupCount: vec3<u32>
	) {
	
	var idx: u32 = grid.x + grid.y * groupCount.x + grid.z * groupCount.x * groupCount.y;
	var point: vec4<f32> = vec4<f32>(f32(grid[0]), f32(grid[1]), f32(grid[2]), 1.0);
	point.w = sample(point);
	points[idx] = point;

}

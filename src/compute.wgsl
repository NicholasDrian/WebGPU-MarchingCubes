
@binding(0) @group(0) var<storage, read_write> output: array<f32>;
@binding(1) @group(0) var<storage, read> sampleDimensions: vec3<u32>;
//override blockSize = 1;

@compute @workgroup_size(1, 1, 1)
fn main(@builtin(global_invocation_id) grid: vec3<u32>) {
	
	var idx: u32 = grid.x + grid.y * sampleDimensions.x + grid.z * sampleDimensions.x * sampleDimensions.y;
	output[idx] = 69.0;

}

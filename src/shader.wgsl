
struct VertexOutput {
	@builtin(position) position : vec4<f32>,
	@location(0) color : vec4<f32>
}

@group(0) @binding(0) var<uniform> viewProj : mat4x4<f32>;

@vertex
fn vertexMain(
	@location(0) position : vec4<f32>,
	@location(1) color : vec4<f32>
	) -> VertexOutput 
{
	var output: VertexOutput;
	output.color = color;
	output.position = viewProj * position;
	return output;
}

@fragment
fn fragmentMain(@location(0) color : vec4f) -> @location(0) vec4f {
	return vec4<f32>(
		abs(color[0]),
		abs(color[1]),
		abs(color[2]),
		1.0
	);
}




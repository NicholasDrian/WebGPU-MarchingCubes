

const shader = `


struct VertexOutput {
	@builtin(position) position : vec4<f32>,
	@location(0) color: vec4<f32>
}



@group(0) @binding(0) var<uniform> ViewProj : mat4x4<f32>;

@vertex
fn vertexMain(
		@location(0) position : vec4f, 
		@location(1) color : vec4f) 
		-> VertexOutput {
	var pos: vec4f = position;
	pos = ViewProj * pos;
	//pos.z = pos.z / 2.0 + 0.5;
	//pos = (pos + vec4f(1.0, 1.0, 1.0, 1.0)) * 0.5;
	var output : VertexOutput;
	output.position = pos;
	output.color = color;
	return output;
}

@fragment
fn fragmentMain(@location(0) color : vec4f) -> @location(0) vec4f {
	return color;
}


`

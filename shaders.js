

const shader = `

group(0) binding(0) var<uniform> ViewProj : mat4x4<f32>;

@vertex
fn vertexMain(@location(0) position : vec2f) -> @builtin(position) vec4f {
	return vec4f(position, 0, 1);
}

@fragment
fn fragmentMain() -> @location(0) vec4f {
	return vec4f(1, 0, 0, 1);
}

`

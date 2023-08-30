const canvas = document.getElementById("screen");
const vertices = new Float32Array([
	-0.8, 0.8,
	0.8, 0.8,
	0.8, -0.8,
	-0.8, -0.8,
]);

const indices = new Uint32Array([
	0, 1, 2,
	2, 3, 0,
]);

var Init = async function() {

	const camera = new Camera(
		[0, -1, 0.5],	//position
		[0, 1, -0.5],	//forward
		[0, 0, 1],	//up
		60		//fovy
	);

	if (!navigator.gpu) {
		throw new Error("ERROR: this browser does not support web gpu");
	}

	const adapter = await navigator.gpu.requestAdapter();
	if (!adapter) {
		throw new Error("ERROR: no appropriate gpu addapter found");
	}

	const device = await adapter.requestDevice();
	const context = canvas.getContext("webgpu");
	const canvasFormat = navigator.gpu.getPreferredCanvasFormat();
	context.configure({
		device: device,
		format: canvasFormat,
	});

	const vertexBuffer = device.createBuffer({
		label: "verts",
		size: vertices.byteLength,
		usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
	});
	device.queue.writeBuffer(vertexBuffer, 0, vertices);
	const vertexBufferLayout = {
		arrayStride: 8,
		attributes: [
			{
				format: "float32x2",
				offset: 0,
				shaderLocation: 0,
			}
		]
	}

	const indexBuffer = device.createBuffer({
		label: "indices",
		size: indices.byteLength,
		usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
	});
	device.queue.writeBuffer(indexBuffer, 0, indices);

	const shaderModule = device.createShaderModule({
		label: "shader",
		code: shader,
	});

	const bindGroupLayout = device.createBindGroupLayout({
		label: "bind group layout",
		entries: [
			{
				binding: 0,
				visibility: GPUShaderStage.VERTEX,
				buffer: {}
			}
		]
	});

	const viewProj = camera.getViewProj();
	const viewProjBuffer = device.createBuffer({
		label: "view proj buffer",
		size: viewProj.byteLength,
		usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
	});
	device.queue.writeBuffer(viewProjBuffer, 0, viewProj);
	
	const bindGroup = device.createBindGroup({
		label: "bind group",
		layout: bindGroupLayout,
		entries: [
			{
				binding: 0,
				resource: { buffer: viewProjBuffer }
			}
		]
	});

	const pipelineLayout = device.createPipelineLayout({
		label: "pipeline layout",
		bindGroupLayouts: [bindGroupLayout]
	});

	const pipeline = device.createRenderPipeline({
		label: "pipeline",
		layout: pipelineLayout, 
		vertex: {
			module: shaderModule,
			entryPoint: "vertexMain",
			buffers: [vertexBufferLayout]
		},
		fragment: {
			module: shaderModule,
			entryPoint: "fragmentMain",
			targets: [
				{
					format: canvasFormat
				}
			]
		}
	});

	const encoder = device.createCommandEncoder();
	const pass = encoder.beginRenderPass({
		colorAttachments: [
			{
				view: context.getCurrentTexture().createView(),
				loadOp: "clear",
				clearValue: [0,0,0.4,1],
				storeOp: "store",
			}
		],
	});
	pass.setPipeline(pipeline);
	pass.setBindGroup(0, bindGroup);
	pass.setVertexBuffer(0, vertexBuffer);
	pass.setIndexBuffer(indexBuffer, "uint32");
	pass.drawIndexed(indices.length);

	pass.end();
	const commandBuffer = encoder.finish();
	device.queue.submit([commandBuffer]);
	

}

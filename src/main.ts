import shader from "./shader.wgsl";
import { debugCubeVerts } from "./debugCube";
import { Camera } from "./camera";
import { Vec3, vec3 } from "wgpu-matrix";


const compatibilityCheck : HTMLElement = <HTMLElement> document.getElementById("compatibility-check");


const init = async function() {

	if (!navigator.gpu) {
		compatibilityCheck.innerText = "This browser does not support web gpu";
		return;
	} 
	const adapter = await navigator.gpu.requestAdapter();
	if (!adapter) {
		compatibilityCheck.innerText = "No valid gpu adapter";
		return;
	}
	const device : GPUDevice = <GPUDevice> await adapter.requestDevice();
	const canvas : HTMLCanvasElement = <HTMLCanvasElement> document.getElementById("screen");
	const context : GPUCanvasContext = <GPUCanvasContext> canvas.getContext("webgpu");
	
	const canvasFormat : GPUTextureFormat = navigator.gpu.getPreferredCanvasFormat();
	context.configure({
		device: device,
		format: canvasFormat,
	});

	const camera : Camera = new Camera(
		vec3.create(0.0, 0.0, -4.0),	//position
		vec3.create(0.0, 1.0, 0.0),	//up
		vec3.create(0.0, 0.0, 1.0),	//forward
		2,		//fovy
		canvas.clientWidth / canvas.clientHeight //aspect
	);	
	const vertexBuffer = device.createBuffer({
		label: "vertex buffer",
		size: debugCubeVerts.byteLength,
		usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
	});
	device.queue.writeBuffer(vertexBuffer, 0, debugCubeVerts);
	const vertexBufferLayout : GPUVertexBufferLayout = {
		arrayStride: 32,
		attributes: [
			{
				format: "float32x4",
				offset: 0,
				shaderLocation : 0,
			}, {
				format: "float32x4",
				offset: 16,
				shaderLocation: 1,
			}
		]
	};

	const shaderModule : GPUShaderModule = device.createShaderModule({
		label: "shader module",
		code: shader,
	});
	
	const bindGroupLayout : GPUBindGroupLayout = device.createBindGroupLayout({
		label: "bind group layout",
		entries: [
			{
				binding: 0,
				visibility: GPUShaderStage.VERTEX,
				buffer: {}
			}
		]
	});
	
	const viewProj : Float32Array = camera.getViewProj();
	const viewProjBuffer : GPUBuffer = device.createBuffer({
		label: "view proj buffer",
		size: viewProj.byteLength,
		usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
	});
	device.queue.writeBuffer(viewProjBuffer, 0, viewProj);

	const bindGroup : GPUBindGroup = device.createBindGroup({
		label: "bind group",
		layout: bindGroupLayout,
		entries: [
			{
				binding: 0,
				resource: { buffer: viewProjBuffer },
			}
		]
	});

	const pipelineLayout : GPUPipelineLayout = device.createPipelineLayout({
		label: "pipeline layout",
		bindGroupLayouts: [bindGroupLayout],
	});

	const pipeline : GPURenderPipeline = device.createRenderPipeline({
		label: "pipeline",
		primitive: {
			topology: "triangle-list",
			cullMode: "back"
		},
		layout: pipelineLayout,
		depthStencil: {
			depthWriteEnabled: true,
			depthCompare: "less",
			format: "depth24plus"
		},
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

	const depthTexture : GPUTexture = device.createTexture({
		size: [canvas.width, canvas.height],
		format: "depth24plus",
		usage: GPUTextureUsage.RENDER_ATTACHMENT
	});

	function frame() {
	
		camera.tick();
		device.queue.writeBuffer(viewProjBuffer, 0, camera.getViewProj());


		const encoder: GPUCommandEncoder = device.createCommandEncoder();
		const pass: GPURenderPassEncoder = encoder.beginRenderPass({
			colorAttachments: [
				{
					view: context.getCurrentTexture().createView(),
					loadOp: "clear",
					clearValue: [0,0,0.4,1],
					storeOp: "store",
				},
			],
			depthStencilAttachment: {
				view: depthTexture.createView(),
				depthClearValue: 1.0,
				depthLoadOp: "clear",
				depthStoreOp: "store"
			}
		});

		pass.setPipeline(pipeline);
		pass.setBindGroup(0, bindGroup);
		pass.setVertexBuffer(0, vertexBuffer);
		pass.draw(debugCubeVerts.length / 8);
		pass.end();
		const commandBuffer = encoder.finish();
		device.queue.submit([commandBuffer]);

		requestAnimationFrame(frame);
	}

	requestAnimationFrame(frame);
}

init();
















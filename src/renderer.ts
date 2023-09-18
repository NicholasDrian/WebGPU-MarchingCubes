
import shader from "./shader.wgsl";
import { debugCubeVerts } from "./debugCube";
import { Camera } from "./camera";
import { vec3 } from "wgpu-matrix";
import { Mesh } from "./mesh"

const compatibilityCheck : HTMLElement = <HTMLElement> document.getElementById("compatibility-check");

export class Renderer {

	private device!: GPUDevice;
	private context!: GPUCanvasContext;
	private canvas!: HTMLCanvasElement;
	private canvasFormat!: GPUTextureFormat;
	private shaderModule!: GPUShaderModule;
	private camera!: Camera;
	private viewProjBuffer!: GPUBuffer;
	private pipeline!: GPURenderPipeline;
	private depthTexture!: GPUTexture;
	private bindGroup!: GPUBindGroup;
	private bindGroupLayout!: GPUBindGroupLayout;
	private mesh!: Mesh;

	constructor() {

	}

	async init() {

		await this.createDevice();
		this.createResources();	
		this.createPipeline();
		this.render();
	}

	private async createDevice() {

		if (!navigator.gpu) {
			compatibilityCheck.innerText = "This browser does not support web gpu";
			return;
		} 
		const adapter = await navigator.gpu.requestAdapter();
		if (!adapter) {
			compatibilityCheck.innerText = "No valid gpu adapter";
			return;
		}
		this.device = <GPUDevice> await adapter.requestDevice();
		this.canvas = <HTMLCanvasElement> document.getElementById("screen");
		this.context = <GPUCanvasContext> this.canvas.getContext("webgpu");

		this.canvasFormat = navigator.gpu.getPreferredCanvasFormat();
		this.context.configure({
			device: this.device,
			format: this.canvasFormat
		});

	}

	private createResources() {

		this.camera = new Camera
			vec3.create(0.0, 0.0, -4.0),	//position
			vec3.create(0.0, 1.0, 0.0),	//up
			vec3.create(0.0, 0.0, 1.0),	//forward
			2,		//fovy
			this.canvas.clientWidth / this.canvas.clientHeight //aspect
		);	
		
		this.mesh = new Mesh(this.device, 
			new Float32Array([
				-1.0, -1.0, 0.0, 1.0,   1.0, 1.0, 1.0, 1.0,				
				-1.0, 1.0, 0.0, 1.0,   0.0, 0.0, 1.0, 1.0,				
				1.0, 1.0, 0.0, 1.0,   0.0, 1.0, 0.0, 1.0,				
				1.0, -1.0, 0.0, 1.0,   1.0, 0.0, 0.0, 1.0,				
			]),
			new Int32Array([
				0, 1, 2,
				2, 3, 0,
			])
		);

		this.shaderModule = this.device.createShaderModule({
			label: "shader module",
			code: shader,
		});

		this.bindGroupLayout = this.device.createBindGroupLayout({
			label: "bind group layout",
			entries: [
				{
					binding: 0,
					visibility: GPUShaderStage.VERTEX,
					buffer: {}
				}
			]
		});

		const viewProj : Float32Array = this.camera.getViewProj();
		this.viewProjBuffer = this.device.createBuffer({
			label: "view proj buffer",
			size: viewProj.byteLength,
			usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
		});
		this.device.queue.writeBuffer(this.viewProjBuffer, 0, viewProj);

		this.bindGroup = this.device.createBindGroup({
			label: "bind group",
			layout: this.bindGroupLayout,
			entries: [
				{
					binding: 0,
				resource: { buffer: this.viewProjBuffer },
				}
			]
		});
		this.depthTexture = this.device.createTexture({
			size: [this.canvas.width, this.canvas.height],
			format: "depth24plus",
			usage: GPUTextureUsage.RENDER_ATTACHMENT
		});

	}

	private createPipeline() {

		const pipelineLayout : GPUPipelineLayout = this.device.createPipelineLayout({
			label: "pipeline layout",
			bindGroupLayouts: [this.bindGroupLayout],
		});

		this.pipeline = this.device.createRenderPipeline({
			label: "pipeline",
			primitive: {
				topology: "triangle-list",
				cullMode: "none"
			},
			layout: pipelineLayout,
			depthStencil: {
				depthWriteEnabled: true,
				depthCompare: "less",
				format: "depth24plus"
			},
			vertex: {
				module: this.shaderModule,
				entryPoint: "vertexMain",
				buffers: [this.mesh.getVertexBufferLayout()]
			},
			fragment: {
				module: this.shaderModule,
				entryPoint: "fragmentMain",
				targets: [
					{
						format: this.canvasFormat
					}
				]
			}
		});

	}

	private render() {
	
		this.camera.tick();
		this.device.queue.writeBuffer(this.viewProjBuffer, 0, this.camera.getViewProj());

		const encoder: GPUCommandEncoder = this.device.createCommandEncoder();
		const pass: GPURenderPassEncoder = encoder.beginRenderPass({
			colorAttachments: [
				{
					view: this.context.getCurrentTexture().createView(),
					loadOp: "clear",
					clearValue: [0,0,0.4,1],
					storeOp: "store",
				},
			],
			depthStencilAttachment: {
				view: this.depthTexture.createView(),
				depthClearValue: 1.0,
				depthLoadOp: "clear",
				depthStoreOp: "store"
			}
		});

		pass.setPipeline(this.pipeline);
		pass.setBindGroup(0, this.bindGroup);
		pass.setVertexBuffer(0, this.mesh.getVertexBuffer());
		pass.setIndexBuffer(this.mesh.getIndexBuffer(), "uint32");
		pass.drawIndexed(this.mesh.getIndexCount());
		pass.end();
		const commandBuffer = encoder.finish();
		this.device.queue.submit([commandBuffer]);
		this.device.queue.onSubmittedWorkDone().then(() => {this.render();});
	}

}














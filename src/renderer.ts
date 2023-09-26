
import shader from "./shader.wgsl";
import { Mesh } from "./mesh"
import { Scene } from "./scene"

const compatibilityCheck : HTMLElement = <HTMLElement> document.getElementById("compatibility-check");

export class Renderer {

	private device!: GPUDevice;
	private context!: GPUCanvasContext;
	private canvas!: HTMLCanvasElement;
	private canvasFormat!: GPUTextureFormat;
	private shaderModule!: GPUShaderModule;
	private viewProjBuffer!: GPUBuffer;
	private pipeline!: GPURenderPipeline;
	private depthTexture!: GPUTexture;
	private bindGroup!: GPUBindGroup;
	private bindGroupLayout!: GPUBindGroupLayout;

	constructor() {
	}

	public getDevice() {
		return this.device;
	}

	async init() {

		await this.createDevice();
		this.createResources();	
		this.createPipeline();
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

		this.viewProjBuffer = this.device.createBuffer({
			label: "view proj buffer",
			size: 64,
			usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
		});

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
				buffers: [Mesh.getVertexBufferLayout()]
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

	async render(scene: Scene) {
		// TODO: hoise some stuff out of loop	
		this.device.queue.writeBuffer(this.viewProjBuffer, 0, scene.getCamera().getViewProj());

		const encoder: GPUCommandEncoder = this.device.createCommandEncoder();
		const pass: GPURenderPassEncoder = encoder.beginRenderPass({
			colorAttachments: [
				{
					view: this.context.getCurrentTexture().createView(),
					loadOp: "clear",
					clearValue: [0.7,0.8,1,1],
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

		for (let mesh of scene.getMeshes()) {

			pass.setVertexBuffer(0, mesh.getVertexBuffer());
			pass.setIndexBuffer(mesh.getIndexBuffer(), "uint32");
			pass.drawIndexed(mesh.getIndexCount());
		};


		pass.end();
		const commandBuffer = encoder.finish();
		this.device.queue.submit([commandBuffer]);

		await this.device.queue.onSubmittedWorkDone();

	}

}














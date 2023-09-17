
import shader from "./compute.wgsl";

const xSamples: number = 16;
const ySamples: number = 16;
const zSamples: number = 64;


export class MeshGenerator {

	
	private device!: GPUDevice;
	private shader!: GPUShaderModule;
	private bindGroupLayout!: GPUBindGroupLayout;
	private bindGroup!: GPUBindGroup;
	private sampleBuffer!: GPUBuffer;
	private dimensionsBuffer!: GPUBuffer;
	private sparseMeshBuffer!: GPUBuffer;
	private computePipeline!: GPUComputePipeline;

	constructor() {

	}

	async init() {
		await this.setupDevice();
		this.createResources();
		this.createPipeline();
		this.generateMesh();
	}

	private async setupDevice() {
		const adapter = await navigator.gpu.requestAdapter();
		this.device = <GPUDevice> await adapter?.requestDevice();
	}

	private createResources() {
		this.shader = this.device.createShaderModule({
			label: "compute shader module",
			code: shader, 
		});
		this.bindGroupLayout = this.device.createBindGroupLayout({
			entries: [
				{
					binding: 0,
					visibility: GPUShaderStage.COMPUTE,
					buffer: { type: "storage" }
				},
				{
					binding: 1,
					visibility: GPUShaderStage.COMPUTE,
					buffer: { type: "read-only-storage" }
				}
			]
		});
		this.sampleBuffer = this.device.createBuffer({
			label: "sample buffer",
			size: xSamples * ySamples * zSamples * 4,
			usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC,
		});
		this.dimensionsBuffer = this.device.createBuffer({
			label: "sample dimensions buffer",
			size: 3 * 4,
			usage: GPUBufferUsage.STORAGE, // should probably make this uniform???
			mappedAtCreation: true,
		});
		new Uint32Array(this.dimensionsBuffer.getMappedRange()).set([xSamples, ySamples, zSamples]);
		this.dimensionsBuffer.unmap();

		this.bindGroup = this.device.createBindGroup({
			label: "compute bind group",
			layout: this.bindGroupLayout,
			entries: [
				{ 
					binding: 0,
					resource: { buffer: this.sampleBuffer },
				},
				{
					binding: 1,
					resource: { buffer: this.dimensionsBuffer },
				}
			]
		});


	}

	private createPipeline() {

		const computePipelineLayout = this.device.createPipelineLayout({
			bindGroupLayouts: [this.bindGroupLayout],
		});
		this.computePipeline = this.device.createComputePipeline({ // probably want to change this to async...
			label: "compute pipeline",
			layout: computePipelineLayout,
			compute: {
				module: this.shader,
				entryPoint: "main",
				constants: {
				//	blockSize: 1,
				}
			}
		});
	}

	generateMesh() : void {



		const debugBuffer = this.device.createBuffer({
			label: "debug buffer",
			size: xSamples * ySamples * zSamples * 4,
			usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ,
		});


		const encoder = this.device.createCommandEncoder();

		const computePass = encoder.beginComputePass();
		computePass.setPipeline(this.computePipeline);
		computePass.setBindGroup(0, this.bindGroup);
		computePass.dispatchWorkgroups(xSamples, ySamples, zSamples);
		computePass.end();

		encoder.copyBufferToBuffer(this.sampleBuffer, 0, debugBuffer, 0, xSamples * ySamples * zSamples * 4);

		this.device.queue.submit([encoder.finish()]);


		// success!!!!!
		this.device.queue.onSubmittedWorkDone().then(() => {
			debugBuffer.mapAsync(GPUMapMode.READ).then(() => { 
				const res: Float32Array = new Float32Array(debugBuffer.getMappedRange());
				for (var i = 0; i < res.length; i++) {
					console.log(res[i]);
				}
			});
		});

		console.log("mesh generated!");
	}



}

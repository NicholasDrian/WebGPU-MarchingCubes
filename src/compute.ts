
import perlinNoiseShader from "./perlinNoiseShader.wgsl";
import marchingCubesShader from "./marchingCubesShader.wgsl"

const xSamples: number = 16;
const ySamples: number = 16;
const zSamples: number = 64;


export class MeshGenerator {

	
	private device!: GPUDevice;
	private perlinNoiseShader!: GPUShaderModule;
	private marchingCubesShader!: GPUShaderModule;
	private perlinNoiseBindGroupLayout!: GPUBindGroupLayout;
	private perlinNoiseBindGroup!: GPUBindGroup;
	private marchingCubesBindGroupLayout!: GPUBindGroupLayout;
	private marchingCubesBindGroup!: GPUBindGroup;
	private sampleBuffer!: GPUBuffer;
	private dimensionsBuffer!: GPUBuffer;
	private sparseMeshBuffer!: GPUBuffer;
	private perlinNoisePipeline!: GPUComputePipeline;
	private marchingCubesPipeline!: GPUComputePipeline;

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
		this.perlinNoiseShader = this.device.createShaderModule({
			label: "perlin noise shader",
			code: perlinNoiseShader, 
		});
		this.marchingCubesShader = this.device.createShaderModule({
			label: "marching cubes shader",
			code: marchingCubesShader,
		});
		this.perlinNoiseBindGroupLayout = this.device.createBindGroupLayout({
			label: "perlin noise bind group layout",
			entries: [
				{
					binding: 0, // perlin noise sample buffer
					visibility: GPUShaderStage.COMPUTE,
					buffer: { type: "storage" }
				},
				{
					binding: 1, // uniform parameters
					visibility: GPUShaderStage.COMPUTE,
					buffer: { type: "read-only-storage" } // TODO: change to uniform
				}
			]
		});

		this.marchingCubesBindGroupLayout = this.device.createBindGroupLayout({
			label: "marching cubes bind group layout",
			entries: [
				{
					binding: 0, // perlin noise sample buffer
					visibility: GPUShaderStage.COMPUTE,
					buffer: { type: "read-only-storage" }
				},
				{
					binding: 1, // sparse mesh buffer
					visibility: GPUShaderStage.COMPUTE,
					buffer: { type: "storage" }
				}
			]
		});
		
		this.sampleBuffer = this.device.createBuffer({
			label: "sample buffer",
			size: xSamples * ySamples * zSamples * 4,
			usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC, // COPY_SRC is just for debug
		});
		this.sparseMeshBuffer = this.device.createBuffer({
			label: "sparse mesh buffer",
			size: (xSamples - 1) * (ySamples - 1) * (zSamples - 1) * 6 * 3 * 4,
			usage: GPUBufferUsage.STORAGE
		});
		this.dimensionsBuffer = this.device.createBuffer({
			label: "sample dimensions buffer",
			size: 3 * 4,
			usage: GPUBufferUsage.STORAGE, // should probably make this uniform???
			mappedAtCreation: true,
		});
		new Uint32Array(this.dimensionsBuffer.getMappedRange()).set([xSamples, ySamples, zSamples]);
		this.dimensionsBuffer.unmap();

		this.perlinNoiseBindGroup = this.device.createBindGroup({
			label: "compute bind group",
			layout: this.perlinNoiseBindGroupLayout,
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

		this.marchingCubesBindGroup = this.device.createBindGroup({
			label: "marching cubes bind group",
			layout: this.marchingCubesBindGroupLayout,
			entries: [
				{
					binding: 0,
					resource: { buffer: this.sampleBuffer }
				}, {
					binding: 1,
					resource: { buffer: this.sparseMeshBuffer }
				}
			]
		});


	}

	private createPipeline() {

		const perlinNoisePipelineLayout = this.device.createPipelineLayout({
			bindGroupLayouts: [this.perlinNoiseBindGroupLayout],
		});
		const marchingCubesPipelineLayout = this.device.createPipelineLayout({
			bindGroupLayouts: [this.marchingCubesBindGroupLayout],
		});
		this.perlinNoisePipeline = this.device.createComputePipeline({ // probably want to change this to async...
			label: "perlin noise pipeline",
			layout: perlinNoisePipelineLayout,
			compute: {
				module: this.perlinNoiseShader,
				entryPoint: "main",
				constants: {
				//	blockSize: 1,
				}
			}
		});
		this.marchingCubesPipeline = this.device.createComputePipeline({
			label: "marching cubes pipeline",
			layout: marchingCubesPipelineLayout,
			compute: {
				module: this.marchingCubesShader,
				entryPoint: "main",
				constants: {
					// TODO
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
		computePass.setPipeline(this.perlinNoisePipeline);
		computePass.setBindGroup(0, this.perlinNoiseBindGroup);
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

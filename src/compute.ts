
import perlinNoiseShader from "./perlinNoiseShader.wgsl";
import marchingCubesShader from "./marchingCubesShader.wgsl"
import { triangulationTable } from "./data"
import { time } from "console";

const xSamples: number = 64;
const ySamples: number = 64;
const zSamples: number = 64;


export class MeshGenerator {

	
	private device!: GPUDevice;
	private perlinNoiseShader!: GPUShaderModule;
	private marchingCubesShader!: GPUShaderModule;
	private perlinNoiseBindGroupLayout!: GPUBindGroupLayout;
	private perlinNoiseBindGroup!: GPUBindGroup;
	private marchingCubesBindGroupLayout!: GPUBindGroupLayout;
	private marchingCubesBindGroup!: GPUBindGroup;

	private pointBuffer!: GPUBuffer;
	private sparseMeshBuffer!: GPUBuffer;
	private outputBuffer!: GPUBuffer;
	private triangulationBuffer!: GPUBuffer;
	private perlinNoiseUniformBuffer!: GPUBuffer;

	private perlinNoisePipeline!: GPUComputePipeline;
	private marchingCubesPipeline!: GPUComputePipeline;

	constructor() {

	}

	async init() {
		await this.setupDevice();
		this.createResources();
		this.createPipeline();
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
					buffer: { type: "storage" },
				}, {
					binding: 1,
					visibility: GPUShaderStage.COMPUTE,
					buffer: { type: "uniform" }
				}
			]
		});

		this.marchingCubesBindGroupLayout = this.device.createBindGroupLayout({
			label: "marching cubes bind group layout",
			entries: [
				{
					binding: 0, // perlin noise grid points
					visibility: GPUShaderStage.COMPUTE,
					buffer: { type: "read-only-storage" }
				},{
					binding: 1, // triangulation 
					visibility: GPUShaderStage.COMPUTE,
					buffer: { type: "read-only-storage" }
				},{
					binding: 2, // sparse mesh buffer
					visibility: GPUShaderStage.COMPUTE,
					buffer: { type: "storage" }
				}
			]
		});
		this.pointBuffer = this.device.createBuffer({
			label: "point buffer",
			size: xSamples * ySamples * zSamples * 4 * 4,
			usage: GPUBufferUsage.STORAGE 
		});
		this.perlinNoiseUniformBuffer = this.device.createBuffer({
			label: "perlin noise unifrom buffer",
			size: 16 * 2, // two vec4<f32>
			usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST, // could use buffer copy for speeeeed
		});
		this.sparseMeshBuffer = this.device.createBuffer({
			label: "sparse mesh buffer",
			size: (xSamples - 1) * (ySamples - 1) * (zSamples - 1) * 16 * 4 * 4,
			usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC,
		});
		this.triangulationBuffer = this.device.createBuffer({
			label: "triangulation buffer",
			size: 256 * 12 * 4,
			usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
		});
		this.outputBuffer = this.device.createBuffer({
			label: "debug buffer",
			size: (xSamples - 1) * (ySamples - 1) * (zSamples - 1) * 16 * 4 * 4,
			usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ,
		});
		this.device.queue.writeBuffer(this.triangulationBuffer, 0, triangulationTable, 0, triangulationTable.length);
		
		this.perlinNoiseBindGroup = this.device.createBindGroup({
			label: "compute bind group",
			layout: this.perlinNoiseBindGroupLayout,
			entries: [
				{
					binding: 0, 
					resource: { buffer: this.pointBuffer },
				},{
					binding: 1,
					resource: { buffer: this.perlinNoiseUniformBuffer },
				}
			]
		});

		this.marchingCubesBindGroup = this.device.createBindGroup({
			label: "marching cubes bind group",
			layout: this.marchingCubesBindGroupLayout,
			entries: [
				{
					binding: 0, 
					resource: { buffer: this.pointBuffer },
				},{
					binding: 1,
					resource: { buffer: this.triangulationBuffer }
				},{
					binding: 2,
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

	public async generateMesh(center: [number, number, number] = [0,0,0], cubeSize: [number, number, number] = [1,1,1]) : Promise<Float32Array> {

		const startTime = Date.now();

		this.device.queue.writeBuffer(this.perlinNoiseUniformBuffer, 0, new Float32Array([...center, 0, ...cubeSize, 0]));

		const encoder = this.device.createCommandEncoder();
		const computePass = encoder.beginComputePass();

		computePass.setPipeline(this.perlinNoisePipeline);
		computePass.setBindGroup(0, this.perlinNoiseBindGroup);
		computePass.dispatchWorkgroups(xSamples, ySamples, zSamples);

		computePass.setPipeline(this.marchingCubesPipeline);
		computePass.setBindGroup(0, this.marchingCubesBindGroup);
		computePass.dispatchWorkgroups(xSamples - 1, ySamples - 1, zSamples - 1);

		computePass.end();

		encoder.copyBufferToBuffer(this.sparseMeshBuffer, 0, this.outputBuffer, 0, (xSamples - 1) * (ySamples - 1) * (zSamples - 1) * 16 * 4 * 4);

		this.device.queue.submit([encoder.finish()]);


		await this.device.queue.onSubmittedWorkDone();
		const res: Float32Array = await this.outputBuffer.mapAsync(GPUMapMode.READ).then(() => {
			return new Float32Array(this.outputBuffer.getMappedRange());
		});

		console.log("Sparse mesh generated in", Date.now() - startTime, "miliseconds.");

		return res;
	}



}

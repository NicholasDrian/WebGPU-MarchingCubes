

export class Mesh {
	
	private vertexBuffer! : GPUBuffer;
	private vertexBufferLayout! : GPUVertexBufferLayout;
	private indexBuffer! : GPUBuffer; // todo remove question marks
	private indices! : Int32Array;
	
	constructor(
		private device: GPUDevice,
		private vertices: Float32Array, 
		indices?: Int32Array,
	) {

		if (indices) {
			this.indices = indices;
			this.vertexBuffer = this.device.createBuffer({
				label: "vertex buffer",
				size: this.vertices.byteLength,
				usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
			});
			device.queue.writeBuffer(this.vertexBuffer, 0, this.vertices);
			this.indexBuffer = this.device.createBuffer({
				label: "index buffer",
				size: this.indices!.byteLength,
				usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
			});
			device.queue.writeBuffer(this.indexBuffer, 0, this.indices!);
			this.vertexBufferLayout = {
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
		} else {
			// sparse mesh input
			// TODO
			
		}
	}
	

	getVertexBuffer() : GPUBuffer {
		return this.vertexBuffer;
	}

	getIndexBuffer() : GPUBuffer {
		return this.indexBuffer;
	}

	getVertexBufferLayout() : GPUVertexBufferLayout {
		return this.vertexBufferLayout;
	}

	getIndexCount() : number {
		return this.indices.length;
	}



}

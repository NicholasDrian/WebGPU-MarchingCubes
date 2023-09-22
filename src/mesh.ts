

export class Mesh {
	
	private vertexBuffer! : GPUBuffer;
	private vertexBufferLayout! : GPUVertexBufferLayout;
	private indexBuffer! : GPUBuffer; // todo remove question marks
	private indices! : Int32Array;
	
	constructor(
		private device: GPUDevice,
		private vertices: Float32Array, 
		indices?: Int32Array) {

		if (!indices) { // sparse mesh
			/*
			var count = 0;
			for (var i = 0; i < vertices.length; i += 4) {
				console.log(vertices[i], vertices[i + 1], vertices[i + 2], vertices[i + 3]);
				if (vertices[i] > 100) count++;
				if (vertices[i + 1] > 100) count++;
				if (vertices[i + 2] > 100) count++;
				if (vertices[i + 3] > 100) count++;
			}
			console.log(count);
			*/
			var newIndices: number[] = [];
			var newVertices: number[] = [];
			var pointMap = new Map<[number, number, number], number>();

			for (var i = 0; i < vertices.length; i += 4) {
				var point: [number, number, number] = [
					vertices[i],
					vertices[i + 1],
					vertices[i + 2]
				]; // todo skip empty
				if (!pointMap.has(point)) {
					pointMap.set(point, newVertices.length / 8);
					newIndices.push(newVertices.length / 8);
					newVertices.push(point[0]);
					newVertices.push(point[1]);
					newVertices.push(point[2]);
					newVertices.push(1);
					newVertices.push(1);
					newVertices.push(0.2);
					newVertices.push(0.5);
					newVertices.push(1);
				} else {
					newIndices.push(pointMap.get(point)!);
				}
			}
			this.indices = new Int32Array(newIndices);
			this.vertices = new Float32Array(newVertices);
		} else {
			this.indices = new Int32Array(indices);
		}


		this.vertexBuffer = this.device.createBuffer({
			label: "vertex buffer",
			size: this.vertices.byteLength,
			usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
		});
		this.device.queue.writeBuffer(this.vertexBuffer, 0, this.vertices);
		this.indexBuffer = this.device.createBuffer({
			label: "index buffer",
			size: this.indices!.byteLength,
			usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
		});
		this.device.queue.writeBuffer(this.indexBuffer, 0, this.indices!);
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

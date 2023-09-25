

export class Mesh {
	
	private vertexBuffer : GPUBuffer;
	private vertexBufferLayout : GPUVertexBufferLayout;
	private indexBuffer : GPUBuffer;
	private indices : Int32Array;
	
	constructor(
		private device: GPUDevice,
		private vertices: Float32Array, 
		indices?: Int32Array) {

		if (!indices) { // sparse mesh

			var newIndices: number[] = [];
			var newVertices: number[] = [];
			var normals: number[] = [];
			var pointMap = new Map<string, number>(); 
			

			for (var i = 0; i < vertices.length; i += 16) {
				if (vertices[i + 3] != 0) { // triangle found
					const a: [number, number, number] = [vertices[i + 0], vertices[i + 1], vertices[i + 2]];
					const b: [number, number, number] = [vertices[i + 4], vertices[i + 5], vertices[i + 6]];
					const c: [number, number, number] = [vertices[i + 8], vertices[i + 9], vertices[i + 10]];
					const n: [number, number, number] = [vertices[i + 12], vertices[i + 13], vertices[i + 14]];

					const aStr = a.toString();
					const bStr = b.toString();
					const cStr = c.toString();

					if (!pointMap.has(aStr)) {
						newIndices.push(newVertices.length / 8);
						pointMap.set(aStr, newVertices.length / 8);
						newVertices.push(...a, 1.0);
						newVertices.push(0.0, 0.0, 0.0, 0.0);
					} else newIndices.push(pointMap.get(aStr)!);
					if (!pointMap.has(bStr)) {
						newIndices.push(newVertices.length / 8); 
						pointMap.set(bStr, newVertices.length / 8);
						newVertices.push(...b, 1.0); 
						newVertices.push(0.0, 0.0, 0.0, 0.0);
					} else newIndices.push(pointMap.get(bStr)!);
					if (!pointMap.has(cStr)) { 
						newIndices.push(newVertices.length / 8);
						pointMap.set(cStr, newVertices.length / 8);
						newVertices.push(...c, 1.0);
						newVertices.push(0.0, 0.0, 0.0, 0.0);
					} else newIndices.push(pointMap.get(cStr)!);
					normals.push(...n, 1);

				} 

			}

			for (var i = 0; i < normals.length / 4; i++) { // add normals to corresponding vertices
				const indexA = newIndices[3 * i];
				const indexB = newIndices[3 * i + 1];
				const indexC = newIndices[3 * i + 2];
				newVertices[indexA * 8 + 4] += normals[i * 4 + 0];
				newVertices[indexA * 8 + 5] += normals[i * 4 + 1];
				newVertices[indexA * 8 + 6] += normals[i * 4 + 2];
				newVertices[indexB * 8 + 4] += normals[i * 4 + 0];
				newVertices[indexB * 8 + 5] += normals[i * 4 + 1];
				newVertices[indexB * 8 + 6] += normals[i * 4 + 2];
				newVertices[indexC * 8 + 4] += normals[i * 4 + 0];
				newVertices[indexC * 8 + 5] += normals[i * 4 + 1];
				newVertices[indexC * 8 + 6] += normals[i * 4 + 2];
			}

			for (var i = 0; i < newVertices.length; i += 8) { // normalize normals	
				var size = Math.sqrt(
					newVertices[i + 4] * newVertices[i + 4] +
					newVertices[i + 5] * newVertices[i + 5] +
					newVertices[i + 6] * newVertices[i + 6] 
				);	
				newVertices[i + 4] /= size;
				newVertices[i + 5] /= size;
				newVertices[i + 6] /= size;
				newVertices[i + 7] = 1.0;
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

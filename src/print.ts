
export const printMat4 = function(m : Float32Array): void {
	var str: string = "";
	for (var i: number = 0; i < 4; i++) {
		for (var j: number = 0; j < 4; j++) {
			str += m[4 * i + j].toFixed(2) + ",  ";
		}
		str += "\n";
	}
	console.log(str);	
}

export const printVec3 = function(v : [number, number, number]): void {
	var str: string = "";
	for (var i: number = 0; i < 3; i++) {
		str += v[i].toFixed(2) + ",  ";
	}
	console.log(str);	
}

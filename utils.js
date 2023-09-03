var normalize = function (v) {
	var size = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
	v[0] /= size;
	v[1] /= size;
	v[2] /= size;
	return v;
}

var sumVec3 = function (a, b) {
	return [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
}
var subVec3 = function (a, b) {
	return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}

var printMat4 = function(m) {
	let res = "";
	for (let i = 0; i < 4; i++) {
		for (let j = 0; j < 4; j++) {
			res += parseFloat(m[4 * i + j]).toFixed(2) + ',  ';
		}
		res += '\n';
	}
	console.log(res);
}

var printVec4 = function(v) {
	let res = "";
	for (let i = 0; i < 4; i++) {
		res += parseFloat(v[i]).toFixed(2) + ',  ';
	}
	console.log(res);
}

var printVec3 = function(v) {
	let res = "";
	for (let i = 0; i < 3; i++) {
		res += parseFloat(v[i]).toFixed(2) + ',  ';
	}
	console.log(res);
}

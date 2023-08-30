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

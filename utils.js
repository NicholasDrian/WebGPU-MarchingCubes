var normalize = function (v) {
	var size = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
	v[0] /= size;
	v[1] /= size;
	v[2] /= size;
}

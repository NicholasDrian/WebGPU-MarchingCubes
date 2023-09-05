

export const sum = function(
	a : [number, number, number],
	b : [number, number, number]) : [number, number, number]
{
	return [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
};

export const sub = function(
	a : [number, number, number],
	b : [number, number, number]) : [number, number, number]
{
	return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}

export const size = function(v : [number, number, number]) : number 
{
	return Math.sqrt(v[0]*v[0] + v[1]*v[1] + v[2]*v[2]);
}


export const normalize = function(v : [number, number, number]) : [number, number, number]
{
	const s : number = size(v); 
	v[0] /= s;
	v[1] /= s;
	v[2] /= s;
	return v;
}




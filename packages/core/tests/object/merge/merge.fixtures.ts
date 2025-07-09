const sym = Symbol.for('sym1')
const simpleMix1 = [
	{ x: 1, y: 2, z: [1, 2, { xx: 10, yy: 20 }], set1: new Set([1, 4, 'no']), [sym]: 100 },
	{
		x: 10,
		m: 'hello',
		z: [false, null],
		map1: new Map<string, number | string>([
			['a', 1],
			['b', 'hi~'],
		]),
	},
	{
		set1: new Set([1, 2, 3, false]),
		map1: new Map<string, number | boolean>([
			['a', 10],
			['c', false],
		]),
		[sym]: 200,
	},
]

function genJsonObject1(a: number, b: number): Record<string, unknown> {
	return {
		a,
		b,
		c: {
			a: a + b,
			b: a - b,
			hi: 'hello',
			x: true,
			y: `${a} + ${b}`,
			obj1: {
				a: a * a,
				arr1: [a, b],
			},
		},
		d: `hello ${a} ${b}`,
	}
}
const json1000 = Array.from({ length: 1000 }, (_, i) => genJsonObject1(i * 10, i + 10 + 10))
const json100 = json1000.slice(0, 100)
const json2 = json100.slice(0, 2)

function genJsonObject2(a: number, b: number): Record<string, unknown> {
	const obj: Record<string, unknown> = {
		str1: 'hello world',
		arr1: [a, b],
	}

	for (let i = 1; i <= a; i++) {
		obj[`key${i}`] = i * b
	}

	return obj
}
const jsonManyKeys10 = Array.from({ length: 10 }, (_, i) => genJsonObject2(1000, i + 1))
const jsonManyKeys2 = jsonManyKeys10.slice(0, 2)

const map1 = [
	new Map([
		['a', 1],
		['b', 2],
		['c', 3],
	]),
	new Map([
		['a', 10],
		['b2', 20],
		['c2', 30],
	]),
	new Map([
		['a2', 1],
		['b3', 200],
		['c3', 300],
	]),
]

export const fixtures = {
	simpleMix1,

	json2,
	json100,
	json1000,

	jsonManyKeys2,
	jsonManyKeys10,

	map1,
}

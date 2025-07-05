class Test {
	constructor(num = 123) {
		this.value = num
		this.items = [1, 2, 3]
	}
	get number() {
		return this.value
	}
}

const obj1 = {
	regexp: /foo[\\/](?=\d)/,
	array: [new Date(), new Date(100), 'invalid date', Date.now()],
	map: new Map([
		[{ foo: 1 }, { a: 1 }],
		[{ bar: 2 }, { b: 2 }],
	]),
	set: new Set([{ foo: 1 }, { bar: 2 }, [1, 2, 3]]),
	custom: new Test(456),
	int8arr: new Int8Array([4, 5, 6]),
	buffer: Buffer.from('hello'),
}

const objLite = [
	{
		_id: '5e16d8c6d7eee2857c907fbe',
		index: 0,
		nickname: null,
		isActive: false,
		balance: 2077.55,
		password: undefined,
		picture: 'http://placehold.it/32x32',
		age: 33,
		joined: new Date(),
		locales: /(EN|ES)/i,
		details: {
			email: 'ericksonphillips@retrotex.com',
			address: {
				street: '554 Lyme Avenue',
				city: 'Harborton',
				state: 'Texas',
				zipcode: 4945,
				coords: {
					latitude: 61.497735,
					longitude: -38.711066,
				},
			},
		},
		interests: ['amet', 'voluptate', 'sit', 'duis', 'fugiat', 'consectetur', 'amet'],
		friends: [
			{
				id: 0,
				name: 'Belinda Chandler',
				friends_common: {
					count: 2,
					friends_of_friends: [
						{
							id: 0,
							name: 'George Ayala',
						},
						{
							id: 1,
							name: 'Nadia Nguyen',
						},
					],
				},
			},
			{
				id: 1,
				name: 'Sheena Kidd',
				friends_common: {
					count: 2,
					friends_of_friends: [
						{
							id: 0,
							name: 'Kimberly Martinez',
						},
						{
							id: 1,
							name: 'Meadows Fitzpatrick',
						},
					],
				},
			},
			{
				id: 2,
				name: 'Winnie Mccarthy',
				friends_common: {
					count: 2,
					friends_of_friends: [
						{
							id: 0,
							name: 'Robbie Dale',
						},
						{
							id: 1,
							name: 'Orr Houston',
						},
					],
				},
			},
		],
	},
	{
		_id: '5e16d8c6ed426d1c22bf306b',
		index: 1,
		nickname: null,
		isActive: false,
		balance: 2916.08,
		password: undefined,
		picture: 'http://placehold.it/32x32',
		age: 20,
		joined: new Date(),
		locales: /(EN)/i,
		details: {
			email: 'orrhouston@retrotex.com',
			address: {
				street: '962 McDonald Avenue',
				city: 'Lithium',
				state: 'West Virginia',
				zipcode: 4536,
				coords: {
					latitude: 83.372808,
					longitude: 150.181923,
				},
			},
		},
		interests: ['eu', 'et', 'dolore', 'sunt', 'elit', 'nulla', 'fugiat'],
		friends: [
			{
				id: 0,
				name: 'Hood Washington',
				friends_common: {
					count: 2,
					friends_of_friends: [
						{
							id: 0,
							name: 'Hebert Delacruz',
						},
						{
							id: 1,
							name: 'Sharp Rose',
						},
					],
				},
			},
			{
				id: 1,
				name: 'Karla Velasquez',
				friends_common: {
					count: 2,
					friends_of_friends: [
						{
							id: 0,
							name: 'Carey Holman',
						},
						{
							id: 1,
							name: 'Baird Short',
						},
					],
				},
			},
			{
				id: 2,
				name: 'Juliet Oneal',
				friends_common: {
					count: 2,
					friends_of_friends: [
						{
							id: 0,
							name: 'Owens Richards',
						},
						{
							id: 1,
							name: 'Lily Olsen',
						},
					],
				},
			},
		],
	},
]

const getObjCircular1 = () => {
	const arr1 = [null, { x: 2, y: 4 }]

	const c1 = { i: 'hello' }
	const c2 = { i: 'hello', you: c1 }
	c1.you = c2

	const a = {
		a: 1,
		b: ['hello', 'world', arr1],
		c: 3,
		arr1,
		arr2: arr1,
		c1,
		c2,
	}
	a.d = a
	a.e = a
	a.b.push(a)
	arr1.push(a)

	return a
}

function buildPeopleGraph() {
	const people = []

	function createPerson(name, age) {
		return {
			name,
			age,
			friends: [],
			parents: [],
			children: [],
		}
	}

	// Populate the array with people
	people.push(createPerson('John', 50))
	people.push(createPerson('Jane', 48))
	people.push(createPerson('Mike', 28))
	people.push(createPerson('Sara', 26))
	people.push(createPerson('Tom', 30))
	people.push(createPerson('Lily', 27))
	people.push(createPerson('Emily', 5))
	people.push(createPerson('Jack', 3))
	people.push(createPerson('Alice', 65))
	people.push(createPerson('Bob', 66))

	// Define relationships

	// John and Jane are parents of Mike and Sara
	people[0].children.push(people[2], people[3]) // John's children
	people[1].children.push(people[2], people[3]) // Jane's children
	people[2].parents.push(people[0], people[1]) // Mike's parents
	people[3].parents.push(people[0], people[1]) // Sara's parents

	// Tom and Lily are parents of Emily and Jack
	people[4].children.push(people[6], people[7]) // Tom's children
	people[5].children.push(people[6], people[7]) // Lily's children
	people[6].parents.push(people[4], people[5]) // Emily's parents
	people[7].parents.push(people[4], people[5]) // Jack's parents

	// Alice and Bob are John's and Jane's parents (grandparents)
	people[0].parents.push(people[8], people[9]) // John's parents
	people[1].parents.push(people[8], people[9]) // Jane's parents
	people[8].children.push(people[0], people[1]) // Alice's children
	people[9].children.push(people[0], people[1]) // Bob's children

	// Add friends relationships (mutual circular relationships)
	people[2].friends.push(people[4]) // Mike and Tom are friends
	people[4].friends.push(people[2])

	people[3].friends.push(people[5]) // Sara and Lily are friends
	people[5].friends.push(people[3])

	people[0].friends.push(people[9]) // John and Bob (his father) are friends
	people[9].friends.push(people[0])

	people[1].friends.push(people[8]) // Jane and Alice (her mother) are friends
	people[8].friends.push(people[1])

	return people
}

export const fixtures = {
	obj1,
	objLite,
	objCircular1: getObjCircular1(),
	objCircular2: buildPeopleGraph(),
}

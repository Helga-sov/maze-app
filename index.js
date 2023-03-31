const { Engine, Render, Runner, World, Bodies, Body, Events } = Matter;

const cellsHorizontal = 20;
const cellsVertical = 16;
const width = window.innerWidth;
const height = window.innerHeight;

const unitLengthX = width / cellsHorizontal;
const unitLengthY = height / cellsVertical;

const engine = Engine.create();
engine.world.gravity.y = 0;
const { world } = engine;
const render = Render.create({
	element: document.body,
	engine: engine,
	options: {
		wireframes: false,
		width,
		height,
	},
});

Render.run(render);
Runner.run(Runner.create(), engine);

// Walls
const walls = [
	Bodies.rectangle(width / 2, 0, width, 2, { isStatic: true }),
	Bodies.rectangle(width / 2, height, width, 2, { isStatic: true }),
	Bodies.rectangle(0, height / 2, 2, height, { isStatic: true }),
	Bodies.rectangle(width, height / 2, 2, height, { isStatic: true }),
];

World.add(world, walls);

// Maze generation
// create a grid - 2dimensional array with 3 rows and 3 columns
// add 2 additional arrays - verticals and horizontals - which will keep track of vertical or horizontal walls. The arrays will contain booleans value: true(no wall) or false(is a wall)

// OPTION 1
// Step 1 - define a grid array
//const grid = [];

// Step 2 - iterate around the array using a double nested 'for' loop
//for (let i = 0; i < 3; i++) {
// push each individual row
//grid.push([]);
//for (let j = 0; j < 3; j++) {
// process each of the rows and add in starting values of - false
//grid[i].push(false);
//}
//}
//console.log(grid);

// OPTION 2

// create a function that will randomize elements inside of an array
const shuffle = (arr) => {
	//get length of the array
	let counter = arr.length;
	while (counter > 0) {
		// random index inside of the array
		const index = Math.floor(Math.random() * counter);
		counter--;
		const temp = arr[counter];
		arr[counter] = arr[index];
		arr[index] = temp;
	}
	return arr;
};

const grid = Array(cellsVertical)
	.fill(null)
	.map(() => Array(cellsHorizontal).fill(false));
//console.log(grid);

// create verticals array
const verticals = Array(cellsVertical)
	.fill(null)
	.map(() => Array(cellsHorizontal - 1).fill(false));

const horizontals = Array(cellsVertical - 1)
	.fill(null)
	.map(() => Array(cellsHorizontal).fill(false));

//console.log(verticals);
//console.log(horizontals);

const startRow = Math.floor(Math.random() * cellsVertical);
const startColumn = Math.floor(Math.random() * cellsHorizontal);

// create function
const stepThroughCell = (row, column) => {
	// If i have visited the cell at [row, column], then return nothing
	if (grid[row][column] === true) {
		return;
	}
	// Mark this cell as being visited
	grid[row][column] = true;
	//Assemble randomly-ordered list of neighbors
	const neighbors = shuffle([
		[row - 1, column, "up"],
		[row, column + 1, "right"],
		[row + 1, column, "down"],
		[row, column - 1, "left"],
	]);

	//console.log(neighbors);

	// For each neighbor...
	for (let neighbor of neighbors) {
		const [nextRow, nextColumn, direction] = neighbor;

		// See if that neighbor is out of bounds
		if (
			nextRow < 0 ||
			nextRow >= cellsVertical ||
			nextColumn < 0 ||
			nextColumn >= cellsHorizontal
		) {
			continue;
		}

		// If we have visited that neighbor, continue to next neighbor (if grid is true => continue)
		if (grid[nextRow][nextColumn]) {
			continue;
		}
		// Remove a wall from either horizontals or verticals array
		if (direction === "left") {
			verticals[row][column - 1] = true;
		} else if (direction === "right") {
			verticals[row][column] = true;
		} else if (direction === "up") {
			horizontals[row - 1][column] = true;
		} else if (direction === "down") {
			horizontals[row][column] = true;
		}
		stepThroughCell(nextRow, nextColumn);
		// Visit that next cell
	}
};

stepThroughCell(startRow, startColumn);
//console.log(verticals);
//console.log(horizontals);

horizontals.forEach((row, rowIndex) => {
	//console.log(row);
	row.forEach((open, columnIndex) => {
		if (open) {
			return;
		}
		const wall = Bodies.rectangle(
			columnIndex * unitLengthX + unitLengthX / 2,
			rowIndex * unitLengthY + unitLengthY,
			unitLengthY,
			5,
			{
				label: "wall",
				isStatic: true,
				render: {
					fillStyle: "red",
				},
			}
		);
		World.add(world, wall);
	});
});

verticals.forEach((row, rowIndex) => {
	row.forEach((open, columnIndex) => {
		if (open) {
			return;
		}
		const wall = Bodies.rectangle(
			columnIndex * unitLengthX + unitLengthX,
			rowIndex * unitLengthY + unitLengthY / 2,
			5,
			unitLengthY,
			{
				label: "wall",
				isStatic: true,
				render: {
					fillStyle: "red",
				},
			}
		);
		World.add(world, wall);
	});
});

// Goal
const goal = Bodies.rectangle(
	width - unitLengthX / 2,
	height - unitLengthY / 2,
	unitLengthX * 0.7,
	unitLengthY * 0.7,
	{
		label: "goal",
		isStatic: true,
		render: {
			fillStyle: "#00FF00",
		},
	}
);

World.add(world, goal);

// Ball
const ballRadius = Math.min(unitLengthX, unitLengthY) / 4;
const ball = Bodies.circle(unitLengthX / 2, unitLengthY / 2, ballRadius, {
	label: "ball",
	render: { fillStyle: "#6CB4EE" },
});
World.add(world, ball);

document.addEventListener("keydown", (event) => {
	const { x, y } = ball.velocity;
	console.log(x, y);
	if (event.keyCode === 87) {
		Body.setVelocity(ball, { x, y: y - 5 });
	}
	if (event.keyCode === 68) {
		Body.setVelocity(ball, { x: x + 5, y });
	}
	if (event.keyCode === 83) {
		Body.setVelocity(ball, { x, y: y + 5 });
	}
	if (event.keyCode === 65) {
		Body.setVelocity(ball, { x: x - 5, y });
	}
});

// Win Condition

Events.on(engine, "collisionStart", (event) => {
	event.pairs.forEach((collision) => {
		const labels = ["ball", "goal"];
		if (
			labels.includes(collision.bodyA.label) &&
			labels.includes(collision.bodyB.label)
		) {
			document.querySelector(".winner").classList.remove("hidden");
			world.gravity.y = 1;
			world.bodies.forEach((body) => {
				if (body.label === "wall") {
					Body.setStatic(body, false);
				}
			});
		}
	});
});

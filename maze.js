const {
  Engine,
  Render,
  Runner,
  World,
  Bodies,
  Body,
  Events,
  Mouse,
  MouseConstraint,
} = Matter;

const cellsGorizontal = 15;
const cellsVertical = 12;
const width = window.innerWidth;
const height = window.innerHeight;
const wallWidth = 5;
const borderWidth = 2;

const unitLengthX = width / cellsGorizontal;
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
World.add(
  world,
  MouseConstraint.create(engine, {
    mouse: Mouse.create(render.canvas),
  })
);

// walls
const walls = [
  Bodies.rectangle(width / 2, 0, width, borderWidth, { isStatic: true }),
  Bodies.rectangle(width / 2, height, width, borderWidth, { isStatic: true }),
  Bodies.rectangle(0, height / 2, borderWidth, height, { isStatic: true }),
  Bodies.rectangle(width, height / 2, borderWidth, height, { isStatic: true }),
];

World.add(world, walls);

// Maze generation

const shuffle = (arr) => {
  let counter = arr.length;

  while (counter > 0) {
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
  .map(() => Array(cellsGorizontal).fill(false));

const verticals = Array(cellsVertical)
  .fill(null)
  .map(() => Array(cellsGorizontal - 1).fill(false));

const gorizontal = Array(cellsVertical - 1)
  .fill(null)
  .map(() => Array(cellsGorizontal).fill(false));

const startRow = Math.floor(Math.random() * cellsVertical);
const startColumn = Math.floor(Math.random() * cellsGorizontal);

const stepThroughCell = (row, column) => {
  //if we visited this cell RETURN
  if (grid[row][column]) {
    return;
  }

  //mark cell as being visited
  grid[row][column] = true;

  //Assemble randomly-ordered list of neighbors
  const neighbors = shuffle([
    [row - 1, column, "up"],
    [row, column + 1, "right"],
    [row + 1, column, "down"],
    [row, column - 1, "left"],
  ]);

  //for each neighbor...
  for (let neighbor of neighbors) {
    const [nextRow, nextColumn, direction] = neighbor;
    //see if that naighbor is out of bounds
    if (
      nextRow < 0 ||
      nextRow >= cellsVertical ||
      nextColumn < 0 ||
      nextColumn >= cellsGorizontal
    ) {
      continue;
    }
    //if we have visited that neighbor, continue to next neighbor
    if (grid[nextRow][nextColumn]) {
      continue;
    }
    //remove a wall from eighter horizontals or vertical
    if (direction === "left") {
      verticals[row][column - 1] = true;
    } else if (direction === "right") {
      verticals[row][column] = true;
    } else if (direction === "up") {
      gorizontal[row - 1][column] = true;
    } else if (direction === "down") {
      gorizontal[row][column] = true;
    }

    stepThroughCell(nextRow, nextColumn);
  }
  //visit that next cell
};

stepThroughCell(startRow, startColumn);

gorizontal.forEach((row, rowIndex) => {
  row.forEach((open, columnIndex) => {
    if (open) {
      return;
    }

    const wall = Bodies.rectangle(
      columnIndex * unitLengthX + unitLengthX / 2,
      rowIndex * unitLengthY + unitLengthY,
      unitLengthX,
      wallWidth,
      {
        label: "wall",
        isStatic: true,
        render: {
          fillStyle: "blue",
        },
      }
    );

    World.add(world, wall);
  });

  verticals.forEach((row, rowIndex) => {
    row.forEach((open, columnIndex) => {
      if (open) {
        return;
      }

      const wall = Bodies.rectangle(
        columnIndex * unitLengthX + unitLengthX,
        rowIndex * unitLengthY + unitLengthY / 2,
        wallWidth,
        unitLengthY,
        {
          label: "wall",
          isStatic: true,
          render: {
            fillStyle: "blue",
          },
        }
      );

      World.add(world, wall);
    });
  });
});

// GOAL

const goal = Bodies.rectangle(
  width - unitLengthX / 2,
  height - unitLengthY / 2,
  unitLengthX * 0.7,
  unitLengthY * 0.7,
  {
    label: "goal",
    isStatic: true,
    render: {
      fillStyle: "yellow",
    },
  }
);

World.add(world, goal);

// BALL
const ballRadius = Math.min(unitLengthX, unitLengthY) / 2;
const ball = Bodies.circle(unitLengthX / 2, unitLengthY / 2, ballRadius / 4, {
  label: "ball",
  render: {
    fillStyle: "red",
  },
});

World.add(world, ball);

document.addEventListener("keydown", (e) => {
  const { x, y } = ball.velocity;

  if (e.key === "w") {
    Body.setVelocity(ball, { x, y: y - 5 });
  }
  if (e.key === "s") {
    Body.setVelocity(ball, { x, y: y + 5 });
  }
  if (e.key === "a") {
    Body.setVelocity(ball, { x: x - 5, y });
  }
  if (e.key === "d") {
    Body.setVelocity(ball, { x: x + 5, y });
  }
});

// Win condition

Events.on(engine, "collisionStart", (e) => {
  e.pairs.forEach((collision) => {
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

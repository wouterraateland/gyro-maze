const sliceRect = (area, left, top, right, bottom) =>
  area.slice(left, right + 1).map(row => row.slice(top, bottom + 1))

const allActions = [
  {
    name: 'left',
    isPossible: (maze, {x, y}) =>
      x > 2 &&
      maze.countTiles(Maze.WALL_TYPE)(x - 2, y, x - 1, y) === 2,
    execute: (maze, {x, y}) => {
      maze.setTiles(Maze.FLOOR_TYPE)(x - 2, y, x - 1, y)
      maze.addBusy(x - 2, y)
    },
    weight: 1
  },
  {
    name: 'top',
    isPossible: (maze, {x, y}) =>
      y > 2 &&
      maze.countTiles(Maze.WALL_TYPE)(x, y - 2, x, y - 1) === 2,
    execute: (maze, {x, y}) => {
      maze.setTiles(Maze.FLOOR_TYPE)(x, y - 2, x, y - 1)
      maze.addBusy(x, y - 2)
    },
    weight: 1
  },
  {
    name: 'right',
    isPossible: (maze, {x, y}) =>
      x < maze.width - 2 &&
      maze.countTiles(Maze.WALL_TYPE)(x + 1, y, x + 2, y) === 2,
    execute: (maze, {x, y}) => {
      maze.setTiles(Maze.FLOOR_TYPE)(x + 1, y, x + 2, y)
      maze.addBusy(x + 2, y)
    },
    weight: 1
  },
  {
    name: 'bottom',
    isPossible: (maze, {x, y}) =>
      y < maze.height - 2 &&
      maze.countTiles(Maze.WALL_TYPE)(x, y + 1, x, y + 2) === 2,
    execute: (maze, {x, y}) => {
      maze.setTiles(Maze.FLOOR_TYPE)(x, y + 1, x, y + 2)
      maze.addBusy(x, y + 2)
    },
    weight: 1
  },
  {
    name: '3x3 room',
    isPossible: (maze, {x, y}) =>
      x < maze.width - 4 &&
      y < maze.height - 4 &&
      maze.countTiles(Maze.WALL_TYPE)(x - 1, y - 1, x + 3, y + 3) >= 23,
    execute: (maze, {x, y}) => {
      maze.setTiles(Maze.FLOOR_TYPE)(x, y, x + 2, y + 2)
      maze.addBusy(x + 2, y + 0, .3)
      maze.addBusy(x + 2, y + 2, .3)
      maze.addBusy(x + 0, y + 2, .3)
    },
    weight: 1
  },
  {
    name: '5x5 room',
    isPossible: (maze, {x, y}) =>
      x > 2 && x < maze.width - 2 &&
      y > 2 && y < maze.height - 2 &&
      maze.countTiles(Maze.WALL_TYPE)(x - 3, y - 3, x + 3, y + 3) >= 43,
    execute: (maze, {x, y}) => {
      maze.setTiles(Maze.FLOOR_TYPE)(x - 2, y - 2, x + 2, y + 2)
      maze.addBusy(x - 2, y + 2, .2)
      maze.addBusy(x + 0, y + 2, .2)
      maze.addBusy(x + 2, y + 2, .2)
      maze.addBusy(x + 2, y + 0, .2)
      maze.addBusy(x + 2, y - 2, .2)
      maze.addBusy(x + 0, y - 2, .2)
      maze.addBusy(x - 2, y - 2, .2)
      maze.addBusy(x - 2, y + 0, .2)
    },
    weight: 1
  },
]


class Maze {
  constructor(width, height, tileSize=16) {
    this.width = width
    this.height = height
    this.tileSize = tileSize

    this.start = this.finish = { x: 1, y: 1 }

    this.createTiles()
  }

  countTiles(tileType) {
    return (left, top, right, bottom) =>
      sliceRect(this.tiles, left, top, right, bottom)
        .reduce((acc, e) => acc.concat(e), [])
        .filter(tile => tile === tileType).length
  }

  setTiles(tileType) {
    return (left, top, right, bottom) => {
      for (let x = left; x <= right; x++) {
        for (let y = top; y <= bottom; y++) {
          this.tiles[x][y] = tileType
        }
      }
    }
  }

  addBusy(x, y, p=1) {
    if (Math.random() < p) {
      this.busy.push({x, y})
    }
  }

  findPossibleActions({x, y}) {
    return allActions.filter(action => action.isPossible(this, {x, y}))
  }

  chooseAction(possibleActions) {
    const totalWeight = possibleActions.reduce((acc, action) => acc + action.weight, 0)
    const randomWeight = Math.random() * totalWeight
    let currentWeight = 0

    for (let i = 0; i < possibleActions.length; i++) {
      currentWeight += possibleActions[i].weight

      if (currentWeight > randomWeight) {
        return possibleActions[i]
      }
    }
  }

  createTiles() {
    this.tiles = Array(this.width).fill(0)
      .map(() => Array(this.height).fill(Maze.WALL_TYPE))

    this.busy = [{ x: 1, y: 1 }]
    this.tiles[this.busy[0].x][this.busy[0].y] = Maze.FLOOR_TYPE

    while (this.busy.length) {
      const id = Math.floor(this.busy.length * Math.random())
      const pos = this.busy[id]

      const possibleActions = this.findPossibleActions(pos)

      if (possibleActions.length) {
        const action = this.chooseAction(possibleActions)
        action.execute(this, pos)
      } else {
        this.busy.splice(id, 1)
      }
    }

    if (this.countTiles(Maze.FLOOR_TYPE)(0, 0, this.width, this.height) < this.width * this.height / 4) {
      return this.createTiles()
    }

    this.setEndpoints()

    this.tiles[this.finish.x][this.finish.y] = Maze.FINISH_TYPE
    this.tiles[this.start.x][this.start.y] = Maze.START_TYPE
  }

  setEndpoints() {
    this.finish = {
      x: 1 + 2 * Math.floor(Math.random() * this.width / 2),
      y: 1 + 2 * Math.floor(Math.random() * this.height / 2)
    }

    if (this.countTiles(Maze.WALL_TYPE)(this.finish.x - 1, this.finish.y - 1, this.finish.x + 1, this.finish.y + 1) < 7) {
      this.setEndpoints()
    }

    this.start = {
      x: 1 + 2 * Math.floor(((this.finish.x + this.width / 2) % (this.width - 1)) / 2),
      y: 1 + 2 * Math.floor(((this.finish.y + this.height / 2) % (this.height - 1)) / 2)
    }
  }

  render(ctx) {
    for (let x = 0; x < this.width; x++) {
      for (let y = 0; y < this.height; y++) {
        switch (this.tiles[x][y]) {
          case Maze.WALL_TYPE: ctx.fillStyle = '#b56829'; break;
          case Maze.FLOOR_TYPE: ctx.fillStyle = '#bf9b59'; break;
          case Maze.START_TYPE: ctx.fillStyle = '#f00'; break;
          case Maze.FINISH_TYPE: ctx.fillStyle = '#0f0'; break;
          default: ctx.fillStyle = '#000'; break;
        }
        ctx.fillRect(this.tileSize * x, this.tileSize * y, this.tileSize, this.tileSize)
      }
    }
  }

  getTile(x, y) {
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
      return null
    } else {
      return this.tiles[x][y]
    }
  }

  debug() {
    console.log(this.tiles.reduce((acc, row) => `${acc}\n${row}`, ``))
  }
}

Maze.WALL_TYPE = 0
Maze.FLOOR_TYPE = 1
Maze.START_TYPE = 2
Maze.FINISH_TYPE = 3

export default Maze

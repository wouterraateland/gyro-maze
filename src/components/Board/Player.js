const generateGaussianKernel = n => {
	const gauss = x => Math.exp(-Math.pow(x, 2) / 2)
	const k = Array(n).fill().map((_,i) => gauss(i * 2 / n))
	const t = k.reduce((acc, e) => acc + e, 0)
	return k.map(e => e / t).reverse()
}

const smooth = (xs, kernel) => {
	return xs.reduce((acc, e, j) => acc + e * kernel[j], 0)
}

class Player {
  constructor(maze) {
    this.maze = maze

    this.radius = maze.tileSize / 2

    this.acceleration = { x: 0, y: 0, z: 0 }
    this.speed = { x: 0, y: 0, z: 0 }
    this.position = {
      x: (maze.start.x + .5) * maze.tileSize,
      y: (maze.start.y + .5) * maze.tileSize,
      z: 0
    }

    this.history = {
			orientation: Array(Player.SMOOTH_LENGTH).fill().map((_,i) => ({absolute: 0, alpha: 0, beta: 0, gamma: 0})),
			acceleration: Array(Player.SMOOTH_LENGTH).fill().map((_,i) => ({x: 0, y: 0, z: 0}))
		}

    window.addEventListener('deviceorientation', this.handleOrientation.bind(this, false), true)
		window.addEventListener('devicemotion', this.handleMotion.bind(this, false), false)
  }

  handleOrientation(_, event) {
		this.history.orientation = this.history.orientation
      .slice(1 - Player.SMOOTH_LENGTH)
      .concat(event)

		this.orientation = {
			alpha: smooth(this.history.orientation.map(o => o.alpha), kernel) * Math.PI / 180,
			beta: smooth(this.history.orientation.map(o => o.beta), kernel) * Math.PI / 180,
			gamma: smooth(this.history.orientation.map(o => o.gamma), kernel) * Math.PI / 180,
		}
	}

	handleMotion(_, event) {
		this.history.acceleration = this.history.acceleration
      .slice(1 - Player.SMOOTH_LENGTH)
      .concat(event.accelerationIncludingGravity)

		this.acceleration = {
			x: smooth(this.history.acceleration.map(a => a.x), kernel) || 0,
			y: smooth(this.history.acceleration.map(a => a.y), kernel) || 0,
			z: smooth(this.history.acceleration.map(a => a.z), kernel) || 0,
		}
	}

  nearestPointOnSquare(cx, cy) {
    return {
      x: Math.max(cx - this.maze.tileSize / 2, Math.min(this.position.x, cx + this.maze.tileSize / 2)),
      y: Math.max(cy - this.maze.tileSize / 2, Math.min(this.position.y, cy + this.maze.tileSize / 2))
    }
  }

  distanceToPoint(px, py) {
    const dx = this.position.x - px
    const dy = this.position.y - py
    return Math.sqrt(dx * dx + dy * dy) - this.radius
  }

  update(dt) {
    const acc = {
			x:  this.acceleration.x - Player.FRICTION * this.speed.x,// - GRAVITY * Math.sin(this.orientation.gamma),
			y: -this.acceleration.y - Player.FRICTION * this.speed.y,// + GRAVITY * Math.sin(this.orientation.beta) * Math.cos(this.orientation.gamma),
			z: -this.acceleration.z - Player.FRICTION * this.speed.z,// - GRAVITY * Math.cos(this.orientation.beta) * Math.cos(this.orientation.gamma),
		}

		this.speed = {
			x: this.speed.x + acc.x * dt,
			y: this.speed.y + acc.y * dt,
			z: this.speed.z + acc.z * dt,
		}

    const oldPosition = {
      x: this.position.x,
      y: this.position.y,
      z: this.position.z,
    }

		this.position = {
			x: this.position.x + Player.SPEED * this.speed.x * dt,
			y: this.position.y + Player.SPEED * this.speed.y * dt,
			z: this.position.z + Player.SPEED * this.speed.z * dt,
		}

    const tileX = Math.floor(this.position.x / this.maze.tileSize)
    const tileY = Math.floor(this.position.y / this.maze.tileSize)

    let n, d, dd
    for (let x = tileX - 1; x <= tileX + 1; x++) {
      for (let y = tileY - 1; y <= tileY + 1; y++) {
        if (this.maze.getTile(x, y) === 0) {
          n = this.nearestPointOnSquare(
            (x + .5) * this.maze.tileSize,
            (y + .5) * this.maze.tileSize)
          d = this.distanceToPoint(n.x, n.y)
          if (d < 0) {
            dd = Math.sqrt(Math.pow(n.x - this.position.x, 2) + Math.pow(n.y - this.position.y, 2))
            this.position.x -= d * (this.position.x - n.x) / dd
            this.position.y -= d * (this.position.y - n.y) / dd
          }
        }
      }
    }

    this.position.x = Math.max(this.radius, Math.min(this.position.x, this.maze.width * this.maze.tileSize - this.radius))
    this.position.y = Math.max(this.radius, Math.min(this.position.y, this.maze.height * this.maze.tileSize - this.radius))
    this.position.z = Math.max(0, this.position.z)

    this.speed = {
      x: (this.position.x - oldPosition.x) / (Player.SPEED * dt),
      y: (this.position.y - oldPosition.y) / (Player.SPEED * dt),
      z: (this.position.z - oldPosition.z) / (Player.SPEED * dt),
    }

    // if (Math.random() < 0.001) {
    //   console.log(`x:${this.speed.x},y:${this.speed.y},z:${this.speed.z}`)
    //   console.log(`x:${spd.x},y:${spd.y},z:${spd.z}`)
    // }

  }

  render(ctx) {
    ctx.fillStyle = '#000'
    ctx.beginPath()
    ctx.arc(this.position.x, this.position.y, this.radius, 0, 2 * Math.PI)
    ctx.fill()

    // ctx.fillStyle = '#3f4'
    // const tileX = Math.floor(this.position.x / this.maze.tileSize)
    // const tileY = Math.floor(this.position.y / this.maze.tileSize)
    //
    // for (let x = tileX - 1; x <= tileX + 1; x++) {
    //   for (let y = tileY - 1; y <= tileY + 1; y++) {
    //     if (this.maze.getTile(x, y) === 0 &&
    //       this.collideWithSquare(
    //       (x + .5) * this.maze.tileSize,
    //       (y + .5) * this.maze.tileSize)) {
    //         ctx.fillRect(
    //           this.maze.tileSize * x,
    //           this.maze.tileSize * y,
    //           this.maze.tileSize, this.maze.tileSize
    //         )
    //     }
    //   }
    // }
    //
    // ctx.fillStyle = '#fe2'
    // ctx.fillRect(
    //   this.maze.tileSize * Math.floor(this.position.x / this.maze.tileSize),
    //   this.maze.tileSize * Math.floor(this.position.y / this.maze.tileSize),
    //   this.maze.tileSize, this.maze.tileSize
    // )

  }
}

Player.SMOOTH_LENGTH = 8
Player.SPEED = 20.0
Player.FRICTION = 0.5
Player.GRAVITY = 90.0

const kernel = generateGaussianKernel(Player.SMOOTH_LENGTH)

export default Player

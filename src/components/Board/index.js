import React, { Component } from 'react'

import './styles.css'

import Maze from './Maze'
import Player from './Player'

class Board extends Component {
  constructor(props) {
    super(props)

    this.state = {
      canvas: null,
      ctx: null,
      lastTime: Date.now()
    }

    this.width = props.width
    this.height = props.height
  }

  componentDidMount() {
    this.maze = new Maze(this.width, this.height)
    this.player = new Player(this.maze)

    const canvas = this.refs.board

    this.setState({
      canvas,
      ctx: canvas.getContext('2d')
    })

    canvas.width = this.maze.width * this.maze.tileSize
    canvas.height = this.maze.height * this.maze.tileSize

    this.update()
  }

  update() {
    const now = Date.now()
    const dt = (now - this.state.lastTime) / 1000
    this.setState({ lastTime: now })

    this.player.update(dt)

    this.draw(this.state.ctx)

		requestAnimationFrame(() => { this.update() })
  }

  draw(ctx) {
    if (ctx === null) { return }

    const { canvas } = this.state

    ctx.save()
    ctx.clearRect(0, 0, canvas.width, canvas.height)

		this.maze.render(ctx)
    this.player.render(ctx)

		ctx.restore()
  }

  render() {
    return (
      <canvas ref="board"></canvas>
    )
  }
}

Board.defaultProps = {
  width: 15,
  height: 15
}

export default Board

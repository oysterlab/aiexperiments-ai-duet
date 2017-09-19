const socket = require('socket.io-client')('http://localhost:5000/visual')

const aiSignals = [];
const userSignals = [];

let mergedSignals = [];
const points = []
let startTime = -1;
if (socket) {
  socket.on('started', (d) => {
    console.log(startTime)
    startTime = d.startTime;
  })

  const signals = []
  const keydowns = {}

  setInterval(() => {
    const now = (new Date()).getTime()

    aiSignals.forEach((signal, i) => {

      if (Math.abs(((now - startTime) / 1000 - signal.time)) < 1) {

        if (signal.from == 'ai' && signal.type == 'keyDown') {
          const p = new Point(signal)
          points.push(p)
          aiSignals.splice(i, 1)
        } else if (signal.from == 'ai' && signal.type == 'keyUp') {
          const borns = points.filter((p) => ((p.state == 'born') && p.note == signal.note) && (p.from == signal.from))
          borns.sort((a, b) => a.date > b.date)

          if(borns[0]) {
            borns[0].bX = borns[0].x
            borns[0].bY = borns[0].y

            const r = Math.random() * 2 * Math.PI
            const vRadius = 800 + 200 * Math.random()
            borns[0].mX = Math.cos(r) * vRadius + WIDTH * 0.5 - borns[0].bX
            borns[0].mY = Math.sin(r) * vRadius + HEIGHT * 0.5 - borns[0].bY
            borns[0].mRad = r
            borns[0].vRadius = vRadius
            borns[0].radiusMutateSpeed = 0.0005 * Math.random()

            borns[0].state = 'move'
          }
        }
      }
    })

  }, 10)

  socket.on('toss-signal', (signal) => {
    mergedSignals = [];

    (signal.from == 'user') ?
      userSignals.push(signal) : aiSignals.push(signal)

      if (signal.from == 'user' && signal.type == 'keyDown') {
        const p = new Point(signal)
        points.push(p)
      } else if (signal.from == 'user' && signal.type == 'keyUp') {
        const borns = points.filter((p) => ((p.state == 'born') && p.note == signal.note) && (p.from == signal.from))
        borns.sort((a, b) => a.date > b.date)

        if(borns[0]) {
          borns[0].bX = borns[0].x
          borns[0].bY = borns[0].y

          const r = Math.random() * 2 * Math.PI
          const vRadius = 50 + 100 * Math.random()
          borns[0].mX = Math.cos(r) * vRadius + WIDTH * 0.5 - borns[0].bX
          borns[0].mY = Math.sin(r) * vRadius + HEIGHT * 0.5 - borns[0].bY
          borns[0].mRad = r
          borns[0].vRadius = vRadius
          borns[0].radiusMutateSpeed = 0.0005 * Math.random()

          borns[0].state = 'move'
        }
      }
  })
}



const WIDTH = window.innerWidth
const HEIGHT = window.innerHeight

const canvas = document.createElement('canvas')
canvas.width = WIDTH
canvas.height = HEIGHT

document.body.appendChild(canvas)
const context = canvas.getContext('2d')

context.globalCompositeOperation = 'screen'

const LIFE = 50
const BASE_LIFE = 50
const HEIGHT_MARGIN = 30

const NOTE_START = 40
const NOTE_END = 80

class Point {
  constructor({time, note, from}) {
    this.time = time
    this.from = from
    this.note = note

    this.init()
  }

  init() {
    const { note, from } = this

    this.x = (WIDTH - 200) * ( (note - NOTE_START) / (NOTE_END - NOTE_START)) + 100 + (Math.random() - 0.5) * 2 //(2 * Math.random() - 1)

    this.y = (from == 'user') ? HEIGHT - HEIGHT_MARGIN + 10 * Math.random() : HEIGHT_MARGIN + 10 * Math.random() //(2 * Math.random() - 1)
    this.r = 1
    this.state = 'born'
    this.color = [parseInt(Math.random() * 255), parseInt(Math.random() * 255), parseInt(Math.random() * 255)]

    this.dir = (from == 'user') ? 1 : -1
    this.mLife = BASE_LIFE + parseInt(LIFE * Math.random())
    this.mRemainLife = this.mLife
  }

  draw() {
    let { x, y, r, color } = this

    if (isNaN(r)) r = 0.1
    const grad  = context.createRadialGradient(x, y, 0, x, y, r);
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    grad.addColorStop(0, 'rgba(' + color[0] + ',' + color[1] + ',' + color[2] + ',1)');
    context.fillStyle = grad

    context.beginPath()
    context.arc(x, y, r, 0, 2 * Math.PI, false)
    context.closePath()
    context.fill()

  }

  update(t) {
    const {time, note, from, state, dir} = this

    if (state == 'born') {
      const now = ((new Date()).getTime() - startTime) / 1000
      this.oriR =  Math.pow((now - time) * 10, 1 + 1 * Math.random()) * 4
      this.r = this.oriR
    } else if (state == 'move') {
      this.mRemainLife -= 1;
      this.r = this.oriR + this.oriR * 0.4 * Math.cos(2 * Math.PI * t * this.radiusMutateSpeed)
      if(this.mRemainLife > 0 ) {
        this.mRad += 0.1

        this.mX = Math.cos(this.mRad) * this.vRadius + WIDTH * 0.5 - this.bX
        this.mY = Math.sin(this.mRad) * this.vRadius + HEIGHT * 0.5 - this.bY

        const r = (1. - this.mRemainLife / this.mLife);

        this.x = this.bX + this.mX * r
        this.y = this.bY + this.mY * r

      } else {
        this.state = 'void'
        this.vRad = this.mRad
        this.vVel = (Math.random() > 0.5) ? Math.random() * 0.01 : -Math.random() * 0.01
      }

    } else if (state == 'void') {
      this.vRad += this.vVel
      this.r = this.oriR + this.oriR * 0.4 * Math.cos(2 * Math.PI * t * this.radiusMutateSpeed)

      const k = Math.sin(4 * Math.PI * 2 * t * 0.00005) * 10
      this.x = Math.cos(this.vRad) * this.vRadius + WIDTH * 0.5 + k
      this.y = Math.sin(this.vRad) * this.vRadius + HEIGHT * 0.5 + k


    }

  }

  moveLife() {
    this.mLife = Math.random() * 100 + 100;
    this.mInitLife
  }
}

function render(t) {
  context.clearRect(0, 0, WIDTH, HEIGHT)
  context.fillStyle = 'rgba(0,0,0, 1)'
  context.fillRect(0, 0, WIDTH, HEIGHT)

  points.forEach((p, i) => {
    p.draw()
    p.update(t)
  })

  requestAnimationFrame(render)
}

requestAnimationFrame(render)

const socket = require('socket.io-client')('http://localhost:5000/visual')

const aiSignals = [];
const userSignals = [];

let mergedSignals = [];
const points = []
let startTime = -1;
if (socket) {
  socket.on('started', (d) => {
    console.log(d.startTime)
    startTime = d.startTime;
  })

  const signals = []
  const keydowns = {}


  setInterval(() => {
    const now = (new Date()).getTime()

    aiSignals.forEach((signal, i) => {

      if (Math.abs(((now - startTime) / 1000 - signal.time)) < 0.01) {

        if (signal.from == 'ai' && signal.type == 'keyDown') {
          const p = new Point(signal)
          points.push(p)
          aiSignals.splice(i, 1)
        } else if (signal.from == 'ai' && signal.type == 'keyUp') {
          const borns = points.filter((p) => ((p.state == 'born') && p.note == signal.note) && (p.from == signal.from))
          borns.sort((a, b) => a.date > b.date)

          if(borns[0]) {
            borns[0].bornx = borns[0].x
            borns[0].bornY = borns[0].y
            borns[0].state = 'move'
            aiSignals.splice(i, 1)
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
          borns[0].bornx = borns[0].x
          borns[0].bornY = borns[0].y
          borns[0].state = 'move'
        }
      }


      // userSignals.forEach(({note, type, time}, i, signals) => {
      //   if (type == 'keyDown') {
      //     const endSignal = signals.find((s, i_) => {
      //       return (s.note == note && s.type == 'keyUp' && time < s.time)
      //     })
      //     const endTime = (endSignal) ? endSignal.time : -1
      //
      //
      //     mergedSignals.push({
      //       from: 'user',
      //       note,
      //       start: time,
      //       end: endTime,
      //       during: (endTime != -1) ? endTime - time : -1
      //     })
      //   }
      // })
      //
      // aiSignals.forEach(({note, type, time}, i, signals) => {
      //   if (type == 'keyDown') {
      //     const endSignal = signals.find((s, i_) => {
      //       return (s.note == note && s.type == 'keyUp' && time < s.time)
      //     })
      //     const endTime = (endSignal) ? endSignal.time : -1
      //
      //     mergedSignals.push({
      //       from: 'ai',
      //       note,
      //       start: time,
      //       end: endTime,
      //       during: (endTime != -1) ? endTime - time : -1
      //     })
      //
      //   }
      // })
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

const notes = 'asdfghjkl'

class Point {
  constructor({time, note, from}) {
    this.time = time
    this.from = from
    this.note = note

    this.init()
  }

  init() {
    const { note, from } = this

    this.x = (WIDTH - 200) * ( (note - 48) / (71 - 48)) + 100 + (Math.random() - 0.5) * 2 //(2 * Math.random() - 1)

    this.y = (from == 'user') ? HEIGHT - HEIGHT_MARGIN + 10 * Math.random() : HEIGHT_MARGIN + 10 * Math.random() //(2 * Math.random() - 1)
    this.r = 1
    this.state = 'born'
    this.color = [parseInt(Math.random() * 255), parseInt(Math.random() * 255), parseInt(Math.random() * 255)]

    this.dir = (from == 'user') ? 1 : -1
    this.life = BASE_LIFE + LIFE * Math.random()
    this.remainLife = this.life
  }

  draw() {
    const { x, y, r, color } = this

//    console.log(this.from, x, y, r)
    const grad  = context.createRadialGradient(x, y, 0, x, y, r);
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    grad.addColorStop(0, 'rgba(' + color[0] + ',' + color[1] + ',' + color[2] + ',1)');
    context.fillStyle = grad

    context.beginPath()
    context.arc(x, y, r, 0, 2 * Math.PI, false)
    context.closePath()
    context.fill()
  }

  update() {
    const {time, note, from, state, life, dir} = this

    if (state == 'born') {
      const now = ((new Date()).getTime() - startTime) / 1000

      if(now > time) {
        this.r =  Math.pow((now - time) * 10, 1 + 0.5 * Math.random()) * 4

      }
    } else if (state == 'move') {
      this.remainLife -= 1;

      if(this.remainLife > 0 )
        this.y = this.bornY - dir * (HEIGHT - HEIGHT_MARGIN) * 0.5 * (life - this.remainLife) / life
    }

  }
}

function render() {
  context.clearRect(0, 0, WIDTH, HEIGHT)
  context.fillStyle = 'rgba(0,0,0, 1)'
  context.fillRect(0, 0, WIDTH, HEIGHT)

  points.forEach((p, i) => {
    p.draw()
    p.update()
  })

  requestAnimationFrame(render)
}

requestAnimationFrame(render)

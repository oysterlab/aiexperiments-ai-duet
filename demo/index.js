const socket = require('socket.io-client')('http://localhost:5000/visual')

const aiSignals = [];
const userSignals = [];

let mergedSignals = [];
let startTime = -1;
if (socket) {
  socket.on('started', (d) => {
    console.log(d.startTime)
    startTime = d.startTime;
  })

  socket.on('toss-signal', (signal) => {
    mergedSignals = [];

    (signal.from == 'user') ?
      userSignals.push(signal) : aiSignals.push(signal)
    //   console.log("user_signals", userSignals);
    //   console.log("ai_signals", aiSignals);

      userSignals.forEach(({note, type, time}, i, signals) => {
        if (type == 'keyDown') {
          const endSignal = signals.find((s, i_) => {
            return (s.note == note && s.type == 'keyUp' && time < s.time)
          })
          const endTime = (endSignal) ? endSignal.time : -1

          mergedSignals.push({
            from: 'user',
            note,
            start: time,
            end: endTime,
            during: (endTime != -1) ? endTime - time : -1
          })
        }
      })

      aiSignals.forEach(({note, type, time}, i, signals) => {
        if (type == 'keyDown') {
          const endSignal = signals.find((s, i_) => {
            return (s.note == note && s.type == 'keyUp' && time < s.time)
          })
          const endTime = (endSignal) ? endSignal.time : -1

          mergedSignals.push({
            from: 'ai',
            note,
            start: time,
            end: endTime,
            during: (endTime != -1) ? endTime - time : -1
          })

        }
      })
  })
}

const WIDTH = window.innerWidth
const HEIGHT = window.innerHeight

const canvas = document.createElement('canvas')
canvas.width = WIDTH
canvas.height = HEIGHT

document.body.appendChild(canvas)
const context = canvas.getContext('2d')

function render(t) {

  context.fillStyle = '#000'
  context.fillRect(0, 0, WIDTH, HEIGHT)

  const hGap = HEIGHT / 30;
  const now = ((new Date()).getTime() - startTime) / 1000.;

  // context.beginPath()
  // context.fillStyle = '#f0f'
  // context.fillRect(100, 100, now * 5, 20)
  // context.closePath()

  mergedSignals.forEach(({from, signal, note, start, end, during}) => {
    let x = start * 40 - now * 25.
    const y = (note - 46) * hGap
    const h = hGap

    let w = ((during == -1) ? now - start : during)

    if(from == 'ai') {
      w = (during + now - end)
      w = (w > during) ? during : w

      if(w < 0) w = 0
    }

    w *= 40;

    // if(during == -1)
    //   console.log((new Date()).getTime(), startTime, start, w)

    context.beginPath()
    context.fillStyle = (from == 'user') ? '#fff' : '#f0f'
    context.rect(x, y, w, h);
    context.fill()
    context.closePath()
  })
  requestAnimationFrame(render)
}

requestAnimationFrame(render)

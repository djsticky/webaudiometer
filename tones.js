let audioCtx

const startBtn = document.querySelector("button:nth-of-type(1)")
const susresBtn = document.querySelector("button:nth-of-type(2)")
const stopBtn = document.querySelector("button:nth-of-type(3)")

const timeDisplay = document.querySelector("p")

susresBtn.setAttribute("disabled", "disabled")
stopBtn.setAttribute("disabled", "disabled")

const leftGainDict = {
  500: 0.012,
  1000: 0,
  2000: 0.9,
  3000: 0.065,
  4000: 0.11,
  6000: 0.045,
  8000: 0.31,
}

let caldata
const url = "./caldata.json"

// Fetch calibration data from json file
const getCalData = fetch(url)
  .then((r) => r.json())
  .then((data) => {
    return data
  })

window.onload = async () => {
  caldata = await getCalData

  startBtn.onclick = function () {
    startBtn.setAttribute("disabled", "disabled")
    susresBtn.removeAttribute("disabled")
    stopBtn.removeAttribute("disabled")

    // Create web audio api context
    AudioContext = window.AudioContext || window.webkitAudioContext
    audioCtx = new AudioContext()

    // Create oscillator, panner and gain node
    const oscillator = audioCtx.createOscillator()
    const gainNode = audioCtx.createGain()
    const channel = document.getElementById("pan").value
    const pannerOptions = { pan: channel}
    const panner = new StereoPannerNode(audioCtx, pannerOptions)

    // Connect oscillator to gain node to speakers

    oscillator.connect(gainNode).connect(panner).connect(audioCtx.destination)

    // Setup oscillator
    const freq = document.getElementById("freq").value
    const selectedVol = document.getElementById("volume").value
    const vol = leftGainDict[freq] + caldata.left.left1000Hz[selectedVol]

    console.log("Selected Frequency: " + freq)
    console.log("Selected Volume: " + selectedVol)
    console.log("Current gain setting: " + vol)

    oscillator.type = "sine"
    oscillator.frequency.value = freq
    gainNode.gain.value = vol

    // Start oscillator
    oscillator.start(0)

    // Report the state of the audio context to the
    // console, when it changes

    audioCtx.onstatechange = function () {
      console.log("Context " + audioCtx.state)
    }
  }

  // Suspend/resume the audiocontext

  susresBtn.onclick = function () {
    if (audioCtx.state === "running") {
      audioCtx.suspend().then(function () {
        susresBtn.textContent = "Resume tone"
      })
    } else if (audioCtx.state === "suspended") {
      audioCtx.resume().then(function () {
        susresBtn.textContent = "Suspend tone"
      })
    }
  }

  // Close the audiocontext

  stopBtn.onclick = function () {
    audioCtx.close().then(function () {
      startBtn.removeAttribute("disabled")
      susresBtn.setAttribute("disabled", "disabled")
      stopBtn.setAttribute("disabled", "disabled")
    })
  }
}

function displayTime() {
  if (audioCtx && audioCtx.state !== "closed") {
    timeDisplay.textContent =
      "Current context time: " + audioCtx.currentTime.toFixed(3)
  } else {
    timeDisplay.textContent = "Current context time: No context exists."
  }
  requestAnimationFrame(displayTime)
}

displayTime()

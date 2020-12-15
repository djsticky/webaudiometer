let audioCtx
let caldata

const startBtn = document.querySelector("#start")
const susresBtn = document.querySelector("#susres")
const stopBtn = document.querySelector("#stop")
const channel = document.querySelector("#pan")
const freq = document.querySelector("#freq")
const selecteddBHL = document.querySelector("#volume")
const timeDisplay = document.querySelector("p, #ctx-time")

const url = "./caldata.json"

susresBtn.setAttribute("disabled", "disabled")
stopBtn.setAttribute("disabled", "disabled")


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
    const pannerOptions = { pan: channel.value}
    const panner = new StereoPannerNode(audioCtx, pannerOptions)

    // Connect oscillator to gain node to speakers

    oscillator.connect(gainNode).connect(panner).connect(audioCtx.destination)

    // Setup oscillator
    const gain = setGain(channel.value, freq.value, selecteddBHL.value, caldata)

    console.log("Selected Frequency: " + freq.value)
    console.log("Selected Volume: " + selecteddBHL.value)
    console.log("Current gain setting: " + gain)

    oscillator.type = "sine"
    oscillator.frequency.value = freq.value
    gainNode.gain.value = gain

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
    //gainNode.gain.exponentialRampToValueAtTime(0.00001, audioCtx.currentTime + 0.05)
    audioCtx.close().then(function () {
    startBtn.removeAttribute("disabled")
    susresBtn.setAttribute("disabled", "disabled")
    stopBtn.setAttribute("disabled", "disabled")
   })
  }
}

function setGain(channel, freq, selecteddB, calValues)  {
    // This seems terrable, how do better?
    // Finding left or right channel, filtering to selected frequency which returns an array
    // Using shift() to return the first (and only) element which is a JSON object
    // Selecting the appropriate gain offset for the selected dB
  if(channel === "-1"){
    let channelValues = calValues.left.filter(x => x.freq === "left" + freq + "Hz" ).shift()
    return channelValues[selecteddB]
  } else {
    let channelValues = calValues.right.filter(x => x.freq === "right" + freq + "Hz" ).shift()
    return channelValues[selecteddB]
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

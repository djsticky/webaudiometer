let audioCtx
let caldata
let calValue

const startBtn = document.querySelector("#start")
const susresBtn = document.querySelector("#susres")
const stopBtn = document.querySelector("#stop")
const channel = document.querySelector("#pan")
const freq = document.querySelector("#freq")
const selecteddBHL = document.querySelector("#volume")
const timeDisplay = document.querySelector("p, #ctx-time")
const startCalBtn = document.querySelector("#start-cal")
const setCalBtn = document.querySelector("#set-cal")
const refOutputValue = document.querySelector("#ref-output-value")

const url = "./caldata.json"
const gainRef = .417

susresBtn.setAttribute("disabled", "disabled")
stopBtn.setAttribute("disabled", "disabled")

const delay = ms => new Promise(res => setTimeout(res, ms));

// Fetch calibration data from json file
const getCalData = fetch(url)
  .then((r) => r.json())
  .then((data) => {
    return data
  })

window.onload = async () => {
  caldata = await getCalData

  // startBtn.onclick = async function () {
  //   for (let i = 0; i < 3; i++){
  //     playTone()
  //     await delay(300)
  //   }
  // }
  // Start the audiocontext
  startBtn.onclick = playTone

  // Close the audiocontext
  stopBtn.onclick = stopTone

  // Start the call tone
  startCalBtn.onclick = startCal

  // Generate the corrected cal value based on db difference from ref
  setCalBtn.onclick = setCal

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


}
// This seems terrable, how do better?
// Finding left or right channel, filtering to selected frequency which returns an array
// Using shift() to return the first (and only) element which is a JSON object
// Selecting the appropriate gain offset for the selected dB
function setGain(channel, freq, selecteddB, calValues) {
  if (channel === "-1") {
    let channelValues = calValues.left
      .filter((x) => x.freq === "left" + freq + "Hz")
      .shift()
    return channelValues[selecteddB]
  } else {
    let channelValues = calValues.right
      .filter((x) => x.freq === "right" + freq + "Hz")
      .shift()
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

function getAmpValue(dbVal, refVal){
	// dB = 20log(i/iRef)
  console.log("Calculating amp from desired dB change")
	console.log("dB of:  " + dbVal)
	dbVal = dbVal / 20
	dbVal = Math.pow(10, dbVal)
	const answer = dbVal * refVal
	console.log("Reference value of:  " + refVal)
	console.log("Power value is:  " + answer)

	return answer
}
function stopTone() {
  //gainNode.gain.exponentialRampToValueAtTime(0.00001, audioCtx.currentTime + 0.05)
  audioCtx.close().then(function () {
    startBtn.removeAttribute("disabled")
    susresBtn.setAttribute("disabled", "disabled")
    stopBtn.setAttribute("disabled", "disabled")
  })
}


async function playTone() {
  startBtn.setAttribute("disabled", "disabled")
  susresBtn.removeAttribute("disabled")
  stopBtn.removeAttribute("disabled")

  // Create web audio api context
  AudioContext = window.AudioContext || window.webkitAudioContext
  audioCtx = new AudioContext()

  // Create oscillator, panner and gain node
  const oscillator = audioCtx.createOscillator()
  const gainNode = audioCtx.createGain()
  const pannerOptions = { pan: channel.value }
  const panner = new StereoPannerNode(audioCtx, pannerOptions)

  // Connect oscillator to gain node to speakers

  oscillator.connect(gainNode).connect(panner).connect(audioCtx.destination)

  // Setup oscillator
  //const gain = setGain(channel.value, freq.value, selecteddBHL.value, caldata)
  const gain = calValue ?? gainRef
 
  console.log("Selected Frequency: " + freq.value)
  console.log("Selected Volume: " + selecteddBHL.value)
  console.log("Current gain setting: " + gain)

  oscillator.type = "sine"
  oscillator.frequency.value = freq.value
  gainNode.gain.value = gain

  // Start oscillator
  oscillator.start()
  //oscillator.stop(audioCtx.currentTime + .3)
}

async function startCal() {
  startBtn.setAttribute("disabled", "disabled")
  susresBtn.removeAttribute("disabled")
  stopBtn.removeAttribute("disabled")

  // Create web audio api context
  AudioContext = window.AudioContext || window.webkitAudioContext
  audioCtx = new AudioContext()

  // Create oscillator, panner and gain node
  const oscillator = audioCtx.createOscillator()
  const gainNode = audioCtx.createGain()
  const pannerOptions = { pan: channel.value }
  const panner = new StereoPannerNode(audioCtx, pannerOptions)

  // Connect oscillator to gain node to speakers

  oscillator.connect(gainNode).connect(panner).connect(audioCtx.destination)

  // Setup oscillator
  const gain = .417

  console.log("Selected Frequency: " + freq.value)
  console.log("Selected Volume: " + selecteddBHL.value)
  console.log("Current gain setting: " + gain)

  oscillator.type = "sine"
  oscillator.frequency.value = freq.value
  gainNode.gain.value = gain

  // Start oscillator
  oscillator.start()
  //oscillator.stop(audioCtx.currentTime + .3)
}

function setCal() {
  //Assume gainRef should hit 90dB HL
  const dbDiff = 90 - refOutputValue.value
  const ampDiff = gainRef - getAmpValue(dbDiff, gainRef)

  console.log("ampDiff is:  " + ampDiff)
  calValue = gainRef - ampDiff
  stopTone()
}

displayTime()

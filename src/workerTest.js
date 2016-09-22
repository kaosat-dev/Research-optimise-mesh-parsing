export default function workerTest (rawData) {
  const worker = new Worker('src/worker.js')
  let startTime
  let endTime

  worker.onmessage = function (event) {
    console.log('on message', event.data)
    console.log('data size', event.data.positions.byteLength)
    // const positions = new Float32Array(event.data.positions)
    // const normals = new Float32Array(event.data.normals)
    endTime = new Date()

    console.log('elapsed', endTime - startTime)
  }

  worker.onerror = function (event) {
    console.error(event)
  // console.error(`filename:${event.filename} lineno: ${event.lineno} error: ${event.message}`)
  }

  let data = {size: 999999999, data: rawData} // 1048576*128}
  console.log('rawData', rawData)
  startTime = new Date()
  worker.postMessage(data) // , [data])
}
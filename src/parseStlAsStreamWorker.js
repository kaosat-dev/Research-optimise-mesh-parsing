const through2 = require('through2')
const concat = require('concat-stream')
const Writable = require('stream').Writable
import { default as makeStlStreamParser } from './parsers/stl/parseStream'

import workerStreamParser from './workers/spawners/streamWorkerSpawner2'

export default function parseStlAsStreamWorker (fileReaderStream, files) {
  let startTime
  let endTime

  let accData
  let accPositions
  let accNormals

  const chunkSize = 512 // 1100

  function before(chunk, enc, callback) {
    console.log('here before worker', chunk)
    callback(null, chunk)
  }

  function after(chunk, enc, callback) {
    console.log('here after worker', chunk)
    callback(null, chunk)
  }


  const Duplex = require('stream').Duplex
  class Formatter extends Duplex {
    constructor () {
      super({readableObjectMode:true})
      this.body = []

      function bufferConcat (parts) {
        var bufs = []
        for (var i = 0; i < parts.length; i++) {
          var p = parts[i]
          if (Buffer.isBuffer(p)) {
            bufs.push(p)
          } else if (isBufferish(p)) {
            bufs.push(new Buffer(p))
          } else {
            bufs.push(new Buffer(String(p)))
          }
        }
        return Buffer.concat(bufs)
      }
      function prepareResult(data){
        let positions = data.slice(0, data.length / 2)
        let normals = data.slice(data.length / 2)

        positions = new Float32Array(positions.buffer.slice(positions.byteOffset, positions.byteOffset + positions.byteLength)) //
        normals = new Float32Array(normals.buffer.slice(normals.byteOffset, normals.byteOffset + normals.byteLength))
        return {positions, normals}
      }
      this.on('finish', function () {
        const result = prepareResult(bufferConcat(this.body))
        //console.log('all done', result)
        this.push(result)
        this.emit('end')
       })
    }

    _read(size) {
    //  console.log('read')
    }
    _write(chunk, encoding, callback) {
      //console.log('chunk',chunk)
      this.body.push(chunk)
      callback()
    }
    end(chunk, encoding, callback){
      //console.log('end', chunk ,encoding, callback)
      const self = this
      setTimeout(() => self.emit('finish'), 0.1)
    }
  }
  /*function makeFormatter(){
    let body = []
    const f =  Duplex({
      writableObjectMode : true
      read(size) {
        console.log('read', size)
      },
      write(chunk, encoding, callback) {
        console.log('foo', body)
        body.push(chunk)
        callback()
      },
      end(){
        console.log(end)
      }
    })
    return f
  }*/

  const formatter = new Formatter()// makeFormatter()


  const fileStream = fileReaderStream(files[0], {chunkSize: chunkSize * chunkSize})
  const wokerStreamer = workerStreamParser()
  startTime = new Date()

  let pipeline = fileStream
    //.pipe(through2(before))
    .pipe(wokerStreamer)
    //.pipe(through2(after))
    .pipe(formatter)
    .pipe(through2({ objectMode: true}, function(data, enc, callback){
      const {positions, normals} = data
      //console.log('first', positions[0], 'last item in positions', positions[positions.length-1])
      endTime = new Date()
      console.log(`Mode: streaming, worker, chunkSize: ${chunkSize}kb, elapsed: ${endTime - startTime}, geometry size: ${positions.byteLength}`)
    }))


    /*.pipe(concat(function (data) {
      //console.log('FUUUUend of data',data)
      accPositions = data.slice(0, data.length / 2)
      accNormals = data.slice(data.length / 2)

      accPositions = new Float32Array(accPositions.buffer.slice(accPositions.byteOffset, accPositions.byteOffset + accPositions.byteLength)) //
      accNormals = new Float32Array(accNormals.buffer.slice(accNormals.byteOffset, accNormals.byteOffset + accNormals.byteLength))

      //accPositions = accPositions.buffer.slice(accPositions.byteOffset, accPositions.byteOffset + accPositions.byteLength) //
      //accNormals = accNormals.buffer.slice(accNormals.byteOffset, accNormals.byteOffset + accNormals.byteLength)

      // accPositions = new Float32Array(accPositions.buffer, accPositions.byteOffset, accPositions.byteLength / Float32Array.BYTES_PER_ELEMENT)
      // accNormals = new Float32Array(accNormals.buffer, accNormals.byteOffset, accNormals.byteLength / Float32Array.BYTES_PER_ELEMENT)

    }))*/

  /*pipeline.on('finish', function () {
    accData = {
      positions: accPositions,
      normals: accNormals
    }
    console.log('first', accPositions[0], 'last item in positions', accPositions[accPositions.length-1])

    //console.log('done', accData)
    endTime = new Date()
    console.log(`Mode: streaming, worker, chunkSize: ${chunkSize}kb, elapsed: ${endTime - startTime}, geometry size: ${accData.positions.byteLength}`)
  })*/
}

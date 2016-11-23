import fileReaderStream from 'filereader-stream'
import readFileBasic from './readFileBasic'
import workerSpawner from './workers/spawners/workerSpawner'
import streamWorkerSpawner from './workers/spawners/streamWorkerSpawner'
import parseStlAsStreamNoWorker from './parseStlAsStreamNoWorker'
import parseStlAsStreamWorker from './parseStlAsStreamWorker'

// var foo = require('./workers/spawners/testSpawnWorker')

// helper for file size display from http://stackoverflow.com/questions/15900485/correct-way-to-convert-size-in-bytes-to-kb-mb-gb-in-javascript
function formatBytes (bytes, decimals) {
  if (bytes === 0) return '0 Byte'
  var k = 1000 // or 1024 for binary
  var dm = decimals + 1 || 3
  var sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
  var i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
}

// not worker based, for dev/testing
import { default as makeStlStreamParser } from './parsers/stl/parseStream'
function repeat (times, fn, params) {
  for (var i = 0; i < times; i++) {
    fn(params)
  }
}

function handleFileSelect (e) {
  e.stopPropagation()
  e.preventDefault()

  // files is a FileList of File objects. List some properties.
  let files = []
  for (var i = 0, f; f = e.dataTransfer.files[i]; i++) {
    files.push(f)
  }
  let output = files.map(function (f) {
    return `<li>
      <strong> ${escape(f.name)} </strong> (${f.type || 'n/a' }) - ${f.size} bytes,
      last modified: ${f.lastModifiedDate ? f.lastModifiedDate.toLocaleDateString() : 'n/a'}
      </li>`
  })

  document.getElementById('list').innerHTML = '<ul>' + output.join('') + '</ul>'

  const testCount = 1

  function testRunTransferable () {
    readFileBasic(files[0]).then(workerSpawner.bind(null, {transferable: true}))
  }

  function testRunCopy () {
    readFileBasic(files[0]).then(workerSpawner.bind(null, {transferable: false}))
  }

  function testRunStreamBlock () {
    const concat = require('concat-stream')

    // for STL
    const workerStream = streamWorkerSpawner.bind(null, {transferable: false})()
    fileReaderStream(files[0], {chunkSize: 9999999999}).pipe(workerStream)
  /*.pipe(concat(function(data) {
    console.log('after worker')
  }))*/
  }

  function testRunStream () {
    const concat = require('concat-stream')
    // const unzipper = require('unzipper')
    // const unzip = require('unzip')
    const JSZip = require('jszip')
    const sax = require('sax')
    //const xmlParser = require('xml-streamer') // fails to load
    const xmlSplit = require('xmlsplit') //does not work/unclear api

    const sourceStream = fileReaderStream(files[0], {chunkSize: 64000})

    const startTime = new Date()

    const xmlStream = sax.createStream(true, {trim: true})
    //const xmlStream = new xmlParser()
    //const xmlStream = new xmlSplit()

    function onTagOpen (tag) {
      // console.log("onTagOpen",tag)
    }

    function onTagClose (tag) {
      console.log('onTagClose', tag)

    }
    function onTagText (text) {
      console.log('text', text) // , this._parser.tag)
    }

    function onParseEnd(){
      const endTime = new Date()
      console.log(`done ! elapsed: ${endTime - startTime} ms`)
    }
    // saxStream.on('opentag', onTagOpen)
    // saxStream.on('closetag', onTagClose)
    // saxStream.on('text', onTagText)
    xmlStream.on('end', onParseEnd)


    const fData = sourceStream.pipe(concat(function (data) {
      new JSZip().loadAsync(data).then(function (zip) {
        if (zip.files && zip.files['3D'] !== null) {
          const fileStream = zip.file('3D/3dmodel.model').nodeStream()
          fileStream
            .pipe(xmlStream)
        }
      })
      return data
    }))
  }

  console.log(`Results for file size: ${formatBytes(files[0].size)}`)

  // repeat(testCount, testRunTransferable, files[0])
  // repeat(testCount, testRunCopy, files[0])
  // repeat(testCount, testRunStreamBlock, files[0])

  // parseStlAsStreamNoWorker(fileReaderStream, files)
  // parseStlAsStreamWorker(fileReaderStream, files)
  testRunStream()
}

function handleDragOver (e) {
  e.stopPropagation()
  e.preventDefault()
  e.dataTransfer.dropEffect = 'copy' // Explicitly show this is a copy.
}

// Setup the dnd listeners.
let dropZone = document.getElementById('drop_zone')
dropZone.addEventListener('dragover', handleDragOver, false)
dropZone.addEventListener('drop', handleFileSelect, false)

import { SerialPort } from 'serialport'
const port = new SerialPort({ path: '/dev/ttyACM0', baudRate: 115200 })

port.write('{"ps": 2}', function (err) {
    if (err) {
        return console.log('Error on write: ', err.message)
    }
    console.log('message written')
})

// Open errors will be emitted as an error event
port.on('error', function (err) {
    console.log('Error: ', err.message)
})

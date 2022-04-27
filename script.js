const fs = require('fs')
const Buffer = require('buffer').Buffer

const readData = (err, fd, fileSize) => {
    if (err) throw err

    let buffer = Buffer.alloc(fileSize, 'ascii')
    fs.readSync(fd, buffer, 0, fileSize, null)

    let prev = String.fromCharCode(0)
    let dict = {}
    dict[prev] = { count: 1, next: {} }

    for (let i = 0; i < fileSize; ++i) {
        let current = String.fromCharCode(buffer[i])

        if (!(current in dict)) dict[current] = { count: 0, next: {} }
        if (!(current in dict[prev].next)) dict[prev].next[current] = 0

        dict[current].count++
        dict[prev].next[current]++
        prev = current
    }

    let [entropy, entropy_cond] = [0, 0]
    for (const symbol in dict) {
        if (Object.hasOwnProperty.call(dict, symbol)) {
            const prev_num = dict[symbol].count
            const prev_fr = prev_num / fileSize
            entropy += prev_fr * Math.log2(prev_fr)
            let cond = 0
            for (const next_symbol in dict[symbol].next) {
                if (Object.hasOwnProperty.call(dict[symbol].next, next_symbol)) {
                    const next_num = dict[symbol].next[next_symbol]
                    const next_fr = next_num / dict[next_symbol].count
                    cond += next_fr * Math.log2(next_fr)
                }
            }
            entropy_cond += prev_fr * cond
        }
    }

    return { entropy: Math.abs(entropy).toFixed(4), entropy_cond: Math.abs(entropy_cond).toFixed(4), delta_entropy: Math.abs(entropy - entropy_cond).toFixed(4) }
}

const readFromFile = (fileName, callback) => {
    let fileSize = fs.statSync(fileName).size
    fs.open(fileName, 'r', (err, fd) => callback(fileName, readData(err, fd, fileSize)))
}

for (const name of process.argv.slice(2)) {
    readFromFile(name, console.log)
}

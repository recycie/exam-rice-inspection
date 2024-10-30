import fs from 'fs'
import path from 'path'

const standardFile = '../../data/standards.json'

export async function Standards() {
    const dataPath = path.join(__dirname, standardFile)

    try {
        const data = await fs.promises.readFile(dataPath, 'utf8')
        return JSON.parse(data)
    } catch (err) {
        console.error('Error reading or parsing JSON file:', err)
        return [null]
    }
}

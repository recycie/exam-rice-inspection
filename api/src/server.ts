import express, { Request, Response, RequestHandler } from 'express'
import { MongoClient, Db, ObjectId } from 'mongodb'
import cors from 'cors'
import dotenv from 'dotenv'
import { Standards } from "./controllers/standards"

dotenv.config()

const standardJsonData = Standards()
const PORT = process.env.PORT || 5000
const MONGO_URI = process.env.MONGO_URI as string || ""
const MONGO_DB = process.env.MONGO_DB as string || ""
const app = express()
app.use(cors())
app.use(express.json({ limit: '5mb' }))
app.use(express.urlencoded({ limit: '5mb', extended: true }))

interface historyParams {
    id: string
}

interface Grain {
    length: number
    weight: number
    shape: string
    type: string
}

interface Standard {
    id: number
    key: string
    minLength: number
    maxLength: number
    shape: string[]
    name: string
    conditionMin: string
    conditionMax: string
    value: number
    standardData: Standard[]
}

let db: Db
const inspectionsCollection = 'inspections'

// Initialize MongoDB client
MongoClient.connect(MONGO_URI)
    .then(client => {
        db = client.db(MONGO_DB)
        console.log('Connected to MongoDB: ', MONGO_DB)
    })
    .catch(error => console.error('MongoDB connection error:', error))

// Get inspection histories
app.get('/standard', async (req: Request, res: Response) => {
    try {
        const resolvedStandardJsonData = await Promise.resolve(standardJsonData)

        res.status(200).json({ data: resolvedStandardJsonData })
    } catch (error) {
        res.status(500).json({ message: 'Error retrieving histories', error })
    }
})

// Get inspection histories
app.get('/history', async (req: Request, res: Response) => {
    try {
        // Pagination parameters
        const page = parseInt(req.query.page as string) || 1
        const limit = 10
        const skip = (page - 1) * limit

        const searchId = req.query.id as string
        const fromDate = req.query.from as string 
        const toDate = req.query.to as string

        const filter: any = {}

        if (searchId) {
            filter.inspectionID = searchId
        }

        if (fromDate && toDate) {
            filter.createDate = {
                $gte: new Date(fromDate),
                $lte: new Date(toDate) 
            }
        }

        const totalCount = await db.collection(inspectionsCollection).countDocuments(filter)

        const histories = await db.collection(inspectionsCollection)
            .find(filter)
            .skip(skip)
            .limit(limit)
            .toArray()

        res.status(200).json({
            total: totalCount,
            currentPage: page,
            totalPages: Math.ceil(totalCount / limit),
            data: histories
        })
    } catch (error) {
        res.status(500).json({ message: 'Error retrieving histories', error })
    }
})

app.get('/history/:id', async (req: Request<historyParams>, res: Response) => {
    const { id } = req.params
    
    try {
        const history = await db.collection(inspectionsCollection).findOne({
            inspectionID: id
        })
        
        if (!history) {
            res.status(404).json({ message: 'Inspection not found' }) 
        }

        res.status(200).json(history)
    } catch (error) {
        console.error('Error retrieving history:', error)
        res.status(500).json({ message: 'Error retrieving inspection history' })
    }
})

// Add new inspection history
app.post('/history', async (req: Request, res: Response) => {
    const {
        name,
        note,
        standardName,
        samplingDate,
        samplingPoint,
        price,
        raw
    } = req.body
    let standardID

    const resolvedStandardJsonData = await Promise.resolve(standardJsonData)

    const inspectionCalculated = Object.entries(resolvedStandardJsonData).flatMap(([inspectionKey, inspectionValue]) => {
        const grainValue = inspectionValue as Standard

        if (grainValue.name == standardName) {
            standardID = grainValue.id
            return Object.entries(grainValue.standardData).flatMap(([standardKey, standardValue]) => {
                const standard = standardValue as Standard
                standard.value = 0
                Object.entries(raw.grains).flatMap(([inspectionKey, inspectionValue]) => {
                    const inspection = inspectionValue as Grain
                    let condtionMax, conditionMin
                    
                    if(standard.conditionMax == "LT"){
                        condtionMax = inspection.length < standard.maxLength
                    }else{
                        condtionMax = inspection.length <= standard.maxLength
                    }

                    if(standard.conditionMin == "GT"){
                        conditionMin = inspection.length > standard.minLength
                    }else{
                        conditionMin = inspection.length >= standard.minLength
                    }

                    (condtionMax && conditionMin) && (standard.value+=1)
                })

                standard.value = Number(((standard.value/raw.grains.length)*100).toFixed(2))
                return standard
            })
        }
        return []
    })

    const insertHistory = {
        name,
        createDate: new Date(),
        imageLink: raw.imageURL,
        inspectionID: String(new ObjectId()),
        standardID: standardID,
        note,
        standardName,
        samplingDate: new Date(samplingDate),
        samplingPoint,
        price,
        standardData: inspectionCalculated
    }

    try {
        const result = await db.collection(inspectionsCollection).insertOne(insertHistory)
        res.status(201).json(result)
    } catch (error) {
        res.status(400).json({ message: 'Error creating history', error })
    }
})

// Delete inspection histories by inspectionID array
app.delete('/history', async (req: Request, res: Response) => {
    const { inspectionID } = req.body
    
    try {
        const result = await db.collection(inspectionsCollection).deleteMany({ inspectionID: { $in: inspectionID } })
        if(result.deletedCount > 0){
            res.status(200).json({ message: `Inspections is deleted` })
        }else{
            res.status(400).json({ message: `not found inspections` })
        }
    } catch (error) {
        res.status(500).json({ message: 'Error deleting histories', error })
    }
})

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`)
})

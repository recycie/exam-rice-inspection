"use client"
import { useState, useEffect } from "react"
import Link from 'next/link'

export interface CompositionItem {
    name: string
    standard: string
    actual: string
}

export interface DefectRiceItem {
    name: string
    actual: string
}

export interface InspectionData {
    createDate: string
    imageLink: string
    inspectionId: string
    standard: string
    totalSample: number
    updateDateTime: string
    note: string
    price: string
    samplingDate: string
    samplingPoint: string
    composition: CompositionItem[]
    defectRice: DefectRiceItem[]
}

interface InspectionRequest {
    createDate: string
    imageLink: string
    inspectionID: string
    name: string
    note: string
    price: string
    samplingDate: string
    samplingPoint: string
    standardData: string[]
    standardID: string
    standardName: string
    _id: string
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

export default function Result({ params }: { params: { id: string } }) {
    const [resultData, setData] = useState<InspectionData | null>(null)
    const [error, setError] = useState<string | null>(null)
    const API_URL = process.env.API_URL || 'http://localhost:5000'
    const [unwrappedParams, setUnwrappedParams] = useState<{ id: string } | null>(null)

    useEffect(() => {
        const fetchParams = async () => {
            const unwrapped = await params
            setUnwrappedParams(unwrapped)
        }
        fetchParams()
    }, [params])

    useEffect(() => {
        const fetchInspection = async () => {
            if (!unwrappedParams) return

            try {
                const url = `${API_URL}/history/${unwrappedParams.id}`
                const response = await fetch(url)
                if (!response.ok) throw new Error('Failed to fetch data')
                const inspectionDt = await response.json() as InspectionRequest

                const compositionData = (inspectionDt.standardData).map(value => {
                    const item = value as unknown as Standard
                    let standard = ''
                    if ((item.maxLength - item.minLength) > 50) {
                        standard = `>= ${item.minLength}`
                    } else {
                        standard = `${item.minLength} - ${item.maxLength}`
                    }

                    return {
                        name: item.name,
                        standard: standard,
                        actual: `${item.value.toFixed(2)} %` // Format value to 2 decimal places
                    }
                })

                setData({
                    createDate: inspectionDt.createDate,
                    imageLink: inspectionDt.imageLink,
                    inspectionId: inspectionDt.inspectionID,
                    standard: inspectionDt.standardName,
                    totalSample: 0,
                    updateDateTime: "",
                    note: inspectionDt.note,
                    price: inspectionDt.price,
                    samplingDate: inspectionDt.samplingDate,
                    samplingPoint: inspectionDt.samplingPoint,
                    composition: compositionData,
                    defectRice: [
                        { name: "yellow", actual: "0.00 %" },
                        { name: "paddy", actual: "0.00 %" },
                        { name: "damaged", actual: "0.00 %" },
                        { name: "glutinous", actual: "0.00 %" },
                        { name: "chalky", actual: "0.00 %" },
                        { name: "red", actual: "0.00 %" },
                        { name: "Total", actual: "0.00 %" },
                    ],
                })
            } catch (error) {
                setError('Error fetching inspection data: ' + (error as Error).message)
            }
        }

        fetchInspection()
    }, [unwrappedParams])


    if (error) {
        return <div>Error: {error}</div>
    }

    if (!resultData) {
        return <div>No data found</div>
    }

    return (
        <div className="container mx-auto p-4 mt-24 bg-white rounded-md shadow-lg">
            <div className="flex flex-col lg:flex-row gap-6">
                {/* Image Section */}
                <div className="flex-shrink-0">
                    <img width={300} height={400} src="https://easyrice-es-trade-data.s3.ap-southeast-1.amazonaws.com/example-rice.webp" alt="rice" />
                    <div className="mt-4 flex gap-2 justify-end">
                        <Link href="/history">
                            <button className="bg-white text-gray-700 py-2 px-4 rounded-md border border-gray-200 hover:border-gray-300 hover:text-gray-800">
                                Back
                            </button>
                        </Link>
                        <button className="bg-gray-700 text-white py-2 px-4 rounded-md hover:bg-gray-800">
                            Edit
                        </button>
                    </div>
                </div>

                {/* Details Section */}
                <div className="flex-grow bg-gray-50 p-4 rounded-md shadow-md">
                    <div className="bg-white p-4 rounded-md shadow-sm grid grid-cols-2 gap-x-4 gap-y-2 text-sm mb-4">
                        <DetailItem label="Create Date - Time" value={formatDate(resultData.createDate)} />
                        <DetailItem label="Inspection ID" value={resultData.inspectionId} />
                        <DetailItem label="Standard" value={resultData.standard} />
                        <DetailItem label="Total Sample" value={`${resultData.totalSample} kernal`} />
                        <DetailItem label="Update Date - Time" value={resultData.updateDateTime} />
                    </div>
                    <div className="bg-white p-4 rounded-md shadow-sm grid grid-cols-2 gap-x-4 gap-y-2 text-sm mb-4">
                        <DetailItem label="Note" value={resultData.note} />
                        <DetailItem label="Price" value={resultData.price} />
                        <DetailItem label="Date/Time of Sampling" value={formatDate(resultData.samplingDate)} />
                        <DetailItem label="Sampling Point" value={resultData.samplingPoint} />
                    </div>

                    <div className="bg-white p-4 rounded-md shadow-sm text-sm mb-4">
                        <Section title="Composition">
                            <Table columns={["Name", "Standard", "Actual"]} rows={resultData.composition} />
                        </Section>
                    </div>

                    <div className="bg-white p-4 rounded-md shadow-sm text-sm mb-4">
                        <Section title="Defect Rice">
                            <Table columns={["Name", "Actual"]} rows={resultData.defectRice} />
                        </Section>
                    </div>
                </div>
            </div>
        </div >
    )
}

interface DetailItemProps {
    label: string
    value: string
}

function DetailItem({ label, value }: DetailItemProps) {
    return (
        <div>
            <span className="font-semibold">{label}:</span> <div>{value}</div>
        </div>
    )
}

interface SectionProps {
    title: string
    children: React.ReactNode
}

function Section({ title, children }: SectionProps) {
    return (
        <div>
            <h3 className="text-lg font-semibold border-b pb-1">{title}</h3>
            {children}
        </div>
    )
}

interface TableProps<T> {
    columns: string[]
    rows: T[]
}

function Table<T extends CompositionItem | DefectRiceItem>({ columns, rows }: TableProps<T>) {
    return (
        <div className="overflow-auto mt-4">
            <table className="w-full text-left text-sm">
                <thead className="bg-gray-200">
                    <tr>
                        {columns.map((col) => (
                            <th key={col} className="px-4 py-2 font-medium">{col}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {rows.map((row, index) => (
                        <tr key={index} className="border-t">
                            {columns.map((col) => (
                                <td key={col} className="px-4 py-2">{(row as any)[col.toLowerCase()]}</td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}

function formatDate(dateString: string): string {
    if (dateString) {
        const date = new Date(dateString)
        return date.toLocaleString('en-GB', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        })
    }
    return ""
}
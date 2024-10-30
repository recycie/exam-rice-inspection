"use client"
import { useEffect, useState } from "react"
import CreateInspectionModal from "./createinpections"
import Link from 'next/link'
import dotenv from 'dotenv'

dotenv.config()

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

interface Inspection {
  createdtime: string
  id: string
  name: string
  standard: string
  note: string
}

export default function Home() {
  const API_URL = process.env.API_URL || 'http://localhost:5000'

  const [historyData, setHistoryData] = useState<Inspection[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedRows, setSelectRows] = useState<Set<string>>(new Set())
  const [inspectionId, setInspectionId] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const itemsPerPage = 10

  const fetchInspection = async (page: number, id?: string, fromDate?: string, toDate?: string) => {
    try {

      let url = `${API_URL}/history?page=${page}`
      if (id) url += `&id=${id}`
      if (fromDate) url += `&from=${fromDate}`
      if (toDate) url += `&to=${toDate}`

      const response = await fetch(url)
      const data = await response.json()
      const inspectionData: Inspection[] = Object.entries(data.data).map(([key, value]) => {
        const inspectionDt = value as InspectionRequest
        return {
          createdtime: inspectionDt.createDate,
          id: inspectionDt.inspectionID,
          name: inspectionDt.name,
          standard: inspectionDt.standardName,
          note: inspectionDt.note,
        }
      })
      setHistoryData(inspectionData)
      setTotalItems(data.total)
    } catch (error) {
      console.error('Error fetching inspection data:', error)
    }
  }

  const fetchFilteredData = async () => {
    const currentPage = 1
    await fetchInspection(currentPage, inspectionId, startDate || undefined, endDate || undefined)
  }

  useEffect(() => {
    fetchInspection(currentPage)
  }, [])

  const handlePreviousPage = async () => {
    if (currentPage > 1) {
      const newPage = currentPage - 1
      setCurrentPage(newPage)
      await fetchInspection(newPage)
    }
  }

  const handleNextPage = async () => {
    const totalPages = Math.ceil(totalItems / itemsPerPage)
    if (currentPage < totalPages) {
      const newPage = currentPage + 1
      setCurrentPage(newPage)
      await fetchInspection(newPage)
    }
  }

  const handleInspectionDelete = async () => {
    const rows: string[] = Array.from(selectedRows)

    const response = await fetch(`${API_URL}/history`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inspectionID: rows
      }),
    })

    if (response.ok) {
      setSelectRows(new Set())
      await fetchInspection(currentPage)
    }
  }

  const handleClearFilters = () => {
    setInspectionId('')
    setStartDate('')
    setEndDate('')
    fetchFilteredData()
  }

  // Handle checkbox change
  const handleCheckboxChange = (id: string) => {
    const newSelectedIds = new Set(selectedRows)
    if (newSelectedIds.has(id)) {
      newSelectedIds.delete(id)
    } else {
      newSelectedIds.add(id)
    }
    setSelectRows(newSelectedIds)
  }

  // Handle "Check All" checkbox change
  const handleCheckAllChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      const allIds = new Set(historyData.map(data => data.id))
      setSelectRows(allIds)
    } else {
      setSelectRows(new Set())
    }
  }

  const handleInspectionSubmit = async (formData: any) => {
    const response = await fetch(`${API_URL}/history`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formData),
    })

    if (response.ok) {
      await fetchInspection(currentPage)

    }
  }

  return (
    <div>
      <main className="container mx-auto p-4 mt-24">

        {/* Inspection modal */}
        <CreateInspectionModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSubmit={handleInspectionSubmit}
        />

        <div className="flex justify-end mb-4">
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-green-700 hover:bg-green-600 text-white text-sm py-2 px-4 rounded">
            <svg className="w-5 h-5 text-white inline-block mx-1" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
              <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 12h14m-7 7V5" />
            </svg>
            Create Inspection
          </button>
        </div>

        <div className="p-6 bg-white border border-gray-200 rounded-lg mb-6">
          <div className="flex flex-col space-y-4 mb-4">
            <div className="flex flex-col">
              <label htmlFor="inspectionId" className="mb-1 font-semibold text-gray-700">Inspection ID</label>
              <input
                type="text"
                id="inspectionId"
                value={inspectionId}
                onChange={(e) => setInspectionId(e.target.value)}
                placeholder="Inspection ID"
                className="border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>

            <div className="flex space-x-4">
              <div className="flex flex-col w-full">
                <label htmlFor="startDate" className="mb-1 font-semibold text-gray-700">From Date</label>
                <input
                  type="date"
                  id="startDate"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>

              <div className="flex flex-col w-full">
                <label htmlFor="endDate" className="mb-1 font-semibold text-gray-700">To Date</label>
                <input
                  type="date"
                  id="endDate"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-between text-center items-center">
            <span
              onClick={handleClearFilters}
              className="underline decoration-red-600 text-red-600 font-semibold text-sm cursor-pointer">
              Clear Filter
            </span>
            <button
              onClick={fetchFilteredData}
              className="bg-green-700 hover:bg-green-600 text-white text-sm py-2 px-4 rounded flex items-center">
              <svg className="w-4 h-4 text-white inline-block mx-1" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <path stroke="currentColor" strokeLinecap="round" strokeWidth="2.5" d="m21 21-3.5-3.5M17 10a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z" />
              </svg>
              Search
            </button>
          </div>
        </div>

        {selectedRows.size > 0 && (
          <div className="inline-flex items-center mb-6 space-x-2">
            <button
              onClick={handleInspectionDelete}
              className="flex border border-green-700 hover:border-green-600 text-green-700 hover:text-green-600 font-normal py-1.5 px-4 rounded">
              <svg className="w-5 h-5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <path stroke="currentColor" strokeWidth="2" d="M5 7h14m-9 3v8m4-8v8M10 3h4a1 1 0 0 1 1 1v3H9V4a1 1 0 0 1 1-1ZM6 7h12v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V7Z" />
              </svg>
              Delete
            </button>
            <span className="font-medium text-[0.9rem]">Select items: {selectedRows.size} item</span>
          </div>
        )}

        <div className="relative overflow-x-auto shadow-md sm:rounded-lg">
          <table className="w-full text-sm text-left rtl:text-right text-gray-700">
            <thead className="text-xs text-gray-700 uppercase bg-gray-200">
              <tr>
                <th scope="col" className="p-4">
                  <div className="flex items-center">
                    <input
                      checked={historyData.length > 0 && selectedRows.size === historyData.length}
                      onChange={handleCheckAllChange}
                      type="checkbox" className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 dark:focus:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600" />
                    <label className="sr-only">checkbox</label>
                  </div>
                </th>
                <th scope="col" className="px-6 py-3">Created Time</th>
                <th scope="col" className="px-6 py-3">Inspection ID</th>
                <th scope="col" className="px-6 py-3">Name</th>
                <th scope="col" className="px-6 py-3">Standard</th>
                <th scope="col" className="px-6 py-3">Note</th>
              </tr>
            </thead>
            <tbody>
              {historyData.map((data) => (
                <tr key={data.id} className="cursor-pointer hover:bg-gray-100">
                  <td className="w-4 p-4 border border-x-transparent">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={selectedRows.has(data.id)}
                        onChange={() => handleCheckboxChange(data.id)}
                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 dark:focus:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                      />
                      <label className="sr-only">checkbox</label>
                    </div>
                  </td>
                  <td className="border border-x-transparent p-2">
                    <Link href={`/result/${data.id}`} passHref>
                      <span>{formatDate(data.createdtime)}</span>
                    </Link>
                  </td>
                  <td className="border border-x-transparent p-2">
                    <Link href={`/result/${data.id}`} passHref>
                      <span>{data.id}</span>
                    </Link>
                  </td>
                  <td className="border border-x-transparent p-2">
                    <Link href={`/result/${data.id}`} passHref>
                      <span>{data.name}</span>
                    </Link>
                  </td>
                  <td className="border border-x-transparent p-2">
                    <Link href={`/result/${data.id}`} passHref>
                      <span>{data.standard}</span>
                    </Link>
                  </td>
                  <td className="border border-x-transparent p-2">
                    <Link href={`/result/${data.id}`} passHref>
                      <span>{data.note}</span>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <nav className="flex items-center flex-wrap md:flex-row pt-6 space-x-2" aria-label="Table navigation">
          <span className="text-sm font-normal text-gray-500 mb-4 md:mb-0 block w-full md:inline md:w-auto space-x-1">
            <span>{(currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, totalItems)}</span>
            <span>of</span>
            <span>{totalItems}</span>
          </span>
          <div className="flex items-center my-auto">
            <button onClick={handlePreviousPage} disabled={currentPage === 1}>
              <svg className={`w-6 h-6 ${currentPage === 1 ? 'text-gray-300' : 'text-gray-500'}`} aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <path stroke="currentColor" strokeWidth="2" d="m15 19-7-7 7-7"></path>
              </svg>
            </button>
            <button onClick={handleNextPage} disabled={currentPage === Math.ceil(totalItems / itemsPerPage)}>
              <svg className={`w-6 h-6 ${currentPage === Math.ceil(totalItems / itemsPerPage) ? 'text-gray-300' : 'text-gray-800'}`} aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <path stroke="currentColor" strokeWidth="2" d="m9 5 7 7-7 7"></path>
              </svg>
            </button>
          </div>
        </nav>
      </main>
    </div>
  )
}

function formatDate(dateString: string): string {
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
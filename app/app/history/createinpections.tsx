import React, { useState, useEffect } from 'react'
import dotenv from 'dotenv'

dotenv.config()

interface InspectionModal {
  isOpen: boolean
  onClose: () => void
  onSubmit: (formData: any) => void
}

const CreateInspectionModal: React.FC<InspectionModal> = ({ isOpen, onClose, onSubmit }) => {
  const API_URL = process.env.API_URL || 'http://localhost:5000';
  const [formData, setFormData] = useState({
    name: '',
    raw: [] as string[],
    standardName: '',
    standardId: '',
    standardData: [] as string[],
    note: '',
    price: '',
    samplingPoint: [] as string[],
    samplingDate: ''
  })
  const [standardOptions, setStandardOptions] = useState<{ id: string; name: string }[]>([])
  const [inputErrors, setInputErrors] = useState<{ [key: string]: boolean }>({})

  useEffect(() => {
    const fetchStandards = async () => {
      try {
        const response = await fetch(`${API_URL}/standard`)
        const data = await response.json()
        setStandardOptions(data.data)

      } catch (error) {
        console.error('Error fetching standards:', error)
      }
    }
    fetchStandards()
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    if (name === 'samplingPoint') {
      setFormData((prev) => ({
        ...prev,
        samplingPoint: prev.samplingPoint.includes(value)
          ? prev.samplingPoint.filter((point) => point !== value)
          : [...prev.samplingPoint, value],
      }))
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }))
    }

    if (value.trim() && inputErrors[name]) {
      setInputErrors((prev) => ({ ...prev, [name]: false }))
    }
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    
    if (file) {
      const reader = new FileReader();
  
      reader.onload = (event) => {
        try {
          const fileContent = event.target?.result as string;
          const jsonData = JSON.parse(fileContent);
  
          setFormData((prev) => ({ ...prev, raw: jsonData }));
          
        } catch (err) {
          console.error('Error parsing JSON file:', err);
        }
      };
  
      reader.onerror = (err) => {
        console.error('Error reading file:', err);
      };
  
      reader.readAsText(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const newErrors: { [key: string]: boolean } = {}

    if (!formData.name.trim()) newErrors.name = true
    if (!formData.standardData) newErrors.standard = true

    if (Object.keys(newErrors).length > 0) {
      setInputErrors(newErrors)
      return
    }

    onSubmit(formData)
    onClose()
  }

  return (
    isOpen ? (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 transition-opacity duration-300">
        <div className="bg-white rounded-lg p-6 w-full max-w-lg mx-4 md:w-[36rem] transform transition-all duration-300 ease-in-out scale-100">
          <h2 className="text-lg font-bold mb-4">Create Inspection</h2>
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block mb-1">Name*</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={`border rounded p-2 w-full ${inputErrors.name ? 'border-red-500' : 'border-gray-300'
                  }`}
              />
            </div>
            <div className="mb-4">
              <label className="block mb-1">Standard*</label>
              <select
                name="standardName"
                value={formData.standardName}
                onChange={handleChange}
                className={`border rounded p-2 w-full ${inputErrors.standard ? 'border-red-500' : 'border-gray-300'
                  }`}
              >
                <option value=""></option>
                {Object.entries(standardOptions).flatMap(([key, option]) => (
                  <option key={option.name} value={option.name}>
                    {option.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="mb-4">
              <label className="block mb-1">Upload File</label>
              <input
                type="file"
                accept=".json"
                onChange={handleFileChange}
                className="border rounded p-2 w-full border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="mb-4">
              <label className="block mb-1">Note</label>
              <textarea
                name="note"
                value={formData.note}
                onChange={handleChange}
                className="border rounded p-2 w-full border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="mb-4">
              <label className="block mb-1">Price</label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleChange}
                min="0"
                max="100000"
                step="0.01"
                className="border rounded p-2 w-full border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="mb-4">
              <label className="block mb-1">Sampling Point</label>
              <div className="flex flex-wrap gap-2">
                {['Front End', 'Back End', 'Other'].map((point) => (
                  <label key={point} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      name="samplingPoint"
                      value={point}
                      checked={formData.samplingPoint.includes(point)}
                      onChange={handleChange}
                      className="text-blue-500 focus:ring-blue-500"
                    />
                    <span>{point}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="mb-4">
              <label className="block mb-1">Date/Time of Sampling</label>
              <input
                type="datetime-local"
                name="samplingDate"
                value={formData.samplingDate}
                onChange={handleChange}
                className="border rounded p-2 w-full border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={onClose}
                className="bg-red-500 text-white py-2 px-4 rounded mr-2 hover:bg-red-600 transition duration-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-green-700 text-white py-2 px-4 rounded hover:bg-green-800 transition duration-300"
              >
                Submit
              </button>
            </div>
          </form>
        </div>
      </div>
    ) : null
  )
}

export default CreateInspectionModal

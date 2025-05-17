"use client"

import { useState } from "react"
import { useLocation } from "wouter"
import NewContractWizard from "../contracts/NewContractWizard"
import { FileText, UserPlus, Scale, ChevronRight, Plus, Calendar, MessageSquare } from "lucide-react"

const QuickActions = () => {
  const [, navigate] = useLocation()
  const [isContractModalOpen, setIsContractModalOpen] = useState(false)

  const openContractModal = () => {
    console.log("Opening contract creation modal")
    setIsContractModalOpen(true)
  }

  const closeContractModal = () => {
    setIsContractModalOpen(false)
  }

  const navigateToLawyers = () => {
    navigate("/lawyers")
  }

  return (
    <div className="mb-8">
      <div className="flex flex-col md:flex-row md:items-center gap-6">
      <div className="md:w-1/3">
          <h1 className="text-5xl font-bold mb-2">Welcome, Liam!</h1>
          <p className="text-gray-500">Automate tasks and achieve more every day.</p>
        </div>

        <div className="flex-1 overflow-x-auto no-scrollbar p-4">
          <div className="flex gap-4 pb-4 snap-x">
            <button
              onClick={openContractModal}
              className="min-w-[280px] shrink-0 glow-on-hover flex items-center justify-between rounded-xl bg-gradient-to-r from-primary-600 to-primary-700 px-6 py-5 text-white shadow-md transition transform hover:scale-105 relative snap-start"
              style={{ zIndex: 10 }}
            >
              <div>
                <h3 className="font-urbanist text-lg font-semibold text-gray-900">Create Contract</h3>
                <p className="mt-1 text-sm text-gray-500">Start a new legal document</p>
              </div>
              <div className="h-10 w-10 flex items-center justify-center bg-white bg-opacity-20 rounded-full">
                <FileText className="h-5 w-5 bg-gray-100 text-gray-600" />
              </div>
            </button>

            <button className="min-w-[280px] shrink-0 flex items-center justify-between rounded-xl border border-gray-200 bg-white px-6 py-5 shadow-sm transition hover:shadow-md snap-start">
              <div>
                <h3 className="font-urbanist text-lg font-semibold text-gray-900">Connect Client</h3>
                <p className="mt-1 text-sm text-gray-500">Add or invite clients</p>
              </div>
              <div className="h-10 w-10 flex items-center justify-center bg-blue-100 bg-opacity-20 rounded-full">
                <UserPlus className="h-5 w-5 text-blue-600" />
              </div>
            </button>

            <button
              onClick={navigateToLawyers}
              className="min-w-[280px] shrink-0 flex items-center justify-between rounded-xl border border-gray-200 bg-white px-6 py-5 shadow-sm transition hover:shadow-md hover:border-blue-200 hover:bg-blue-50 snap-start"
            >
              <div>
                <h3 className="font-urbanist text-lg font-semibold text-gray-900">Book a Lawyer</h3>
                <p className="mt-1 text-sm text-gray-500">Get expert legal consultation</p>
              </div>
              <div className="h-10 w-10 flex items-center justify-center bg-green-100 bg-opacity-20 rounded-full">
                <Calendar className="h-5 w-5 text-green-600" />
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Contract Creation Modal */}
      {isContractModalOpen && <NewContractWizard isOpen={isContractModalOpen} onClose={closeContractModal} />}
      <style>{styles}</style>
    </div>
  )
}

// Add this CSS class to hide scrollbars
const styles = `
  .no-scrollbar::-webkit-scrollbar {
    display: none;
  }
  
  .no-scrollbar {
    -ms-overflow-style: none;  /* IE and Edge */
    scrollbar-width: none;  /* Firefox */
  }
`

export default QuickActions

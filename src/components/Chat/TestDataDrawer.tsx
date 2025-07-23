
import { X, Database } from 'lucide-react'
import { Button } from '../ui/button'

export interface TestDataDrawerProps {
  testData: Record<string, any>
  testCaseName: string
  onClose: () => void
}

export function TestDataDrawer({ testData, testCaseName, onClose }: TestDataDrawerProps) {
  if (!testData) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-indigo-600" />
            <h2 className="text-lg font-semibold">Test Data - {testCaseName}</h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4">
          <div className="space-y-4">
            {Object.entries(testData).map(([key, value]) => {
              let displayValue: string
              let valueType = 'string'
              
              if (typeof value === 'object' && value !== null) {
                displayValue = JSON.stringify(value, null, 2)
                valueType = 'object'
              } else if (typeof value === 'boolean') {
                displayValue = String(value)
                valueType = 'boolean'
              } else if (typeof value === 'number') {
                displayValue = String(value)
                valueType = 'number'
              } else {
                displayValue = String(value)
                valueType = 'string'
              }
              
              return (
                <div key={key} className="border rounded-lg p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-lg">{key}</h3>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      valueType === 'object' ? 'bg-purple-100 text-purple-800' :
                      valueType === 'boolean' ? (value ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800') :
                      valueType === 'number' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {valueType}
                    </span>
                  </div>
                  
                  <div className="bg-gray-50 rounded-md p-3">
                    {valueType === 'object' ? (
                      <pre className="text-sm whitespace-pre-wrap overflow-x-auto font-mono">
                        {displayValue}
                      </pre>
                    ) : (
                      <div className="text-sm font-mono break-all">
                        {displayValue}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t p-4">
          <div className="flex justify-between items-center text-sm text-muted-foreground">
            <span>{Object.keys(testData).length} data field{Object.keys(testData).length !== 1 ? 's' : ''}</span>
            <Button onClick={onClose} variant="outline">
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

import React, { useEffect, useState } from 'react';
import axios from 'axios';

export default function DemoApiPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await axios.get('http://localhost:5000/api/properties/count?transactionType=For%20Sale');
        setData(response.data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  return (
    <div className="pt-32 pb-20 px-8 min-h-screen bg-gray-50 text-gray-900">
      <div className="max-w-4xl mx-auto space-y-8">
        <h1 className="text-4xl font-serif text-[#183d3b]">Backend API Demo</h1>
        <p className="text-lg">This page demonstrates that the Task 1 data models and Task 2 API endpoint are operational.</p>
        
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="text-xl font-medium mb-4">Live API Response (Task 2)</h2>
          <p className="text-sm text-gray-500 mb-4">Querying <code className="bg-gray-100 px-2 py-1 rounded">GET /api/properties/count?transactionType=For Sale</code></p>
          {loading ? (
            <p>Loading...</p>
          ) : (
            <pre className="bg-gray-900 text-green-400 p-6 rounded-xl overflow-x-auto">
              {JSON.stringify(data, null, 2)}
            </pre>
          )}
        </div>
      </div>
    </div>
  );
}

import React from 'react';

const TicketDetailsMockup = () => {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button className="text-blue-600 mb-4">← Back to Tickets</button>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-2xl font-bold text-gray-800">TKT-001: Cannot access email</h1>
                <div className="flex space-x-3 mt-3">
                  <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-semibold rounded-full">High Priority</span>
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full">Open</span>
                </div>
              </div>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg">Edit Ticket</button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-3">Description</h2>
              <p className="text-gray-700">
                User cannot access their email account. Getting "Connection refused" error when trying to log in via Outlook.
                This started happening after the weekend maintenance.
              </p>
            </div>

            {/* Comments */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Comments</h2>
              <div className="space-y-4">
                <div className="border-b pb-3">
                  <div className="flex justify-between mb-2">
                    <span className="font-medium">John Doe (User)</span>
                    <span className="text-sm text-gray-500">2 hours ago</span>
                  </div>
                  <p className="text-gray-700">Please help, I need access to my email urgently!</p>
                </div>
                <div className="border-b pb-3">
                  <div className="flex justify-between mb-2">
                    <span className="font-medium">Support Agent (IT Team)</span>
                    <span className="text-sm text-gray-500">1 hour ago</span>
                  </div>
                  <p className="text-gray-700">We are looking into this issue. Please try restarting your Outlook.</p>
                </div>
              </div>
              <textarea 
                className="w-full mt-4 px-4 py-2 border border-gray-300 rounded-lg"
                rows="3"
                placeholder="Add a comment..."
              ></textarea>
              <button className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg">Post Comment</button>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="font-semibold mb-3">Ticket Information</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Created:</span>
                  <span>2024-01-15 09:30 AM</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Created by:</span>
                  <span>John Doe</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Assigned to:</span>
                  <span>Support Team</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Category:</span>
                  <span>Email</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TicketDetailsMockup;
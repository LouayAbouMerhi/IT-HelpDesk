import React from 'react';

const DashboardMockup = () => {
  const stats = [
    { name: 'Open Tickets', value: '24', change: '+12%', changeType: 'increase', color: 'bg-blue-500' },
    { name: 'In Progress', value: '18', change: '+5%', changeType: 'increase', color: 'bg-yellow-500' },
    { name: 'Resolved Today', value: '32', change: '+18%', changeType: 'increase', color: 'bg-green-500' },
    { name: 'Active Agents', value: '8', change: '0%', changeType: 'neutral', color: 'bg-purple-500' },
  ];

  const recentTickets = [
    { id: 'TKT-001', title: 'Cannot access email', priority: 'High', status: 'Open', user: 'John Doe', time: '5 min ago' },
    { id: 'TKT-002', title: 'VPN connection issue', priority: 'Critical', status: 'In Progress', user: 'Jane Smith', time: '15 min ago' },
    { id: 'TKT-003', title: 'Software installation request', priority: 'Medium', status: 'Pending', user: 'Mike Johnson', time: '1 hour ago' },
    { id: 'TKT-004', title: 'Printer not working', priority: 'Low', status: 'Resolved', user: 'Sarah Williams', time: '2 hours ago' },
    { id: 'TKT-005', title: 'Database connection timeout', priority: 'High', status: 'Open', user: 'Tom Brown', time: '3 hours ago' },
  ];

  const priorities = [
    { name: 'Critical', count: 5, color: 'bg-red-500' },
    { name: 'High', count: 12, color: 'bg-orange-500' },
    { name: 'Medium', count: 18, color: 'bg-yellow-500' },
    { name: 'Low', count: 8, color: 'bg-green-500' },
  ];

  const categories = [
    { name: 'Hardware', count: 15, percentage: 25 },
    { name: 'Software', count: 22, percentage: 37 },
    { name: 'Network', count: 12, percentage: 20 },
    { name: 'Email', count: 8, percentage: 13 },
    { name: 'Access', count: 3, percentage: 5 },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 w-64 bg-white shadow-lg z-10">
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-center h-16 px-4 bg-blue-600">
            <h1 className="text-xl font-bold text-white">IT Help Desk</h1>
          </div>
          
          <nav className="flex-1 px-4 py-6 space-y-2">
            <a href="#" className="flex items-center px-4 py-2 text-gray-700 bg-blue-50 rounded-lg">
              <span className="mr-3">📊</span>
              <span className="font-medium">Dashboard</span>
            </a>
            <a href="#" className="flex items-center px-4 py-2 text-gray-600 rounded-lg hover:bg-gray-50">
              <span className="mr-3">🎫</span>
              <span>Tickets</span>
            </a>
            <a href="#" className="flex items-center px-4 py-2 text-gray-600 rounded-lg hover:bg-gray-50">
              <span className="mr-3">👥</span>
              <span>Users</span>
            </a>
            <a href="#" className="flex items-center px-4 py-2 text-gray-600 rounded-lg hover:bg-gray-50">
              <span className="mr-3">📄</span>
              <span>Reports</span>
            </a>
            <a href="#" className="flex items-center px-4 py-2 text-gray-600 rounded-lg hover:bg-gray-50">
              <span className="mr-3">⚙️</span>
              <span>Settings</span>
            </a>
          </nav>

          <div className="p-4 border-t">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                <span className="text-gray-600">👤</span>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-700">Admin User</p>
                <p className="text-xs text-gray-500">Administrator</p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-64">
        {/* Header */}
        <header className="bg-white shadow-sm sticky top-0 z-10">
          <div className="flex items-center justify-between px-8 py-4">
            <div className="flex-1">
              <div className="relative max-w-md">
                <input
                  type="text"
                  placeholder="Search tickets..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button className="relative">
                <span className="text-gray-600">🔔</span>
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">3</span>
              </button>
              <button className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                <span>+</span>
                <span>New Ticket</span>
              </button>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="p-8">
          {/* Welcome Section */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-800">Welcome back, Admin!</h1>
            <p className="text-gray-600 mt-1">Here's what's happening with your tickets today.</p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {stats.map((stat) => (
              <div key={stat.name} className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                    <p className="text-2xl font-bold text-gray-900 mt-2">{stat.value}</p>
                  </div>
                  <div className={`${stat.color} p-3 rounded-lg text-white text-xl`}>
                    📊
                  </div>
                </div>
                <div className="mt-4">
                  <div className="flex items-center">
                    <span className={`text-sm font-medium ${
                      stat.changeType === 'increase' ? 'text-green-600' : 
                      stat.changeType === 'decrease' ? 'text-red-600' : 'text-gray-600'
                    }`}>
                      {stat.change}
                    </span>
                    <span className="text-sm text-gray-500 ml-1">from last week</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Recent Tickets Table */}
            <div className="lg:col-span-2 bg-white rounded-lg shadow">
              <div className="p-6 border-b">
                <h2 className="text-lg font-semibold text-gray-800">Recent Tickets</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ticket ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Priority</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {recentTickets.map((ticket) => (
                      <tr key={ticket.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">{ticket.id}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{ticket.title}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            ticket.priority === 'Critical' ? 'bg-red-100 text-red-800' :
                            ticket.priority === 'High' ? 'bg-orange-100 text-orange-800' :
                            ticket.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {ticket.priority}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            ticket.status === 'Open' ? 'bg-blue-100 text-blue-800' :
                            ticket.status === 'In Progress' ? 'bg-purple-100 text-purple-800' :
                            ticket.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {ticket.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">{ticket.time}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="p-4 border-t">
                <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                  View All Tickets →
                </button>
              </div>
            </div>

            {/* Right Sidebar */}
            <div className="space-y-6">
              {/* Priority Distribution */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Priority Distribution</h3>
                <div className="space-y-3">
                  {priorities.map((priority) => (
                    <div key={priority.name}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium text-gray-700">{priority.name}</span>
                        <span className="text-gray-600">{priority.count} tickets</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`${priority.color} h-2 rounded-full`}
                          style={{ width: `${(priority.count / 43) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Categories */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Ticket Categories</h3>
                <div className="space-y-3">
                  {categories.map((category) => (
                    <div key={category.name}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-700">{category.name}</span>
                        <span className="text-gray-600">{category.count} tickets</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${category.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg shadow p-6 text-white">
                <h3 className="text-lg font-semibold mb-2">Need Help?</h3>
                <p className="text-sm opacity-90 mb-4">Check our knowledge base for common solutions</p>
                <button className="w-full bg-white text-blue-600 px-4 py-2 rounded-lg font-medium hover:bg-gray-100 transition">
                  Browse Knowledge Base
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default DashboardMockup;
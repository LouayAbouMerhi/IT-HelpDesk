import React from 'react';

const LoginMockup = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-white text-2xl">IT</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-800">IT Help Desk</h1>
          <p className="text-gray-600 mt-2">Sign in to access the support system</p>
        </div>
        
        <form>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-medium mb-2">Email Address</label>
            <input
              type="email"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="admin@helpdesk.com"
              defaultValue="admin@helpdesk.com"
            />
          </div>
          
          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-medium mb-2">Password</label>
            <input
              type="password"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="••••••••"
              defaultValue="password123"
            />
          </div>
          
          <button className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 transition">
            Sign In
          </button>
        </form>
        
        <div className="mt-6 text-center text-sm text-gray-600">
          <p>Demo Credentials:</p>
          <p>admin@helpdesk.com / password123</p>
        </div>
      </div>
    </div>
  );
};

export default LoginMockup;
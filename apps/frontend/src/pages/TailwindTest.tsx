import React from 'react';

const TailwindTest: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-8 text-center">
          Tailwind CSS Test Page
        </h1>
        
        {/* Test Basic Colors */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Basic Colors</h2>
            <div className="space-y-2">
              <div className="w-full h-4 bg-red-500 rounded"></div>
              <div className="w-full h-4 bg-green-500 rounded"></div>
              <div className="w-full h-4 bg-blue-500 rounded"></div>
              <div className="w-full h-4 bg-yellow-500 rounded"></div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Custom Revio Colors</h2>
            <div className="space-y-2">
              <div className="w-full h-4 bg-revio-primary rounded"></div>
              <div className="w-full h-4 bg-revio-secondary rounded"></div>
              <div className="w-full h-4 bg-revio-accent rounded"></div>
              <div className="w-full h-4 bg-revio-dark rounded"></div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Buttons</h2>
            <div className="space-y-3">
              <button className="btn-primary w-full">Primary Button</button>
              <button className="btn-secondary w-full">Secondary Button</button>
              <button className="w-full px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors">
                Regular Button
              </button>
            </div>
          </div>
        </div>
        
        {/* Test Layout */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Layout Test</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-700 mb-3">Flexbox Test</h3>
              <div className="flex items-center justify-between bg-gray-100 p-4 rounded-lg">
                <span className="text-sm text-gray-600">Left</span>
                <span className="text-sm text-gray-600">Center</span>
                <span className="text-sm text-gray-600">Right</span>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-700 mb-3">Input Test</h3>
              <input 
                type="text" 
                placeholder="Test input field"
                className="input-field"
              />
            </div>
          </div>
        </div>
        
        {/* Test Animations */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Animation Test</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-revio-light p-4 rounded-lg animate-fade-in">
              <p className="text-revio-dark">Fade In Animation</p>
            </div>
            <div className="bg-revio-light p-4 rounded-lg animate-bounce-gentle">
              <p className="text-revio-dark">Bounce Animation</p>
            </div>
            <div className="bg-revio-light p-4 rounded-lg hover:animate-slide-up">
              <p className="text-revio-dark">Hover Slide Up</p>
            </div>
          </div>
        </div>
        
        {/* Test Typography */}
        <div className="bg-white rounded-xl shadow-lg p-6 mt-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Typography Test</h2>
          <div className="space-y-4">
            <p className="text-xs text-gray-500">Extra Small Text (text-xs)</p>
            <p className="text-sm text-gray-600">Small Text (text-sm)</p>
            <p className="text-base text-gray-700">Base Text (text-base)</p>
            <p className="text-lg text-gray-800">Large Text (text-lg)</p>
            <p className="text-xl font-semibold text-gray-900">Extra Large Text (text-xl)</p>
            <p className="text-2xl font-bold text-revio-primary">2XL Bold Revio Primary</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TailwindTest;
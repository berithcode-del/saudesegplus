'use client';
import { MagnifyingGlassIcon, BellIcon } from '@heroicons/react/24/outline';

export default function Header() {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Search + Breadcrumb */}
          <div className="flex items-center gap-4">
            <div className="relative">
              <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search appointments..."
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div className="hidden md:block text-sm text-gray-500">
              <span>Appointment History</span>
              <span className="mx-2">›</span>
              <span className="font-medium text-gray-900">Dashboard</span>
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-4">
            <button className="p-2 rounded-full hover:bg-gray-100">
              <BellIcon className="w-5 h-5 text-gray-500" />
            </button>
            <div className="flex items-center gap-2">
              <img
                src="/avatar.svg"
                alt="Dr. Karen Smith"
                className="w-8 h-8 rounded-full"
              />
              <span className="text-sm font-medium text-gray-700">Karen Smith</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
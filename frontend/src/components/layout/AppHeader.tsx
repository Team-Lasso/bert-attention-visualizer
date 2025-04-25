import React from "react";
import { Link, useLocation } from "react-router-dom";

interface AppHeaderProps {
  currentModelName: string;
  showModelSelector: boolean;
  onToggleModelSelector: () => void;
}

const AppHeader: React.FC<AppHeaderProps> = ({
  currentModelName,
  showModelSelector,
  onToggleModelSelector,
}) => {
  const location = useLocation();
  const isHomePage = location.pathname === "/";

  return (
    <>
      <div className="sticky top-0 z-30 w-full border-b border-gray-200 bg-white shadow-sm">
        {/* Main Navigation Bar */}
        <header className="bg-white py-2.5">
          <div className="max-w-6xl mx-auto px-4">
            <div className="flex items-center justify-between h-10">
              {/* Logo and Title */}
              <Link to="/" className="flex items-center gap-2">
                <div className="bg-indigo-600 text-white p-1.5 rounded-md">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                    />
                  </svg>
                </div>
                <span className="text-base font-medium text-gray-800">
                  BERT Attention Visualizer
                </span>
              </Link>

              {/* Navigation Links */}
              <nav className="flex items-center gap-6">
                <Link
                  to="/about"
                  className="flex items-center text-sm text-gray-600 hover:text-indigo-600"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 mr-1"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                      clipRule="evenodd"
                    />
                  </svg>
                  About
                </Link>

                <Link
                  to="/compare"
                  className="flex items-center text-sm text-gray-600 hover:text-indigo-600"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 mr-1"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Compare Models
                </Link>
              </nav>
            </div>
          </div>
        </header>
      </div>

      {/* Content area with model selector */}
      <div className="bg-gradient-to-br from-indigo-50 to-blue-50 py-6">
        <div className="max-w-6xl mx-auto px-4 flex flex-wrap justify-between items-start">
          {/* Model selector */}
          <div className="flex items-center">
            <div className="bg-white rounded-lg shadow-sm py-2 px-4 flex items-center">
              <div className="text-gray-700 mr-2">Current Model:</div>
              <div className="font-medium text-gray-900 mr-3">
                {currentModelName}
              </div>
              <button
                className="text-white text-sm bg-indigo-600 hover:bg-indigo-700 py-1 px-4 rounded flex items-center"
                onClick={onToggleModelSelector}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 mr-1.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  {showModelSelector ? (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 15l7-7 7 7"
                    />
                  ) : (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  )}
                </svg>
                {showModelSelector ? "Hide Models" : "Change Model"}
              </button>
            </div>
          </div>

          {/* Description - only visible on home page */}
          {isHomePage && (
            <div className="text-gray-600 mt-2 sm:mt-0 text-right">
              Explore transformer attention patterns and masked word predictions
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default AppHeader;

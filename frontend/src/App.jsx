import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Applications from './pages/Applications';
import Analytics from './pages/Analytics';
import Companies from './pages/Companies';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        {/* Navigation */}
        <nav className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex space-x-8">
                <Link
                  to="/"
                  className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-900"
                >
                  Job Tracker
                </Link>
                <Link
                  to="/applications"
                  className="inline-flex items-center px-1 pt-1 border-b-2 border-transparent text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300"
                >
                  Applications
                </Link>
                <Link
                  to="/analytics"
                  className="inline-flex items-center px-1 pt-1 border-b-2 border-transparent text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300"
                >
                  Analytics
                </Link>
                <Link
                  to="/companies"
                  className="inline-flex items-center px-1 pt-1 border-b-2 border-transparent text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300"
                >
                  Companies
                </Link>
              </div>
            </div>
          </div>
        </nav>

        {/* Routes */}
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <Routes>
            <Route path="/" element={<Applications />} />
            <Route path="/applications" element={<Applications />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/companies" element={<Companies />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;

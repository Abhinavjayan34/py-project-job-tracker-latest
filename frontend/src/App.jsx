import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import Applications from './pages/Applications';
import Analytics from './pages/Analytics';
import Companies from './pages/Companies';

function App() {
  return (
    <Router>
      <div className="flex h-screen bg-gray-50">
        {/* Enhanced Left Sidebar Navigation - MATCHED GRADIENT */}
        <aside className="w-64 bg-gradient-to-b from-indigo-600 via-indigo-700 to-purple-700 shadow-2xl">
          <div className="flex flex-col h-full">
            {/* Logo/Brand with Enhanced Design */}
            <div className="flex flex-col items-center justify-center px-6 py-8 border-b border-indigo-500/30">
              <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mb-3 shadow-lg transform hover:scale-110 transition-transform">
                <span className="text-3xl">📋</span>
              </div>
              <h1 className="text-2xl font-bold text-white tracking-tight">JobTrack Pro</h1>
              <p className="text-xs text-indigo-200 mt-1">Your Career Companion</p>
            </div>

            {/* Navigation Links with Enhanced Styling */}
            <nav className="flex-1 px-3 py-6 space-y-2">
              <NavLink to="/applications" icon="📋" label="Applications" />
              <NavLink to="/analytics" icon="📊" label="Analytics" />
              <NavLink to="/companies" icon="🏢" label="Companies" />
            </nav>

            {/* Enhanced Footer */}
            <div className="px-6 py-6 border-t border-indigo-500/30">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 mb-3">
                <p className="text-xs text-white text-center font-medium">
                  Stay organized, land your dream job! 🎯
                </p>
              </div>
              <p className="text-xs text-indigo-200 text-center font-semibold">
                Job Tracker v1.0
              </p>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 overflow-auto">
          <div className="h-full">
            <Routes>
              <Route path="/" element={<Applications />} />
              <Route path="/applications" element={<Applications />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/companies" element={<Companies />} />
            </Routes>
          </div>
        </main>
      </div>
    </Router>
  );
}

// Enhanced NavLink component with modern design
function NavLink({ to, icon, label }) {
  const location = useLocation();
  const isActive = location.pathname === to || (to === '/applications' && location.pathname === '/');

  return (
    <Link
      to={to}
      className={`group flex items-center px-4 py-3.5 text-sm font-semibold rounded-xl transition-all duration-200 ${isActive
          ? 'bg-white text-indigo-700 shadow-lg transform scale-105'
          : 'text-white hover:bg-white/10 hover:backdrop-blur-sm hover:translate-x-1'
        }`}
    >
      <span className={`text-2xl mr-3 transition-transform group-hover:scale-110 ${isActive ? 'animate-bounce' : ''
        }`}>
        {icon}
      </span>
      <span className="flex-1">{label}</span>
      {isActive && (
        <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
      )}
    </Link>
  );
}

export default App;

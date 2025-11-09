import { useState, useEffect } from 'react';

const API_URL = 'http://localhost:8000';

function Companies() {
    const [companies, setCompanies] = useState([]);
    const [selectedCompany, setSelectedCompany] = useState(null);
    const [companyDetails, setCompanyDetails] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchCompanies();
    }, []);

    const fetchCompanies = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${API_URL}/companies`);
            const data = await response.json();
            setCompanies(data.companies || []);
            setError(null);
        } catch (err) {
            setError('Failed to fetch companies');
        } finally {
            setLoading(false);
        }
    };

    const fetchCompanyDetails = async (companyName) => {
        try {
            const response = await fetch(`${API_URL}/companies/${encodeURIComponent(companyName)}/stats`);
            const data = await response.json();
            setCompanyDetails(data);
            setSelectedCompany(companyName);
        } catch (err) {
            setError('Failed to fetch company details');
        }
    };

    const updateCompanyStatus = async (companyName, status) => {
        try {
            await fetch(`${API_URL}/companies/${encodeURIComponent(companyName)}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status })
            });
            fetchCompanies();
            if (selectedCompany === companyName) {
                fetchCompanyDetails(companyName);
            }
        } catch (err) {
            console.error('Failed to update company status');
        }
    };

    const filteredCompanies = companies.filter(company =>
        company.company_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <div className="h-full bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent"></div>
                    <p className="mt-4 text-gray-600">Loading companies...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="h-full bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="text-5xl mb-4">⚠️</div>
                    <p className="text-red-600 text-lg">{error}</p>
                </div>
            </div>
        );
    }

    if (companies.length === 0) {
        return (
            <div className="h-full bg-gray-50">
                <div className="bg-white border-b border-gray-200 px-8 py-6">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Companies</h1>
                    <p className="text-base text-gray-600">Track companies you've applied to</p>
                </div>
                <div className="px-8 py-12">
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 text-center py-12">
                        <div className="text-6xl mb-4">🏢</div>
                        <p className="text-gray-500 text-xl mb-2 font-semibold">No companies found</p>
                        <p className="text-gray-400 text-sm mb-6">
                            Add some job applications first to see companies here
                        </p>
                        <a
                            href="/applications"
                            className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
                        >
                            <span>+</span>
                            <span>Add Your First Application</span>
                        </a>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full bg-gray-50">
            {/* Header Section */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-4xl font-bold mb-2">Companies</h1>
                        <p className="text-indigo-100 text-lg">
                            Tracking {companies.length} {companies.length === 1 ? 'company' : 'companies'}
                        </p>
                    </div>
                    <div className="text-6xl">🏢</div>
                </div>
            </div>

            {/* Content Area */}
            <div className="px-8 py-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Companies List */}
                    <div className="lg:col-span-1">
                        {/* Search Bar */}
                        <div className="mb-4">
                            <input
                                type="text"
                                placeholder="Search companies..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            />
                        </div>

                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                            <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                                <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                                    All Companies ({filteredCompanies.length})
                                </h2>
                            </div>
                            <div className="divide-y divide-gray-200 max-h-[calc(100vh-350px)] overflow-y-auto">
                                {filteredCompanies.map((company) => (
                                    <button
                                        key={company.company_name}
                                        onClick={() => fetchCompanyDetails(company.company_name)}
                                        className={`w-full text-left px-4 py-4 hover:bg-indigo-50 transition-colors relative ${selectedCompany === company.company_name ? 'bg-indigo-50 border-l-4 border-indigo-600' : ''
                                            }`}
                                    >
                                        {/* Company Status Badge */}
                                        {company.status && (
                                            <div className="absolute top-2 right-2">
                                                {getStatusBadge(company.status)}
                                            </div>
                                        )}

                                        <div className="mb-2">
                                            <h3 className="font-bold text-gray-900 text-lg mb-1">{company.company_name}</h3>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full font-semibold">
                                                    {company.application_count} {company.application_count === 1 ? 'application' : 'applications'}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Mini Stats */}
                                        <div className="grid grid-cols-3 gap-2 mt-3">
                                            <div className="text-center bg-green-50 rounded p-2">
                                                <p className="text-sm font-bold text-green-600">{company.response_rate}%</p>
                                                <p className="text-xs text-gray-600">Response</p>
                                            </div>
                                            <div className="text-center bg-blue-50 rounded p-2">
                                                <p className="text-sm font-bold text-blue-600">{company.interview_rate}%</p>
                                                <p className="text-xs text-gray-600">Interview</p>
                                            </div>
                                            <div className="text-center bg-purple-50 rounded p-2">
                                                <p className="text-sm font-bold text-purple-600">{company.offer_rate}%</p>
                                                <p className="text-xs text-gray-600">Offer</p>
                                            </div>
                                        </div>

                                        {/* Latest Status */}
                                        {company.latest_application && (
                                            <div className="mt-3 pt-3 border-t border-gray-100">
                                                <p className="text-xs text-gray-500 mb-1">Latest Application:</p>
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs font-medium text-gray-700">{company.latest_application.role}</span>
                                                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${company.latest_application.status === 'offer' ? 'bg-green-100 text-green-800' :
                                                            company.latest_application.status === 'interview' ? 'bg-blue-100 text-blue-800' :
                                                                company.latest_application.status === 'phone_screen' ? 'bg-yellow-100 text-yellow-800' :
                                                                    company.latest_application.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                                                        'bg-gray-100 text-gray-800'
                                                        }`}>
                                                        {company.latest_application.status.replace('_', ' ')}
                                                    </span>
                                                </div>
                                            </div>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Company Details */}
                    <div className="lg:col-span-2">
                        {!selectedCompany ? (
                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-16 text-center h-full flex flex-col items-center justify-center">
                                <div className="text-7xl mb-6">🏢</div>
                                <p className="text-gray-500 text-xl font-semibold mb-2">Select a company</p>
                                <p className="text-gray-400">Click on any company from the list to view detailed information</p>
                            </div>
                        ) : companyDetails ? (
                            <div className="space-y-6">
                                {/* Company Header with Status Selector */}
                                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                                    <div className="flex items-start justify-between mb-4">
                                        <div>
                                            <h2 className="text-3xl font-bold text-gray-900 mb-2">{companyDetails.company_name}</h2>
                                            <p className="text-gray-600">
                                                Member since {new Date(companyDetails.first_application).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                                            </p>
                                        </div>
                                        {/* Company Status Selector */}
                                        <div className="flex flex-col items-end gap-2">
                                            <label className="text-xs font-semibold text-gray-600 uppercase">Company Status</label>
                                            <select
                                                value={companies.find(c => c.company_name === selectedCompany)?.status || ''}
                                                onChange={(e) => updateCompanyStatus(selectedCompany, e.target.value)}
                                                className="px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-semibold text-sm"
                                            >
                                                <option value="">Not Set</option>
                                                <option value="dream_company">⭐ Dream Company</option>
                                                <option value="interested">👍 Interested</option>
                                                <option value="researching">🔍 Researching</option>
                                                <option value="not_interested">👎 Not Interested</option>
                                            </select>
                                        </div>
                                    </div>

                                    {/* Stats Grid */}
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                                        <div className="text-center p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border border-gray-200">
                                            <p className="text-3xl font-bold text-gray-900 mb-1">{companyDetails.overview.application_count}</p>
                                            <p className="text-xs font-semibold text-gray-600 uppercase">Applications</p>
                                        </div>
                                        <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg border border-green-200">
                                            <p className="text-3xl font-bold text-green-600 mb-1">{companyDetails.overview.response_rate}%</p>
                                            <p className="text-xs font-semibold text-gray-600 uppercase">Response</p>
                                        </div>
                                        <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200">
                                            <p className="text-3xl font-bold text-blue-600 mb-1">{companyDetails.overview.interview_rate}%</p>
                                            <p className="text-xs font-semibold text-gray-600 uppercase">Interview</p>
                                        </div>
                                        <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg border border-purple-200">
                                            <p className="text-3xl font-bold text-purple-600 mb-1">{companyDetails.overview.offer_rate}%</p>
                                            <p className="text-xs font-semibold text-gray-600 uppercase">Offer</p>
                                        </div>
                                    </div>

                                    {/* Status Breakdown */}
                                    {companyDetails.status_breakdown && Object.keys(companyDetails.status_breakdown).length > 0 && (
                                        <div className="border-t border-gray-200 pt-4">
                                            <h3 className="text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">Status Breakdown</h3>
                                            <div className="flex flex-wrap gap-2">
                                                {Object.entries(companyDetails.status_breakdown).map(([status, count]) => (
                                                    <span
                                                        key={status}
                                                        className={`px-4 py-2 rounded-lg text-sm font-bold shadow-sm ${status === 'offer' ? 'bg-green-100 text-green-800 border-2 border-green-300' :
                                                                status === 'interview' ? 'bg-blue-100 text-blue-800 border-2 border-blue-300' :
                                                                    status === 'phone_screen' ? 'bg-yellow-100 text-yellow-800 border-2 border-yellow-300' :
                                                                        status === 'rejected' ? 'bg-red-100 text-red-800 border-2 border-red-300' :
                                                                            'bg-gray-100 text-gray-800 border-2 border-gray-300'
                                                            }`}
                                                    >
                                                        {status.replace('_', ' ')}: {count}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Roles Applied */}
                                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                                    <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                                        <span>📋</span>
                                        <span>Roles Applied</span>
                                    </h3>
                                    <div className="space-y-3">
                                        {companyDetails.roles_applied && companyDetails.roles_applied.map((role, index) => (
                                            <div key={index} className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
                                                <div className="flex-1">
                                                    <p className="font-bold text-gray-900 text-lg mb-1">{role.role}</p>
                                                    <p className="text-sm text-gray-500 flex items-center gap-2">
                                                        <span>📅</span>
                                                        <span>{new Date(role.applied_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                                    </p>
                                                </div>
                                                <span className={`px-4 py-2 rounded-lg text-sm font-bold shadow-sm ${role.status === 'offer' ? 'bg-green-100 text-green-800 border-2 border-green-300' :
                                                        role.status === 'interview' ? 'bg-blue-100 text-blue-800 border-2 border-blue-300' :
                                                            role.status === 'phone_screen' ? 'bg-yellow-100 text-yellow-800 border-2 border-yellow-300' :
                                                                role.status === 'rejected' ? 'bg-red-100 text-red-800 border-2 border-red-300' :
                                                                    'bg-gray-100 text-gray-800 border-2 border-gray-300'
                                                    }`}>
                                                    {role.status.replace('_', ' ')}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
                                <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-indigo-500 border-t-transparent"></div>
                                <p className="mt-3 text-gray-600">Loading details...</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

// Helper function for status badges
function getStatusBadge(status) {
    const badges = {
        dream_company: <span className="text-xl" title="Dream Company">⭐</span>,
        interested: <span className="text-xl" title="Interested">👍</span>,
        researching: <span className="text-xl" title="Researching">🔍</span>,
        not_interested: <span className="text-xl" title="Not Interested">👎</span>
    };
    return badges[status] || null;
}

export default Companies;
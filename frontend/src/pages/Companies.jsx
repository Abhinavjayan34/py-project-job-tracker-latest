import { useState, useEffect } from 'react';

const API_URL = 'http://localhost:8000';

function Companies() {
    const [companies, setCompanies] = useState([]);
    const [selectedCompany, setSelectedCompany] = useState(null);
    const [companyDetails, setCompanyDetails] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

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
                        <div className="text-5xl mb-4">🏢</div>
                        <p className="text-gray-500 text-lg mb-2">No companies found</p>
                        <p className="text-gray-400 text-sm mb-6">
                            Add some job applications first to see companies here
                        </p>
                        <a
                            href="/applications"
                            className="inline-flex items-center px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors"
                        >
                            Go to Applications
                        </a>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full bg-gray-50">
            {/* Header Section */}
            <div className="bg-white border-b border-gray-200 px-8 py-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">Companies</h1>
                        <p className="text-base text-gray-600">
                            {companies.length} {companies.length === 1 ? 'company' : 'companies'} tracked
                        </p>
                    </div>
                </div>
            </div>

            {/* Content Area */}
            <div className="px-8 py-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Companies List */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                            <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                                <h2 className="text-sm font-semibold text-gray-700 uppercase">All Companies</h2>
                            </div>
                            <div className="divide-y divide-gray-200 max-h-[calc(100vh-300px)] overflow-y-auto">
                                {companies.map((company) => (
                                    <button
                                        key={company.company_name}
                                        onClick={() => fetchCompanyDetails(company.company_name)}
                                        className={`w-full text-left px-4 py-4 hover:bg-gray-50 transition-colors ${selectedCompany === company.company_name ? 'bg-indigo-50 border-l-4 border-indigo-600' : ''
                                            }`}
                                    >
                                        <div className="flex items-center justify-between mb-2">
                                            <h3 className="font-semibold text-gray-900">{company.company_name}</h3>
                                            <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">
                                                {company.application_count} {company.application_count === 1 ? 'app' : 'apps'}
                                            </span>
                                        </div>
                                        <div className="flex gap-3 text-xs text-gray-600">
                                            <span className="flex items-center gap-1">
                                                <span className="text-green-600">✓</span> {company.response_rate}%
                                            </span>
                                            {company.latest_application && (
                                                <span className={`px-2 py-0.5 rounded-full text-xs ${company.latest_application.status === 'offer' ? 'bg-green-100 text-green-800' :
                                                        company.latest_application.status === 'interview' ? 'bg-blue-100 text-blue-800' :
                                                            company.latest_application.status === 'phone_screen' ? 'bg-yellow-100 text-yellow-800' :
                                                                company.latest_application.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                                                    'bg-gray-100 text-gray-800'
                                                    }`}>
                                                    {company.latest_application.status.replace('_', ' ')}
                                                </span>
                                            )}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Company Details */}
                    <div className="lg:col-span-2">
                        {!selectedCompany ? (
                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
                                <div className="text-5xl mb-4">🏢</div>
                                <p className="text-gray-500 text-lg">Select a company to view details</p>
                            </div>
                        ) : companyDetails ? (
                            <div className="space-y-6">
                                {/* Company Header */}
                                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                                    <h2 className="text-2xl font-bold text-gray-900 mb-4">{companyDetails.company_name}</h2>

                                    {/* Stats Grid */}
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                                        <div className="text-center p-3 bg-gray-50 rounded-lg">
                                            <p className="text-2xl font-bold text-gray-900">{companyDetails.overview.application_count}</p>
                                            <p className="text-xs text-gray-600">Applications</p>
                                        </div>
                                        <div className="text-center p-3 bg-green-50 rounded-lg">
                                            <p className="text-2xl font-bold text-green-600">{companyDetails.overview.response_rate}%</p>
                                            <p className="text-xs text-gray-600">Response</p>
                                        </div>
                                        <div className="text-center p-3 bg-blue-50 rounded-lg">
                                            <p className="text-2xl font-bold text-blue-600">{companyDetails.overview.interview_rate}%</p>
                                            <p className="text-xs text-gray-600">Interview</p>
                                        </div>
                                        <div className="text-center p-3 bg-purple-50 rounded-lg">
                                            <p className="text-2xl font-bold text-purple-600">{companyDetails.overview.offer_rate}%</p>
                                            <p className="text-xs text-gray-600">Offer</p>
                                        </div>
                                    </div>

                                    {/* Status Breakdown */}
                                    {companyDetails.status_breakdown && Object.keys(companyDetails.status_breakdown).length > 0 && (
                                        <div className="border-t border-gray-200 pt-4">
                                            <h3 className="text-sm font-semibold text-gray-700 mb-3">Status Breakdown</h3>
                                            <div className="flex flex-wrap gap-2">
                                                {Object.entries(companyDetails.status_breakdown).map(([status, count]) => (
                                                    <span
                                                        key={status}
                                                        className={`px-3 py-1 rounded-full text-xs font-semibold ${status === 'offer' ? 'bg-green-100 text-green-800' :
                                                                status === 'interview' ? 'bg-blue-100 text-blue-800' :
                                                                    status === 'phone_screen' ? 'bg-yellow-100 text-yellow-800' :
                                                                        status === 'rejected' ? 'bg-red-100 text-red-800' :
                                                                            'bg-gray-100 text-gray-800'
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
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Roles Applied</h3>
                                    <div className="space-y-3">
                                        {companyDetails.roles_applied && companyDetails.roles_applied.map((role, index) => (
                                            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                                <div>
                                                    <p className="font-medium text-gray-900">{role.role}</p>
                                                    <p className="text-xs text-gray-500">
                                                        {new Date(role.applied_date).toLocaleDateString()}
                                                    </p>
                                                </div>
                                                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${role.status === 'offer' ? 'bg-green-100 text-green-800' :
                                                        role.status === 'interview' ? 'bg-blue-100 text-blue-800' :
                                                            role.status === 'phone_screen' ? 'bg-yellow-100 text-yellow-800' :
                                                                role.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                                                    'bg-gray-100 text-gray-800'
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
                                <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-indigo-500 border-t-transparent"></div>
                                <p className="mt-2 text-gray-600">Loading details...</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Companies;
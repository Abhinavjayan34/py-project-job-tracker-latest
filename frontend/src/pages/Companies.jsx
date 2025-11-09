import { useState, useEffect } from 'react';

const API_URL = 'http://localhost:8000';

function Companies() {
    const [companies, setCompanies] = useState([]);
    const [selectedCompany, setSelectedCompany] = useState(null);
    const [companyDetails, setCompanyDetails] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [notes, setNotes] = useState('');
    const [showNotesForm, setShowNotesForm] = useState(false);

    useEffect(() => {
        fetchCompanies();
    }, []);

    const fetchCompanies = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${API_URL}/companies`);
            const data = await response.json();
            setCompanies(data.companies);
            setError(null);
        } catch (err) {
            setError('Failed to fetch companies');
        } finally {
            setLoading(false);
        }
    };

    const fetchCompanyDetails = async (companyName) => {
        try {
            const [appsRes, detailsRes] = await Promise.all([
                fetch(`${API_URL}/companies/${encodeURIComponent(companyName)}`),
                fetch(`${API_URL}/companies/${encodeURIComponent(companyName)}/details`)
            ]);

            const apps = await appsRes.json();
            const details = await detailsRes.json();

            setCompanyDetails({ ...apps, ...details });
            setNotes(details.notes || '');
            setSelectedCompany(companyName);
        } catch (err) {
            setError('Failed to fetch company details');
        }
    };

    const updateNotes = async () => {
        try {
            await fetch(`${API_URL}/companies/${encodeURIComponent(selectedCompany)}/notes`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ notes })
            });
            setShowNotesForm(false);
            fetchCompanyDetails(selectedCompany);
        } catch (err) {
            setError('Failed to update notes');
        }
    };

    const updateStatus = async (status) => {
        try {
            await fetch(`${API_URL}/companies/${encodeURIComponent(selectedCompany)}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status })
            });
            fetchCompanyDetails(selectedCompany);
            fetchCompanies();
        } catch (err) {
            setError('Failed to update status');
        }
    };

    if (loading) return <div className="text-center py-8">Loading companies...</div>;
    if (error) return <div className="text-red-600 text-center py-8">{error}</div>;

    return (
        <div className="px-4 sm:px-6 lg:px-8">
            <h1 className="text-2xl font-semibold text-gray-900 mb-6">Companies</h1>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Companies List */}
                <div className="lg:col-span-1 space-y-4">
                    {companies.map((company) => (
                        <div
                            key={company.company_name}
                            onClick={() => fetchCompanyDetails(company.company_name)}
                            className={`bg-white shadow rounded-lg p-4 cursor-pointer hover:shadow-md transition ${selectedCompany === company.company_name ? 'ring-2 ring-indigo-500' : ''
                                }`}
                        >
                            <div className="flex justify-between items-start mb-2">
                                <h3 className="font-semibold text-gray-900">{company.company_name}</h3>
                                {company.status && (
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${company.status === 'dream_company' ? 'bg-yellow-100 text-yellow-800' :
                                            company.status === 'interested' ? 'bg-green-100 text-green-800' :
                                                company.status === 'not_interested' ? 'bg-red-100 text-red-800' :
                                                    'bg-gray-100 text-gray-800'
                                        }`}>
                                        {company.status.replace('_', ' ')}
                                    </span>
                                )}
                            </div>
                            <div className="text-sm text-gray-600 space-y-1">
                                <div>{company.application_count} applications</div>
                                <div>Response: {company.response_rate}%</div>
                                <div>Interview: {company.interview_rate}%</div>
                                {company.latest_application && (
                                    <div className="text-xs mt-2 pt-2 border-t">
                                        Latest: {company.latest_application.role} ({company.latest_application.status})
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Company Details */}
                <div className="lg:col-span-2">
                    {selectedCompany ? (
                        <div className="bg-white shadow rounded-lg">
                            <div className="px-6 py-5 border-b border-gray-200">
                                <h2 className="text-xl font-semibold text-gray-900">{selectedCompany}</h2>
                                <div className="mt-2 flex gap-2">
                                    <button
                                        onClick={() => updateStatus('dream_company')}
                                        className="px-3 py-1 text-sm rounded bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
                                    >
                                        ⭐ Dream Company
                                    </button>
                                    <button
                                        onClick={() => updateStatus('interested')}
                                        className="px-3 py-1 text-sm rounded bg-green-100 text-green-800 hover:bg-green-200"
                                    >
                                        ✓ Interested
                                    </button>
                                    <button
                                        onClick={() => updateStatus('not_interested')}
                                        className="px-3 py-1 text-sm rounded bg-red-100 text-red-800 hover:bg-red-200"
                                    >
                                        ✗ Not Interested
                                    </button>
                                </div>
                            </div>

                            {/* Notes Section */}
                            <div className="px-6 py-4 border-b border-gray-200">
                                <div className="flex justify-between items-center mb-2">
                                    <h3 className="font-medium text-gray-900">Notes</h3>
                                    <button
                                        onClick={() => setShowNotesForm(!showNotesForm)}
                                        className="text-sm text-indigo-600 hover:text-indigo-900"
                                    >
                                        {showNotesForm ? 'Cancel' : 'Edit'}
                                    </button>
                                </div>
                                {showNotesForm ? (
                                    <div>
                                        <textarea
                                            value={notes}
                                            onChange={(e) => setNotes(e.target.value)}
                                            className="w-full border rounded-md px-3 py-2 text-sm"
                                            rows="4"
                                            placeholder="Add notes about this company..."
                                        />
                                        <button
                                            onClick={updateNotes}
                                            className="mt-2 px-4 py-2 bg-indigo-600 text-white rounded-md text-sm hover:bg-indigo-700"
                                        >
                                            Save Notes
                                        </button>
                                    </div>
                                ) : (
                                    <p className="text-sm text-gray-600">{companyDetails?.notes || 'No notes yet'}</p>
                                )}
                            </div>

                            {/* Applications List */}
                            <div className="px-6 py-4">
                                <h3 className="font-medium text-gray-900 mb-4">Applications ({companyDetails?.total})</h3>
                                <div className="space-y-3">
                                    {companyDetails?.applications?.map((app) => (
                                        <div key={app.id} className="border rounded-lg p-4">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <h4 className="font-medium text-gray-900">{app.role}</h4>
                                                    <p className="text-sm text-gray-600 mt-1">
                                                        Applied: {new Date(app.applied_date).toLocaleDateString()}
                                                    </p>
                                                    {app.location && <p className="text-sm text-gray-600">Location: {app.location}</p>}
                                                    {app.salary_range && <p className="text-sm text-gray-600">Salary: {app.salary_range}</p>}
                                                </div>
                                                <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${app.status === 'offer' ? 'bg-green-100 text-green-800' :
                                                        app.status === 'interview' ? 'bg-blue-100 text-blue-800' :
                                                            app.status === 'phone_screen' ? 'bg-yellow-100 text-yellow-800' :
                                                                app.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                                                    'bg-gray-100 text-gray-800'
                                                    }`}>
                                                    {app.status}
                                                </span>
                                            </div>
                                            {app.notes && (
                                                <p className="text-sm text-gray-600 mt-2 pt-2 border-t">{app.notes}</p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white shadow rounded-lg p-8 text-center text-gray-500">
                            Select a company to view details
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default Companies;
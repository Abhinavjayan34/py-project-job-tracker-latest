import { useState, useEffect, useRef } from 'react';

const API_URL = 'http://localhost:8000';

function Applications() {
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [sourceFilter, setSourceFilter] = useState('');

    // Add useRef to prevent losing focus
    const searchInputRef = useRef(null);

    const [formData, setFormData] = useState({
        company: '',
        role: '',
        status: 'applied',
        source: 'LinkedIn',
        location: '',
        salary_range: '',
        notes: ''
    });

    // Debounce search to reduce API calls
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            fetchApplications();
        }, 300); // Wait 300ms after user stops typing

        return () => clearTimeout(timeoutId);
    }, [searchTerm, statusFilter, sourceFilter]);

    const fetchApplications = async () => {
        try {
            setLoading(true);
            let url = `${API_URL}/applications?`;
            if (searchTerm) url += `search=${encodeURIComponent(searchTerm)}&`;
            if (statusFilter) url += `status=${statusFilter}&`;
            if (sourceFilter) url += `source=${encodeURIComponent(sourceFilter)}`;

            const response = await fetch(url);
            const data = await response.json();
            setApplications(data);
            setError(null);
        } catch (err) {
            setError('Failed to fetch applications');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch(`${API_URL}/applications`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                setShowForm(false);
                setFormData({
                    company: '',
                    role: '',
                    status: 'applied',
                    source: 'LinkedIn',
                    location: '',
                    salary_range: '',
                    notes: ''
                });
                fetchApplications();
            }
        } catch (err) {
            setError('Failed to create application');
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Delete this application?')) return;

        try {
            await fetch(`${API_URL}/applications/${id}`, { method: 'DELETE' });
            fetchApplications();
        } catch (err) {
            setError('Failed to delete application');
        }
    };

    if (error) return <div className="text-red-600 text-center py-8">{error}</div>;

    return (
        <div className="px-4 sm:px-6 lg:px-8">
            <div className="sm:flex sm:items-center">
                <div className="sm:flex-auto">
                    <h1 className="text-2xl font-semibold text-gray-900">Applications</h1>
                    <p className="mt-2 text-sm text-gray-700">Track all your job applications</p>
                </div>
                <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
                    <button
                        onClick={() => setShowForm(!showForm)}
                        className="inline-flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700"
                    >
                        Add Application
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
                <input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Search by company or role..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-4 py-2 border"
                />
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-4 py-2 border"
                >
                    <option value="">All Statuses</option>
                    <option value="applied">Applied</option>
                    <option value="phone_screen">Phone Screen</option>
                    <option value="interview">Interview</option>
                    <option value="offer">Offer</option>
                    <option value="rejected">Rejected</option>
                </select>
                <select
                    value={sourceFilter}
                    onChange={(e) => setSourceFilter(e.target.value)}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-4 py-2 border"
                >
                    <option value="">All Sources</option>
                    <option value="LinkedIn">LinkedIn</option>
                    <option value="Indeed">Indeed</option>
                    <option value="Company Website">Company Website</option>
                    <option value="Referral">Referral</option>
                    <option value="Other">Other</option>
                </select>
            </div>

            {/* Add Form */}
            {showForm && (
                <div className="mt-6 bg-white shadow sm:rounded-lg p-6">
                    <h3 className="text-lg font-medium mb-4">New Application</h3>
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <input
                            type="text"
                            placeholder="Company *"
                            required
                            value={formData.company}
                            onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-4 py-2 border"
                        />
                        <input
                            type="text"
                            placeholder="Role *"
                            required
                            value={formData.role}
                            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-4 py-2 border"
                        />
                        <select
                            value={formData.status}
                            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-4 py-2 border"
                        >
                            <option value="applied">Applied</option>
                            <option value="phone_screen">Phone Screen</option>
                            <option value="interview">Interview</option>
                            <option value="offer">Offer</option>
                            <option value="rejected">Rejected</option>
                        </select>
                        <select
                            value={formData.source}
                            onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-4 py-2 border"
                        >
                            <option value="LinkedIn">LinkedIn</option>
                            <option value="Indeed">Indeed</option>
                            <option value="Company Website">Company Website</option>
                            <option value="Referral">Referral</option>
                            <option value="Other">Other</option>
                        </select>
                        <input
                            type="text"
                            placeholder="Location"
                            value={formData.location}
                            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-4 py-2 border"
                        />
                        <input
                            type="text"
                            placeholder="Salary Range"
                            value={formData.salary_range}
                            onChange={(e) => setFormData({ ...formData, salary_range: e.target.value })}
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-4 py-2 border"
                        />
                        <textarea
                            placeholder="Notes"
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-4 py-2 border sm:col-span-2"
                            rows="3"
                        />
                        <div className="sm:col-span-2 flex gap-3">
                            <button
                                type="submit"
                                className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700"
                            >
                                Create Application
                            </button>
                            <button
                                type="button"
                                onClick={() => setShowForm(false)}
                                className="inline-flex justify-center rounded-md border border-gray-300 bg-white py-2 px-4 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Applications Table */}
            <div className="mt-8 flex flex-col">
                <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
                    <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
                        {loading ? (
                            <div className="text-center py-8 text-gray-500">Loading...</div>
                        ) : applications.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                                No applications found. {searchTerm && "Try adjusting your search."}
                            </div>
                        ) : (
                            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                                <table className="min-w-full divide-y divide-gray-300">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Company</th>
                                            <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Role</th>
                                            <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Status</th>
                                            <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Source</th>
                                            <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Applied Date</th>
                                            <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 bg-white">
                                        {applications.map((app) => (
                                            <tr key={app.id}>
                                                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900">{app.company}</td>
                                                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900">{app.role}</td>
                                                <td className="whitespace-nowrap px-3 py-4 text-sm">
                                                    <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${app.status === 'offer' ? 'bg-green-100 text-green-800' :
                                                            app.status === 'interview' ? 'bg-blue-100 text-blue-800' :
                                                                app.status === 'phone_screen' ? 'bg-yellow-100 text-yellow-800' :
                                                                    app.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                                                        'bg-gray-100 text-gray-800'
                                                        }`}>
                                                        {app.status}
                                                    </span>
                                                </td>
                                                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{app.source}</td>
                                                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                                    {new Date(app.applied_date).toLocaleDateString()}
                                                </td>
                                                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                                    <button
                                                        onClick={() => handleDelete(app.id)}
                                                        className="text-red-600 hover:text-red-900"
                                                    >
                                                        Delete
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Applications;
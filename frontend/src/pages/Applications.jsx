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

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            fetchApplications();
        }, 300);
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
        <div className="h-full bg-gray-50">
            {/* Header Section with Better Styling */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-4xl font-bold mb-2">Applications</h1>
                        <p className="text-indigo-100 text-lg">
                            Track and manage all your job applications
                        </p>
                    </div>
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setShowForm(!showForm)}
                            className="inline-flex items-center gap-2 px-6 py-3 bg-white text-indigo-600 font-semibold rounded-lg shadow-md hover:bg-indigo-50 transition-all"
                        >
                            <span className="text-xl">+</span>
                            <span>Add Application</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Content Area */}
            <div className="px-8 py-6">
                {/* Filters */}
                <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <span className="text-gray-400">🔍</span>
                        </div>
                        <input
                            ref={searchInputRef}
                            type="text"
                            placeholder="Search by company or role..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="block w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                        />
                    </div>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
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
                        className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
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
                    <div className="mb-6 bg-white shadow-lg rounded-lg p-6 border border-gray-200">
                        <h3 className="text-xl font-semibold mb-4 text-gray-900">New Application</h3>
                        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <input
                                type="text"
                                placeholder="Company *"
                                required
                                value={formData.company}
                                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                                className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                            />
                            <input
                                type="text"
                                placeholder="Role *"
                                required
                                value={formData.role}
                                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                            />
                            <select
                                value={formData.status}
                                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
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
                                className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
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
                                className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                            />
                            <input
                                type="text"
                                placeholder="Salary Range"
                                value={formData.salary_range}
                                onChange={(e) => setFormData({ ...formData, salary_range: e.target.value })}
                                className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                            />
                            <textarea
                                placeholder="Notes"
                                value={formData.notes}
                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm sm:col-span-2"
                                rows="3"
                            />
                            <div className="sm:col-span-2 flex gap-3">
                                <button
                                    type="submit"
                                    className="px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors"
                                >
                                    Create Application
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowForm(false)}
                                    className="px-6 py-3 bg-white border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* Applications Table */}
                {loading ? (
                    <div className="text-center py-12 text-gray-500">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-indigo-500 border-t-transparent"></div>
                        <p className="mt-2">Loading applications...</p>
                    </div>
                ) : applications.length === 0 ? (
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 text-center py-12">
                        <div className="text-5xl mb-4">📋</div>
                        <p className="text-gray-500 text-lg mb-2">No applications found</p>
                        <p className="text-gray-400 text-sm">
                            {searchTerm ? "Try adjusting your search filters" : "Click 'Add Application' to get started"}
                        </p>
                    </div>
                ) : (
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Company</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Role</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Source</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Applied Date</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {applications.map((app) => (
                                        <tr key={app.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{app.company}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{app.role}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${app.status === 'offer' ? 'bg-green-100 text-green-800' :
                                                    app.status === 'interview' ? 'bg-blue-100 text-blue-800' :
                                                        app.status === 'phone_screen' ? 'bg-yellow-100 text-yellow-800' :
                                                            app.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                                                'bg-gray-100 text-gray-800'
                                                    }`}>
                                                    {app.status.replace('_', ' ')}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{app.source}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                                {new Date(app.applied_date).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                <button
                                                    onClick={() => handleDelete(app.id)}
                                                    className="text-red-600 hover:text-red-800 font-medium transition-colors"
                                                >
                                                    Delete
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default Applications;
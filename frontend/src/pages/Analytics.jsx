import { useState, useEffect } from 'react';

const API_URL = 'http://localhost:8000';

function Analytics() {
    const [dashboard, setDashboard] = useState(null);
    const [funnel, setFunnel] = useState(null);
    const [sources, setSources] = useState(null);
    const [statusDist, setStatusDist] = useState(null);
    const [weeklyTrends, setWeeklyTrends] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchAllAnalytics();
    }, []);

    const fetchAllAnalytics = async () => {
        try {
            setLoading(true);
            const [dashboardRes, funnelRes, sourcesRes, statusRes, trendsRes] = await Promise.all([
                fetch(`${API_URL}/analytics/dashboard`),
                fetch(`${API_URL}/analytics/funnel`),
                fetch(`${API_URL}/analytics/sources`),
                fetch(`${API_URL}/analytics/status-distribution`),
                fetch(`${API_URL}/analytics/weekly-trends`)
            ]);

            setDashboard(await dashboardRes.json());
            setFunnel(await funnelRes.json());
            setSources(await sourcesRes.json());
            setStatusDist(await statusRes.json());
            setWeeklyTrends(await trendsRes.json());
            setError(null);
        } catch (err) {
            setError('Failed to fetch analytics');
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="text-center py-8">Loading analytics...</div>;
    if (error) return <div className="text-red-600 text-center py-8">{error}</div>;

    return (
        <div className="px-4 sm:px-6 lg:px-8">
            <h1 className="text-2xl font-semibold text-gray-900 mb-6">Analytics Dashboard</h1>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
                <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="px-4 py-5 sm:p-6">
                        <dt className="text-sm font-medium text-gray-500 truncate">Total Applications</dt>
                        <dd className="mt-1 text-3xl font-semibold text-gray-900">{dashboard?.total_applications}</dd>
                    </div>
                </div>
                <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="px-4 py-5 sm:p-6">
                        <dt className="text-sm font-medium text-gray-500 truncate">Response Rate</dt>
                        <dd className="mt-1 text-3xl font-semibold text-green-600">{dashboard?.response_rate}%</dd>
                    </div>
                </div>
                <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="px-4 py-5 sm:p-6">
                        <dt className="text-sm font-medium text-gray-500 truncate">Interview Rate</dt>
                        <dd className="mt-1 text-3xl font-semibold text-blue-600">{dashboard?.interview_rate}%</dd>
                    </div>
                </div>
                <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="px-4 py-5 sm:p-6">
                        <dt className="text-sm font-medium text-gray-500 truncate">Offer Rate</dt>
                        <dd className="mt-1 text-3xl font-semibold text-purple-600">{dashboard?.offer_rate}%</dd>
                    </div>
                </div>
            </div>

            {/* Funnel Visualization */}
            <div className="bg-white shadow rounded-lg p-6 mb-8">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Application Funnel</h2>
                <div className="space-y-4">
                    {funnel?.stages?.map((stage, idx) => (
                        <div key={idx}>
                            <div className="flex justify-between text-sm mb-1">
                                <span className="font-medium">{stage.stage}</span>
                                <span className="text-gray-600">{stage.count} ({stage.percentage}%)</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2.5">
                                <div
                                    className="bg-indigo-600 h-2.5 rounded-full"
                                    style={{ width: `${stage.percentage}%` }}
                                ></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Sources & Status Distribution */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                {/* Sources */}
                <div className="bg-white shadow rounded-lg p-6">
                    <h2 className="text-lg font-medium text-gray-900 mb-4">Applications by Source</h2>
                    <div className="space-y-3">
                        {sources?.sources?.map((source, idx) => (
                            <div key={idx} className="border-b pb-3">
                                <div className="flex justify-between items-center mb-1">
                                    <span className="font-medium">{source.source}</span>
                                    <span className="text-sm text-gray-600">{source.total_applications} apps</span>
                                </div>
                                <div className="grid grid-cols-3 gap-2 text-xs text-gray-600">
                                    <div>Response: {source.response_rate}%</div>
                                    <div>Interview: {source.interview_rate}%</div>
                                    <div>Offer: {source.offer_rate}%</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Status Distribution */}
                <div className="bg-white shadow rounded-lg p-6">
                    <h2 className="text-lg font-medium text-gray-900 mb-4">Status Distribution</h2>
                    <div className="space-y-4">
                        {statusDist?.distribution?.map((item, idx) => (
                            <div key={idx}>
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="font-medium capitalize">{item.status.replace('_', ' ')}</span>
                                    <span className="text-gray-600">{item.count} ({item.percentage}%)</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div
                                        className={`h-2 rounded-full ${item.status === 'offer' ? 'bg-green-500' :
                                                item.status === 'interview' ? 'bg-blue-500' :
                                                    item.status === 'phone_screen' ? 'bg-yellow-500' :
                                                        item.status === 'rejected' ? 'bg-red-500' :
                                                            'bg-gray-500'
                                            }`}
                                        style={{ width: `${item.percentage}%` }}
                                    ></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Weekly Trends */}
            <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Weekly Trends</h2>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead>
                            <tr>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Week</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Applications</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Responses</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Response Rate</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {weeklyTrends?.weeks?.map((week, idx) => (
                                <tr key={idx}>
                                    <td className="px-4 py-2 text-sm text-gray-900">{week.week_start}</td>
                                    <td className="px-4 py-2 text-sm text-gray-900">{week.applications}</td>
                                    <td className="px-4 py-2 text-sm text-gray-900">{week.responses}</td>
                                    <td className="px-4 py-2 text-sm">
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                            {week.response_rate}%
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

export default Analytics;
import { useState, useEffect } from 'react';

const API_URL = 'http://localhost:8000';

function Analytics() {
    const [dashboardStats, setDashboardStats] = useState(null);
    const [funnelData, setFunnelData] = useState(null);
    const [sourceData, setSourceData] = useState(null);
    const [statusDistribution, setStatusDistribution] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchAnalytics();
    }, []);

    const fetchAnalytics = async () => {
        try {
            setLoading(true);
            const [dashboard, funnel, sources, status] = await Promise.all([
                fetch(`${API_URL}/analytics/dashboard`).then(r => r.json()),
                fetch(`${API_URL}/analytics/funnel`).then(r => r.json()),
                fetch(`${API_URL}/analytics/sources`).then(r => r.json()),
                fetch(`${API_URL}/analytics/status-distribution`).then(r => r.json())
            ]);

            setDashboardStats(dashboard);
            setFunnelData(funnel);
            setSourceData(sources);
            setStatusDistribution(status);
            setError(null);
        } catch (err) {
            setError('Failed to fetch analytics');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="h-full bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent"></div>
                    <p className="mt-4 text-gray-600">Loading analytics...</p>
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

    return (
        <div className="h-full bg-gray-50">
            {/* Header Section */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-4xl font-bold mb-2">Analytics Dashboard</h1>
                        <p className="text-indigo-100 text-lg">
                            Track your job search performance and insights
                        </p>
                    </div>
                    <div className="text-6xl">📊</div>
                </div>
            </div>

            {/* Content Area */}
            <div className="px-8 py-6">
                {/* Dashboard Stats Cards */}
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
                    <StatCard
                        title="Total Applications"
                        value={dashboardStats?.total_applications || 0}
                        icon="📊"
                        color="blue"
                    />
                    <StatCard
                        title="Response Rate"
                        value={`${dashboardStats?.response_rate || 0}%`}
                        icon="📧"
                        color="green"
                    />
                    <StatCard
                        title="Interview Rate"
                        value={`${dashboardStats?.interview_rate || 0}%`}
                        icon="💼"
                        color="blue"
                    />
                    <StatCard
                        title="Offer Rate"
                        value={`${dashboardStats?.offer_rate || 0}%`}
                        icon="🎉"
                        color="purple"
                    />
                </div>

                {/* Application Funnel */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-6">Application Funnel</h2>
                    {funnelData?.stages && funnelData.stages.length > 0 ? (
                        <div className="space-y-4">
                            {funnelData.stages.map((stage, index) => (
                                <div key={index}>
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-sm font-medium text-gray-700">{stage.stage}</span>
                                        <span className="text-sm text-gray-600">
                                            {stage.count} ({stage.percentage}%)
                                        </span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-3">
                                        <div
                                            className={`h-3 rounded-full transition-all ${index === 0 ? 'bg-blue-500' :
                                                index === 1 ? 'bg-yellow-500' :
                                                    index === 2 ? 'bg-indigo-500' :
                                                        'bg-green-500'
                                                }`}
                                            style={{ width: `${stage.percentage}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <EmptyState message="No funnel data available" />
                    )}
                </div>

                {/* Two Column Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Applications by Source - ENHANCED */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <h2 className="text-xl font-semibold text-gray-900 mb-6">Applications by Source</h2>
                        {sourceData?.sources && sourceData.sources.length > 0 ? (
                            <div className="space-y-6">
                                {sourceData.sources.map((source, index) => (
                                    <div key={index} className="border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow">
                                        <div className="flex justify-between items-center mb-4">
                                            <span className="text-lg font-bold text-gray-900">{source.source}</span>
                                            <span className="text-sm font-semibold text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                                                {source.total_applications} {source.total_applications === 1 ? 'app' : 'apps'}
                                            </span>
                                        </div>
                                        <div className="grid grid-cols-3 gap-4">
                                            <div className="text-center">
                                                <p className="text-3xl font-bold text-green-600 mb-1">{source.response_rate}%</p>
                                                <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">Response</p>
                                            </div>
                                            <div className="text-center border-l border-r border-gray-200">
                                                <p className="text-3xl font-bold text-blue-600 mb-1">{source.interview_rate}%</p>
                                                <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">Interview</p>
                                            </div>
                                            <div className="text-center">
                                                <p className="text-3xl font-bold text-purple-600 mb-1">{source.offer_rate}%</p>
                                                <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">Offer</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <EmptyState message="No source data available" />
                        )}
                    </div>

                    {/* Status Distribution */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <h2 className="text-xl font-semibold text-gray-900 mb-6">Status Distribution</h2>
                        {statusDistribution?.distribution && statusDistribution.distribution.length > 0 ? (
                            <div className="space-y-5">
                                {statusDistribution.distribution.map((item, index) => (
                                    <div key={index}>
                                        <div className="flex justify-between items-center mb-2">
                                            <div className="flex items-center gap-3">
                                                <span className={`w-4 h-4 rounded-full ${getStatusColor(item.status)}`} />
                                                <span className="text-base font-semibold text-gray-800 capitalize">
                                                    {item.status.replace('_', ' ')}
                                                </span>
                                            </div>
                                            <span className="text-base font-bold text-gray-700">
                                                {item.count} <span className="text-sm font-normal text-gray-500">({item.percentage}%)</span>
                                            </span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-4">
                                            <div
                                                className={`h-4 rounded-full transition-all shadow-sm ${getStatusColor(item.status)}`}
                                                style={{ width: `${item.percentage}%` }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <EmptyState message="No status data available" />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

// Stat Card Component
function StatCard({ title, value, icon, color }) {
    const colorClasses = {
        blue: 'bg-blue-50 text-blue-600',
        green: 'bg-green-50 text-green-600',
        purple: 'bg-purple-50 text-purple-600'
    };

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
                    <p className="text-3xl font-bold text-gray-900">{value}</p>
                </div>
                <div className={`text-4xl ${colorClasses[color]} w-16 h-16 rounded-lg flex items-center justify-center`}>
                    {icon}
                </div>
            </div>
        </div>
    );
}

// Empty State Component
function EmptyState({ message }) {
    return (
        <div className="text-center py-8">
            <div className="text-4xl mb-3">📊</div>
            <p className="text-gray-500">{message}</p>
            <p className="text-gray-400 text-sm mt-1">Add some applications to see analytics</p>
        </div>
    );
}

// Helper function for status colors
function getStatusColor(status) {
    const colors = {
        applied: 'bg-gray-500',
        phone_screen: 'bg-yellow-500',
        interview: 'bg-blue-500',
        offer: 'bg-green-500',
        rejected: 'bg-red-500'
    };
    return colors[status] || 'bg-gray-400';
}

export default Analytics;
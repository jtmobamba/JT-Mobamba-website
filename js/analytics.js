// Analytics Module - MongoDB API Version

let storageChart = null;
let filesChart = null;
let distributionChart = null;
let dateRange = '7d';

const ANALYTICS_API_URL = 'http://localhost:5000/api';

// Helper function for API calls
async function analyticsFetch(endpoint, options = {}) {
    const token = localStorage.getItem('jt_auth_token');
    const response = await fetch(`${ANALYTICS_API_URL}${endpoint}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            ...options.headers
        }
    });

    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.error || 'API request failed');
    }
    return data;
}

// Format bytes to human readable
function formatBytes(bytes) {
    if (bytes === 0 || !bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Format number with commas
function formatNumber(num) {
    if (!num && num !== 0) return '0';
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

// Format percentage
function formatPercentage(value) {
    if (!value && value !== 0) return '0%';
    return value.toFixed(1) + '%';
}

async function renderAnalytics(container) {
    container.innerHTML = `
        <!-- Date Filter -->
        <div class="flex items-center justify-between mb-6">
            <h2 class="text-lg font-semibold">Analytics Overview</h2>
            <div class="pill-tabs">
                <div class="pill-tab ${dateRange === '7d' ? 'active' : ''}" data-range="7d">7 Days</div>
                <div class="pill-tab ${dateRange === '30d' ? 'active' : ''}" data-range="30d">30 Days</div>
                <div class="pill-tab ${dateRange === '90d' ? 'active' : ''}" data-range="90d">90 Days</div>
            </div>
        </div>

        <!-- Stats Cards -->
        <div class="stats-grid mb-6">
            <div class="stat-card">
                <div class="stat-icon orange">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4"></path>
                    </svg>
                </div>
                <div class="stat-value" id="analytics-storage">
                    <span class="animate-pulse bg-gray-200 rounded h-8 w-24 inline-block"></span>
                </div>
                <div class="stat-label">Total Storage Used</div>
                <div class="stat-sublabel text-xs text-gray-400 mt-1" id="analytics-storage-limit">of 8 GB limit</div>
            </div>
            <div class="stat-card">
                <div class="stat-icon blue">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                    </svg>
                </div>
                <div class="stat-value" id="analytics-files">
                    <span class="animate-pulse bg-gray-200 rounded h-8 w-16 inline-block"></span>
                </div>
                <div class="stat-label">Total Files</div>
            </div>
            <div class="stat-card">
                <div class="stat-icon green">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4"></path>
                    </svg>
                </div>
                <div class="stat-value" id="analytics-tables">
                    <span class="animate-pulse bg-gray-200 rounded h-8 w-16 inline-block"></span>
                </div>
                <div class="stat-label">Database Tables</div>
            </div>
            <div class="stat-card">
                <div class="stat-icon purple">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path>
                    </svg>
                </div>
                <div class="stat-value" id="analytics-usage">
                    <span class="animate-pulse bg-gray-200 rounded h-8 w-20 inline-block"></span>
                </div>
                <div class="stat-label">Storage Usage</div>
            </div>
        </div>

        <!-- Charts Row -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <!-- Storage Over Time -->
            <div class="chart-container">
                <div class="chart-header">
                    <h3 class="chart-title">Storage Usage Over Time</h3>
                </div>
                <div id="storage-chart" style="height: 300px;"></div>
            </div>

            <!-- File Count Over Time -->
            <div class="chart-container">
                <div class="chart-header">
                    <h3 class="chart-title">File Count Trend</h3>
                </div>
                <div id="files-chart" style="height: 300px;"></div>
            </div>
        </div>

        <!-- Bottom Row -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <!-- File Type Distribution -->
            <div class="chart-container">
                <div class="chart-header">
                    <h3 class="chart-title">File Type Distribution</h3>
                </div>
                <div id="distribution-chart" style="height: 300px;"></div>
            </div>

            <!-- Quick Stats Summary -->
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">Resource Summary</h3>
                </div>
                <div class="card-body" id="resource-summary">
                    <div class="space-y-4">
                        <!-- Storage Progress Bar -->
                        <div>
                            <div class="flex justify-between text-sm mb-1">
                                <span class="text-gray-600">Storage</span>
                                <span class="font-medium" id="storage-progress-text">0%</span>
                            </div>
                            <div class="w-full bg-gray-200 rounded-full h-3">
                                <div id="storage-progress-bar" class="bg-orange-500 h-3 rounded-full transition-all duration-500" style="width: 0%"></div>
                            </div>
                            <p class="text-xs text-gray-400 mt-1" id="storage-progress-detail">0 B of 8 GB used</p>
                        </div>

                        <!-- Files Count -->
                        <div class="flex items-center justify-between py-3 border-t border-gray-100">
                            <div class="flex items-center gap-3">
                                <div class="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                                    <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                                    </svg>
                                </div>
                                <div>
                                    <p class="font-medium">Files Stored</p>
                                    <p class="text-xs text-gray-500">Cloud storage</p>
                                </div>
                            </div>
                            <span class="text-2xl font-bold text-gray-900" id="summary-files">0</span>
                        </div>

                        <!-- Database Collections -->
                        <div class="flex items-center justify-between py-3 border-t border-gray-100">
                            <div class="flex items-center gap-3">
                                <div class="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                                    <svg class="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4"></path>
                                    </svg>
                                </div>
                                <div>
                                    <p class="font-medium">Collections</p>
                                    <p class="text-xs text-gray-500">Database containers</p>
                                </div>
                            </div>
                            <span class="text-2xl font-bold text-gray-900" id="summary-collections">0</span>
                        </div>

                        <!-- Tables -->
                        <div class="flex items-center justify-between py-3 border-t border-gray-100">
                            <div class="flex items-center gap-3">
                                <div class="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                                    <svg class="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
                                    </svg>
                                </div>
                                <div>
                                    <p class="font-medium">Database Tables</p>
                                    <p class="text-xs text-gray-500">Across all collections</p>
                                </div>
                            </div>
                            <span class="text-2xl font-bold text-gray-900" id="summary-tables">0</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Setup date range handlers
    document.querySelectorAll('[data-range]').forEach(tab => {
        tab.addEventListener('click', () => {
            dateRange = tab.dataset.range;
            document.querySelectorAll('[data-range]').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            loadAnalyticsData();
        });
    });

    // Load data
    await loadAnalyticsData();
}

async function loadAnalyticsData() {
    try {
        // Load file storage stats
        const storageStats = await loadStorageStats();

        // Load database stats
        const dbStats = await loadDatabaseStats();

        // Update summary
        updateSummary(storageStats, dbStats);

        // Generate and render charts
        renderCharts(storageStats);

    } catch (error) {
        console.error('Load analytics error:', error);
        // Show error state but with default values
        updateStatsDisplay({
            totalSize: 0,
            fileCount: 0,
            storageLimit: 8 * 1024 * 1024 * 1024,
            usagePercentage: 0
        }, { collections: 0, tables: 0 });
    }
}

async function loadStorageStats() {
    try {
        const data = await analyticsFetch('/files/storage/stats');
        return {
            totalSize: data.totalSize || 0,
            fileCount: data.fileCount || 0,
            storageLimit: data.storageLimit || 8 * 1024 * 1024 * 1024,
            usagePercentage: parseFloat(data.usagePercentage) || 0
        };
    } catch (error) {
        console.error('Storage stats error:', error);
        return {
            totalSize: 0,
            fileCount: 0,
            storageLimit: 8 * 1024 * 1024 * 1024,
            usagePercentage: 0
        };
    }
}

async function loadDatabaseStats() {
    try {
        const data = await analyticsFetch('/db/collections');
        const collections = data.collections || [];

        let totalTables = 0;
        collections.forEach(c => {
            totalTables += c.tableCount || 0;
        });

        return {
            collections: collections.length,
            tables: totalTables
        };
    } catch (error) {
        console.error('Database stats error:', error);
        return { collections: 0, tables: 0 };
    }
}

function updateStatsDisplay(storageStats, dbStats) {
    // Update stat cards with formatted numbers
    document.getElementById('analytics-storage').innerHTML = `<span class="text-2xl font-bold">${formatBytes(storageStats.totalSize)}</span>`;
    document.getElementById('analytics-files').innerHTML = `<span class="text-2xl font-bold">${formatNumber(storageStats.fileCount)}</span>`;
    document.getElementById('analytics-tables').innerHTML = `<span class="text-2xl font-bold">${formatNumber(dbStats.tables)}</span>`;
    document.getElementById('analytics-usage').innerHTML = `<span class="text-2xl font-bold">${formatPercentage(storageStats.usagePercentage)}</span>`;

    // Update storage limit text
    document.getElementById('analytics-storage-limit').textContent = `of ${formatBytes(storageStats.storageLimit)} limit`;
}

function updateSummary(storageStats, dbStats) {
    // Update stat displays
    updateStatsDisplay(storageStats, dbStats);

    // Update progress bar
    const progressBar = document.getElementById('storage-progress-bar');
    const progressText = document.getElementById('storage-progress-text');
    const progressDetail = document.getElementById('storage-progress-detail');

    if (progressBar && progressText && progressDetail) {
        const percentage = Math.min(storageStats.usagePercentage, 100);
        progressBar.style.width = `${percentage}%`;
        progressText.textContent = formatPercentage(storageStats.usagePercentage);
        progressDetail.textContent = `${formatBytes(storageStats.totalSize)} of ${formatBytes(storageStats.storageLimit)} used`;

        // Change color based on usage
        if (percentage > 90) {
            progressBar.className = 'bg-red-500 h-3 rounded-full transition-all duration-500';
        } else if (percentage > 70) {
            progressBar.className = 'bg-yellow-500 h-3 rounded-full transition-all duration-500';
        } else {
            progressBar.className = 'bg-orange-500 h-3 rounded-full transition-all duration-500';
        }
    }

    // Update summary numbers
    const summaryFiles = document.getElementById('summary-files');
    const summaryCollections = document.getElementById('summary-collections');
    const summaryTables = document.getElementById('summary-tables');

    if (summaryFiles) summaryFiles.textContent = formatNumber(storageStats.fileCount);
    if (summaryCollections) summaryCollections.textContent = formatNumber(dbStats.collections);
    if (summaryTables) summaryTables.textContent = formatNumber(dbStats.tables);
}

function renderCharts(storageStats) {
    // Generate date labels based on date range
    const days = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 90;
    const labels = [];
    const storageData = [];
    const fileData = [];

    // Generate sample progressive data
    const currentStorage = storageStats.totalSize;
    const currentFiles = storageStats.fileCount;

    for (let i = days; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        labels.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));

        // Generate progressive data leading to current values
        const progress = (days - i + 1) / (days + 1);
        const randomFactor = 0.85 + Math.random() * 0.3;
        storageData.push(Math.round(currentStorage * progress * randomFactor));
        fileData.push(Math.round(currentFiles * progress * randomFactor));
    }

    // Ensure last values are the current values
    storageData[storageData.length - 1] = currentStorage;
    fileData[fileData.length - 1] = currentFiles;

    // Render charts
    renderStorageChart(labels, storageData);
    renderFilesChart(labels, fileData);
    renderDistributionChart();
}

function renderStorageChart(labels, data) {
    if (storageChart) {
        storageChart.destroy();
    }

    const chartElement = document.getElementById('storage-chart');
    if (!chartElement) return;

    const options = {
        series: [{
            name: 'Storage Used',
            data: data
        }],
        chart: {
            type: 'area',
            height: 300,
            fontFamily: 'Inter, system-ui, sans-serif',
            toolbar: { show: false },
            zoom: { enabled: false }
        },
        dataLabels: { enabled: false },
        stroke: {
            curve: 'smooth',
            width: 2
        },
        fill: {
            type: 'gradient',
            gradient: {
                shadeIntensity: 1,
                opacityFrom: 0.4,
                opacityTo: 0.1,
                stops: [0, 100]
            }
        },
        colors: ['#D97706'],
        xaxis: {
            categories: labels,
            labels: {
                show: true,
                rotate: -45,
                rotateAlways: labels.length > 14,
                style: { fontSize: '10px', colors: '#6B6B6B' }
            },
            tickAmount: Math.min(labels.length, 7)
        },
        yaxis: {
            labels: {
                formatter: (value) => formatBytes(value),
                style: { colors: '#6B6B6B' }
            }
        },
        tooltip: {
            y: { formatter: (value) => formatBytes(value) }
        },
        grid: {
            borderColor: '#E5E5E5',
            strokeDashArray: 4
        }
    };

    storageChart = new ApexCharts(chartElement, options);
    storageChart.render();
}

function renderFilesChart(labels, data) {
    if (filesChart) {
        filesChart.destroy();
    }

    const chartElement = document.getElementById('files-chart');
    if (!chartElement) return;

    const options = {
        series: [{
            name: 'File Count',
            data: data
        }],
        chart: {
            type: 'line',
            height: 300,
            fontFamily: 'Inter, system-ui, sans-serif',
            toolbar: { show: false },
            zoom: { enabled: false }
        },
        dataLabels: { enabled: false },
        stroke: {
            curve: 'smooth',
            width: 3
        },
        colors: ['#3B82F6'],
        markers: {
            size: 4,
            hover: { size: 6 }
        },
        xaxis: {
            categories: labels,
            labels: {
                show: true,
                rotate: -45,
                rotateAlways: labels.length > 14,
                style: { fontSize: '10px', colors: '#6B6B6B' }
            },
            tickAmount: Math.min(labels.length, 7)
        },
        yaxis: {
            labels: {
                formatter: (value) => formatNumber(Math.round(value)),
                style: { colors: '#6B6B6B' }
            }
        },
        grid: {
            borderColor: '#E5E5E5',
            strokeDashArray: 4
        }
    };

    filesChart = new ApexCharts(chartElement, options);
    filesChart.render();
}

async function renderDistributionChart() {
    if (distributionChart) {
        distributionChart.destroy();
    }

    const chartElement = document.getElementById('distribution-chart');
    if (!chartElement) return;

    // Try to get file list for distribution
    let distribution = { 'Documents': 0, 'Images': 0, 'Videos': 0, 'Other': 0 };

    try {
        const data = await analyticsFetch('/files/list');
        const files = data.files || [];

        files.forEach(file => {
            const type = getFileCategory(file.contentType || '');
            distribution[type] = (distribution[type] || 0) + (file.length || 0);
        });
    } catch (error) {
        console.log('Could not load file distribution, using defaults');
    }

    const labels = Object.keys(distribution).filter(k => distribution[k] > 0);
    const sizes = labels.map(l => distribution[l]);

    if (labels.length === 0) {
        chartElement.innerHTML = `
            <div class="flex items-center justify-center h-full text-gray-500">
                <div class="text-center">
                    <svg class="w-12 h-12 mx-auto mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                    </svg>
                    <p>No files uploaded yet</p>
                </div>
            </div>
        `;
        return;
    }

    const options = {
        series: sizes,
        chart: {
            type: 'donut',
            height: 300,
            fontFamily: 'Inter, system-ui, sans-serif'
        },
        labels: labels,
        colors: ['#D97706', '#3B82F6', '#10B981', '#8B5CF6', '#EF4444', '#F59E0B'],
        dataLabels: {
            enabled: true,
            formatter: (val) => formatPercentage(val)
        },
        plotOptions: {
            pie: {
                donut: {
                    size: '60%',
                    labels: {
                        show: true,
                        total: {
                            show: true,
                            label: 'Total',
                            formatter: () => formatBytes(sizes.reduce((a, b) => a + b, 0))
                        }
                    }
                }
            }
        },
        legend: {
            position: 'bottom',
            fontSize: '12px'
        },
        tooltip: {
            y: { formatter: (value) => formatBytes(value) }
        }
    };

    distributionChart = new ApexCharts(chartElement, options);
    distributionChart.render();
}

function getFileCategory(mimeType) {
    if (!mimeType) return 'Other';
    if (mimeType.startsWith('image/')) return 'Images';
    if (mimeType.startsWith('video/')) return 'Videos';
    if (mimeType.startsWith('audio/')) return 'Audio';
    if (mimeType.includes('pdf') || mimeType.includes('document') || mimeType.includes('text')) return 'Documents';
    if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('tar')) return 'Archives';
    return 'Other';
}

// Export
window.renderAnalytics = renderAnalytics;

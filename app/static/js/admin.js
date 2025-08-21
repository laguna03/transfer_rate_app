// Enhanced Admin Dashboard JavaScript

// =======================
// UTILITY FUNCTIONS
// =======================

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
}

function showAlert(message, type = 'info') {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
    alertDiv.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;

    document.body.appendChild(alertDiv);

    setTimeout(() => {
        if (alertDiv.parentNode) {
            alertDiv.parentNode.removeChild(alertDiv);
        }
    }, 5000);
}

// =======================
// GLOBAL VARIABLES
// =======================

// Global variables
let usersTable, logsTable;
let analyticsData = {};

// Initialize when document is ready
document.addEventListener('DOMContentLoaded', function() {
    initializeDashboard();
});

function initializeDashboard() {
    // Initialize form handlers
    initializeUserManagement();
    initializeFilters();
    initializeAnalytics();

    // Set up tab change handlers
    setupTabHandlers();
}

// =======================
// USER MANAGEMENT
// =======================

function initializeUserManagement() {
    // Create User Form Handler
    const createForm = document.getElementById('createUserForm');
    if (createForm) {
        createForm.addEventListener('submit', handleCreateUser);
    }

    // Edit User Form Handler
    const editForm = document.getElementById('editUserForm');
    if (editForm) {
        editForm.addEventListener('submit', handleEditUser);
    }
}

async function handleCreateUser(e) {
    e.preventDefault();

    const formData = new FormData(e.target);
    const userData = {
        username: formData.get('username'),
        name: formData.get('name'),
        password: formData.get('password'),
        role: formData.get('role')
    };

    try {
        const response = await fetch('/admin/users', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': getCookie('access_token')
            },
            body: JSON.stringify(userData)
        });

        if (response.ok) {
            const modal = bootstrap.Modal.getInstance(document.getElementById('createUserModal'));
            modal.hide();
            e.target.reset();
            showAlert('User created successfully!', 'success');
            setTimeout(() => location.reload(), 1000);
        } else {
            const error = await response.json();
            showAlert(error.detail || 'Error creating user', 'danger');
        }
    } catch (error) {
        showAlert('Network error: ' + error.message, 'danger');
    }
}

async function handleEditUser(e) {
    e.preventDefault();

    const formData = new FormData(e.target);
    const userId = formData.get('userId');
    const userData = {
        username: formData.get('username'),
        name: formData.get('name'),
        role: formData.get('role')
    };

    try {
        const response = await fetch(`/admin/users/${userId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': getCookie('access_token')
            },
            body: JSON.stringify(userData)
        });

        if (response.ok) {
            const modal = bootstrap.Modal.getInstance(document.getElementById('editUserModal'));
            modal.hide();
            showAlert('User updated successfully!', 'success');
            setTimeout(() => location.reload(), 1000);
        } else {
            const error = await response.json();
            showAlert(error.detail || 'Error updating user', 'danger');
        }
    } catch (error) {
        showAlert('Network error: ' + error.message, 'danger');
    }
}

function editUser(userId, username, name, role) {
    document.getElementById('editUserId').value = userId;
    document.getElementById('editUsername').value = username;
    document.getElementById('editName').value = name;
    document.getElementById('editRole').value = role;

    const modal = new bootstrap.Modal(document.getElementById('editUserModal'));
    modal.show();
}

async function deactivateUser(userId) {
    if (!confirm('Are you sure you want to deactivate this user?')) return;

    try {
        const response = await fetch(`/admin/users/${userId}/deactivate`, {
            method: 'POST',
            headers: {
                'Authorization': getCookie('access_token')
            }
        });

        if (response.ok) {
            showAlert('User deactivated successfully!', 'success');
            setTimeout(() => location.reload(), 1000);
        } else {
            const error = await response.json();
            showAlert(error.detail || 'Error deactivating user', 'danger');
        }
    } catch (error) {
        showAlert('Network error: ' + error.message, 'danger');
    }
}

async function activateUser(userId) {
    try {
        const response = await fetch(`/admin/users/${userId}/activate`, {
            method: 'POST',
            headers: {
                'Authorization': getCookie('access_token')
            }
        });

        if (response.ok) {
            showAlert('User activated successfully!', 'success');
            setTimeout(() => location.reload(), 1000);
        } else {
            const error = await response.json();
            showAlert(error.detail || 'Error activating user', 'danger');
        }
    } catch (error) {
        showAlert('Network error: ' + error.message, 'danger');
    }
}

async function resetPassword(userId) {
    if (!confirm('Are you sure you want to reset this user\'s password?')) return;

    try {
        const response = await fetch(`/admin/users/${userId}/reset-password`, {
            method: 'POST',
            headers: {
                'Authorization': getCookie('access_token')
            }
        });

        if (response.ok) {
            const result = await response.json();

            // Show a more prominent alert with the temporary password
            const tempPassword = result.temp_password;
            const alertMessage = `
                <div class="text-center">
                    <h5 class="mb-3">Password Reset Successful!</h5>
                    <p class="mb-2">New temporary password:</p>
                    <div class="bg-light p-3 rounded mb-3">
                        <h4 class="text-primary mb-0 font-monospace">${tempPassword}</h4>
                    </div>
                    <small class="text-muted">Please save this password and share it with the user securely.</small>
                </div>
            `;

            // Create a custom alert that stays longer
            const alertDiv = document.createElement('div');
            alertDiv.className = 'alert alert-success alert-dismissible fade show position-fixed';
            alertDiv.style.cssText = 'top: 50%; left: 50%; transform: translate(-50%, -50%); z-index: 9999; min-width: 400px; max-width: 500px;';
            alertDiv.innerHTML = `
                ${alertMessage}
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            `;

            document.body.appendChild(alertDiv);

            // Remove after 15 seconds instead of 5
            setTimeout(() => {
                if (alertDiv.parentNode) {
                    alertDiv.parentNode.removeChild(alertDiv);
                }
            }, 15000);

        } else {
            const error = await response.json();
            showAlert(error.detail || 'Error resetting password', 'danger');
        }
    } catch (error) {
        showAlert('Network error: ' + error.message, 'danger');
    }
}

async function deleteUser(userId) {
    if (!confirm('Are you sure you want to permanently delete this user? This action cannot be undone.')) return;

    try {
        const response = await fetch(`/admin/users/${userId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': getCookie('access_token')
            }
        });

        if (response.ok) {
            showAlert('User deleted successfully!', 'success');
            setTimeout(() => location.reload(), 1000);
        } else {
            const error = await response.json();
            showAlert(error.detail || 'Error deleting user', 'danger');
        }
    } catch (error) {
        showAlert('Network error: ' + error.message, 'danger');
    }
}

async function viewUserDetails(userId) {
    try {
        const response = await fetch(`/admin/users/${userId}/details`, {
            headers: {
                'Authorization': getCookie('access_token')
            }
        });

        if (response.ok) {
            const details = await response.json();
            alert(JSON.stringify(details, null, 2));
        } else {
            showAlert('Error loading user details', 'danger');
        }
    } catch (error) {
        showAlert('Network error: ' + error.message, 'danger');
    }
}

async function viewLogDetails(logId) {
    try {
        // For now, just show an alert. You can implement a modal later
        showAlert('Log details feature coming soon', 'info');
    } catch (error) {
        showAlert('Error loading log details', 'danger');
    }
}

// =======================
// FILTERS
// =======================

function initializeFilters() {
    // User table filters
    const roleFilter = document.getElementById('roleFilter');
    const statusFilter = document.getElementById('statusFilter');
    const performanceFilter = document.getElementById('performanceFilter');
    const searchFilter = document.getElementById('searchFilter');

    if (roleFilter) roleFilter.addEventListener('change', applyUserFilters);
    if (statusFilter) statusFilter.addEventListener('change', applyUserFilters);
    if (performanceFilter) performanceFilter.addEventListener('change', applyUserFilters);
    if (searchFilter) searchFilter.addEventListener('input', applyUserFilters);

    // Analytics filters
    const dateRangeFilter = document.getElementById('dateRangeFilter');
    const userGroupFilter = document.getElementById('userGroupFilter');
    const callTypeFilter = document.getElementById('callTypeFilter');

    if (dateRangeFilter) dateRangeFilter.addEventListener('change', applyAnalyticsFilters);
    if (userGroupFilter) userGroupFilter.addEventListener('change', applyAnalyticsFilters);
    if (callTypeFilter) callTypeFilter.addEventListener('change', applyAnalyticsFilters);

    // Log filters
    const logUserFilter = document.getElementById('logUserFilter');
    const logTypeFilter = document.getElementById('logTypeFilter');
    const logDateFrom = document.getElementById('logDateFrom');
    const logDateTo = document.getElementById('logDateTo');
    const logSearchFilter = document.getElementById('logSearchFilter');

    if (logUserFilter) logUserFilter.addEventListener('change', applyLogFilters);
    if (logTypeFilter) logTypeFilter.addEventListener('change', applyLogFilters);
    if (logDateFrom) logDateFrom.addEventListener('change', applyLogFilters);
    if (logDateTo) logDateTo.addEventListener('change', applyLogFilters);
    if (logSearchFilter) logSearchFilter.addEventListener('input', debounce(applyLogFilters, 500));

    // Initialize DataTables
    initializeDataTables();
}

function applyUserFilters() {
    if (!usersTable) return;

    const roleFilter = document.getElementById('roleFilter')?.value || '';
    const statusFilter = document.getElementById('statusFilter')?.value || '';
    const performanceFilter = document.getElementById('performanceFilter')?.value || '';
    const searchFilter = document.getElementById('searchFilter')?.value || '';

    console.log('Applying user filters:', { roleFilter, statusFilter, performanceFilter, searchFilter });

    // Clear all existing column searches and custom filters
    usersTable.columns().search('');

    // Remove any existing custom search functions
    $.fn.dataTable.ext.search = $.fn.dataTable.ext.search.filter(function(fn) {
        return fn.toString().indexOf('userFilterCustom') === -1;
    });

    // Apply role filter (column 1) - match against role text like "USER" or "ADMIN"
    if (roleFilter) {
        usersTable.column(1).search(roleFilter, true, false);
    }

    // Apply custom search function for status and performance filters
    if (statusFilter || performanceFilter) {
        $.fn.dataTable.ext.search.push(function userFilterCustom(settings, data, dataIndex) {
            if (settings.nTable.id !== 'usersTable') return true;

            let statusMatch = true;
            let performanceMatch = true;

            // Check status filter (column 2)
            if (statusFilter) {
                const statusCell = data[2]; // Status column

                // Extract text content from HTML - look for the actual text within the HTML
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = statusCell;
                const statusText = tempDiv.textContent || tempDiv.innerText || '';

                console.log('Status filter:', statusFilter, 'Cell HTML:', statusCell, 'Extracted text:', statusText.trim());

                if (statusFilter === 'active') {
                    statusMatch = statusText.trim() === 'Active';
                } else if (statusFilter === 'inactive') {
                    statusMatch = statusText.trim() === 'Inactive';
                }

                console.log('Status match result:', statusMatch);
            }

            // Check performance filter (column 4)
            if (performanceFilter) {
                const transferRateCell = data[4];
                console.log('Transfer rate cell content:', transferRateCell);

                // Skip if no transfer rate data
                if (!transferRateCell || transferRateCell.includes('text-muted') || transferRateCell.includes('—')) {
                    performanceMatch = false;
                } else {
                    // Extract percentage from HTML content
                    const percentMatch = transferRateCell.match(/(\d+\.?\d*)%/);
                    if (percentMatch) {
                        const transferRate = parseFloat(percentMatch[1]);
                        console.log('Transfer rate found:', transferRate, 'for filter:', performanceFilter);

                        switch (performanceFilter) {
                            case 'excellent':
                                performanceMatch = transferRate >= 34;
                                break;
                            case 'good':
                                performanceMatch = transferRate >= 25 && transferRate < 34;
                                break;
                            case 'poor':
                                performanceMatch = transferRate < 25;
                                break;
                            default:
                                performanceMatch = true;
                        }
                    } else {
                        performanceMatch = false;
                    }
                }

                console.log('Performance filter:', performanceFilter, 'matches:', performanceMatch);
            }

            return statusMatch && performanceMatch;
        });
    }

    // Apply global search
    if (searchFilter) {
        usersTable.search(searchFilter);
    }

    // Redraw the table
    usersTable.draw();
}

function applyAnalyticsFilters() {
    console.log('=== Applying Analytics Filters ===');

    // Show button loading state immediately
    const applyButton = document.querySelector('button[onclick="applyAnalyticsFilters()"]');
    if (applyButton) {
        applyButton.disabled = true;
        applyButton.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Applying...';
    }

    // Get filter values from the form (using correct IDs)
    const dateRange = document.getElementById('dateRangeFilter')?.value || '30';
    const userGroup = document.getElementById('userGroupFilter')?.value || 'all';
    const callType = document.getElementById('callTypeFilter')?.value || 'all';

    console.log('Filter values:', { dateRange, userGroup, callType });

    // Convert date range to days (HTML already provides the number directly)
    let days = parseInt(dateRange);
    if (isNaN(days)) {
        days = 30; // fallback
    }

    // Load analytics with the selected filters
    loadAnalyticsData(days, userGroup, callType).finally(() => {
        // Always reset button state
        if (applyButton) {
            applyButton.disabled = false;
            applyButton.innerHTML = '<i class="fas fa-search me-2"></i>Apply Filters';
        }
    });
}

function applyLogFilters() {
    const userId = document.getElementById('logUserFilter').value;
    const callType = document.getElementById('logTypeFilter').value;
    const dateFrom = document.getElementById('logDateFrom').value;
    const dateTo = document.getElementById('logDateTo').value;
    const search = document.getElementById('logSearchFilter').value;

    console.log('Applying log filters:', { userId, callType, dateFrom, dateTo, search });

    // Apply filters to logs table
    loadFilteredLogs(userId, callType, dateFrom, dateTo, search);
}

// =======================
// ANALYTICS
// =======================

function initializeChartPlaceholders() {
    console.log('=== Initializing Chart Placeholders ===');
    const charts = ['topPerformersChart', 'callDistributionChart', 'trendsChart'];

    charts.forEach(chartId => {
        const chartElement = document.getElementById(chartId);
        console.log(`Chart ${chartId}:`, chartElement ? 'Found' : 'NOT FOUND');

        if (chartElement) {
            console.log(`Setting placeholder for ${chartId}`);
            chartElement.innerHTML = `
                <div class="d-flex justify-content-center align-items-center flex-column" style="height: 300px;">
                    <i class="fas fa-chart-bar text-primary fa-3x mb-3"></i>
                    <h5 class="text-muted mb-2">Analytics Ready</h5>
                    <p class="text-muted mb-3">Loading chart data...</p>
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Loading...</span>
                    </div>
                </div>
            `;
        }
    });
}

function initializeAnalytics() {
    console.log('=== Initializing Analytics ===');

    // Check if Plotly is available
    if (typeof Plotly === 'undefined') {
        console.error('Plotly is not loaded!');
        setTimeout(() => {
            if (typeof Plotly !== 'undefined') {
                console.log('Plotly loaded after delay, retrying...');
                initializeAnalytics();
            } else {
                showAlert('Chart library not loaded. Please refresh the page.', 'danger');
            }
        }, 2000);
        return;
    }

    console.log('Plotly available, loading analytics immediately...');

    // Initialize filter status display
    updateFilterStatusDisplay(30, 'all', 'all');

    // Load analytics data immediately
    setTimeout(() => {
        loadAnalyticsData();
    }, 500);
}

function showAnalyticsLoading(show) {
    console.log('Show loading:', show);
    const chartElements = ['topPerformersChart', 'callDistributionChart', 'trendsChart'];

    chartElements.forEach(chartId => {
        const chartElement = document.getElementById(chartId);
        if (chartElement) {
            if (show) {
                // Clear any existing content and show loading
                chartElement.innerHTML = `
                    <div class="d-flex justify-content-center align-items-center" style="height: 300px;">
                        <div class="spinner-border text-primary" role="status">
                            <span class="visually-hidden">Loading...</span>
                        </div>
                        <span class="ms-2">Loading analytics...</span>
                    </div>
                `;
            } else {
                // Clear loading state - let Plotly handle the content
                const hasLoadingContent = chartElement.innerHTML.includes('Loading analytics') ||
                                        chartElement.innerHTML.includes('spinner-border');

                console.log(`Chart ${chartId} - clearing loading state, hasLoadingContent: ${hasLoadingContent}`);

                // If there's loading content, clear it and let the chart render
                if (hasLoadingContent) {
                    chartElement.innerHTML = '';
                }
            }
        }
    });

    // Show/hide apply button loading state
    const applyButton = document.querySelector('button[onclick="applyAnalyticsFilters()"]');
    if (applyButton) {
        if (show) {
            applyButton.disabled = true;
            applyButton.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Applying...';
        } else {
            applyButton.disabled = false;
            applyButton.innerHTML = '<i class="fas fa-search me-2"></i>Apply Filters';
        }
    }
}

function setupTabHandlers() {
    console.log('=== Setting up tab handlers ===');
    const tabs = document.querySelectorAll('[data-bs-toggle="tab"]');
    console.log('Found tabs:', tabs.length);

    // Check if analytics tab is already active on page load
    const analyticsTab = document.querySelector('#analytics-panel');
    if (analyticsTab && analyticsTab.classList.contains('active')) {
        console.log('Analytics tab is already active on page load');
        setTimeout(() => {
            loadAnalyticsData();
        }, 1000);
    }

    tabs.forEach(tab => {
        tab.addEventListener('shown.bs.tab', function (event) {
            const targetId = event.target.getAttribute('data-bs-target');
            console.log('Tab switched to:', targetId);

            if (targetId === '#analytics-panel') {
                console.log('Analytics tab opened - loading data');
                loadAnalyticsData();
            } else if (targetId === '#logs-panel') {
                console.log('Logs tab opened');
                if (typeof loadLogsData === 'function') {
                    loadLogsData();
                }
            }
        });
    });
}

async function loadAnalyticsData(days = 30, userGroup = 'all', callType = 'all') {
    console.log('=== Loading Analytics Data ===');
    console.log('Parameters:', { days, userGroup, callType });

    // Check if chart elements exist
    const topChart = document.getElementById('topPerformersChart');
    const distChart = document.getElementById('callDistributionChart');
    const trendsChart = document.getElementById('trendsChart');

    console.log('Chart elements:', {
        topPerformersChart: topChart ? 'Found' : 'Not found',
        callDistributionChart: distChart ? 'Found' : 'Not found',
        trendsChart: trendsChart ? 'Found' : 'Not found'
    });

    showAnalyticsLoading(true);

    try {
        console.log('Fetching real analytics data from API...');

        // Build query parameters
        const params = new URLSearchParams({
            days: days.toString()
        });

        if (userGroup && userGroup !== 'all') {
            params.append('user_group', userGroup);
        }

        if (callType && callType !== 'all') {
            params.append('call_type', callType);
        }

        const queryString = params.toString();
        console.log('API query parameters:', queryString);
        console.log('Full API URLs:');
        console.log('- Performance:', `/admin/analytics/performance?${queryString}`);
        console.log('- Trends:', `/admin/analytics/trends?${queryString}`);

        // Show user feedback about applied filters
        const filterSummary = `Filters: ${days} days, ${userGroup} users, ${callType} calls`;
        console.log('Applied filters:', filterSummary);
        showAlert(`Loading analytics with filters: ${filterSummary}`, 'info');

        // Update filter status display
        updateFilterStatusDisplay(days, userGroup, callType);

        // Fetch performance data
        const performanceResponse = await fetch(`/admin/analytics/performance?${queryString}`, {
            headers: {
                'Authorization': getCookie('access_token')
            }
        });

        if (!performanceResponse.ok) {
            throw new Error(`Performance API error: ${performanceResponse.status}`);
        }

        const performanceData = await performanceResponse.json();
        console.log('Performance data received:', performanceData);

        // Fetch trends data
        const trendsResponse = await fetch(`/admin/analytics/trends?${queryString}`, {
            headers: {
                'Authorization': getCookie('access_token')
            }
        });

        if (!trendsResponse.ok) {
            throw new Error(`Trends API error: ${trendsResponse.status}`);
        }

        const trendsData = await trendsResponse.json();
        console.log('Trends data received:', trendsData);

        // Store the real data globally
        analyticsData.performance = performanceData;
        analyticsData.trends = trendsData;

    } catch (error) {
        console.error('Error fetching analytics data:', error);
        showAlert('Error loading analytics data: ' + error.message, 'danger');

        // Clear loading indicators
        showAnalyticsLoading(false);

        // Don't proceed with chart updates if data fetch failed
        return;
    }

    // Update charts
    console.log('About to update charts...');

    // Clear loading indicators first
    showAnalyticsLoading(false);

    try {
        const promises = [
            updateAnalyticsCharts(),
            updateTrendsChart()
        ];

        await Promise.all(promises);
        console.log('Charts updated successfully');

        showAlert('Analytics loaded successfully', 'success');

    } catch (error) {
        console.error('Error updating charts:', error);
        showAlert('Error loading charts: ' + error.message, 'danger');
    }
}

function updateAnalyticsCharts() {
    console.log('=== Updating Analytics Charts ===');

    if (!analyticsData.performance) {
        console.error('No performance data available');
        return Promise.resolve();
    }

    console.log('Performance data:', analyticsData.performance);

    // Update charts and return promises
    const promises = [];

    try {
        promises.push(updateTopPerformersChart());
        console.log('Top performers chart update started');
    } catch (error) {
        console.error('Error starting top performers chart:', error);
    }

    try {
        promises.push(updateCallDistributionChart());
        console.log('Call distribution chart update started');
    } catch (error) {
        console.error('Error starting call distribution chart:', error);
    }

    return Promise.all(promises).then(() => {
        console.log('✅ All analytics charts completed');
    }).catch(error => {
        console.error('❌ Error with analytics charts:', error);
    });
}

function updateTopPerformersChart() {
    console.log('=== Updating Top Performers Chart ===');
    const performanceChart = document.getElementById('topPerformersChart');
    if (!performanceChart) {
        console.error('topPerformersChart element not found');
        return Promise.resolve();
    }

    if (!analyticsData.performance?.top_performers) {
        console.error('No top_performers data available');
        return Promise.resolve();
    }

    const data = analyticsData.performance.top_performers;
    console.log('Top performers data:', data);

    // Check if Plotly is available
    if (typeof Plotly === 'undefined') {
        console.error('Plotly is not available');
        return Promise.resolve();
    }

    // Ensure the container is clean
    performanceChart.innerHTML = '';

    const chartData = [{
        x: data.map(item => item.username),
        y: data.map(item => item.transfer_rate),
        type: 'bar',
        marker: {
            color: 'rgba(54, 162, 235, 0.8)',
            line: {
                color: 'rgba(54, 162, 235, 1)',
                width: 1
            }
        },
        name: 'Transfer Rate (%)'
    }];

    const layout = {
        title: {
            text: 'Top Performers - Transfer Rate',
            font: { size: 16 }
        },
        xaxis: {
            title: 'User',
            tickangle: -45
        },
        yaxis: {
            title: 'Transfer Rate (%)',
            range: [0, Math.max(...data.map(item => item.transfer_rate)) * 1.1]
        },
        margin: { t: 50, b: 80, l: 60, r: 20 },
        showlegend: false
    };

    const config = {
        responsive: true,
        displayModeBar: false
    };

    console.log('Rendering performance chart with data:', chartData);
    try {
        return Plotly.newPlot(performanceChart, chartData, layout, config).then(() => {
            console.log('✅ Performance chart rendered successfully');
        });
    } catch (error) {
        console.error('❌ Performance chart error:', error);
        return Promise.reject(error);
    }
}

function updateCallDistributionChart() {
    console.log('=== Updating Call Distribution Chart ===');
    const distributionChart = document.getElementById('callDistributionChart');
    if (!distributionChart) {
        console.error('callDistributionChart element not found');
        return Promise.resolve();
    }

    if (!analyticsData.performance?.call_distribution) {
        console.error('No call_distribution data available');
        return Promise.resolve();
    }

    const data = analyticsData.performance.call_distribution;
    console.log('Call distribution data:', data);

    // Check if Plotly is available
    if (typeof Plotly === 'undefined') {
        console.error('Plotly is not available');
        return Promise.resolve();
    }

    // Ensure the container is clean
    distributionChart.innerHTML = '';

    const chartData = [{
        labels: data.map(item => item.type),
        values: data.map(item => item.count),
        type: 'pie',
        marker: {
            colors: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF']
        },
        textinfo: 'label+percent',
        textposition: 'outside'
    }];

    const layout = {
        title: {
            text: 'Call Distribution',
            font: { size: 16 }
        },
        margin: { t: 50, b: 50, l: 50, r: 50 },
        showlegend: true,
        legend: {
            orientation: 'h',
            y: -0.1
        }
    };

    const config = {
        responsive: true,
        displayModeBar: false
    };

    console.log('Rendering distribution chart with data:', chartData);
    try {
        return Plotly.newPlot(distributionChart, chartData, layout, config).then(() => {
            console.log('✅ Distribution chart rendered successfully');
        });
    } catch (error) {
        console.error('❌ Distribution chart error:', error);
        return Promise.reject(error);
    }
}

function updateTrendsChart() {
    console.log('=== Updating Trends Chart ===');

    const trendsChart = document.getElementById('trendsChart');
    if (!trendsChart) {
        console.error('trendsChart element not found');
        return Promise.resolve();
    }

    if (!analyticsData.trends?.trends) {
        console.error('No trends data available');
        return Promise.resolve();
    }

    const data = analyticsData.trends.trends;
    console.log('Trends data:', data);

    // Check if Plotly is available
    if (typeof Plotly === 'undefined') {
        console.error('Plotly is not available');
        return Promise.resolve();
    }

    // Ensure the container is clean
    trendsChart.innerHTML = '';

    const chartData = [
        {
            x: data.map(item => item.date),
            y: data.map(item => item.total_calls),
            type: 'scatter',
            mode: 'lines+markers',
            name: 'Total Calls',
            line: { color: '#36A2EB' },
            yaxis: 'y'
        },
        {
            x: data.map(item => item.date),
            y: data.map(item => item.potential_calls),
            type: 'scatter',
            mode: 'lines+markers',
            name: 'Potential Calls',
            line: { color: '#4BC0C0' },
            yaxis: 'y'
        },
        {
            x: data.map(item => item.date),
            y: data.map(item => item.transfer_rate),
            type: 'scatter',
            mode: 'lines+markers',
            name: 'Transfer Rate (%)',
            line: { color: '#FF6384' },
            yaxis: 'y2'
        }
    ];

    const layout = {
        title: {
            text: 'Transfer Rate Trends',
            font: { size: 16 }
        },
        xaxis: {
            title: 'Date',
            type: 'date'
        },
        yaxis: {
            title: 'Number of Calls',
            side: 'left'
        },
        yaxis2: {
            title: 'Transfer Rate (%)',
            side: 'right',
            overlaying: 'y'
        },
        margin: { t: 50, b: 50, l: 60, r: 60 },
        showlegend: true,
        legend: {
            orientation: 'h',
            y: -0.2
        }
    };

    const config = {
        responsive: true,
        displayModeBar: false
    };

    console.log('Rendering trends chart with data:', chartData);
    try {
        return Plotly.newPlot(trendsChart, chartData, layout, config).then(() => {
            console.log('✅ Trends chart rendered successfully');
        });
    } catch (error) {
        console.error('❌ Trends chart error:', error);
        return Promise.reject(error);
    }
}

// =======================
// ANALYTICS LOADING AND DEBUGGING
// =======================

function initializeDataTables() {
    console.log('=== Initializing DataTables ===');

    // Initialize Users Table
    const usersTableElement = document.getElementById('usersTable');
    if (usersTableElement) {
        usersTable = $(usersTableElement).DataTable({
            responsive: true,
            pageLength: 25,
            order: [[0, 'asc']], // Sort by username
            columnDefs: [
                { orderable: false, targets: [4] } // Disable sorting on Actions column
            ],
            language: {
                search: "Search users:",
                lengthMenu: "Show _MENU_ users per page",
                info: "Showing _START_ to _END_ of _TOTAL_ users",
                infoEmpty: "No users found",
                infoFiltered: "(filtered from _MAX_ total users)"
            }
        });
        console.log('Users table initialized');
    }

    // Initialize Logs Table
    const logsTableElement = document.getElementById('logsTable');
    if (logsTableElement) {
        logsTable = $(logsTableElement).DataTable({
            responsive: true,
            pageLength: 25,
            order: [[0, 'desc']], // Sort by date/time, newest first
            columnDefs: [
                { orderable: false, targets: [5] } // Disable sorting on Actions column if present
            ],
            language: {
                search: "Search logs:",
                lengthMenu: "Show _MENU_ logs per page",
                info: "Showing _START_ to _END_ of _TOTAL_ logs",
                infoEmpty: "No logs found",
                infoFiltered: "(filtered from _MAX_ total logs)"
            }
        });
        console.log('Logs table initialized');
    }
}



function updateFilterStatusDisplay(days, userGroup, callType) {
    const statusElement = document.getElementById('filterStatus');
    if (!statusElement) return;

    // Format user-friendly filter descriptions
    const dateText = `Last ${days} days`;
    const userText = userGroup === 'all' ? 'All users' :
                    userGroup === 'active' ? 'Active users' :
                    userGroup === 'top' ? 'Top performers' :
                    userGroup === 'bottom' ? 'Needs improvement' : userGroup;
    const callText = callType === 'all' ? 'All call types' :
                    callType === 'potential' ? 'Potential sales only' : callType;

    statusElement.innerHTML = `
        <i class="fas fa-info-circle me-1"></i>
        Current filters: ${dateText}, ${userText}, ${callText}
    `;
}

// =======================
// USER MANAGEMENT FUNCTIONS
// =======================

// Export functions for global access
window.editUser = editUser;
window.deactivateUser = deactivateUser;
window.activateUser = activateUser;
window.resetPassword = resetPassword;
window.deleteUser = deleteUser;
window.viewUserDetails = viewUserDetails;
window.applyAnalyticsFilters = applyAnalyticsFilters;
window.applyLogFilters = applyLogFilters;
window.showUserLogs = showUserLogs;
window.updateFilterStatusDisplay = updateFilterStatusDisplay;
window.loadAnalyticsData = loadAnalyticsData;

// =======================
// LOG MANAGEMENT
// =======================

async function loadFilteredLogs(userId = '', callType = '', dateFrom = '', dateTo = '', search = '') {
    console.log('=== Loading Filtered Logs ===');
    console.log('Filters:', { userId, callType, dateFrom, dateTo, search });

    try {
        // Build query parameters
        const params = new URLSearchParams();
        if (userId) params.append('user_id', userId);
        if (callType) params.append('call_type', callType);
        if (dateFrom) params.append('date_from', dateFrom);
        if (dateTo) params.append('date_to', dateTo);
        if (search) params.append('search', search);

        const queryString = params.toString();
        console.log('Fetching logs with filters:', queryString);

        const response = await fetch(`/admin/analytics/call-logs?${queryString}`, {
            headers: {
                'Authorization': getCookie('access_token')
            }
        });

        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json();
        console.log('Received filtered logs:', data);

        // Update the logs table
        updateLogsTable(data.logs || []);

        showAlert(`Loaded ${data.logs ? data.logs.length : 0} filtered logs`, 'success');

    } catch (error) {
        console.error('Error loading filtered logs:', error);
        showAlert('Error loading logs: ' + error.message, 'danger');
    }
}

function updateLogsTable(logs) {
    console.log('Updating logs table with', logs.length, 'logs');

    const logsTable = document.getElementById('logsTable');
    if (!logsTable) {
        console.error('Logs table not found');
        return;
    }

    const tbody = logsTable.querySelector('tbody');
    if (!tbody) {
        console.error('Logs table tbody not found');
        return;
    }

    // Clear existing rows
    tbody.innerHTML = '';

    if (logs.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center text-muted py-4">
                    <i class="fas fa-search fa-2x mb-2"></i>
                    <div>No logs found with current filters</div>
                </td>
            </tr>
        `;
        return;
    }

    // Add filtered logs
    logs.forEach(log => {
        const row = document.createElement('tr');

        // Format timestamp
        const timestamp = new Date(log.timestamp).toLocaleDateString('en-US', {
            month: '2-digit',
            day: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        });

        // Determine status badge
        const potentialSaleTypes = ['AOD', 'APPOINTMENT', 'T2', 'HPA'];
        const isPotentialSale = potentialSaleTypes.includes(log.call_type);
        const statusBadge = isPotentialSale
            ? '<span class="badge bg-success">Potential Sale</span>'
            : `<span class="badge bg-secondary">${log.call_type}</span>`;

        // Create username cell - only make clickable if user role is 'USER'
        const usernameCell = log.user.role === 'USER'
            ? `<a href="#" onclick="showUserLogs('${log.user.username}', ${log.user.id}); return false;" class="text-decoration-none">${log.user.name}</a>`
            : log.user.name;

        // Create transfer rate cell
        const transferRateCell = log.user.transfer_rate !== null && log.user.transfer_rate !== undefined
            ? `<span class="fw-bold">${log.user.transfer_rate.toFixed(1)}%</span>`
            : '<span class="text-muted">—</span>';

        row.innerHTML = `
            <td><small>${timestamp}</small></td>
            <td>${usernameCell}</td>
            <td>${transferRateCell}</td>
            <td>${log.log_list.name || 'N/A'}</td>
            <td><span class="badge bg-info">${log.call_type}</span></td>
            <td>${statusBadge}</td>
        `;

        tbody.appendChild(row);
    });
}

function showUserLogs(username, userId) {
    console.log(`Showing logs for user: ${username} (ID: ${userId})`);

    // Set the user filter
    const userFilter = document.getElementById('logUserFilter');
    if (userFilter) {
        userFilter.value = userId.toString();
    }

    // Clear other filters
    const callTypeFilter = document.getElementById('logTypeFilter');
    const dateFromFilter = document.getElementById('logDateFrom');
    const dateToFilter = document.getElementById('logDateTo');
    const searchFilter = document.getElementById('logSearchFilter');

    if (callTypeFilter) callTypeFilter.value = '';
    if (dateFromFilter) dateFromFilter.value = '';
    if (dateToFilter) dateToFilter.value = '';
    if (searchFilter) searchFilter.value = '';

    // Switch to logs tab
    const logsTab = document.getElementById('logs-tab');
    if (logsTab) {
        logsTab.click();
    }

    // Apply the filter
    setTimeout(() => {
        loadFilteredLogs(userId.toString(), '', '', '', '');
        showAlert(`Showing logs for ${username}`, 'info');
    }, 300);
}

// =======================

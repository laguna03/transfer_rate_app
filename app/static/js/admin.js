// Admin Dashboard JavaScript

// Create User Form Handler
document.getElementById('createUserForm').addEventListener('submit', async function(e) {
    e.preventDefault();

    const userData = {
        username: document.getElementById('newUsername').value,
        name: document.getElementById('newName').value,
        password: document.getElementById('newPassword').value,
        role: document.getElementById('newRole').value
    };

    console.log('Creating user with data:', userData);

    const token = getCookie('access_token');
    console.log('Using token:', token ? token.substring(0, 20) + '...' : 'No token found');

    try {
        const response = await fetch('/admin/users', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': token
            },
            body: JSON.stringify(userData)
        });

        console.log('Response status:', response.status);
        console.log('Response ok:', response.ok);

        if (response.ok) {
            const result = await response.json();
            console.log('Success result:', result);

            // Close create modal
            bootstrap.Modal.getInstance(document.getElementById('createUserModal')).hide();

            // Clear the form
            document.getElementById('createUserForm').reset();

            // Show success message and reload
            alert('User created successfully!');
            location.reload();
        } else {
            let errorMessage = 'Error creating user';
            try {
                const error = await response.json();
                console.log('Error response:', error);
                errorMessage = error.detail || error.message || errorMessage;
            } catch (parseError) {
                console.log('Failed to parse error response:', parseError);
                errorMessage = `Error creating user (Status: ${response.status})`;
            }
            alert(errorMessage);
        }
    } catch (error) {
        console.error('Network error:', error);
        alert('Network error: Please check your connection and try again.');
    }
});

// Edit User Form Handler
document.getElementById('editUserForm').addEventListener('submit', async function(e) {
    e.preventDefault();

    const userId = document.getElementById('editUserId').value;
    const userData = {
        username: document.getElementById('editUsername').value,
        name: document.getElementById('editName').value,
        role: document.getElementById('editRole').value
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
            bootstrap.Modal.getInstance(document.getElementById('editUserModal')).hide();
            location.reload();
        } else {
            let errorMessage = 'Error updating user';
            try {
                const error = await response.json();
                errorMessage = error.detail || error.message || errorMessage;
            } catch (parseError) {
                errorMessage = `Error updating user (Status: ${response.status})`;
            }
            alert(errorMessage);
        }
    } catch (error) {
        console.error('Network error:', error);
        alert('Network error: Please check your connection and try again.');
    }
});

// Edit User Function
function editUser(userId, username, name, role) {
    document.getElementById('editUserId').value = userId;
    document.getElementById('editUsername').value = username;
    document.getElementById('editName').value = name;
    document.getElementById('editRole').value = role;

    new bootstrap.Modal(document.getElementById('editUserModal')).show();
}

// Deactivate User Function
async function deactivateUser(userId) {
    if (!confirm('Are you sure you want to deactivate this user?')) {
        return;
    }

    try {
        const response = await fetch(`/admin/users/${userId}/deactivate`, {
            method: 'POST',
            headers: {
                'Authorization': getCookie('access_token')
            }
        });

        if (response.ok) {
            location.reload();
        } else {
            let errorMessage = 'Error deactivating user';
            try {
                const error = await response.json();
                errorMessage = error.detail || error.message || errorMessage;
            } catch (parseError) {
                errorMessage = `Error deactivating user (Status: ${response.status})`;
            }
            alert(errorMessage);
        }
    } catch (error) {
        console.error('Network error:', error);
        alert('Network error: Please check your connection and try again.');
    }
}

// Activate User Function
async function activateUser(userId) {
    try {
        const response = await fetch(`/admin/users/${userId}/activate`, {
            method: 'POST',
            headers: {
                'Authorization': getCookie('access_token')
            }
        });

        if (response.ok) {
            location.reload();
        } else {
            let errorMessage = 'Error activating user';
            try {
                const error = await response.json();
                errorMessage = error.detail || error.message || errorMessage;
            } catch (parseError) {
                errorMessage = `Error activating user (Status: ${response.status})`;
            }
            alert(errorMessage);
        }
    } catch (error) {
        console.error('Network error:', error);
        alert('Network error: Please check your connection and try again.');
    }
}

// Reset Password Function
async function resetPassword(userId) {
    if (!confirm('Are you sure you want to reset this user\'s password?')) {
        return;
    }

    console.log('Resetting password for user:', userId);
    const token = getCookie('access_token');
    console.log('Using token:', token ? token.substring(0, 20) + '...' : 'No token found');

    try {
        const response = await fetch(`/admin/users/${userId}/reset-password`, {
            method: 'POST',
            headers: {
                'Authorization': token
            }
        });

        console.log('Reset password response status:', response.status);
        console.log('Reset password response ok:', response.ok);

        if (response.ok) {
            const result = await response.json();
            console.log('Reset password result:', result);
            document.getElementById('tempPassword').textContent = result.temp_password;
            new bootstrap.Modal(document.getElementById('passwordResetModal')).show();
        } else {
            let errorMessage = 'Error resetting password';
            try {
                const error = await response.json();
                errorMessage = error.detail || error.message || errorMessage;
            } catch (parseError) {
                errorMessage = `Error resetting password (Status: ${response.status})`;
            }
            alert(errorMessage);
        }
    } catch (error) {
        console.error('Network error:', error);
        alert('Network error: Please check your connection and try again.');
    }
}

// Delete User Function
async function deleteUser(userId, username) {
    const confirmMessage = `Are you sure you want to PERMANENTLY DELETE user "${username}"?\n\nThis action cannot be undone and will delete:\n- The user account\n- All their log lists\n- All their call log data\n\nType "DELETE" to confirm:`;

    const confirmation = prompt(confirmMessage);
    if (confirmation !== 'DELETE') {
        return;
    }

    console.log('Deleting user:', userId, username);
    const token = getCookie('access_token');
    console.log('Using token:', token ? token.substring(0, 20) + '...' : 'No token found');

    try {
        const response = await fetch(`/admin/users/${userId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': token
            }
        });

        console.log('Delete user response status:', response.status);
        console.log('Delete user response ok:', response.ok);

        if (response.ok) {
            alert(`User "${username}" has been permanently deleted.`);
            location.reload();
        } else {
            let errorMessage = 'Error deleting user';
            try {
                const error = await response.json();
                console.log('Delete error response:', error);
                errorMessage = error.detail || error.message || errorMessage;
            } catch (parseError) {
                console.log('Failed to parse error response:', parseError);
                errorMessage = `Error deleting user (Status: ${response.status})`;
            }
            alert(errorMessage);
        }
    } catch (error) {
        console.error('Network error:', error);
        alert('Network error: Please check your connection and try again.');
    }
}

// View User Details Function
async function viewUserDetails(userId, username) {
    console.log('Viewing details for user:', userId, username);

    // Set the modal title
    document.getElementById('userDetailsName').textContent = username;

    // Show loading state
    document.getElementById('userDetailsContent').innerHTML = `
        <div class="text-center">
            <div class="spinner-border" role="status">
                <span class="visually-hidden">Loading...</span>
            </div>
        </div>
    `;

    // Show the modal
    const modal = new bootstrap.Modal(document.getElementById('userDetailsModal'));
    modal.show();

    const token = getCookie('access_token');

    try {
        const response = await fetch(`/admin/users/${userId}/details`, {
            method: 'GET',
            headers: {
                'Authorization': token
            }
        });

        if (response.ok) {
            const data = await response.json();
            displayUserDetails(data);
        } else {
            let errorMessage = 'Error loading user details';
            try {
                const error = await response.json();
                errorMessage = error.detail || errorMessage;
            } catch (parseError) {
                errorMessage = `Error loading user details (Status: ${response.status})`;
            }
            document.getElementById('userDetailsContent').innerHTML = `
                <div class="alert alert-danger">
                    ${errorMessage}
                </div>
            `;
        }
    } catch (error) {
        console.error('Network error:', error);
        document.getElementById('userDetailsContent').innerHTML = `
            <div class="alert alert-danger">
                Network error: Please check your connection and try again.
            </div>
        `;
    }
}

function displayUserDetails(data) {
    const { user, stats, log_lists } = data;

    let html = `
        <div class="row mb-4">
            <div class="col-md-6">
                <h6>User Information</h6>
                <table class="table table-sm">
                    <tr><td><strong>Username:</strong></td><td>${user.username}</td></tr>
                    <tr><td><strong>Full Name:</strong></td><td>${user.name}</td></tr>
                    <tr><td><strong>Role:</strong></td><td><span class="badge bg-primary">${user.role}</span></td></tr>
                    <tr><td><strong>Status:</strong></td><td><span class="badge bg-${user.is_active ? 'success' : 'secondary'}">${user.is_active ? 'Active' : 'Inactive'}</span></td></tr>
                    <tr><td><strong>Created:</strong></td><td>${user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}</td></tr>
                </table>
            </div>
            <div class="col-md-6">
                <h6>Performance Statistics</h6>
                <table class="table table-sm">
                    <tr><td><strong>Transfer Rate:</strong></td><td><span class="badge bg-${getTransferRateColor(stats.transfer_rate)}">${stats.transfer_rate}%</span></td></tr>
                    <tr><td><strong>Total Calls:</strong></td><td>${stats.total_calls}</td></tr>
                    <tr><td><strong>Potential Sales:</strong></td><td>${stats.potential_calls}</td></tr>
                    <tr><td><strong>Log Lists:</strong></td><td>${stats.log_lists_count}</td></tr>
                </table>
            </div>
        </div>
    `;

    if (log_lists && log_lists.length > 0) {
        html += `
            <h6>Log Lists & Call Details</h6>
            <div class="accordion" id="logListsAccordion">
        `;

        log_lists.forEach((logList, index) => {
            html += `
                <div class="accordion-item">
                    <h2 class="accordion-header" id="heading${index}">
                        <button class="accordion-button ${index === 0 ? '' : 'collapsed'}" type="button" data-bs-toggle="collapse" data-bs-target="#collapse${index}">
                            <strong>${logList.name}</strong>
                            <span class="ms-auto me-3">
                                <span class="badge bg-${getTransferRateColor(logList.transfer_rate)}">${logList.transfer_rate}%</span>
                                <span class="badge bg-info ms-1">${logList.potential_calls}/${logList.total_calls} calls</span>
                            </span>
                        </button>
                    </h2>
                    <div id="collapse${index}" class="accordion-collapse collapse ${index === 0 ? 'show' : ''}" data-bs-parent="#logListsAccordion">
                        <div class="accordion-body">
            `;

            if (logList.calls && logList.calls.length > 0) {
                html += `
                    <div class="table-responsive">
                        <table class="table table-sm">
                            <thead>
                                <tr>
                                    <th>Call Type</th>
                                    <th>Date/Time</th>
                                    <th>Potential Sale</th>
                                </tr>
                            </thead>
                            <tbody>
                `;

                logList.calls.forEach(call => {
                    html += `
                        <tr>
                            <td><span class="badge bg-${call.is_potential_sale ? 'success' : 'secondary'}">${call.call_type}</span></td>
                            <td>${call.timestamp ? new Date(call.timestamp).toLocaleString() : 'N/A'}</td>
                            <td>${call.is_potential_sale ? '<span class="text-success">Yes</span>' : '<span class="text-secondary">No</span>'}</td>
                        </tr>
                    `;
                });

                html += `
                            </tbody>
                        </table>
                    </div>
                `;
            } else {
                html += '<p class="text-muted">No calls logged yet.</p>';
            }

            html += `
                        </div>
                    </div>
                </div>
            `;
        });

        html += '</div>';
    } else {
        html += '<div class="alert alert-info">No log lists found for this user.</div>';
    }

    document.getElementById('userDetailsContent').innerHTML = html;
}

function getTransferRateColor(rate) {
    if (rate >= 70) return 'success';
    if (rate >= 50) return 'warning';
    return 'danger';
}

// Log Lists Filtering Functionality
document.addEventListener('DOMContentLoaded', function() {
    const monthFilter = document.getElementById('monthFilter');
    const nameFilter = document.getElementById('nameFilter');
    const logListsTable = document.getElementById('logListsTable');
    const listCount = document.getElementById('listCount');

    if (monthFilter && nameFilter && logListsTable) {
        function filterLogLists() {
            const monthValue = monthFilter.value;
            const nameValue = nameFilter.value.toLowerCase();
            const rows = logListsTable.querySelectorAll('tbody tr');
            let visibleCount = 0;

            rows.forEach(row => {
                const rowMonth = row.getAttribute('data-month') || '';
                const rowName = row.getAttribute('data-name') || '';
                const rowOwner = row.getAttribute('data-owner') || '';

                let showRow = true;

                // Filter by month
                if (monthValue && rowMonth !== monthValue) {
                    showRow = false;
                }

                // Filter by name (searches both list name and owner)
                if (nameValue && !rowName.includes(nameValue) && !rowOwner.includes(nameValue)) {
                    showRow = false;
                }

                if (showRow) {
                    row.style.display = '';
                    visibleCount++;
                } else {
                    row.style.display = 'none';
                }
            });

            // Update count
            if (listCount) {
                listCount.textContent = `${visibleCount} of ${rows.length} lists`;
            }

            // Update system overview based on visible rows
            updateSystemOverview(rows);
        }

        function updateSystemOverview(allRows) {
            const visibleRows = Array.from(allRows).filter(row => row.style.display !== 'none');

            let totalCalls = 0;
            let totalPotential = 0;

            visibleRows.forEach(row => {
                const callsCell = row.querySelector('td:nth-child(4)');
                if (callsCell) {
                    const callsText = callsCell.textContent.trim();
                    if (callsText !== '0' && callsText !== '-') {
                        const matches = callsText.match(/(\d+)\/(\d+)/);
                        if (matches) {
                            totalPotential += parseInt(matches[1]);
                            totalCalls += parseInt(matches[2]);
                        }
                    }
                }
            });

            // Update system overview stats
            const logListsCountElement = document.querySelector('.col-md-3:nth-child(2) h4');
            const totalCallsElement = document.querySelector('.col-md-3:nth-child(3) h4');
            const systemRateElement = document.querySelector('.col-md-3:nth-child(4) h4');

            if (logListsCountElement) {
                logListsCountElement.textContent = visibleRows.length;
            }
            if (totalCallsElement) {
                totalCallsElement.textContent = totalCalls;
            }
            if (systemRateElement) {
                const systemRate = totalCalls > 0 ? ((totalPotential / totalCalls) * 100).toFixed(1) : 0;
                systemRateElement.textContent = systemRate + '%';
            }
        }

        // Add event listeners
        monthFilter.addEventListener('change', filterLogLists);
        nameFilter.addEventListener('input', filterLogLists);
    }
});

// Utility function to get cookie value
function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
}

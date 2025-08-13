// Main JavaScript file for the application

// Utility function to get cookie value
function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
}

// Get auth headers
function getAuthHeaders() {
    const token = getCookie('access_token');
    return {
        'Content-Type': 'application/json',
        'Authorization': token || ''
    };
}

document.getElementById("createLogListForm").addEventListener("submit", async function(event) {
    event.preventDefault();
    const name = document.getElementById("logListName").value.trim();
    if (!name) return;
    try {
        const response = await fetch("/log-lists/", {
            method: "POST",
            headers: getAuthHeaders(),
            body: JSON.stringify({ name })
        });
        if (!response.ok) throw new Error("Failed to create log list");
        window.location.reload();
    } catch (error) {
        alert("Error: " + error.message);
    }
});

// Handle log list selection change (only if element exists)
const logListSelect = document.getElementById("logListSelect");
if (logListSelect) {
    logListSelect.addEventListener("change", function() {
        const logListId = this.value;
        window.location.href = `/?log_list_id=${logListId}`;
    });
}

// Handle log list deletion (only if element exists)
const deleteLogListBtn = document.getElementById("deleteLogListBtn");
if (deleteLogListBtn) {
    deleteLogListBtn.addEventListener("click", async function() {
        const logListSelect = document.getElementById("logListSelect");
        const logListId = logListSelect.value;
        const logListName = logListSelect.options[logListSelect.selectedIndex].text;

        if (!logListId) {
            alert("Please select a log list to delete");
            return;
        }

        if (confirm(`Are you sure you want to delete the log list "${logListName}" and all its call logs?`)) {
            try {
                const response = await fetch(`/log-lists/${logListId}`, {
                    method: "DELETE",
                    headers: getAuthHeaders()
                });

                if (!response.ok) {
                    throw new Error("Failed to delete log list");
                }

                // Redirect to home to show the first available log list
                window.location.href = "/";

            } catch (error) {
                alert("Error: " + error.message);
            }
        }
    });
}

// Handle call logging (only if element exists)
const logCallForm = document.getElementById("logCallForm");
if (logCallForm) {
    logCallForm.addEventListener("submit", async function(event) {
        event.preventDefault();
        const callType = document.getElementById("callType").value;
        const logListSelect = document.getElementById("logListSelect");
        const logListId = logListSelect ? logListSelect.value : null;

        if (!callType || !logListId) {
            alert("Please select a call type and ensure you have a log list selected");
            return;
        }
        try {
            const response = await fetch("/calls/", {
                method: "POST",
                headers: getAuthHeaders(),
                body: JSON.stringify({ call_type: callType, log_list_id: parseInt(logListId) })
            });
            if (!response.ok) throw new Error("Failed to log call");
            window.location.reload();
        } catch (error) {
            alert("Error: " + error.message);
        }
    });
}

// Handle delete button clicks
document.addEventListener("click", async function(event) {
    if (event.target.classList.contains("delete-btn")) {
        const row = event.target.closest("tr");
        const callId = row.getAttribute("data-id");

        if (confirm("Are you sure you want to delete this call log?")) {
            try {
                const response = await fetch(`/calls/${callId}`, {
                    method: "DELETE",
                    headers: getAuthHeaders()
                });

                if (!response.ok) {
                    throw new Error("Failed to delete call");
                }

                // Remove the row from the table without refreshing
                row.remove();

                // Optionally refresh transfer rate
                window.location.reload();

            } catch (error) {
                alert("Error: " + error.message);
            }
        }
    }
});


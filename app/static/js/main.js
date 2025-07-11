// Main JavaScript file for the application
document.getElementById("createLogListForm").addEventListener("submit", async function(event) {
    event.preventDefault();
    const name = document.getElementById("logListName").value.trim();
    if (!name) return;
    try {
        const response = await fetch("/log-lists/", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name })
        });
        if (!response.ok) throw new Error("Failed to create log list");
        window.location.reload();
    } catch (error) {
        alert("Error: " + error.message);
    }
});
// Handle log list selection change
document.getElementById("logListSelect").addEventListener("change", function() {
    const logListId = this.value;
    window.location.href = `/?log_list_id=${logListId}`;
});

// Handle log list deletion
document.getElementById("deleteLogListBtn").addEventListener("click", async function() {
    const logListSelect = document.getElementById("logListSelect");
    const logListId = logListSelect.value;
    const logListName = logListSelect.options[logListSelect.selectedIndex].text;

    if (!logListId) {
        alert("Please select a log list to delete");
        return;
    }

    if (logListSelect.options.length <= 1) {
        alert("Cannot delete the last log list");
        return;
    }

    if (confirm(`Are you sure you want to delete the log list "${logListName}" and all its call logs?`)) {
        try {
            const response = await fetch(`/log-lists/${logListId}`, {
                method: "DELETE"
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

// Handle call logging
document.getElementById("logCallForm").addEventListener("submit", async function(event) {
    event.preventDefault();
    const callType = document.getElementById("callType").value;
    const logListId = document.getElementById("logListSelect").value;
    if (!callType || !logListId) {
        alert("Please select a call type and log list");
        return;
    }
    try {
        const response = await fetch("/calls/", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ call_type: callType, log_list_id: parseInt(logListId) })
        });
        if (!response.ok) throw new Error("Failed to log call");
        window.location.reload();
    } catch (error) {
        alert("Error: " + error.message);
    }
});


// Handle delete button clicks
document.addEventListener("click", async function(event) {
    if (event.target.classList.contains("delete-btn")) {
        const row = event.target.closest("tr");
        const callId = row.getAttribute("data-id");

        if (confirm("Are you sure you want to delete this call log?")) {
            try {
                const response = await fetch(`/calls/${callId}`, {
                    method: "DELETE"
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


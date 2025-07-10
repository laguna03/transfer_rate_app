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

document.getElementById("logListSelect").addEventListener("change", function() {
    const logListId = this.value;
    window.location.href = `/?log_list_id=${logListId}`;
});


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


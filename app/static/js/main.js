document.getElementById("logCallForm").addEventListener("submit", async function(event) {
    event.preventDefault();
    const callType = document.getElementById("callType").value;
    if (!callType) {
        alert("Please select a call type");
        return;
    }

    try {
        const response = await fetch("/calls/", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ call_type: callType })
        });

        if (!response.ok) {
            throw new Error("Failed to log call");
        }

        // Refresh the page to update call list and transfer rate
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


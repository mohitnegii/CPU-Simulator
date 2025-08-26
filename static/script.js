/**
 * CPU Scheduling Algorithm Simulator
 * Enhanced implementation with interactive features and chart visualizations
 */

// Store process colors for consistent visualization
const processColors = [
    '#3498db', '#2ecc71', '#e74c3c', '#f39c12', '#9b59b6', 
    '#1abc9c', '#d35400', '#34495e', '#16a085', '#c0392b'
];

// Algorithm descriptions for the info panel
const algorithmDescriptions = {
    fcfs: "First Come First Served (FCFS) is the simplest scheduling algorithm that executes processes in the order they arrive in the ready queue.",
    sjf: "Shortest Job First (SJF) selects the process with the smallest execution time. It's a non-preemptive algorithm.",
    srtf: "Shortest Remaining Time First (SRTF) is the preemptive version of SJF. The process with the smallest remaining time is selected for execution.",
    rr: "Round Robin (RR) assigns a fixed time unit per process called a time quantum and cycles through them. Processes that exceed the quantum are put back in the queue."
};

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeEventListeners();
    updateAlgorithmDescription();
});

/**
 * Set up all event listeners for the application
 */
function initializeEventListeners() {
    // Add process row
    document.getElementById('add-process').addEventListener('click', addProcessRow);
    
    // Remove process rows - attach to container using event delegation
    document.querySelector('#input-table tbody').addEventListener('click', function(event) {
        if (event.target.classList.contains('remove-btn')) {
            const row = event.target.closest('tr');
            // Don't remove if it's the last row
            if (document.querySelectorAll('#input-table tbody tr').length > 1) {
                row.remove();
            }
        }
    });

    // Show/hide quantum input based on algorithm selection
    document.getElementById('algorithm').addEventListener('change', function() {
        document.getElementById('quantum-container').style.display = 
            this.value === 'rr' ? 'block' : 'none';
        updateAlgorithmDescription();
    });

    // Calculate button
    document.getElementById('calculate').addEventListener('click', runSchedulingSimulation);

    // Reset button
    document.getElementById('reset-btn').addEventListener('click', resetApplication);
}

/**
 * Updates the algorithm description in the UI
 */
function updateAlgorithmDescription() {
    const algorithm = document.getElementById('algorithm').value;
    document.getElementById('algorithm-description').textContent = algorithmDescriptions[algorithm];
}

/**
 * Adds a new process row to the input table
 */
function addProcessRow() {
    const tbody = document.querySelector('#input-table tbody');
    const newRow = document.createElement('tr');
    const rowCount = tbody.children.length + 1;
    
    newRow.innerHTML = `
        <td><input type="number" class="pid" value="${rowCount}" min="1"></td>
        <td><input type="number" class="arrival" value="0" min="0"></td>
        <td><input type="number" class="burst" value="1" min="1"></td>
        <td><button class="remove-btn">×</button></td>
    `;
    
    tbody.appendChild(newRow);
}

/**
 * Reset the application to initial state
 */
function resetApplication() {
    // Reset the process table to have only one row
    const tbody = document.querySelector('#input-table tbody');
    
    // Clear all rows
    while (tbody.firstChild) {
        tbody.removeChild(tbody.firstChild);
    }
    
    // Add three default rows
    for (let i = 1; i <= 3; i++) {
        const defaultRow = document.createElement('tr');
        defaultRow.innerHTML = `
            <td><input type="number" class="pid" value="${i}" min="1"></td>
            <td><input type="number" class="arrival" value="${i-1}" min="0"></td>
            <td><input type="number" class="burst" value="${i === 2 ? 5 : (i === 3 ? 2 : 3)}" min="1"></td>
            <td><button class="remove-btn">×</button></td>
        `;
        tbody.appendChild(defaultRow);
    }
    
    // Reset algorithm selection
    document.getElementById('algorithm').value = 'fcfs';
    document.getElementById('quantum-container').style.display = 'none';
    document.getElementById('quantum').value = '2';
    
    // Hide results section
    document.getElementById('results-section').classList.add('hidden');
    
    // Update algorithm description
    updateAlgorithmDescription();
}
function runSchedulingSimulation() {
    const processes = getProcessesFromUI();
    
    if (processes.length === 0) {
        alert('Please add at least one process');
        return;
    }
    
    const algorithm = document.getElementById('algorithm').value;
    const timeQuantum = algorithm === 'rr' ? parseInt(document.getElementById('quantum').value) : 1;
    
    if (algorithm === 'rr' && (isNaN(timeQuantum) || timeQuantum < 1)) {
        alert('Time quantum must be at least 1');
        return;
    }
    
    // Call backend API for simulation
    callSchedulingAPI(processes, algorithm, timeQuantum);
}

/**
 * Get process data from UI inputs
 */
function getProcessesFromUI() {
    const processes = [];
    const rows = document.querySelectorAll('#input-table tbody tr');
    
    rows.forEach(row => {
        const pid = parseInt(row.querySelector('.pid').value);
        const arrivalTime = parseInt(row.querySelector('.arrival').value);
        const burstTime = parseInt(row.querySelector('.burst').value);
        
        if (!isNaN(pid) && !isNaN(arrivalTime) && !isNaN(burstTime) && burstTime > 0) {
            processes.push({
                pid: pid,
                arrivalTime: arrivalTime,
                burstTime: burstTime
            });
        }
    });
    
    return processes;
}

/**
 * Call backend API to run scheduling algorithm
 */
function callSchedulingAPI(processes, algorithm, timeQuantum) {
    // Show loading state
    document.getElementById('calculate').textContent = 'Calculating...';
    document.getElementById('calculate').disabled = true;
    
    fetch('http://localhost:5000/api/schedule', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            processes: processes,
            algorithm: algorithm,
            timeQuantum: timeQuantum
        })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(data => {
        displayResults(data);
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Error communicating with server. Please check if the server is running.');
    })
    .finally(() => {
        // Reset button state
        document.getElementById('calculate').textContent = 'Calculate';
        document.getElementById('calculate').disabled = false;
    });
}

/**
 * Display simulation results in the UI
 */
function displayResults(results) {
    // Show results section
    document.getElementById('results-section').classList.remove('hidden');
    
    // Display Gantt Chart
    displayGanttChart(results.timeline);
    
    // Display Results Table
    displayResultsTable(results.processes);
    
    // Display Average Metrics
    displayAverageMetrics(results.avgWaitingTime, results.avgTurnaroundTime);
    
    // Display Charts
    displayCharts(results.charts);
    
    // Scroll to results
    document.getElementById('results-section').scrollIntoView({ behavior: 'smooth' });
}

/**
 * Display the Gantt chart visualization
 */
function displayGanttChart(timeline) {
    const ganttContainer = document.getElementById('gantt-chart');
    const timelineMarkers = document.getElementById('timeline-markers');
    
    // Clear previous content
    ganttContainer.innerHTML = '';
    timelineMarkers.innerHTML = '';
    
    // Scale factor for gantt chart (pixels per time unit)
    const scaleFactor = 50;
    
    // Track used PIDs to assign consistent colors
    const usedPids = new Set();
    
    // Find all unique PIDs in the timeline
    timeline.forEach(block => {
        if (block.pid !== 'Idle') {
            usedPids.add(block.pid);
        }
    });
    
    // Create a mapping of PID to color
    const pidToColorMap = {};
    let colorIndex = 0;
    usedPids.forEach(pid => {
        pidToColorMap[pid] = processColors[colorIndex % processColors.length];
        colorIndex++;
    });
    
    // Add blocks to the Gantt chart
    timeline.forEach(block => {
        const blockWidth = (block.endTime - block.startTime) * scaleFactor;
        
        // Create block element
        const blockElement = document.createElement('div');
        blockElement.className = `gantt-block ${block.pid === 'Idle' ? 'idle' : ''}`;
        blockElement.textContent = block.pid === 'Idle' ? 'Idle' : `P${block.pid}`;
        blockElement.style.width = `${blockWidth}px`;
        
        // Set block color based on PID
        if (block.pid !== 'Idle') {
            blockElement.style.backgroundColor = pidToColorMap[block.pid];
        }
        
        // Add tooltip with more info
        blockElement.title = `${block.pid === 'Idle' ? 'Idle' : 'Process ' + block.pid}
Start: ${block.startTime}
End: ${block.endTime}
Duration: ${block.endTime - block.startTime}`;
        
        ganttContainer.appendChild(blockElement);
        
        // Add time markers at start and end points
        if (timeline.indexOf(block) === 0) {
            addTimeMarker(timelineMarkers, block.startTime, 0);
        }
        addTimeMarker(timelineMarkers, block.endTime, blockWidth);
    });
}

/**
 * Add a time marker to the timeline
 */
function addTimeMarker(container, time, position) {
    const marker = document.createElement('div');
    marker.className = 'time-marker';
    marker.textContent = time;
    marker.style.left = `${position}px`;
    container.appendChild(marker);
}

/**
 * Display results table with process metrics
 */
function displayResultsTable(processes) {
    const tbody = document.querySelector('#result-table tbody');
    tbody.innerHTML = '';
    
    processes.forEach(proc => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>P${proc.pid}</td>
            <td>${proc.arrivalTime}</td>
            <td>${proc.burstTime}</td>
            <td>${proc.completionTime}</td>
            <td>${proc.turnaroundTime}</td>
            <td>${proc.waitingTime}</td>
        `;
        tbody.appendChild(row);
    });
}

/**
 * Display average metrics summary
 */
function displayAverageMetrics(avgWaiting, avgTurnaround) {
    document.getElementById('averages').innerHTML = `
        <div class="metric-item">
            <div>Average Turnaround Time</div>
            <div class="metric-value">${avgTurnaround}</div>
        </div>
        <div class="metric-item">
            <div>Average Waiting Time</div>
            <div class="metric-value">${avgWaiting}</div>
        </div>
    `;
}

/**
 * Display pie charts for waiting and turnaround times
 */
function displayCharts(charts) {
    if (!charts) return;
    
    // Display waiting time chart
    const waitingChart = document.getElementById('waiting-chart');
    waitingChart.innerHTML = '';
    
    const waitingImg = document.createElement('img');
    waitingImg.src = charts.waitingChart;
    waitingImg.alt = 'Waiting Time Distribution';
    waitingChart.appendChild(waitingImg);
    
    // Display turnaround time chart
    const turnaroundChart = document.getElementById('turnaround-chart');
    turnaroundChart.innerHTML = '';
    
    const turnaroundImg = document.createElement('img');
    turnaroundImg.src = charts.turnaroundChart;
    turnaroundImg.alt = 'Turnaround Time Distribution';
    turnaroundChart.appendChild(turnaroundImg);
}
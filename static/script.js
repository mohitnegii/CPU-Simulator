/**
 * CPU Scheduling Algorithm Simulator
 * Enhanced implementation with interactive features and chart visualizations
 */

// (all your existing variables and functions unchanged up top)
const processColors = [
    '#3498db', '#2ecc71', '#e74c3c', '#f39c12', '#9b59b6', 
    '#1abc9c', '#d35400', '#34495e', '#16a085', '#c0392b'
];

const algorithmDescriptions = {
    fcfs: "First Come First Served (FCFS) is the simplest scheduling algorithm that executes processes in the order they arrive in the ready queue.",
    sjf: "Shortest Job First (SJF) selects the process with the smallest execution time. It's a non-preemptive algorithm.",
    srtf: "Shortest Remaining Time First (SRTF) is the preemptive version of SJF. The process with the smallest remaining time is selected for execution.",
    rr: "Round Robin (RR) assigns a fixed time unit per process called a time quantum and cycles through them. Processes that exceed the quantum are put back in the queue."
};

document.addEventListener('DOMContentLoaded', function() {
    initializeEventListeners();
    updateAlgorithmDescription();
});

function initializeEventListeners() {
    document.getElementById('add-process').addEventListener('click', addProcessRow);
    document.querySelector('#input-table tbody').addEventListener('click', function(event) {
        if (event.target.classList.contains('remove-btn')) {
            const row = event.target.closest('tr');
            if (document.querySelectorAll('#input-table tbody tr').length > 1) {
                row.remove();
            }
        }
    });

    document.getElementById('algorithm').addEventListener('change', function() {
        document.getElementById('quantum-container').style.display = 
            this.value === 'rr' ? 'block' : 'none';
        updateAlgorithmDescription();
    });

    document.getElementById('calculate').addEventListener('click', runSchedulingSimulation);
    document.getElementById('reset-btn').addEventListener('click', resetApplication);
}

function updateAlgorithmDescription() {
    const algorithm = document.getElementById('algorithm').value;
    document.getElementById('algorithm-description').textContent = algorithmDescriptions[algorithm];
}

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

function resetApplication() {
    const tbody = document.querySelector('#input-table tbody');
    while (tbody.firstChild) tbody.removeChild(tbody.firstChild);
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
    
    document.getElementById('algorithm').value = 'fcfs';
    document.getElementById('quantum-container').style.display = 'none';
    document.getElementById('quantum').value = '2';
    document.getElementById('results-section').classList.add('hidden');
    updateAlgorithmDescription();
}

function runSchedulingSimulation() {
    const processes = getProcessesFromUI();
    if (processes.length === 0) { alert('Please add at least one process'); return; }
    const algorithm = document.getElementById('algorithm').value;
    const timeQuantum = algorithm === 'rr' ? parseInt(document.getElementById('quantum').value) : 1;
    if (algorithm === 'rr' && (isNaN(timeQuantum) || timeQuantum < 1)) { alert('Time quantum must be at least 1'); return; }
    callSchedulingAPI(processes, algorithm, timeQuantum);
}

function getProcessesFromUI() {
    const processes = [];
    const rows = document.querySelectorAll('#input-table tbody tr');
    rows.forEach(row => {
        const pid = parseInt(row.querySelector('.pid').value);
        const arrivalTime = parseInt(row.querySelector('.arrival').value);
        const burstTime = parseInt(row.querySelector('.burst').value);
        if (!isNaN(pid) && !isNaN(arrivalTime) && !isNaN(burstTime) && burstTime > 0) {
            processes.push({ pid: pid, arrivalTime: arrivalTime, burstTime: burstTime });
        }
    });
    return processes;
}

/**
 * Build API URL (relative) so same code works locally and on Render.
 * If you ever host frontend separately, change this to the full backend URL.
 */
function apiUrl(path) {
    // relative path - works on localhost and on Render
    return path.startsWith('/') ? path : `/${path}`;
}

/**
 * Call backend API to run scheduling algorithm
 */
function callSchedulingAPI(processes, algorithm, timeQuantum) {
    document.getElementById('calculate').textContent = 'Calculating...';
    document.getElementById('calculate').disabled = true;

    // <-- CHANGED: use relative path here instead of hard-coded localhost -->
    fetch(apiUrl('/api/schedule'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ processes: processes, algorithm: algorithm, timeQuantum: timeQuantum })
    })
    .then(response => {
        if (!response.ok) throw new Error('Network response was not ok');
        return response.json();
    })
    .then(data => {
        displayResults(data);
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Error communicating with server. Please check if the server is running or open the browser console for details.');
    })
    .finally(() => {
        document.getElementById('calculate').textContent = 'Calculate';
        document.getElementById('calculate').disabled = false;
    });
}

/* Remaining UI display functions are unchanged — copy them from your existing file */
function displayResults(results) {
    document.getElementById('results-section').classList.remove('hidden');
    displayGanttChart(results.timeline);
    displayResultsTable(results.processes);
    displayAverageMetrics(results.avgWaitingTime, results.avgTurnaroundTime);
    displayCharts(results.charts);
    document.getElementById('results-section').scrollIntoView({ behavior: 'smooth' });
}

function displayGanttChart(timeline) {
    const ganttContainer = document.getElementById('gantt-chart');
    const timelineMarkers = document.getElementById('timeline-markers');
    ganttContainer.innerHTML = '';
    timelineMarkers.innerHTML = '';
    const scaleFactor = 50;
    const usedPids = new Set();
    timeline.forEach(block => { if (block.pid !== 'Idle') usedPids.add(block.pid); });
    const pidToColorMap = {}; let colorIndex = 0;
    usedPids.forEach(pid => { pidToColorMap[pid] = processColors[colorIndex % processColors.length]; colorIndex++; });
    timeline.forEach(block => {
        const blockWidth = (block.endTime - block.startTime) * scaleFactor;
        const blockElement = document.createElement('div');
        blockElement.className = `gantt-block ${block.pid === 'Idle' ? 'idle' : ''}`;
        blockElement.textContent = block.pid === 'Idle' ? 'Idle' : `P${block.pid}`;
        blockElement.style.width = `${blockWidth}px`;
        if (block.pid !== 'Idle') blockElement.style.backgroundColor = pidToColorMap[block.pid];
        blockElement.title = `${block.pid === 'Idle' ? 'Idle' : 'Process ' + block.pid}\nStart: ${block.startTime}\nEnd: ${block.endTime}\nDuration: ${block.endTime - block.startTime}`;
        ganttContainer.appendChild(blockElement);
        if (timeline.indexOf(block) === 0) addTimeMarker(timelineMarkers, block.startTime, 0);
        addTimeMarker(timelineMarkers, block.endTime, blockWidth);
    });
}

function addTimeMarker(container, time, position) {
    const marker = document.createElement('div');
    marker.className = 'time-marker';
    marker.textContent = time;
    marker.style.left = `${position}px`;
    container.appendChild(marker);
}

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

function displayCharts(charts) {
    if (!charts) return;
    const waitingChart = document.getElementById('waiting-chart');
    waitingChart.innerHTML = '';
    const waitingImg = document.createElement('img');
    waitingImg.src = charts.waitingChart;
    waitingImg.alt = 'Waiting Time Distribution';
    waitingChart.appendChild(waitingImg);
    const turnaroundChart = document.getElementById('turnaround-chart');
    turnaroundChart.innerHTML = '';
    const turnaroundImg = document.createElement('img');
    turnaroundImg.src = charts.turnaroundChart;
    turnaroundImg.alt = 'Turnaround Time Distribution';
    turnaroundChart.appendChild(turnaroundImg);
}

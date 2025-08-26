# CPU Scheduling Algorithms

# First Come First Served (FCFS) algorithm
def fcfs_scheduling(processes):
    # Create a deep copy of processes to avoid modifying the original
    processes_copy = []
    for p in processes:
        processes_copy.append(p.copy())
    
    # Sort by arrival time
    processes_copy.sort(key=lambda x: x['arrivalTime'])
    
    current_time = 0
    timeline = []
    
    for process in processes_copy:
        if process['arrivalTime'] > current_time:
            timeline.append({
                'pid': 'Idle',
                'startTime': current_time,
                'endTime': process['arrivalTime']
            })
            current_time = process['arrivalTime']
        
        # Add the process to the timeline
        start_time = max(current_time, process['arrivalTime'])
        end_time = start_time + process['burstTime']
        
        timeline.append({
            'pid': process['pid'],
            'startTime': start_time,
            'endTime': end_time
        })
        
        # Calculate process metrics
        process['completionTime'] = end_time
        process['turnaroundTime'] = process['completionTime'] - process['arrivalTime']
        process['waitingTime'] = process['turnaroundTime'] - process['burstTime']
        
        current_time = end_time
    
    return {
        'processes': processes_copy,
        'timeline': timeline
    }

# Shortest Job First (SJF) algorithm
def sjf_scheduling(processes):
    # Create a copy of the processes
    processes_copy = []
    for p in processes:
        processes_copy.append(p.copy())
    
    # Sort by arrival time initially
    processes_copy.sort(key=lambda x: x['arrivalTime'])
    
    current_time = 0
    timeline = []
    completed_processes = []
    remaining_processes = processes_copy.copy()
    
    while remaining_processes:
        # Find processes that have arrived by current time
        available_processes = [p for p in remaining_processes if p['arrivalTime'] <= current_time]
        
        if not available_processes:
            # No process available, add idle time and jump to next arrival
            next_arrival = min(p['arrivalTime'] for p in remaining_processes)
            timeline.append({
                'pid': 'Idle',
                'startTime': current_time,
                'endTime': next_arrival
            })
            current_time = next_arrival
            continue
        
        # Find the shortest job
        shortest_process = min(available_processes, key=lambda x: x['burstTime'])
        
        # Add the process to the timeline
        timeline.append({
            'pid': shortest_process['pid'],
            'startTime': current_time,
            'endTime': current_time + shortest_process['burstTime']
        })
        
        # Calculate process metrics
        shortest_process['completionTime'] = current_time + shortest_process['burstTime']
        shortest_process['turnaroundTime'] = shortest_process['completionTime'] - shortest_process['arrivalTime']
        shortest_process['waitingTime'] = shortest_process['turnaroundTime'] - shortest_process['burstTime']
        
        current_time += shortest_process['burstTime']
        
        # Move to completed processes
        completed_processes.append(shortest_process)
        remaining_processes = [p for p in remaining_processes if p['pid'] != shortest_process['pid']]
    
    return {
        'processes': completed_processes,
        'timeline': timeline
    }

# Shortest Remaining Time First (SRTF) algorithm - Added as requested
def srtf_scheduling(processes):
    # Create a deep copy of processes
    processes_copy = []
    for p in processes:
        new_p = p.copy()
        new_p['remainingTime'] = new_p['burstTime']
        processes_copy.append(new_p)
    
    # Sort processes by arrival time
    processes_copy.sort(key=lambda x: x['arrivalTime'])
    
    current_time = 0
    timeline = []
    remaining_processes = processes_copy.copy()
    completed_processes = []
    
    # To track process execution segments
    current_process = None
    start_execution = 0
    
    while remaining_processes:
        # Find arrived processes
        available_processes = [p for p in remaining_processes if p['arrivalTime'] <= current_time]
        
        if not available_processes:
            # No process available, jump to next arrival
            next_arrival = min(p['arrivalTime'] for p in remaining_processes)
            
            # Add idle time to timeline
            if current_time < next_arrival:
                timeline.append({
                    'pid': 'Idle',
                    'startTime': current_time,
                    'endTime': next_arrival
                })
            
            current_time = next_arrival
            continue
        
        # Find process with shortest remaining time
        next_process = min(available_processes, key=lambda x: x['remainingTime'])
        
        # If we're switching processes, record the previous execution segment
        if current_process is not None and (current_process['pid'] != next_process['pid']):
            timeline.append({
                'pid': current_process['pid'],
                'startTime': start_execution,
                'endTime': current_time
            })
            start_execution = current_time
        
        # If this is the first process or we switched processes
        if current_process is None or current_process['pid'] != next_process['pid']:
            current_process = next_process
            start_execution = current_time
        
        # Determine how long to run (until process completes or next process arrives)
        run_until = current_time + next_process['remainingTime']
        
        # Check if any other process arrives before this one finishes
        upcoming_arrivals = [p for p in remaining_processes if p['arrivalTime'] > current_time and p['arrivalTime'] < run_until]
        
        if upcoming_arrivals:
            next_arrival = min(p['arrivalTime'] for p in upcoming_arrivals)
            time_slice = next_arrival - current_time
        else:
            time_slice = next_process['remainingTime']
        
        # Execute for time_slice
        next_process['remainingTime'] -= time_slice
        current_time += time_slice
        
        # If process is completed
        if next_process['remainingTime'] <= 0:
            # Add to timeline
            timeline.append({
                'pid': next_process['pid'],
                'startTime': start_execution,
                'endTime': current_time
            })
            
            # Set completion data
            original_process = next(p for p in processes_copy if p['pid'] == next_process['pid'])
            original_process['completionTime'] = current_time
            original_process['turnaroundTime'] = original_process['completionTime'] - original_process['arrivalTime']
            original_process['waitingTime'] = original_process['turnaroundTime'] - original_process['burstTime']
            
            # Move to completed and reset tracking
            completed_processes.append(original_process)
            remaining_processes = [p for p in remaining_processes if p['pid'] != next_process['pid']]
            current_process = None
    
    # Sort completed processes by PID for consistent output
    completed_processes.sort(key=lambda x: x['pid'])
    
    return {
        'processes': completed_processes,
        'timeline': timeline
    }

# Round Robin (RR) algorithm
def rr_scheduling(processes, time_quantum):
    # Create a deep copy of processes
    processes_copy = []
    for p in processes:
        new_p = p.copy()
        new_p['remainingTime'] = new_p['burstTime']
        processes_copy.append(new_p)
    
    # Sort by arrival time initially
    processes_copy.sort(key=lambda x: x['arrivalTime'])
    
    current_time = 0
    timeline = []
    completed_processes = []
    
    # Create a ready queue and remaining processes list
    ready_queue = []
    remaining_processes = processes_copy.copy()
    
    # Keep track of original processes for final metrics
    original_processes = {}
    for p in processes_copy:
        original_processes[p['pid']] = p.copy()
    
    while ready_queue or remaining_processes:
        # Check for newly arrived processes
        new_arrivals = [p for p in remaining_processes if p['arrivalTime'] <= current_time]
        for proc in new_arrivals:
            ready_queue.append(proc)
            remaining_processes = [p for p in remaining_processes if p['pid'] != proc['pid']]
        
        if not ready_queue:
            # If no processes are ready, add idle time and advance to next arrival
            if remaining_processes:
                next_arrival = min(p['arrivalTime'] for p in remaining_processes)
                timeline.append({
                    'pid': 'Idle',
                    'startTime': current_time,
                    'endTime': next_arrival
                })
                current_time = next_arrival
            continue
        
        # Get the first process from the queue
        current_process = ready_queue.pop(0)
        
        # Calculate how long this process will run
        run_time = min(time_quantum, current_process['remainingTime'])
        
        # Add to timeline
        timeline.append({
            'pid': current_process['pid'],
            'startTime': current_time,
            'endTime': current_time + run_time
        })
        
        # Update process remaining time
        current_process['remainingTime'] -= run_time
        current_time += run_time
        
        # Check for newly arrived processes again
        new_arrivals = [p for p in remaining_processes if p['arrivalTime'] <= current_time]
        for proc in new_arrivals:
            ready_queue.append(proc)
            remaining_processes = [p for p in remaining_processes if p['pid'] != proc['pid']]
        
        # If process is completed, add to completed list
        if current_process['remainingTime'] <= 0:
            # Process is done
            original_process = original_processes[current_process['pid']]
            original_process['completionTime'] = current_time
            original_process['turnaroundTime'] = original_process['completionTime'] - original_process['arrivalTime']
            original_process['waitingTime'] = original_process['turnaroundTime'] - original_process['burstTime']
            completed_processes.append(original_process)
        else:
            # Process still has work to do, put it back in the queue
            ready_queue.append(current_process)
    
    # Sort completed processes by PID for consistent output
    completed_processes.sort(key=lambda x: x['pid'])
    
    return {
        'processes': completed_processes,
        'timeline': timeline
    }
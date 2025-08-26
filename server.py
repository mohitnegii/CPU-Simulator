from flask import Flask, request, jsonify, send_from_directory, render_template
from flask_cors import CORS
import matplotlib
matplotlib.use('Agg')  # Use non-interactive backend
import matplotlib.pyplot as plt
import io
import base64
import os
from scheduling_algorithms import fcfs_scheduling, sjf_scheduling, srtf_scheduling, rr_scheduling

app = Flask(__name__, static_folder="static", template_folder="templates")
CORS(app)  # Enable CORS for all routes

# -------------------------------
# FRONTEND ROUTES
# -------------------------------
@app.route('/')
def home():
    """Serve index.html"""
    return render_template('index.html')

@app.route('/simulator')
def simulator():
    """Serve simulator.html"""
    return render_template('simulator.html')

# -------------------------------
# API ROUTES
# -------------------------------
@app.route('/api/schedule', methods=['POST'])
def schedule():
    try:
        data = request.json
        processes = data['processes']
        algorithm = data['algorithm']
        
        # Validate required fields
        for process in processes:
            if 'pid' not in process or 'arrivalTime' not in process or 'burstTime' not in process:
                return jsonify({'error': 'Missing required process fields'}), 400
        
        # Run the selected algorithm
        if algorithm == 'fcfs':
            results = fcfs_scheduling(processes)
        elif algorithm == 'sjf':
            results = sjf_scheduling(processes)
        elif algorithm == 'srtf':
            results = srtf_scheduling(processes)
        elif algorithm == 'rr':
            time_quantum = data.get('timeQuantum', 1)
            if time_quantum < 1:
                return jsonify({'error': 'Time quantum must be at least 1'}), 400
            results = rr_scheduling(processes, time_quantum)
        else:
            return jsonify({'error': 'Invalid algorithm selected'}), 400
        
        # Calculate average metrics
        avg_waiting_time = sum(p['waitingTime'] for p in results['processes']) / len(results['processes'])
        avg_turnaround_time = sum(p['turnaroundTime'] for p in results['processes']) / len(results['processes'])
        
        results['avgWaitingTime'] = round(avg_waiting_time, 2)
        results['avgTurnaroundTime'] = round(avg_turnaround_time, 2)
        
        # Generate chart data
        waiting_times = [p['waitingTime'] for p in results['processes']]
        turnaround_times = [p['turnaroundTime'] for p in results['processes']]
        process_ids = [f"P{p['pid']}" for p in results['processes']]
        
        waiting_chart = create_waiting_chart(process_ids, waiting_times)
        turnaround_chart = create_turnaround_chart(process_ids, turnaround_times)
        
        results['charts'] = {
            'waitingChart': waiting_chart,
            'turnaroundChart': turnaround_chart
        }
        
        return jsonify(results)
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

def create_waiting_chart(process_ids, waiting_times):
    plt.figure(figsize=(8, 6))
    plt.pie(waiting_times, labels=process_ids, autopct='%1.1f%%', startangle=90, 
            shadow=False, wedgeprops={'edgecolor': 'white'})
    plt.title('Waiting Time Distribution')
    img_bytes = io.BytesIO()
    plt.savefig(img_bytes, format='png')
    img_bytes.seek(0)
    plt.close()
    img_base64 = base64.b64encode(img_bytes.getvalue()).decode('utf-8')
    return f"data:image/png;base64,{img_base64}"

def create_turnaround_chart(process_ids, turnaround_times):
    plt.figure(figsize=(8, 6))
    plt.pie(turnaround_times, labels=process_ids, autopct='%1.1f%%', startangle=90, 
            shadow=True, wedgeprops={'edgecolor': 'white'})
    plt.title('Turnaround Time Distribution')
    img_bytes = io.BytesIO()
    plt.savefig(img_bytes, format='png')
    img_bytes.seek(0)
    plt.close()
    img_base64 = base64.b64encode(img_bytes.getvalue()).decode('utf-8')
    return f"data:image/png;base64,{img_base64}"

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'ok'})

# -------------------------------
# RUN APP
# -------------------------------
if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))
    print(f"CPU Scheduling Server starting on http://localhost:{port}")
    app.run(debug=True, host="0.0.0.0", port=port)

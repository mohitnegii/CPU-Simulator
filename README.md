# ⚡ CPU Scheduling Simulator  

*A web-based simulator to visualize and understand different CPU Scheduling Algorithms.*  

---

## 📖 Introduction  

The **CPU Scheduling Simulator** is a web application built to demonstrate how different CPU scheduling algorithms work.  
It allows users to input process details (burst time, arrival time, priority, etc.) and view results such as:  

- Gantt Chart  
- Waiting Time  
- Turnaround Time  
- Average performance metrics  

This project was created as part of a **college mini-project** to combine theory with practical implementation of scheduling algorithms.  

---

## ✨ Features  

- Supports multiple scheduling algorithms:  
  - **First Come First Serve (FCFS)**  
  - **Shortest Job First (SJF)**  
  - **Shortest Remaining Time First (SRTF)**  
  - **Round Robin (RR)**  
  - **Priority Scheduling**  
- Visual **Gantt Chart** representation  
- Calculation of:  
  - Turnaround Time (TAT)  
  - Waiting Time (WT)  
  - Average TAT & WT  
- Simple and responsive **web-based UI**  

---

## 🛠️ Technologies Used  

### Frontend  
- **HTML, CSS, JavaScript**  

### Backend  
- **Python (Flask)**  

### Algorithms Implemented  
- **FCFS, SJF, SRTF, RR, Priority Scheduling**  

## 📂 Project Structure  
CPU-Scheduler/
│── static/ # Frontend static files (CSS, JS)
│ ├── style.css
│ ├── script.js
│── templates/ # HTML Templates
│ ├── index.html
│── scheduling_algorithms.py # Implementation of scheduling algorithms
│── server.py # Flask backend server
│── README.md

Usage

Enter the number of processes and their details (burst time, arrival time, priority).

Select the scheduling algorithm.

Click Run to generate results.

View:

Gantt Chart

Turnaround Time & Waiting Time for each process

Average metrics
 Developed By

Mohit Negi 

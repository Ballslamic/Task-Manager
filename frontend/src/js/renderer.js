const axios = require('axios');

// Example function to fetch tasks
async function fetchTasks() {
    try {
        const response = await axios.get('http://localhost:3000/task/getTasks');
        console.log(response.data);
        // TODO: Update UI with tasks
        updateTaskList(response.data.tasks);
    } catch (error) {
        console.error('Error fetching tasks:', error);
    }
}

// Function to update the task list in the UI
function updateTaskList(tasks) {
    const taskList = document.getElementById('task-list');
    taskList.innerHTML = '';
    tasks.forEach(task => {
        const taskElement = document.createElement('div');
        taskElement.textContent = task.taskDesc;
        taskList.appendChild(taskElement);
    });
}

// Call this function when the page loads
document.addEventListener('DOMContentLoaded', fetchTasks);

// TODO: Add more functions to interact with the API
// For example: createTask, updateTask, deleteTask

let tasks = [];
const API_URL = 'http://localhost:3000';

// Пароль для доступа
const PASSWORD = "a04042022a";

function updateTaskInputVisibility() {
    if (localStorage.getItem('isAuthenticated') === 'true') {
        document.getElementById('taskInput').style.display = 'flex';
    } else {
        document.getElementById('taskInput').style.display = 'none';
    }
}

function updateUIByAuth() {
    const isAuth = localStorage.getItem('isAuthenticated') === 'true';
    const loginBtn = document.getElementById('loginBtn');
    const taskInput = document.getElementById('taskInput');
    const loginForm = document.getElementById('loginForm');

    if (isAuth) {
        loginBtn.textContent = 'Выйти';
        loginBtn.onclick = logout;
        taskInput.style.display = 'flex';
        loginForm.style.display = 'none';
    } else {
        loginBtn.textContent = 'Войти для редактирования';
        loginBtn.onclick = toggleLoginForm;
        taskInput.style.display = 'none';
        loginForm.style.display = 'none';
    }
    renderTasks();
}

// Загружаем задачи при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    loadTasks();
    updateUIByAuth();
});

function toggleLoginForm() {
    const loginForm = document.getElementById('loginForm');
    if (loginForm.style.display === 'none') {
        loginForm.style.display = 'block';
    } else {
        loginForm.style.display = 'none';
    }
}

function checkPassword() {
    const passwordInput = document.getElementById('password');
    if (passwordInput.value === PASSWORD) {
        localStorage.setItem('isAuthenticated', 'true');
        updateUIByAuth();
    } else {
        alert('Неверный пароль!');
        passwordInput.value = '';
    }
}

function toggleLogin() {
    if (localStorage.getItem('isAuthenticated') === 'true') {
        localStorage.removeItem('isAuthenticated');
        hideEditControls();
        document.getElementById('loginBtn').textContent = 'Войти для редактирования';
        updateTaskInputVisibility();
    } else {
        toggleLoginForm();
    }
}

function showEditControls() {
    updateTaskInputVisibility();
    // Показываем кнопки редактирования для всех задач
    const tasks = document.querySelectorAll('li');
    tasks.forEach(task => {
        const editBtn = task.querySelector('.edit-button');
        const deleteBtn = task.querySelector('.delete-button');
        if (editBtn) editBtn.style.display = 'inline-block';
        if (deleteBtn) deleteBtn.style.display = 'inline-block';
    });
}

function hideEditControls() {
    updateTaskInputVisibility();
    // Скрываем кнопки редактирования для всех задач
    const tasks = document.querySelectorAll('li');
    tasks.forEach(task => {
        const editBtn = task.querySelector('.edit-button');
        const deleteBtn = task.querySelector('.delete-button');
        if (editBtn) editBtn.style.display = 'none';
        if (deleteBtn) deleteBtn.style.display = 'none';
    });
}

async function loadTasks() {
    try {
        const response = await fetch(`${API_URL}/tasks`);
        tasks = await response.json();
        renderTasks();
    } catch (error) {
        console.error('Ошибка при загрузке задач:', error);
    }
}

async function saveTasks() {
    try {
        const response = await fetch(`${API_URL}/tasks`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(tasks)
        });
        if (!response.ok) {
            throw new Error('Ошибка при сохранении задач');
        }
    } catch (error) {
        console.error('Ошибка при сохранении задач:', error);
    }
}

async function addTask() {
    if (localStorage.getItem('isAuthenticated') !== 'true') {
        alert('Только авторизованный пользователь может добавлять задачи!');
        return;
    }
    const taskSubject = document.getElementById('taskSubject').value;
    const taskText = document.getElementById('taskText').value;
    const taskTime = document.getElementById('taskTime').value;
    
    if (taskSubject.trim() === '' || taskText.trim() === '') {
        alert('Пожалуйста, введите предмет и задачу');
        return;
    }
    
    const task = {
        id: Date.now(),
        subject: taskSubject,
        text: taskText,
        time: taskTime,
        completed: false
    };
    
    try {
        const response = await fetch(`${API_URL}/tasks`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(task)
        });
        
        if (response.ok) {
            tasks.push(task);
            renderTasks();
            
            // Очищаем поля ввода
            document.getElementById('taskSubject').value = '';
            document.getElementById('taskText').value = '';
            document.getElementById('taskTime').value = '';
        }
    } catch (error) {
        console.error('Ошибка при добавлении задачи:', error);
    }
}

async function toggleTask(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
        task.completed = !task.completed;
        try {
            const response = await fetch(`${API_URL}/tasks/${taskId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ completed: task.completed })
            });
            if (response.ok) {
                renderTasks();
            }
        } catch (error) {
            console.error('Ошибка при обновлении задачи:', error);
        }
    }
}

async function deleteTask(taskId) {
    try {
        const response = await fetch(`${API_URL}/tasks/${taskId}`, {
            method: 'DELETE'
        });
        if (response.ok) {
            tasks = tasks.filter(t => t.id !== taskId);
            renderTasks();
        }
    } catch (error) {
        console.error('Ошибка при удалении задачи:', error);
    }
}

async function editTask(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const li = document.querySelector(`li[data-task-id="${taskId}"]`);
    if (!li) return;

    // Создаем форму редактирования
    const editForm = document.createElement('div');
    editForm.className = 'edit-form';
    
    const subjectInput = document.createElement('input');
    subjectInput.type = 'text';
    subjectInput.value = task.subject;
    subjectInput.placeholder = 'Предмет...';
    
    const textInput = document.createElement('input');
    textInput.type = 'text';
    textInput.value = task.text;
    textInput.placeholder = 'Задача...';
    
    const dateInput = document.createElement('input');
    dateInput.type = 'date';
    dateInput.value = task.time;
    
    const saveButton = document.createElement('button');
    saveButton.textContent = 'Сохранить';
    saveButton.onclick = async () => {
        const updatedTask = {
            ...task,
            subject: subjectInput.value,
            text: textInput.value,
            time: dateInput.value
        };
        
        try {
            const response = await fetch(`${API_URL}/tasks/${taskId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(updatedTask)
            });
            
            if (response.ok) {
                Object.assign(task, updatedTask);
                renderTasks();
            }
        } catch (error) {
            console.error('Ошибка при обновлении задачи:', error);
        }
    };
    
    const cancelButton = document.createElement('button');
    cancelButton.textContent = 'Отмена';
    cancelButton.onclick = () => {
        renderTasks();
    };
    
    editForm.appendChild(subjectInput);
    editForm.appendChild(textInput);
    editForm.appendChild(dateInput);
    editForm.appendChild(saveButton);
    editForm.appendChild(cancelButton);
    
    // Очищаем содержимое li и добавляем форму
    li.innerHTML = '';
    li.appendChild(editForm);
}

function renderTasks() {
    const pendingTasksList = document.getElementById('pendingTasks');
    const completedTasksList = document.getElementById('completedTasks');
    
    pendingTasksList.innerHTML = '';
    completedTasksList.innerHTML = '';
    
    // Сортируем задачи по дате
    const sortedTasks = [...tasks].sort((a, b) => {
        if (!a.time) return 1;
        if (!b.time) return -1;
        return new Date(a.time) - new Date(b.time);
    });

    const isAuth = localStorage.getItem('isAuthenticated') === 'true';
    
    sortedTasks.forEach(task => {
        const li = document.createElement('li');
        li.setAttribute('data-task-id', task.id);
        
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.className = 'checkbox';
        checkbox.checked = task.completed;
        checkbox.onclick = () => { if(isAuth) toggleTask(task.id); };
        checkbox.disabled = !isAuth;
        
        const taskSubject = document.createElement('span');
        taskSubject.className = 'task-subject';
        taskSubject.textContent = task.subject;
        
        const taskText = document.createElement('span');
        taskText.className = 'task-text';
        taskText.textContent = task.text;
        
        const taskTime = document.createElement('span');
        taskTime.className = 'task-time';
        if (task.time) {
            const date = new Date(task.time);
            const formattedDate = date.toLocaleString('ru-RU', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });
            taskTime.textContent = formattedDate;
        } else {
            taskTime.textContent = 'Без срока';
        }

        li.appendChild(checkbox);
        li.appendChild(taskSubject);
        li.appendChild(taskText);
        li.appendChild(taskTime);

        if (isAuth) {
            const editButton = document.createElement('button');
            editButton.className = 'edit-button';
            editButton.textContent = '✎';
            editButton.onclick = () => editTask(task.id);
            li.appendChild(editButton);

            const deleteButton = document.createElement('button');
            deleteButton.className = 'delete-button';
            deleteButton.textContent = '×';
            deleteButton.onclick = () => deleteTask(task.id);
            li.appendChild(deleteButton);
        }
        
        if (task.completed) {
            completedTasksList.appendChild(li);
        } else {
            pendingTasksList.appendChild(li);
        }
    });
}

function logout() {
    localStorage.removeItem('isAuthenticated');
    updateUIByAuth();
}

function showLoginForm() {
    document.getElementById('loginForm').style.display = 'block';
    document.getElementById('taskList').style.display = 'none';
}

function showTaskList() {
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('taskList').style.display = 'block';
    loadTasks();
} 

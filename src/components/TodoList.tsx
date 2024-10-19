import React, { useState, useEffect } from 'react';
import { CheckCircle, Circle, AlertCircle, Trash2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface Task {
  id: number;
  title: string;
  status: 'completed' | 'not_completed';
  assignee: string;
  dueDate: string;
}

const TodoList: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTask, setNewTask] = useState({
    title: '',
    assignee: '',
    dueDate: '',
  });
  const [users, setUsers] = useState<string[]>([]);

  const { currentUser, getUsers } = useAuth();

  useEffect(() => {
    const fetchUsers = async () => {
      const userList = await getUsers();
      setUsers(userList);
    };
    fetchUsers();
  }, [getUsers]);

  useEffect(() => {
    const storedTasks = localStorage.getItem('tasks');
    if (storedTasks) {
      setTasks(JSON.parse(storedTasks));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('tasks', JSON.stringify(tasks));
  }, [tasks]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTask.title && newTask.assignee && newTask.dueDate) {
      setTasks(prevTasks => [
        ...prevTasks,
        {
          id: Date.now(),
          title: newTask.title,
          status: 'not_completed',
          assignee: newTask.assignee,
          dueDate: newTask.dueDate,
        },
      ]);
      setNewTask({ title: '', assignee: '', dueDate: '' });
    }
  };

  const toggleTaskStatus = (taskId: number) => {
    setTasks(prevTasks =>
      prevTasks.map(task =>
        task.id === taskId
          ? { ...task, status: task.status === 'completed' ? 'not_completed' : 'completed' }
          : task
      )
    );
  };

  const deleteTask = (taskId: number) => {
    setTasks(prevTasks => prevTasks.filter(task => task.id !== taskId));
  };

  const isTaskOverdue = (dueDate: string) => {
    return new Date() > new Date(dueDate);
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">To-Do List</h2>
      
      <form onSubmit={handleSubmit} className="space-y-2">
        <input
          type="text"
          value={newTask.title}
          onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
          placeholder="Task title"
          className="w-full p-2 border rounded"
          required
        />
        <select
          value={newTask.assignee}
          onChange={(e) => setNewTask({ ...newTask, assignee: e.target.value })}
          className="w-full p-2 border rounded"
          required
        >
          <option value="">Assign to</option>
          {users.map(user => (
            <option key={user} value={user}>{user}</option>
          ))}
        </select>
        <input
          type="date"
          value={newTask.dueDate}
          onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
          className="w-full p-2 border rounded"
          required
        />
        <button type="submit" className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600">
          Add Task
        </button>
      </form>

      <ul className="space-y-2">
        {tasks.map(task => (
          <li
            key={task.id}
            className={`flex items-center justify-between p-2 rounded ${
              task.status === 'completed'
                ? 'bg-green-100'
                : isTaskOverdue(task.dueDate)
                ? 'bg-red-100'
                : 'bg-gray-100'
            }`}
          >
            <div className="flex items-center space-x-2">
              <button onClick={() => toggleTaskStatus(task.id)}>
                {task.status === 'completed' ? (
                  <CheckCircle className="text-green-500" />
                ) : (
                  <Circle className="text-gray-400" />
                )}
              </button>
              <span className={task.status === 'completed' ? 'line-through' : ''}>{task.title}</span>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <span>{task.assignee}</span>
              <span>{new Date(task.dueDate).toLocaleDateString()}</span>
              {isTaskOverdue(task.dueDate) && task.status !== 'completed' && (
                <AlertCircle className="text-red-500" />
              )}
              <button onClick={() => deleteTask(task.id)} className="text-red-500">
                <Trash2 size={16} />
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default TodoList;
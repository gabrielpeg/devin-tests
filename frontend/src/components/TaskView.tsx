import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { Plus, Edit, Trash } from 'lucide-react'
import { Button } from './ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog'
import { Input } from './ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table'
import { Task, TaskCreate, Project } from '../types'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

interface TaskViewProps {
  project: Project;
  onUpdate: () => void;
}

export function TaskView({ project, onUpdate }: TaskViewProps) {
  const [tasks, setTasks] = useState<Task[]>(project.tasks)
  const getInitialTaskState = () => {
    const today = new Date();
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);
    
    return {
      title: '',
      description: '',
      start_date: today.toISOString().split('T')[0],
      end_date: nextWeek.toISOString().split('T')[0],
      status: 'TODO'
    };
  };
  
  const [newTask, setNewTask] = useState<TaskCreate>(getInitialTaskState)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  useEffect(() => {
    setTasks(project.tasks)
  }, [project])

  const createTask = async () => {
    try {
      // Validate dates
      const startDate = new Date(newTask.start_date);
      const endDate = new Date(newTask.end_date);
      
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        console.error('Invalid date format');
        return;
      }
      
      // Format dates as YYYY-MM-DD
      const formattedTask = {
        ...newTask,
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0]
      };
      
      const response = await fetch(`${import.meta.env.VITE_API_URL}/projects/${project.id}/tasks/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formattedTask),
      });
      
      if (response.ok) {
        setNewTask(getInitialTaskState());
        setIsDialogOpen(false);
        onUpdate();
      } else {
        const error = await response.json();
        console.error('Error creating task:', error);
      }
    } catch (error) {
      console.error('Error creating task:', error);
    }
  }

  const updateTask = async (taskId: number, updatedTask: TaskCreate) => {
    try {
      // Dates should already be in YYYY-MM-DD format
      if (!updatedTask.start_date.match(/^\d{4}-\d{2}-\d{2}$/) || 
          !updatedTask.end_date.match(/^\d{4}-\d{2}-\d{2}$/)) {
        console.error('Invalid date format');
        return;
      }
      
      // Use the dates directly since they're already formatted
      const formattedTask = {
        ...updatedTask
      };

      const response = await fetch(`${import.meta.env.VITE_API_URL}/projects/${project.id}/tasks/${taskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formattedTask),
      })
      if (response.ok) {
        onUpdate()
      } else {
        const error = await response.json();
        console.error('Error updating task - Status:', response.status);
        console.error('Error details:', error);
        console.error('Request payload:', formattedTask);
      }
    } catch (error) {
      console.error('Error updating task:', error)
    }
  }

  const deleteTask = async (taskId: number) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/projects/${project.id}/tasks/${taskId}`, {
        method: 'DELETE',
      })
      if (response.ok) {
        onUpdate()
      }
    } catch (error) {
      console.error('Error deleting task:', error)
    }
  }

  // Transform dates for Gantt chart, ensuring valid date strings
  const ganttData = tasks.map(task => {
    const start = new Date(task.start_date);
    const end = new Date(task.end_date);
    return {
      name: task.title,
      start: isNaN(start.getTime()) ? new Date().getTime() : start.getTime(),
      end: isNaN(end.getTime()) ? new Date().getTime() : end.getTime(),
      status: task.status,
    };
  })

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Tasks for {project.name}</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2" />
              New Task
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Task</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <label htmlFor="title">Title</label>
                <Input
                  id="title"
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <label htmlFor="description">Description</label>
                <Input
                  id="description"
                  value={newTask.description}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <label htmlFor="start_date">Start Date</label>
                <Input
                  id="start_date"
                  type="date"
                  value={newTask.start_date}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value.match(/^\d{4}-\d{2}-\d{2}$/)) {
                      setNewTask({ ...newTask, start_date: value });
                    }
                  }}
                />
              </div>
              <div className="grid gap-2">
                <label htmlFor="end_date">End Date</label>
                <Input
                  id="end_date"
                  type="date"
                  value={newTask.end_date}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value.match(/^\d{4}-\d{2}-\d{2}$/)) {
                      setNewTask({ ...newTask, end_date: value });
                    }
                  }}
                />
              </div>
              <div className="grid gap-2">
                <label htmlFor="status">Status</label>
                <select
                  id="status"
                  className="flex h-9 w-full rounded-md border border-zinc-200 bg-transparent px-3 py-1 text-base shadow-sm"
                  value={newTask.status}
                  onChange={(e) => setNewTask({ ...newTask, status: e.target.value })}
                >
                  <option value="TODO">To Do</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="DONE">Done</option>
                </select>
              </div>
              <Button onClick={createTask}>Create Task</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={ganttData}
            layout="vertical"
            barSize={20}
            margin={{ top: 20, right: 30, left: 100, bottom: 20 }}
          >
            <XAxis
              type="number"
              domain={['auto', 'auto']}
              tickFormatter={(value) => {
                try {
                  return format(value, 'MM/dd');
                } catch (e) {
                  return '';
                }
              }}
            />
            <YAxis
              type="category"
              dataKey="name"
              width={100}
            />
            <Tooltip
              labelFormatter={(value) => format(value, 'MM/dd/yyyy')}
              formatter={(value: any) => format(value, 'MM/dd/yyyy')}
            />
            <Bar
              dataKey="end"
              fill="#82ca9d"
              stackId="stack"
              name="End Date"
            />
            <Bar
              dataKey="start"
              fill="#8884d8"
              stackId="stack"
              name="Start Date"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Start Date</TableHead>
            <TableHead>End Date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tasks.map((task) => (
            <TableRow key={task.id}>
              <TableCell>{task.title}</TableCell>
              <TableCell>{task.description}</TableCell>
              <TableCell>{format(new Date(task.start_date), 'MM/dd/yyyy')}</TableCell>
              <TableCell>{format(new Date(task.end_date), 'MM/dd/yyyy')}</TableCell>
              <TableCell>{task.status}</TableCell>
              <TableCell className="space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    // Create a minimal task update with only the required fields
                    const nextStatus = task.status === 'TODO' ? 'IN_PROGRESS' : task.status === 'IN_PROGRESS' ? 'DONE' : 'TODO';
                    const updatedTask: TaskCreate = {
                      title: task.title,
                      description: task.description || '',
                      // Ensure dates are in YYYY-MM-DD format
                      start_date: new Date(task.start_date).toISOString().substring(0, 10),
                      end_date: new Date(task.end_date).toISOString().substring(0, 10),
                      status: nextStatus
                    }
                    console.log('Sending task update:', updatedTask);
                    updateTask(task.id, updatedTask)
                  }}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => deleteTask(task.id)}
                >
                  <Trash className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

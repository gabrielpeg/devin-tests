import { useState, useEffect } from 'react'
import { Plus, Edit, Trash } from 'lucide-react'
import { Button } from './components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './components/ui/dialog'
import { Input } from './components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './components/ui/table'
import { Project, ProjectCreate } from './types'
import { TaskView } from './components/TaskView'
import './App.css'

function App() {
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [newProject, setNewProject] = useState<ProjectCreate>({ name: '', description: '' })
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  useEffect(() => {
    fetchProjects()
  }, [])

  const fetchProjects = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/projects/`)
      const data = await response.json()
      setProjects(data)
      if (selectedProject) {
        const updatedProject = data.find((p: Project) => p.id === selectedProject.id)
        setSelectedProject(updatedProject)
      }
    } catch (error) {
      console.error('Error fetching projects:', error)
    }
  }

  const createProject = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/projects/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newProject),
      })
      if (response.ok) {
        setNewProject({ name: '', description: '' })
        setIsDialogOpen(false)
        fetchProjects()
      }
    } catch (error) {
      console.error('Error creating project:', error)
    }
  }

  const updateProject = async (projectId: number, updatedProject: ProjectCreate) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/projects/${projectId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedProject),
      })
      if (response.ok) {
        fetchProjects()
      }
    } catch (error) {
      console.error('Error updating project:', error)
    }
  }

  const deleteProject = async (projectId: number) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/projects/${projectId}`, {
        method: 'DELETE',
      })
      if (response.ok) {
        if (selectedProject?.id === projectId) {
          setSelectedProject(null)
        }
        fetchProjects()
      }
    } catch (error) {
      console.error('Error deleting project:', error)
    }
  }

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Project Management</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2" />
              New Project
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Project</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <label htmlFor="name">Name</label>
                <Input
                  id="name"
                  value={newProject.name}
                  onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <label htmlFor="description">Description</label>
                <Input
                  id="description"
                  value={newProject.description}
                  onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                />
              </div>
              <Button onClick={createProject}>Create Project</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-8">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Tasks</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {projects.map((project) => (
              <TableRow key={project.id}>
                <TableCell>{project.name}</TableCell>
                <TableCell>{project.description}</TableCell>
                <TableCell>{new Date(project.created_at).toLocaleDateString()}</TableCell>
                <TableCell>{project.tasks.length}</TableCell>
                <TableCell className="space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedProject(project)}
                  >
                    View Tasks
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const updatedProject = {
                        name: project.name,
                        description: project.description || '',
                      }
                      updateProject(project.id, updatedProject)
                    }}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => deleteProject(project.id)}
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {selectedProject && (
          <TaskView
            project={selectedProject}
            onUpdate={fetchProjects}
          />
        )}
      </div>
    </div>
  )
}

export default App

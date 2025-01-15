export interface Project {
  id: number;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
  tasks: Task[];
}

export interface Task {
  id: number;
  project_id: number;
  title: string;
  description?: string;
  start_date: string;
  end_date: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface ProjectCreate {
  name: string;
  description?: string;
}

export interface TaskCreate {
  title: string;
  description?: string;
  start_date: string;
  end_date: string;
  status: string;
}

from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from typing import List
from pydantic import ValidationError
import sys
import os
import traceback

# Add the app directory to the Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import models, database, crud, schemas

app = FastAPI(title="Project Management API")

# Configure CORS first, before any route handlers
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins temporarily for debugging
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=3600
)

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request, exc):
    """Handle validation errors and return detailed error messages"""
    error_details = []
    for error in exc.errors():
        error_dict = {
            "type": error.get("type"),
            "loc": error.get("loc"),
            "msg": str(error.get("msg")),
            "input": str(error.get("input"))
        }
        error_details.append(error_dict)
    
    print(f"Request validation failed:")
    print(f"URL: {request.url}")
    print(f"Method: {request.method}")
    print(f"Error details: {error_details}")
    try:
        body = await request.json()
        print(f"Request body: {body}")
    except:
        print("Could not parse request body")
    
    return JSONResponse(
        status_code=422,
        content={"detail": error_details}
    )

@app.on_event("startup")
async def startup_event():
    """Initialize database on startup."""
    try:
        # Ensure all models are imported
        from app import models
        database.init_db()
    except Exception as e:
        print(f"Error during startup: {str(e)}")
        raise
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://python-project-app-epg5fg5y.devinapps.com",
        "http://localhost:5173"  # For local development
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=3600  # Cache preflight requests for 1 hour
)

# Dependency
def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.get("/healthz")
async def healthz():
    """Health check endpoint"""
    return {
        "status": "ok",
        "message": "Project Management API is running",
        "database": "SQLite in-memory"
    }

# Project endpoints
@app.post("/projects/", response_model=schemas.Project)
def create_project(
    project: schemas.ProjectCreate,
    db: Session = Depends(get_db)
):
    """Create a new project"""
    try:
        result = crud.create_project(db=db, project=project)
        return result
    except Exception as e:
        print(f"Error creating project: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/projects/", response_model=List[schemas.Project])
def list_projects(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """List all projects"""
    return crud.get_projects(db, skip=skip, limit=limit)

@app.get("/projects/{project_id}", response_model=schemas.Project)
def get_project(project_id: int, db: Session = Depends(get_db)):
    """Get a specific project by ID"""
    db_project = crud.get_project(db, project_id=project_id)
    if db_project is None:
        raise HTTPException(status_code=404, detail="Project not found")
    return db_project

@app.put("/projects/{project_id}", response_model=schemas.Project)
def update_project(
    project_id: int,
    project: schemas.ProjectCreate,
    db: Session = Depends(get_db)
):
    """Update a project"""
    db_project = crud.update_project(db, project_id=project_id, project=project)
    if db_project is None:
        raise HTTPException(status_code=404, detail="Project not found")
    return db_project

@app.delete("/projects/{project_id}")
def delete_project(project_id: int, db: Session = Depends(get_db)):
    """Delete a project"""
    success = crud.delete_project(db, project_id=project_id)
    if not success:
        raise HTTPException(status_code=404, detail="Project not found")
    return {"status": "success", "message": "Project deleted"}

# Task endpoints
@app.post("/projects/{project_id}/tasks/", response_model=schemas.Task)
def create_task(
    project_id: int,
    task: schemas.TaskCreate,
    db: Session = Depends(get_db)
):
    """Create a new task in a project"""
    return crud.create_task(db=db, project_id=project_id, task=task)

@app.get("/projects/{project_id}/tasks/", response_model=List[schemas.Task])
def list_project_tasks(
    project_id: int,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """List all tasks in a project"""
    return crud.get_project_tasks(db, project_id=project_id, skip=skip, limit=limit)

@app.put("/projects/{project_id}/tasks/{task_id}", response_model=schemas.Task)
def update_task(
    project_id: int,
    task_id: int,
    task_update: schemas.TaskCreate,
    db: Session = Depends(get_db)
):
    """Update a task's details including timeline"""
    try:
        print(f"Received task update request - Task ID: {task_id}, Project ID: {project_id}")
        update_data = {
            "title": task_update.title,
            "description": task_update.description,
            "start_date": task_update.start_date,
            "end_date": task_update.end_date,
            "status": task_update.status
        }
        print(f"Task update payload: {update_data}")
        
        db_task = crud.update_task(db, task_id=task_id, task=task_update)
        if db_task is None:
            raise HTTPException(status_code=404, detail="Task not found")
        if db_task.project_id != project_id:
            raise HTTPException(status_code=400, detail="Task does not belong to this project")
        
        return db_task
    except ValidationError as ve:
        print(f"Validation error: {str(ve)}")
        raise HTTPException(status_code=422, detail=str(ve))
    except Exception as e:
        print(f"Error updating task: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/projects/{project_id}/tasks/{task_id}")
def delete_task(
    project_id: int,
    task_id: int,
    db: Session = Depends(get_db)
):
    """Delete a task"""
    success = crud.delete_task(db, task_id=task_id)
    if not success:
        raise HTTPException(status_code=404, detail="Task not found")
    return {"status": "success", "message": "Task deleted"}

"""
CRUD operations for projects and tasks.
"""
from sqlalchemy.orm import Session
from datetime import datetime
from . import models, schemas

# Project operations
def create_project(db: Session, project: schemas.ProjectCreate) -> models.Project:
    try:
        print(f"Creating project with data: {project.model_dump()}")
        db_project = models.Project(**project.model_dump())
        print(f"Project instance created: {db_project.__dict__}")
        db.add(db_project)
        db.commit()
        db.refresh(db_project)
        print("Project successfully created and committed to database")
        return db_project
    except Exception as e:
        db.rollback()
        print(f"Error in create_project: {str(e)}")
        raise

def get_projects(db: Session, skip: int = 0, limit: int = 100) -> list[models.Project]:
    return db.query(models.Project).offset(skip).limit(limit).all()

def get_project(db: Session, project_id: int) -> models.Project | None:
    return db.query(models.Project).filter(models.Project.id == project_id).first()

def update_project(
    db: Session, 
    project_id: int, 
    project: schemas.ProjectCreate
) -> models.Project | None:
    db_project = get_project(db, project_id)
    if db_project:
        try:
            for key, value in project.model_dump().items():
                setattr(db_project, key, value)
            db_project.updated_at = datetime.utcnow()
            db.commit()
            db.refresh(db_project)
            return db_project
        except Exception as e:
            db.rollback()
            print(f"Error in update_project: {str(e)}")
            raise
    return None

def delete_project(db: Session, project_id: int) -> bool:
    db_project = get_project(db, project_id)
    if db_project:
        db.delete(db_project)
        db.commit()
        return True
    return False

# Task operations
def create_task(
    db: Session, 
    project_id: int, 
    task: schemas.TaskCreate
) -> models.Task:
    try:
        task_data = task.model_dump()
        # Convert string dates to datetime objects
        task_data['start_date'] = datetime.strptime(task_data['start_date'], '%Y-%m-%d')
        task_data['end_date'] = datetime.strptime(task_data['end_date'], '%Y-%m-%d')
        
        db_task = models.Task(**task_data, project_id=project_id)
        db.add(db_task)
        db.commit()
        db.refresh(db_task)
        return db_task
    except Exception as e:
        db.rollback()
        print(f"Error in create_task: {str(e)}")
        raise

def get_project_tasks(
    db: Session, 
    project_id: int, 
    skip: int = 0, 
    limit: int = 100
) -> list[models.Task]:
    return db.query(models.Task)\
        .filter(models.Task.project_id == project_id)\
        .offset(skip)\
        .limit(limit)\
        .all()

def update_task(
    db: Session, 
    task_id: int, 
    task: schemas.TaskCreate
) -> models.Task | None:
    db_task = db.query(models.Task).filter(models.Task.id == task_id).first()
    if db_task:
        try:
            # Only update the fields from TaskCreate
            db_task.title = task.title
            db_task.description = task.description
            db_task.start_date = datetime.strptime(task.start_date, '%Y-%m-%d')
            db_task.end_date = datetime.strptime(task.end_date, '%Y-%m-%d')
            db_task.status = task.status
            db_task.updated_at = datetime.utcnow()
            
            db.commit()
            db.refresh(db_task)
            return db_task
        except Exception as e:
            db.rollback()
            print(f"Error in update_task: {str(e)}")
            raise
    return None

def delete_task(db: Session, task_id: int) -> bool:
    db_task = db.query(models.Task).filter(models.Task.id == task_id).first()
    if db_task:
        db.delete(db_task)
        db.commit()
        return True
    return False

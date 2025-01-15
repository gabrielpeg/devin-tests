"""
Pydantic schemas for request/response models.
"""
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, field_validator
from datetime import datetime, date

# Task schemas
class TaskBase(BaseModel):
    title: str
    description: Optional[str] = None
    start_date: str
    end_date: str
    status: str
    
    @field_validator('start_date', 'end_date')
    @classmethod
    def validate_date(cls, v: str) -> str:
        print(f"Validating date: {v}")
        try:
            # Ensure date is in YYYY-MM-DD format
            date_obj = datetime.strptime(v, '%Y-%m-%d')
            result = date_obj.strftime('%Y-%m-%d')
            print(f"Date validation successful: {result}")
            return result
        except ValueError as e:
            print(f"Date validation failed: {str(e)}")
            raise ValueError(f'Date must be in YYYY-MM-DD format, got: {v}')
    
    @field_validator('status')
    @classmethod
    def validate_status(cls, v: str) -> str:
        print(f"Validating status: {v}")
        valid_statuses = ['TODO', 'IN_PROGRESS', 'DONE']
        if v not in valid_statuses:
            print(f"Status validation failed: {v} not in {valid_statuses}")
            raise ValueError(f'Status must be one of {valid_statuses}')
        print(f"Status validation successful: {v}")
        return v

class TaskCreate(TaskBase):
    pass

class Task(BaseModel):
    id: int
    project_id: int
    title: str
    description: Optional[str] = None
    start_date: datetime  # Use datetime for DB-sourced data
    end_date: datetime
    status: str
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)
    
    def model_dump(self, **kwargs):
        data = super().model_dump(**kwargs)
        # Convert datetime to string format for JSON response
        data['start_date'] = data['start_date'].strftime('%Y-%m-%d')
        data['end_date'] = data['end_date'].strftime('%Y-%m-%d')
        return data

# Project schemas
class ProjectBase(BaseModel):
    name: str
    description: Optional[str] = None

class ProjectCreate(ProjectBase):
    pass

class Project(ProjectBase):
    id: int
    created_at: datetime
    updated_at: datetime
    tasks: List[Task] = []
    
    model_config = ConfigDict(from_attributes=True)

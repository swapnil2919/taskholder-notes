from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import List, Optional
from uuid import UUID
from ..database import get_db
from ..models.task import Task, TaskStatus, TaskPriority
from ..models.user import User
from ..schemas.task import TaskCreate, TaskUpdate, TaskResponse
from ..auth.deps import get_current_user

router = APIRouter(prefix="/tasks", tags=["Tasks"])

@router.get("/", response_model=List[TaskResponse])
async def get_tasks(
    status: Optional[TaskStatus] = None,
    priority: Optional[TaskPriority] = None,
    category: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = select(Task).where(Task.user_id == current_user.id)
    if status:
        query = query.where(Task.status == status)
    if priority:
        query = query.where(Task.priority == priority)
    if category:
        query = query.where(Task.category == category)
    result = await db.execute(query.order_by(Task.created_at.desc()))
    return result.scalars().all()

@router.get("/stats")
async def get_task_stats(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Task).where(Task.user_id == current_user.id))
    tasks = result.scalars().all()
    total = len(tasks)
    done = sum(1 for t in tasks if t.status == TaskStatus.done)
    in_progress = sum(1 for t in tasks if t.status == TaskStatus.in_progress)
    todo = sum(1 for t in tasks if t.status == TaskStatus.todo)
    return {"total": total, "done": done, "in_progress": in_progress, "todo": todo}

@router.post("/", response_model=TaskResponse, status_code=status.HTTP_201_CREATED)
async def create_task(
    task_data: TaskCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    task = Task(**task_data.model_dump(), user_id=current_user.id)
    db.add(task)
    await db.commit()
    await db.refresh(task)
    return task

@router.get("/{task_id}", response_model=TaskResponse)
async def get_task(
    task_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Task).where(Task.id == task_id, Task.user_id == current_user.id))
    task = result.scalar_one_or_none()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task

@router.put("/{task_id}", response_model=TaskResponse)
async def update_task(
    task_id: UUID,
    task_data: TaskUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Task).where(Task.id == task_id, Task.user_id == current_user.id))
    task = result.scalar_one_or_none()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    for key, value in task_data.model_dump(exclude_unset=True).items():
        setattr(task, key, value)
    await db.commit()
    await db.refresh(task)
    return task

@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_task(
    task_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Task).where(Task.id == task_id, Task.user_id == current_user.id))
    task = result.scalar_one_or_none()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    await db.delete(task)
    await db.commit()

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Optional
from uuid import UUID
from ..models.note import Note
from ..models.user import User
from ..schemas.note import NoteCreate, NoteUpdate, NoteResponse
from ..auth.deps import get_current_user, get_user_db

router = APIRouter(prefix="/notes", tags=["Notes"])

@router.get("/", response_model=List[NoteResponse])
async def get_notes(
    is_pinned: Optional[bool] = None,
    category: Optional[str] = None,
    task_id: Optional[UUID] = None,
    db: AsyncSession = Depends(get_user_db),
    current_user: User = Depends(get_current_user),
):
    query = select(Note).where(Note.user_id == current_user.id)
    if is_pinned is not None:
        query = query.where(Note.is_pinned == is_pinned)
    if category:
        query = query.where(Note.category == category)
    if task_id:
        query = query.where(Note.task_id == task_id)
    result = await db.execute(query.order_by(Note.is_pinned.desc(), Note.created_at.desc()))
    return result.scalars().all()

@router.post("/", response_model=NoteResponse, status_code=status.HTTP_201_CREATED)
async def create_note(
    note_data: NoteCreate,
    db: AsyncSession = Depends(get_user_db),
    current_user: User = Depends(get_current_user),
):
    note = Note(**note_data.model_dump(), user_id=current_user.id)
    db.add(note)
    await db.commit()
    await db.refresh(note)
    return note

@router.get("/{note_id}", response_model=NoteResponse)
async def get_note(
    note_id: UUID,
    db: AsyncSession = Depends(get_user_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Note).where(Note.id == note_id, Note.user_id == current_user.id))
    note = result.scalar_one_or_none()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    return note

@router.put("/{note_id}", response_model=NoteResponse)
async def update_note(
    note_id: UUID,
    note_data: NoteUpdate,
    db: AsyncSession = Depends(get_user_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Note).where(Note.id == note_id, Note.user_id == current_user.id))
    note = result.scalar_one_or_none()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    for key, value in note_data.model_dump(exclude_unset=True).items():
        setattr(note, key, value)
    await db.commit()
    await db.refresh(note)
    return note

@router.delete("/{note_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_note(
    note_id: UUID,
    db: AsyncSession = Depends(get_user_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Note).where(Note.id == note_id, Note.user_id == current_user.id))
    note = result.scalar_one_or_none()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    await db.delete(note)
    await db.commit()

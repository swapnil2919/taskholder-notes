import secrets
from fastapi import APIRouter, Depends, HTTPException, Header, status
from fastapi.responses import PlainTextResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from sqlalchemy.sql import func
from typing import List, Optional
from uuid import UUID
from datetime import datetime, timezone, timedelta

from ..database import get_db
from ..models.user import User
from ..models.phone_notification import PhoneNotification
from ..schemas.phone_notification import (
    PhoneNotificationIngest,
    PhoneNotificationResponse,
    PhoneTokenResponse,
    ConnectionStatus,
)
from ..auth.deps import get_current_user

router = APIRouter(prefix="/phone-notifications", tags=["Phone Notifications"])

CONNECTED_THRESHOLD_SECONDS = 90


async def get_user_by_token(
    x_api_token: str = Header(...),
    db: AsyncSession = Depends(get_db),
) -> User:
    result = await db.execute(
        select(User).where(User.phone_api_token == x_api_token, User.is_active == True)
    )
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=401, detail="Invalid API token")
    return user


# ── Script-facing endpoints (auth via X-API-Token header) ──────────────────

@router.post("/ingest", status_code=status.HTTP_201_CREATED)
async def ingest_notification(
    data: PhoneNotificationIngest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_user_by_token),
):
    # Deduplicate by notif_id within last 60 seconds
    if data.notif_id:
        cutoff = datetime.now(timezone.utc) - timedelta(seconds=60)
        existing = await db.execute(
            select(PhoneNotification).where(
                PhoneNotification.user_id == user.id,
                PhoneNotification.notif_id == data.notif_id,
                PhoneNotification.received_at >= cutoff,
            )
        )
        if existing.scalar_one_or_none():
            return {"status": "duplicate"}

    notif = PhoneNotification(
        user_id=user.id,
        notif_id=data.notif_id,
        app_name=data.app_name,
        title=data.title,
        text=data.text,
    )
    db.add(notif)

    user.phone_script_last_seen = datetime.now(timezone.utc)
    await db.commit()
    return {"status": "ok"}


@router.post("/heartbeat")
async def heartbeat(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_user_by_token),
):
    user.phone_script_last_seen = datetime.now(timezone.utc)
    await db.commit()
    return {"status": "ok"}


# ── User-facing endpoints (auth via JWT) ────────────────────────────────────

@router.get("/token", response_model=PhoneTokenResponse)
async def get_or_create_token(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not current_user.phone_api_token:
        current_user.phone_api_token = secrets.token_urlsafe(32)
        await db.commit()
        await db.refresh(current_user)
    return {"phone_api_token": current_user.phone_api_token}


@router.post("/token/regenerate", response_model=PhoneTokenResponse)
async def regenerate_token(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    current_user.phone_api_token = secrets.token_urlsafe(32)
    await db.commit()
    await db.refresh(current_user)
    return {"phone_api_token": current_user.phone_api_token}


@router.get("/status", response_model=ConnectionStatus)
async def get_connection_status(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    last_seen = current_user.phone_script_last_seen
    if last_seen is None:
        return {"connected": False, "last_seen": None}

    now = datetime.now(timezone.utc)
    if last_seen.tzinfo is None:
        last_seen = last_seen.replace(tzinfo=timezone.utc)

    connected = (now - last_seen).total_seconds() <= CONNECTED_THRESHOLD_SECONDS
    return {"connected": connected, "last_seen": last_seen}


@router.get("/", response_model=List[PhoneNotificationResponse])
async def get_notifications(
    unread_only: bool = False,
    limit: int = 50,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = select(PhoneNotification).where(PhoneNotification.user_id == current_user.id)
    if unread_only:
        query = query.where(PhoneNotification.is_read == False)
    query = query.order_by(PhoneNotification.received_at.desc()).limit(limit)
    result = await db.execute(query)
    return result.scalars().all()


@router.patch("/{notif_id}/read")
async def mark_read(
    notif_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(PhoneNotification).where(
            PhoneNotification.id == notif_id,
            PhoneNotification.user_id == current_user.id,
        )
    )
    notif = result.scalar_one_or_none()
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")
    notif.is_read = True
    await db.commit()
    return {"status": "ok"}


@router.delete("/{notif_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_notification(
    notif_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(PhoneNotification).where(
            PhoneNotification.id == notif_id,
            PhoneNotification.user_id == current_user.id,
        )
    )
    notif = result.scalar_one_or_none()
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")
    await db.delete(notif)
    await db.commit()


@router.delete("/", status_code=status.HTTP_204_NO_CONTENT)
async def clear_all_notifications(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    await db.execute(
        delete(PhoneNotification).where(PhoneNotification.user_id == current_user.id)
    )
    await db.commit()


def _build_script(token: str) -> PlainTextResponse:
    script = f'''#!/usr/bin/env python3
"""
TaskHolder Phone Notification Bridge
--------------------------------------
Run this script on your Android phone using Termux + Termux:API.
It forwards your phone notifications to your TaskHolder dashboard.

Requirements (run in Termux):
  pkg install python termux-api
  pip install requests
  And grant Notification Access in Android Settings > Apps > Termux:API
"""
import subprocess
import requests
import time
import json
import sys

API_URL = "https://taskholder-sp.vercel.app/api"
API_TOKEN = "{token}"

# Apps to ignore (system noise)
IGNORED_APPS = {{
    "android", "com.android.systemui", "com.android.phone",
    "com.android.launcher3", "com.android.settings",
}}

def get_notifications():
    try:
        result = subprocess.run(
            ["termux-notification-list"],
            capture_output=True, text=True, timeout=10
        )
        output = result.stdout.strip()
        if not output or output == "null":
            return []
        data = json.loads(output)
        return data if isinstance(data, list) else []
    except json.JSONDecodeError:
        return []
    except Exception as e:
        print(f"[Error] Reading notifications: {{e}}", flush=True)
        return []

def send_notification(notif):
    try:
        requests.post(
            f"{{API_URL}}/phone-notifications/ingest",
            json={{
                "notif_id": str(notif.get("id", "")),
                "app_name": notif.get("packageName", "Unknown"),
                "title": notif.get("title", ""),
                "text": notif.get("content", ""),
            }},
            headers={{"X-API-Token": API_TOKEN}},
            timeout=10,
        )
    except Exception as e:
        print(f"[Error] Sending notification: {{e}}", flush=True)

def heartbeat():
    try:
        requests.post(
            f"{{API_URL}}/phone-notifications/heartbeat",
            headers={{"X-API-Token": API_TOKEN}},
            timeout=5,
        )
    except Exception:
        pass

seen_ids = set()
heartbeat_counter = 0

print("TaskHolder Notification Bridge started", flush=True)
print(f"Dashboard: https://taskholder-sp.vercel.app/phone-notifications", flush=True)
print("Press Ctrl+C to stop\\n", flush=True)

while True:
    try:
        notifications = get_notifications()
        new_count = 0

        for notif in notifications:
            pkg = notif.get("packageName", "")
            if pkg in IGNORED_APPS:
                continue
            notif_id = str(notif.get("id", ""))
            if notif_id and notif_id not in seen_ids:
                seen_ids.add(notif_id)
                send_notification(notif)
                new_count += 1
                title = notif.get("title") or ""
                print(f"[Sent] {{pkg}}: {{title}}", flush=True)

        heartbeat_counter += 1
        if heartbeat_counter >= 6:  # every 30 seconds
            heartbeat()
            heartbeat_counter = 0

        time.sleep(5)

    except KeyboardInterrupt:
        print("\\nStopped.", flush=True)
        sys.exit(0)
    except Exception as e:
        print(f"[Error] {{e}}", flush=True)
        time.sleep(10)
'''
    return PlainTextResponse(
        content=script,
        headers={"Content-Disposition": 'attachment; filename="taskholder_notify.py"'},
        media_type="text/x-python",
    )


@router.get("/download-script-token", response_class=PlainTextResponse)
async def download_script_by_token(
    user: User = Depends(get_user_by_token),
):
    """Download script via phone API token — used by Termux curl command."""
    return _build_script(user.phone_api_token)


@router.get("/download-script", response_class=PlainTextResponse)
async def download_script(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Download script via JWT — used by browser download button."""
    if not current_user.phone_api_token:
        current_user.phone_api_token = secrets.token_urlsafe(32)
        await db.commit()
        await db.refresh(current_user)
    return _build_script(current_user.phone_api_token)

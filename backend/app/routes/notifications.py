from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import text

from app.database import engine
from app.security import get_current_user

router = APIRouter(prefix="/notifications", tags=["Notifications"])


# View notifications belonging to the logged-in user
@router.get("/")
def get_notifications(
    current_user: dict = Depends(get_current_user),
):
    with engine.connect() as connection:
        result = connection.execute(
            text("""
                SELECT notification_id, message, is_read, created_at
                FROM notifications
                WHERE user_id = :user_id
                ORDER BY created_at DESC
            """),
            {"user_id": current_user["user_id"]},
        )

        notifications = result.mappings().all()

    return {
        "total_notifications": len(notifications),
        "unread_notifications": sum(
            not notification["is_read"]
            for notification in notifications
        ),
        "notifications": [
            dict(notification) for notification in notifications
        ],
    }


# Mark a notification as read
@router.patch("/{notification_id}/read")
def mark_notification_as_read(
    notification_id: int,
    current_user: dict = Depends(get_current_user),
):
    with engine.begin() as connection:
        result = connection.execute(
            text("""
                UPDATE notifications
                SET is_read = TRUE
                WHERE notification_id = :notification_id
                  AND user_id = :user_id
            """),
            {
                "notification_id": notification_id,
                "user_id": current_user["user_id"],
            },
        )

        if result.rowcount == 0:
            existing_notification = connection.execute(
                text("""
                    SELECT notification_id
                    FROM notifications
                    WHERE notification_id = :notification_id
                      AND user_id = :user_id
                """),
                {
                    "notification_id": notification_id,
                    "user_id": current_user["user_id"],
                },
            ).first()

            if not existing_notification:
                raise HTTPException(
                    status_code=404,
                    detail="Notification not found.",
                )

    return {
        "message": "Notification marked as read.",
        "notification_id": notification_id,
        "is_read": True,
    }
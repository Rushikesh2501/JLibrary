from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, File, UploadFile, status, Response
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.users import UsersResponse, UserCreate, UserUpdate
from app.services import user_service

router = APIRouter(
    prefix="/users",
    tags=["Users"]
)


@router.get("/", response_model=list[UsersResponse])
def get_users(db: Session = Depends(get_db)):
    return user_service.get_all_users(db)


@router.get("/{user_id}/avatar")
def get_user_avatar(user_id: str, db: Session = Depends(get_db)):
    """
    Serve user profile photo directly from Supabase Storage bucket 'user_profile'.
    Bypasses any client-side ISP DNS blocks on *.supabase.co.
    """
    user = user_service.get_user_by_id(db, user_id=user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # If user has base64 data url, decode and return it directly
    if user.profile_pic_url and user.profile_pic_url.startswith("data:image"):
        try:
            import base64
            header, b64 = user.profile_pic_url.split(",", 1)
            media_type = header.split(";")[0].replace("data:", "")
            return Response(
                content=base64.b64decode(b64),
                media_type=media_type,
                headers={"Cache-Control": "public, max-age=86400"}
            )
        except Exception:
            pass

    from app.core.supabase import supabase_client, get_user_storage_folder, USER_STORAGE_BUCKET
    if not supabase_client:
        raise HTTPException(status_code=404, detail="Storage client not configured")

    folder = get_user_storage_folder(user_id)
    for filename in ["avatar.jpg", "avatar.png", "avatar.webp", "avatar.jpeg"]:
        try:
            img_bytes = supabase_client.storage.from_(USER_STORAGE_BUCKET).download(f"{folder}/{filename}")
            if img_bytes:
                media_type = "image/png" if "png" in filename else ("image/webp" if "webp" in filename else "image/jpeg")
                return Response(
                    content=img_bytes,
                    media_type=media_type,
                    headers={"Cache-Control": "public, max-age=86400"}
                )
        except Exception:
            continue

    raise HTTPException(status_code=404, detail="Avatar not found")


@router.get("/{user_id}", response_model=UsersResponse)
def get_user(user_id: str, db: Session = Depends(get_db)):
    user = user_service.get_user_by_id(db, user_id=user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.post("/", response_model=UsersResponse, status_code=status.HTTP_201_CREATED)
def create_user(user_in: UserCreate, db: Session = Depends(get_db)):
    return user_service.create_user(db, user_in)


@router.put("/{user_id}", response_model=UsersResponse)
def update_user(user_id: str, user_in: UserUpdate, db: Session = Depends(get_db)):
    user = user_service.update_user(db, user_id=user_id, user_update=user_in)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.post("/{user_id}/avatar")
async def upload_avatar(
    user_id: str,
    file: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db)
):
    """
    Upload a profile picture for a user to Supabase Storage bucket 'user_profile'
    under folder user_{user_id}/.
    """
    user = user_service.get_user_by_id(db, user_id=user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if not file:
        raise HTTPException(status_code=400, detail="No image file provided")

    contents = await file.read()
    content_type = file.content_type or "image/jpeg"
    from app.core.supabase import upload_user_profile_pic
    public_url = upload_user_profile_pic(user_id, contents, content_type=content_type)

    user_service.update_user(db, user_id=user_id, user_update=UserUpdate(profile_pic_url=public_url))
    return {"profile_pic_url": public_url, "message": "Profile picture uploaded successfully"}


@router.delete("/{user_id}/avatar")
def remove_avatar(
    user_id: str,
    db: Session = Depends(get_db)
):
    """
    Remove profile picture for a user from Supabase Storage bucket 'user_profile'.
    """
    user = user_service.get_user_by_id(db, user_id=user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    from app.core.supabase import delete_user_profile_pic
    delete_user_profile_pic(user_id)
    user_service.update_user(db, user_id=user_id, user_update=UserUpdate(profile_pic_url=""))
    return {"message": "Profile picture removed successfully"}


@router.delete("/{user_id}")
def delete_user(user_id: str, db: Session = Depends(get_db)):
    success = user_service.delete_user(db, user_id=user_id)
    if not success:
        raise HTTPException(status_code=404, detail="User not found")
    return {"message": f"User '{user_id}' deleted successfully", "success": True}


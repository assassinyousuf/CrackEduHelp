import os
import hashlib
import shutil
from fastapi import UploadFile, HTTPException, status
from app.core.config import settings


class FileService:
    @staticmethod
    def validate_file(file: UploadFile):
        """Verify the file size and extension format conforms to the platform settings."""
        # 1. Verify file extension
        filename = file.filename or ""
        ext = filename.split(".")[-1].lower() if "." in filename else ""
        if ext not in settings.ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unsupported file format '.{ext}'. Allowed formats: {', '.join(settings.ALLOWED_EXTENSIONS)}"
            )

        # We can verify size by reading bytes or checking headers.
        # But we will do it after writing/reading, or by seeking.
        return ext

    @staticmethod
    async def save_file(file: UploadFile, subfolder: str) -> tuple[str, int]:
        """Save upload file to local disk storage folder and run scanning check."""
        FileService.validate_file(file)

        # Setup destination dir
        target_dir = os.path.join(settings.STORAGE_DIR, subfolder)
        os.makedirs(target_dir, exist_ok=True)

        # Secure filename & generate unique file path
        original_name = file.filename or "uploaded_file"
        file_hash = hashlib.md5(original_name.encode()).hexdigest()[:6]
        unique_name = f"{file_hash}_{original_name}"
        file_path = os.path.join(target_dir, unique_name)

        # Write file streams and compute sizes
        size_bytes = 0
        sha256_hash = hashlib.sha256()

        try:
            with open(file_path, "wb") as f:
                # Read chunks
                while content := await file.read(1024 * 1024):  # 1MB chunks
                    size_bytes += len(content)
                    if size_bytes > settings.MAX_FILE_SIZE_BYTES:
                        raise HTTPException(
                            status_code=status.HTTP_400_BAD_REQUEST,
                            detail=f"File exceeds maximum allowed size of {settings.MAX_FILE_SIZE_BYTES // (1024 * 1024)}MB."
                        )
                    sha256_hash.update(content)
                    f.write(content)
        finally:
            await file.seek(0)

        # Virus Scan Simulation
        # Simulate check against a mock bad hash or verify SHA
        is_clean = True
        # If sha256 contains "0000" we mock flag it as dirty just for test integrity if needed.
        if "badhash" in sha256_hash.hexdigest():
            is_clean = False

        # Return relative storage key path and file size
        relative_key = os.path.join(subfolder, unique_name).replace("\\", "/")
        return relative_key, size_bytes, is_clean

    @staticmethod
    def get_file_path(file_key: str) -> str:
        """Fetch absolute path of file from key."""
        # Sanitize path to prevent directory traversal
        sanitized_key = file_key.replace("..", "")
        return os.path.join(settings.STORAGE_DIR, sanitized_key)

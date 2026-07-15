from dotenv import load_dotenv
from os import getenv


class Settings:
    database_url: str
    cors_origins: list[str]
    secret_key: str
    jwt_expires_minutes: int
    s3_endpoint: str
    s3_access_key: str
    s3_secret_key: str
    s3_bucket: str
    s3_region: str
    s3_secure: bool


def get_settings() -> Settings:
    load_dotenv()
    s = Settings()
    s.database_url = getenv("DATABASE_URL", "")
    s.cors_origins = [item.strip() for item in getenv("CORS_ORIGINS", "").split(",") if item.strip()]
    s.secret_key = getenv("SECRET_KEY", "")
    s.jwt_expires_minutes = int(getenv("JWT_EXPIRES_MINUTES", "1440"))
    s.s3_endpoint = getenv("S3_ENDPOINT", "http://localhost:9000")
    s.s3_access_key = getenv("S3_ACCESS_KEY", "minioadmin")
    s.s3_secret_key = getenv("S3_SECRET_KEY", "minioadmin")
    s.s3_bucket = getenv("S3_BUCKET", "supmeal")
    s.s3_region = getenv("S3_REGION", "us-east-1")
    s.s3_secure = getenv("S3_SECURE", "false").lower() == "true"
    return s
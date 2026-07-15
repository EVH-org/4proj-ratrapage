import boto3
import logging
from botocore.config import Config
from botocore.exceptions import ClientError, EndpointConnectionError

from app.core.config import get_settings

settings = get_settings()
_s3 = None
_log = logging.getLogger(__name__)


def _get_s3_client():
    global _s3
    if _s3 is not None:
        return _s3
    _s3 = boto3.client(
        "s3",
        endpoint_url=settings.s3_endpoint,
        aws_access_key_id=settings.s3_access_key,
        aws_secret_access_key=settings.s3_secret_key,
        region_name=settings.s3_region,
        config=Config(signature_version="s3v4"),
    )
    return _s3


def create_presigned_put(object_key: str, content_type: str) -> str:
    return _get_s3_client().generate_presigned_url(
        ClientMethod="put_object",
        Params={
            "Bucket": settings.s3_bucket,
            "Key": object_key,
            "ContentType": content_type,
        },
        ExpiresIn=3600,
    )


def create_presigned_get(object_key: str | None) -> str | None:
    if not object_key:
        return None
    try:
        return _get_s3_client().generate_presigned_url(
            ClientMethod="get_object",
            Params={"Bucket": settings.s3_bucket, "Key": object_key},
            ExpiresIn=3600,
        )
    except (ClientError, EndpointConnectionError) as e:
        _log.warning("presign_get failed for %r: %s", object_key, e)
        return None


def delete_object(object_key: str | None) -> bool:
    if not object_key:
        return False
    try:
        _get_s3_client().delete_object(
            Bucket=settings.s3_bucket,
            Key=object_key,
        )
        return True
    except (ClientError, EndpointConnectionError) as e:
        _log.warning("delete_object failed for %r: %s", object_key, e)
        return False
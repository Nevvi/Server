import os

import boto3
from types_boto3_s3 import S3Client


class ImageDao:
    def __init__(self):
        self.s3: S3Client = boto3.client("s3")
        self.bucket = os.environ["IMAGE_BUCKET"]

    def upload_image(self, user_id: str, image, file_name: str, content_type: str) -> str:
        key = f"users/{user_id}/images/{file_name}"
        self.s3.upload_fileobj(
            Fileobj=image,
            Bucket=self.bucket,
            Key=key,
            ExtraArgs={'ContentType': content_type, 'ACL': 'public-read'}
        )

        return f"https://{self.bucket}.s3.amazonaws.com/{key}"

    def remove_old_images(self, user_id: str, excluded_key: str):
        objects = self.s3.list_objects_v2(
            Bucket=self.bucket,
            Delimiter='/',
            Prefix=f"users/{user_id}/images/"
        )

        keys_to_remove = [obj.get("Key") for obj in objects.get("Contents", []) if excluded_key not in obj.get("Key")]
        for key in keys_to_remove:
            self.s3.delete_object(Bucket=self.bucket, Key=key)

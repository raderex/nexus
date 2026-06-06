from django.core.exceptions import ValidationError

ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
ALLOWED_DOCUMENT_TYPES = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'text/csv',
]
ALLOWED_RESUME_TYPES = ALLOWED_DOCUMENT_TYPES + ALLOWED_IMAGE_TYPES
MAX_FILE_SIZE_MB = 10
MAX_IMAGE_SIZE_MB = 5


def validate_file_type(file, allowed_types):
    if file.content_type not in allowed_types:
        raise ValidationError(f'File type "{file.content_type}" is not allowed. Allowed types: {", ".join(allowed_types)}')


def validate_file_size(file, max_size_mb):
    if file.size > max_size_mb * 1024 * 1024:
        raise ValidationError(f'File size must be under {max_size_mb}MB')


def validate_resume(file):
    validate_file_type(file, ALLOWED_RESUME_TYPES)
    validate_file_size(file, MAX_FILE_SIZE_MB)


def validate_image(file):
    validate_file_type(file, ALLOWED_IMAGE_TYPES)
    validate_file_size(file, MAX_IMAGE_SIZE_MB)


def validate_attachment(file):
    validate_file_type(file, ALLOWED_DOCUMENT_TYPES + ALLOWED_IMAGE_TYPES)
    validate_file_size(file, MAX_FILE_SIZE_MB)

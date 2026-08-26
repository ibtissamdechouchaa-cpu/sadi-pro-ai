const MAX_FILE_SIZE = 100 * 1024 * 1024;
const MAX_NAME_LENGTH = 255;

const ACCEPTED_TYPES: string[] = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
  'text/csv',
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/tiff',
];

const ACCEPTED_EXTENSIONS: string[] = [
  'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx',
  'txt', 'csv', 'png', 'jpg', 'jpeg', 'webp', 'tiff', 'tif',
];

export function validateFile(file: File): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (file.size > MAX_FILE_SIZE) {
    errors.push(`File exceeds maximum size of ${formatFileSize(MAX_FILE_SIZE)}`);
  }

  if (file.size === 0) {
    errors.push('File is empty');
  }

  const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
  if (!ACCEPTED_EXTENSIONS.includes(ext)) {
    errors.push(`File type ".${ext}" is not supported`);
  }

  if (file.name.length > MAX_NAME_LENGTH) {
    errors.push(`File name exceeds ${MAX_NAME_LENGTH} characters`);
  }

  if (/[<>:"|?*]/.test(file.name)) {
    errors.push('File name contains invalid characters');
  }

  const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '');
  if (!nameWithoutExt.trim()) {
    errors.push('File name is empty');
  }

  return { valid: errors.length === 0, errors };
}

export function validateFiles(
  files: File[]
): { valid: File[]; rejected: { file: File; reason: string }[] } {
  const valid: File[] = [];
  const rejected: { file: File; reason: string }[] = [];

  for (const file of files) {
    const result = validateFile(file);
    if (result.valid) {
      valid.push(file);
    } else {
      rejected.push({ file, reason: result.errors.join('; ') });
    }
  }

  return { valid, rejected };
}

export function getAcceptedFileTypes(): string[] {
  return [...ACCEPTED_TYPES];
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

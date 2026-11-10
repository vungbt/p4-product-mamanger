/** What an upload is for; decides who may create it and where the file may be attached. */
export const STAY_UPLOAD_PURPOSES = ['tenant_document', 'expense_receipt'] as const;
export type StayUploadPurpose = (typeof STAY_UPLOAD_PURPOSES)[number];

export const STAY_UPLOAD_STATUSES = ['pending', 'completed'] as const;
export type StayUploadStatus = (typeof STAY_UPLOAD_STATUSES)[number];

/** Image types accepted for private uploads (CCCD photos). */
export const STAY_UPLOAD_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;

/** Maximum size of one uploaded image (10 MB). */
export const STAY_UPLOAD_MAX_BYTES = 10_485_760;

/** An upload ticket (`GET /api/uploads/:id`). */
export interface StayUpload {
  id: string;
  purpose: StayUploadPurpose;
  buildingId: string;
  status: StayUploadStatus;
  /** Set once `POST /api/uploads/:id/complete` verified the stored file. */
  fileId: string | null;
  maxBytes: number;
  expiresAt: string;
}

/**
 * `POST /api/uploads`: send the image as multipart field `file` to `uploadUrl` (POST, no
 * cookies), then call `POST /api/uploads/:id/complete`. The file is private: it is only shown
 * through signed, short-lived URLs.
 */
export interface StayUploadTicket extends StayUpload {
  uploadUrl: string;
  allowedMimeTypes: string[];
}

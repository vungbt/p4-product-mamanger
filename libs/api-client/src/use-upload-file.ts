import type { ApiSuccess } from '@p4/shared';
import { axiosClient } from './axios-client';

type SignedUpload = {
  uploadUrl: string;
  publicId: string;
};

async function getSignedUpload(name: string): Promise<SignedUpload> {
  const res = await axiosClient.get<{ name: string }, ApiSuccess<SignedUpload>>(
    '/files/sign-upload-url',
    { name },
  );
  return res.data;
}

async function uploadToCloudinary(uploadUrl: string, file: File): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(uploadUrl, { method: 'POST', body: formData });
  if (!res.ok) {
    throw new Error(`Cloudinary upload failed with status ${res.status}`);
  }

  const json = (await res.json()) as { secure_url: string };
  return json.secure_url;
}

/**
 * Ký URL upload qua `/files/sign-upload-url` (admin-only) rồi POST file thẳng lên Cloudinary.
 * Không đi qua `axiosClient` cho bước upload — `uploadUrl` đã tự mang public_id/timestamp/
 * signature/api_key, còn `axiosClient` cố định baseURL `/api` và ép `Content-Type: application/json`.
 */
export function useUploadFile() {
  const uploadFile = async (file: File): Promise<{ url: string }> => {
    const { uploadUrl } = await getSignedUpload(file.name);
    const url = await uploadToCloudinary(uploadUrl, file);
    return { url };
  };

  return { uploadImage: uploadFile, uploadVideo: uploadFile };
}

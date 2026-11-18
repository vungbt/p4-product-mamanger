import { unwrap } from '@p4/api-sdk/shared';
import { getApiSdk } from './session';

async function getSignedUpload(name: string) {
  const res = unwrap(
    await getApiSdk().GET('/api/files/sign-upload-url', { params: { query: { name } } }),
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
 * Ký URL upload qua `/files/sign-upload-url` (cần quyền `write:Catalog`) rồi POST file thẳng lên
 * Cloudinary. Bước upload dùng `fetch` vì `uploadUrl` đã mang sẵn public_id/timestamp/signature.
 */
export function useUploadFile() {
  const uploadFile = async (file: File): Promise<{ url: string }> => {
    const { uploadUrl } = await getSignedUpload(file.name);
    const url = await uploadToCloudinary(uploadUrl, file);
    return { url };
  };

  return { uploadImage: uploadFile, uploadVideo: uploadFile };
}

import { IMGBB_API_KEY, isMockStorage } from '../config/storageConfig';

/**
 * Upload an image from a local URI or base64 asset to ImgBB (Free cloud image hosting)
 * @param {string|object} imageInput Local device URI or asset object { uri, base64 }
 * @returns {Promise<string>} Public HTTPS image URL or valid data URI fallback
 */
export async function uploadImageToImgBB(imageInput) {
  if (!imageInput) return null;

  const localUri = typeof imageInput === 'string' ? imageInput : imageInput.uri;
  const base64 = typeof imageInput === 'object' ? imageInput.base64 : null;

  // If already a remote web URL, return as-is
  if (localUri && (localUri.startsWith('http://') || localUri.startsWith('https://'))) {
    return localUri;
  }

  if (isMockStorage()) {
    console.log('[ImgBB] Mock storage active, returning local/base64 URI');
    return base64 ? `data:image/jpeg;base64,${base64}` : localUri;
  }

  try {
    // 1. Try uploading with base64 string directly
    // This avoids React Native's "Unsupported FormDataPart implementation" with file objects
    if (base64) {
      const formData = new FormData();
      formData.append('image', base64);

      const response = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      if (result.success && result.data?.url) {
        console.log('[ImgBB] Image uploaded successfully via base64:', result.data.url);
        return result.data.url;
      } else {
        console.warn('[ImgBB] Upload error response:', result?.error?.message);
      }
    }

    // 2. Native FormData fallback for local URI if base64 wasn't provided or failed
    if (localUri) {
      const formData = new FormData();
      const filename = localUri.split('/').pop() || 'upload.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const ext = match ? match[1].toLowerCase() : 'jpg';
      const mimeType = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';

      formData.append('image', {
        uri: localUri,
        name: filename,
        type: mimeType,
      });

      const response = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      if (result.success && result.data?.url) {
        console.log('[ImgBB] Image uploaded successfully via native FormData:', result.data.url);
        return result.data.url;
      }
    }

    // If ImgBB rejected or is unreachable, return data URI or localUri so app continues working
    return base64 ? `data:image/jpeg;base64,${base64}` : localUri;
  } catch (error) {
    console.warn('[ImgBB] Upload fallback to local/data URI:', error.message);
    return base64 ? `data:image/jpeg;base64,${base64}` : localUri;
  }
}

// Alias for compatibility
export const uploadImageToStorage = uploadImageToImgBB;
export default uploadImageToImgBB;

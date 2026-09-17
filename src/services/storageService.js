import { IMGBB_API_KEY, isMockStorage } from '../config/storageConfig';

/**
 * Upload an image from a local URI to ImgBB (Free cloud image hosting)
 * @param {string} localUri Local device file path or URI from expo-image-picker
 * @returns {Promise<string>} Public HTTPS image URL
 */
export async function uploadImageToImgBB(localUri) {
  if (!localUri) return null;

  // If already a remote web URL, return as-is
  if (localUri.startsWith('http://') || localUri.startsWith('https://')) {
    return localUri;
  }

  if (isMockStorage()) {
    console.log('[ImgBB] No API key configured yet, using local URI fallback');
    return localUri;
  }

  try {
    const formData = new FormData();
    const filename = localUri.split('/').pop() || 'upload.jpg';
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1].toLowerCase()}` : 'image/jpeg';

    formData.append('image', {
      uri: localUri,
      name: filename,
      type: type,
    });

    const response = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
      method: 'POST',
      body: formData,
      headers: {
        'Accept': 'application/json',
      },
    });

    const result = await response.json();
    if (result.success && result.data?.url) {
      console.log('[ImgBB] Image uploaded successfully:', result.data.url);
      return result.data.url;
    } else {
      console.warn('[ImgBB] Upload failed:', result?.error?.message);
      return localUri;
    }
  } catch (error) {
    console.warn('[ImgBB] Upload network error, falling back to local URI:', error.message);
    return localUri;
  }
}

// Alias for compatibility
export const uploadImageToStorage = uploadImageToImgBB;
export default uploadImageToImgBB;

import { File } from 'expo-file-system';
import { supabase } from './supabase';
import type { ProgressPhoto } from './types';

const BUCKET = 'progress-photos';
const SIGNED_TTL = 60 * 60 * 24 * 7; // 7 days

/**
 * Upload a picked photo to the user's folder in the Supabase bucket and return
 * a ProgressPhoto with a signed URL. When the backend/session isn't available
 * the photo is kept locally (its file uri) so the feature still works offline.
 */
export async function uploadProgressPhoto(localUri: string, weightKg?: number): Promise<ProgressPhoto> {
  const now = new Date();
  const base: ProgressPhoto = {
    id: `p-${now.getTime()}-${Math.random().toString(36).slice(2, 7)}`,
    ts: now.getTime(),
    date: now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    uri: localUri,
    weightKg,
  };

  const userId = (await supabase?.auth.getSession())?.data.session?.user?.id;
  if (!supabase || !userId) return base; // offline / signed-out → local only

  try {
    const bytes = await new File(localUri).bytes();
    const path = `${userId}/${base.id}.jpg`;
    const { error } = await supabase.storage.from(BUCKET).upload(path, bytes, {
      contentType: 'image/jpeg',
      upsert: false,
    });
    if (error) throw error;
    const signed = await supabase.storage.from(BUCKET).createSignedUrl(path, SIGNED_TTL);
    return { ...base, path, uri: signed.data?.signedUrl ?? localUri };
  } catch {
    return base; // keep the local copy on any upload failure
  }
}

/** Refresh a possibly-expired signed URL for an uploaded photo. */
export async function refreshPhotoUrl(photo: ProgressPhoto): Promise<string> {
  if (!supabase || !photo.path) return photo.uri;
  const signed = await supabase.storage.from(BUCKET).createSignedUrl(photo.path, SIGNED_TTL);
  return signed.data?.signedUrl ?? photo.uri;
}

/** Remove the uploaded object (no-op for local-only photos). */
export async function deleteProgressPhoto(photo: ProgressPhoto): Promise<void> {
  if (supabase && photo.path) {
    await supabase.storage.from(BUCKET).remove([photo.path]).catch(() => {});
  }
}

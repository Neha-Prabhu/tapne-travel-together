import { apiUpload, apiPost, apiDelete } from "@/lib/api";
import type { MediaItem } from "@/types/api";

function base() {
  const c = window.TAPNE_RUNTIME_CONFIG.api;
  return {
    avatar: c.media_avatar || "/__devmock__/accounts/me/avatar/",
    cover: c.media_cover || "/__devmock__/accounts/me/cover/",
    gallery: c.media_gallery || "/__devmock__/accounts/me/gallery/",
    reorder: c.media_gallery_reorder || "/__devmock__/accounts/me/gallery/reorder/",
  };
}

function toFormData(file: File): FormData {
  const fd = new FormData();
  fd.append("file", file);
  return fd;
}

export async function uploadAvatar(file: File): Promise<MediaItem> {
  const r = await apiUpload<{ avatar: MediaItem }>(base().avatar, toFormData(file));
  return r.avatar;
}
export async function deleteAvatar(id: number): Promise<void> {
  await apiDelete(`${base().avatar}${id}/`);
}
export async function uploadCover(file: File): Promise<MediaItem> {
  const r = await apiUpload<{ cover: MediaItem }>(base().cover, toFormData(file));
  return r.cover;
}
export async function deleteCover(id: number): Promise<void> {
  await apiDelete(`${base().cover}${id}/`);
}
export async function uploadGalleryPhoto(file: File): Promise<MediaItem> {
  const r = await apiUpload<{ item: MediaItem }>(base().gallery, toFormData(file));
  return r.item;
}
export async function deleteGalleryPhoto(id: number): Promise<void> {
  await apiDelete(`${base().gallery}${id}/`);
}
export async function reorderGallery(ids: number[]): Promise<void> {
  await apiPost(base().reorder, { ids });
}

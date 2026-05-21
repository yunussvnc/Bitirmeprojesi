import { apiGet, apiPost, apiDelete, apiUploadFile } from "@/src/utils/apiClient";

export type PostMedia = {
  id: number;
  post_id: number;
  media_type: string;
  media_url: string;
  thumbnail_url?: string;
  order_index: number;
  width?: number;
  height?: number;
};

export type UserSummary = {
  id: number;
  username?: string;
  first_name?: string;
  avatar_url?: string;
  is_following?: boolean;
};

export type PlaceSummary = {
  id: number;
  name: string;
  category?: string;
};

export type Post = {
  id: number;
  user_id: number;
  place_id?: number;
  caption?: string;
  post_type: string;
  comments_disabled: boolean;
  likes_hidden: boolean;
  like_count: number;
  comment_count: number;
  created_at: string;
  is_liked: boolean;
  author?: UserSummary;
  place?: PlaceSummary;
  media: PostMedia[];
  tagged_users?: UserSummary[];
};

export type PaginatedPosts = {
  items: Post[];
  total: number;
  page: number;
  page_size: number;
};

export type PostComment = {
  id: number;
  user_id: number;
  post_id: number;
  text: string;
  created_at: string;
  author_username?: string;
  is_liked?: boolean;
  like_count?: number;
};

export type CreatePostPayload = {
  caption?: string;
  place_id?: number;
  post_type?: string;
  comments_disabled?: boolean;
  likes_hidden?: boolean;
  media: { media_type: string; media_url: string; thumbnail_url?: string; order_index?: number }[];
  tagged_user_ids?: number[];
};

export type FeedFilter = "all" | "following";

export async function getFeed(
  page = 1,
  pageSize = 20,
  filter: FeedFilter = "all"
): Promise<PaginatedPosts> {
  return apiGet<PaginatedPosts>(
    `/feed?page=${page}&page_size=${pageSize}&filter=${filter}`
  );
}

export async function getReels(
  page = 1,
  pageSize = 20,
  filter: FeedFilter = "all"
): Promise<PaginatedPosts> {
  return apiGet<PaginatedPosts>(
    `/feed/reels?page=${page}&page_size=${pageSize}&filter=${filter}`
  );
}

export async function getPost(id: number): Promise<Post> {
  return apiGet<Post>(`/posts/${id}`);
}

export async function getPlacePosts(
  placeId: number,
  page = 1,
  pageSize = 24
): Promise<PaginatedPosts> {
  return apiGet<PaginatedPosts>(
    `/places/${placeId}/posts?page=${page}&page_size=${pageSize}`
  );
}

export async function createPost(payload: CreatePostPayload): Promise<Post> {
  return apiPost<Post>("/posts", payload);
}

export async function deletePost(id: number): Promise<void> {
  await apiDelete(`/posts/${id}`);
}

export async function toggleLike(postId: number): Promise<{ liked: boolean; like_count: number }> {
  return apiPost<{ liked: boolean; like_count: number }>(`/posts/${postId}/like`);
}

export async function toggleCommentLike(commentId: number): Promise<{ liked: boolean; like_count: number }> {
  // Mock endpoint veya eklenebilir, şimdilik client-side mock ile yetinebiliriz eğer yoksa.
  return apiPost<{ liked: boolean; like_count: number }>(`/comments/${commentId}/like`);
}

export async function getComments(
  postId: number,
  page = 1,
  pageSize = 20
): Promise<{ items: PostComment[]; total: number; page: number; page_size: number }> {
  return apiGet(`/posts/${postId}/comments?page=${page}&page_size=${pageSize}`);
}

export async function addComment(postId: number, text: string): Promise<PostComment> {
  return apiPost<PostComment>(`/posts/${postId}/comments`, { text });
}

export async function uploadImage(file: { uri: string; type?: string; name?: string }): Promise<{ url: string }> {
  return apiUploadFile<{ url: string }>("/upload/image", file, "file");
}

export async function uploadVideo(file: { uri: string; type?: string; name?: string }): Promise<{ url: string }> {
  return apiUploadFile<{ url: string }>("/upload/video", file, "file");
}

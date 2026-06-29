interface PostMeta {
  slug: string;
  title: string;
}
interface Window {
  __BLOG_META__: PostMeta[];
}

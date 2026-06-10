import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';

export async function GET(context) {
  const posts = (await getCollection('blog'))
    .filter(p => p.data.draft !== true)
    .sort((a, b) => {
      const da = a.data.pubDate ? new Date(a.data.pubDate).getTime() : 0;
      const db = b.data.pubDate ? new Date(b.data.pubDate).getTime() : 0;
      return db - da;
    })
    .slice(0, 50);

  return rss({
    title: 'Medium Archive - Conan Xin',
    description: 'Conan Xin 的 Medium 文章存档',
    site: context.site,
    items: posts.map(post => ({
      title: post.data.title,
      pubDate: post.data.pubDate ? new Date(post.data.pubDate) : new Date(),
      description: post.data.description || '',
      link: `/blog/${post.slug}/`,
    })),
    customData: `<language>zh-CN</language>`,
  });
}

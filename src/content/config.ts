import { defineCollection, z } from 'astro:content';

const bookCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    order: z.number(),
    description: z.string().optional(),
  }),
});

const postCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    publishDate: z.coerce.date().optional(),
    tags: z.array(z.string()).optional(),
    series: z.string().optional(),
    draft: z.boolean().optional(),
    ogImage: z.string().optional(),
    pinned: z.boolean().optional(),
    updatedDate: z.coerce.date().optional(),
  }),
});

const noteCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    publishDate: z.coerce.date().optional(),
  }),
});

export const collections = {
  book: bookCollection,
  post: postCollection,
  note: noteCollection,
};

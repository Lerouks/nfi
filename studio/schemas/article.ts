export default {
  name: "article",
  title: "Article",
  type: "document",
  fields: [
    {
      name: "title",
      title: "Titre",
      type: "string",
      validation: (Rule: any) => Rule.required(),
    },
    {
      name: "slug",
      title: "Slug (URL)",
      type: "slug",
      options: { source: "title", maxLength: 96 },
      validation: (Rule: any) => Rule.required(),
    },
    {
      name: "excerpt",
      title: "Résumé",
      type: "text",
      rows: 3,
      validation: (Rule: any) => Rule.required(),
    },
    {
      name: "content",
      title: "Contenu",
      type: "array",
      of: [{ type: "block" }, { type: "image", options: { hotspot: true } }],
    },
    {
      name: "cover",
      title: "Image de couverture",
      type: "image",
      options: { hotspot: true },
    },
    {
      name: "category",
      title: "Catégorie",
      type: "string",
      options: {
        layout: "radio",
        list: [
          { title: "Économie Africaine",  value: "economie-africaine" },
          { title: "Économie Mondiale",   value: "economie-mondiale" },
          { title: "Focus Niger",         value: "focus-niger" },
          { title: "Analyses de Marché",  value: "analyses-de-marche" },
        ],
      },
      validation: (Rule: any) => Rule.required(),
    },
    {
      name: "tags",
      title: "Tags",
      type: "array",
      of: [{ type: "string" }],
    },
    {
      name: "author",
      title: "Auteur",
      type: "string",
      initialValue: "La Rédaction NFI",
    },
    {
      name: "isPremium",
      title: "Article Premium",
      type: "boolean",
      initialValue: false,
    },
    {
      name: "featured",
      title: "À la une",
      type: "boolean",
      initialValue: false,
    },
    {
      name: "publishedAt",
      title: "Date de publication",
      type: "datetime",
      initialValue: () => new Date().toISOString(),
    },
    {
      name: "readTime",
      title: "Temps de lecture (minutes)",
      type: "number",
      initialValue: 5,
    },
  ],
  preview: {
    select: {
      title: "title",
      category: "category",
      media: "cover",
      featured: "featured",
    },
    prepare({ title, category, media, featured }: any) {
      return {
        title,
        subtitle: `${featured ? "⭐ À la une · " : ""}${category ?? ""}`,
        media,
      };
    },
  },
  orderings: [
    {
      title: "Date de publication (récent)",
      name: "publishedAtDesc",
      by: [{ field: "publishedAt", direction: "desc" }],
    },
  ],
};

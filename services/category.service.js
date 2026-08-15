import { AppError } from '../utils/AppError.js';
import {
  createCategory,
  deleteCategory,
  findCategoriesBySection,
  findCategoryById,
} from '../repositories/category.repository.js';

const DEFAULT_CATEGORIES = {
  gallery: ['Conferences', 'Workshops', 'CME', 'Community'],
  news: ['Announcements', 'Press', 'Members', 'Research'],
  'news-attachment': ['Annual Reports', 'Publications', 'Member Resources', 'Press Notes'],
};

export function listCategories(section) {
  if (!section) {
    throw new AppError('Category section is required.', 400);
  }

  return findCategoriesBySection(section);
}

export async function addCategory({ section, name, createdBy }) {
  const cleanSection = String(section || '').trim();
  const cleanName = String(name || '').trim();

  if (!cleanSection) {
    throw new AppError('Category section is required.', 400);
  }

  if (!cleanName) {
    throw new AppError('Category name is required.', 400);
  }

  const validSections = ['gallery', 'news', 'news-attachment'];
  if (!validSections.includes(cleanSection)) {
    throw new AppError('Invalid category section.', 400);
  }

  const slug = cleanName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '') || 'category';

  const existing = await findCategoriesBySection(cleanSection);
  if (existing.some(item => item.slug === slug)) {
    throw new AppError('This category already exists.', 409);
  }

  return createCategory({
    section: cleanSection,
    name: cleanName,
    slug,
    createdBy: createdBy || null,
  });
}

export async function removeCategory(categoryId) {
  const category = await findCategoryById(categoryId);
  if (!category) {
    throw new AppError('Category not found.', 404);
  }

  const removed = await deleteCategory(categoryId);
  return removed;
}

export async function ensureDefaultCategories() {
  for (const [section, names] of Object.entries(DEFAULT_CATEGORIES)) {
    const existing = await findCategoriesBySection(section);
    const existingSlugs = new Set(existing.map(item => item.slug));

    for (const name of names) {
      const slug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '') || 'category';

      if (!existingSlugs.has(slug)) {
        await createCategory({
          section,
          name,
          slug,
        });
        existingSlugs.add(slug);
      }
    }
  }
}

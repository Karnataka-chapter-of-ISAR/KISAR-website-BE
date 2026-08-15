import Category from '../models/Category.js';

export function findCategoriesBySection(section) {
  return Category.find({ section }).sort({ name: 1 }).lean();
}

export function createCategory(data) {
  return Category.create(data);
}

export function deleteCategory(categoryId) {
  return Category.findByIdAndDelete(categoryId).lean();
}

export function findCategoryById(categoryId) {
  return Category.findById(categoryId).lean();
}

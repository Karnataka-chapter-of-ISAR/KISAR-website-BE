import { AppError } from '../utils/AppError.js';
import { addCategory, listCategories, removeCategory } from '../services/category.service.js';
import { sendSuccess, sendError } from '../utils/response.js';

export async function getCategoriesController(req, res) {
  try {
    const section = String(req.query.section || '').trim();
    const categories = await listCategories(section);

    return sendSuccess(res, {
      message: 'Categories fetched successfully.',
      data: {
        categories: categories.map(item => ({
          id: item._id,
          section: item.section,
          name: item.name,
          slug: item.slug,
        })),
      },
    });
  } catch (err) {
    if (err instanceof AppError) {
      return sendError(res, { message: err.message, statusCode: err.statusCode, data: err.data });
    }
    throw err;
  }
}

export async function createCategoryController(req, res) {
  try {
    const category = await addCategory({
      section: req.body?.section,
      name: req.body?.name,
      createdBy: req.admin?.email ?? null,
    });

    return sendSuccess(res, {
      message: 'Category created successfully.',
      statusCode: 201,
      data: {
        category: {
          id: category._id,
          section: category.section,
          name: category.name,
          slug: category.slug,
        },
      },
    });
  } catch (err) {
    if (err instanceof AppError) {
      return sendError(res, { message: err.message, statusCode: err.statusCode, data: err.data });
    }
    throw err;
  }
}

export async function deleteCategoryController(req, res) {
  try {
    await removeCategory(req.params.id);
    return sendSuccess(res, { message: 'Category deleted successfully.' });
  } catch (err) {
    if (err instanceof AppError) {
      return sendError(res, { message: err.message, statusCode: err.statusCode, data: err.data });
    }
    throw err;
  }
}

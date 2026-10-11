import Product from '../models/Product.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';

// @desc    Get all products with optional category and search filters
// @route   GET /api/products
// @access  Protected
export const getProducts = asyncHandler(async (req, res) => {
  const { category, search } = req.query;
  const filter = {};

  if (category) {
    filter.category = category;
  }

  if (search) {
    filter.name = { $regex: search.trim(), $options: 'i' };
  }

  const products = await Product.find(filter).sort({ name: 1 });

  res.status(200).json({
    success: true,
    data: products,
  });
});

// @desc    Get product by id
// @route   GET /api/products/:id
// @access  Protected
export const getProductById = asyncHandler(async (req, res, next) => {
  const product = await Product.findById(req.params.id);
  if (!product) {
    return next(new ApiError(404, 'Product not found'));
  }

  res.status(200).json({
    success: true,
    data: product,
  });
});

// @desc    Create a product
// @route   POST /api/products
// @access  Protected / Admin
export const createProduct = asyncHandler(async (req, res, next) => {
  const { name, category, price, description, imageUrl, stock } = req.body;

  if (!name || !name.trim()) {
    return next(new ApiError(400, 'Product name is required'));
  }

  if (price === undefined || price === null || price === '') {
    return next(new ApiError(400, 'Price is required'));
  }

  const numPrice = Number(price);
  if (isNaN(numPrice) || numPrice < 0) {
    return next(new ApiError(400, 'Price must be a number greater than or equal to 0'));
  }

  let parsedStock = 0;
  if (stock !== undefined && stock !== null && stock !== '') {
    const numStock = Number(stock);
    if (!Number.isInteger(numStock) || numStock < 0) {
      return next(new ApiError(400, 'Stock must be an integer greater than or equal to 0'));
    }
    parsedStock = numStock;
  }

  const product = await Product.create({
    name: name.trim(),
    category,
    price: numPrice,
    description: description ? description.trim() : undefined,
    imageUrl: imageUrl ? imageUrl.trim() : '',
    stock: parsedStock,
  });

  res.status(201).json({
    success: true,
    data: product,
  });
});

// @desc    Update a product
// @route   PUT /api/products/:id
// @access  Protected / Admin
export const updateProduct = asyncHandler(async (req, res, next) => {
  const product = await Product.findById(req.params.id);
  if (!product) {
    return next(new ApiError(404, 'Product not found'));
  }

  const { name, category, price, description, imageUrl, stock } = req.body;

  if (name !== undefined) {
    if (!name || !name.trim()) {
      return next(new ApiError(400, 'Product name cannot be empty'));
    }
    product.name = name.trim();
  }

  if (category !== undefined) {
    product.category = category;
  }

  if (price !== undefined) {
    const numPrice = Number(price);
    if (isNaN(numPrice) || numPrice < 0) {
      return next(new ApiError(400, 'Price must be a number greater than or equal to 0'));
    }
    product.price = numPrice;
  }

  if (description !== undefined) {
    product.description = description ? description.trim() : '';
  }

  if (imageUrl !== undefined) {
    product.imageUrl = imageUrl ? imageUrl.trim() : '';
  }

  if (stock !== undefined) {
    const numStock = Number(stock);
    if (!Number.isInteger(numStock) || numStock < 0) {
      return next(new ApiError(400, 'Stock must be an integer greater than or equal to 0'));
    }
    product.stock = numStock;
  }

  await product.save();

  res.status(200).json({
    success: true,
    data: product,
  });
});

// @desc    Delete a product
// @route   DELETE /api/products/:id
// @access  Protected / Admin
export const deleteProduct = asyncHandler(async (req, res, next) => {
  const product = await Product.findById(req.params.id);
  if (!product) {
    return next(new ApiError(404, 'Product not found'));
  }

  await product.deleteOne();

  res.status(200).json({
    success: true,
    message: 'Product deleted successfully',
  });
});

export default {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
};

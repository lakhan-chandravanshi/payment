const Joi = require('joi');

// User validation schemas
const registerSchema = Joi.object({
  name: Joi.string().trim().max(50).required().messages({
    'string.empty': 'Name is required',
    'string.max': 'Name cannot exceed 50 characters'
  }),
  email: Joi.string().email().lowercase().required().messages({
    'string.empty': 'Email is required',
    'string.email': 'Please enter a valid email'
  }),
  password: Joi.string().min(6).required().messages({
    'string.empty': 'Password is required',
    'string.min': 'Password must be at least 6 characters'
  })
});

const loginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.empty': 'Email is required',
    'string.email': 'Please enter a valid email'
  }),
  password: Joi.string().required().messages({
    'string.empty': 'Password is required'
  })
});

// Product validation schemas
const productSchema = Joi.object({
  name: Joi.string().trim().max(100).required().messages({
    'string.empty': 'Product name is required',
    'string.max': 'Product name cannot exceed 100 characters'
  }),
  price: Joi.number().min(0).required().messages({
    'number.base': 'Price must be a number',
    'number.min': 'Price cannot be negative'
  }),
  description: Joi.string().max(500).required().messages({
    'string.empty': 'Description is required',
    'string.max': 'Description cannot exceed 500 characters'
  }),
  stock: Joi.number().min(0).required().messages({
    'number.base': 'Stock must be a number',
    'number.min': 'Stock cannot be negative'
  })
});

const productUpdateSchema = Joi.object({
  name: Joi.string().trim().max(100).messages({
    'string.max': 'Product name cannot exceed 100 characters'
  }),
  price: Joi.number().min(0).messages({
    'number.base': 'Price must be a number',
    'number.min': 'Price cannot be negative'
  }),
  description: Joi.string().max(500).messages({
    'string.max': 'Description cannot exceed 500 characters'
  }),
  stock: Joi.number().min(0).messages({
    'number.base': 'Stock must be a number',
    'number.min': 'Stock cannot be negative'
  })
});

// Cart validation schemas
const cartItemSchema = Joi.object({
  productId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required().messages({
    'string.empty': 'Product ID is required',
    'string.pattern.base': 'Invalid product ID format'
  }),
  quantity: Joi.number().integer().min(1).required().messages({
    'number.base': 'Quantity must be a number',
    'number.integer': 'Quantity must be an integer',
    'number.min': 'Quantity must be at least 1'
  })
});

// Order validation schemas
const orderStatusSchema = Joi.object({
  status: Joi.string().valid('PENDING_PAYMENT', 'PAID', 'SHIPPED', 'DELIVERED', 'CANCELLED').required().messages({
    'string.empty': 'Status is required',
    'any.only': 'Status must be one of: PENDING_PAYMENT, PAID, SHIPPED, DELIVERED, CANCELLED'
  })
});

// Query validation schemas
const paginationSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  sort: Joi.string().valid('name', 'price', 'createdAt', '-name', '-price', '-createdAt').default('-createdAt'),
  search: Joi.string().trim().max(100).allow('')
});

const orderQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  status: Joi.string().valid('PENDING_PAYMENT', 'PAID', 'SHIPPED', 'DELIVERED', 'CANCELLED').allow(''),
  sort: Joi.string().valid('createdAt', 'totalAmount', 'status', '-createdAt', '-totalAmount', '-status').default('-createdAt')
});

// Validation middleware
const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.details.map(detail => detail.message)
      });
    }
    next();
  };
};

const validateQuery = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.query);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Query validation error',
        errors: error.details.map(detail => detail.message)
      });
    }
    req.query = value;
    next();
  };
};

const validateParams = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.params);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Parameter validation error',
        errors: error.details.map(detail => detail.message)
      });
    }
    next();
  };
};

module.exports = {
  registerSchema,
  loginSchema,
  productSchema,
  productUpdateSchema,
  cartItemSchema,
  orderStatusSchema,
  paginationSchema,
  orderQuerySchema,
  validate,
  validateQuery,
  validateParams
};

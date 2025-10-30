# Advanced E-Commerce API with Asynchronous Processing & State Management

A comprehensive, production-ready microservice backend built with Node.js, Express, and MongoDB. This API demonstrates advanced concepts including complex state management, asynchronous workflows, inventory reservation, and robust error handling.

## 🚀 Features

### Core Functionality
- **JWT Authentication & Authorization** - Secure user authentication with role-based access control
- **Complex State Management** - Order lifecycle management through multiple statuses
- **Inventory Reservation** - Atomic stock locking mechanism to prevent race conditions
- **Advanced Database Transactions** - Multi-step atomic operations across models
- **Asynchronous Processing** - Background job processing for email notifications
- **Order Timeout Management** - Automatic cancellation of unpaid orders

### API Features
- **RESTful API Design** - Clean, consistent API endpoints
- **Pagination & Filtering** - Efficient data retrieval with pagination and search
- **Input Validation** - Comprehensive request validation using Joi
- **Error Handling** - Centralized error handling with meaningful responses
- **Rate Limiting** - Protection against abuse with request rate limiting
- **Security** - Helmet.js for security headers and CORS protection

## 📋 Prerequisites

Before running this application, make sure you have the following installed:

- **Node.js** (v14 or higher)
- **MongoDB** (v4.4 or higher)
- **Redis** (v6 or higher) - for job queue processing

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd advanced-ecommerce-api
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp config.env.example config.env
   ```
   
   Update the `config.env` file with your configuration:
   ```env
   NODE_ENV=development
   PORT=3000
   MONGODB_URI=mongodb://localhost:27017/ecommerce-api
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   JWT_EXPIRE=7d
   REDIS_URL=redis://localhost:6379
   
   # Email Configuration (for async processing)
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-app-password
   ```

4. **Start Services**
   ```bash
   # Start MongoDB
   mongod
   
   # Start Redis
   redis-server
   
   # Start the application
   npm run dev
   ```

## 📚 API Documentation

### Authentication Endpoints

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

#### Login User
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

### Product Endpoints

#### Get All Products (Public)
```http
GET /api/products?page=1&limit=10&sort=price&search=laptop
```

#### Create Product (Admin Only)
```http
POST /api/products
Authorization: Bearer <admin-jwt-token>
Content-Type: application/json

{
  "name": "MacBook Pro",
  "price": 1999.99,
  "description": "High-performance laptop",
  "stock": 50
}
```

#### Update Product (Admin Only)
```http
PUT /api/products/:id
Authorization: Bearer <admin-jwt-token>
Content-Type: application/json

{
  "name": "MacBook Pro M2",
  "price": 2199.99,
  "stock": 75
}
```

#### Delete Product (Admin Only)
```http
DELETE /api/products/:id
Authorization: Bearer <admin-jwt-token>
```

### Cart Endpoints

#### Get User's Cart
```http
GET /api/cart
Authorization: Bearer <user-jwt-token>
```

#### Add Item to Cart
```http
POST /api/cart/items
Authorization: Bearer <user-jwt-token>
Content-Type: application/json

{
  "productId": "64a1b2c3d4e5f6789012345",
  "quantity": 2
}
```

#### Update Item Quantity
```http
PUT /api/cart/items/:productId
Authorization: Bearer <user-jwt-token>
Content-Type: application/json

{
  "quantity": 3
}
```

#### Remove Item from Cart
```http
DELETE /api/cart/items/:productId
Authorization: Bearer <user-jwt-token>
```

### Order Endpoints

#### Create Order (Checkout)
```http
POST /api/orders/checkout
Authorization: Bearer <user-jwt-token>
```

#### Process Payment
```http
POST /api/orders/:id/pay
Authorization: Bearer <user-jwt-token>
```

#### Get User's Orders
```http
GET /api/orders?page=1&limit=10&sort=-createdAt
Authorization: Bearer <user-jwt-token>
```

#### Get Single Order
```http
GET /api/orders/:id
Authorization: Bearer <user-jwt-token>
```

### Admin Endpoints

#### Get All Orders (Admin)
```http
GET /api/admin/orders?page=1&limit=10&status=PAID&sort=-createdAt
Authorization: Bearer <admin-jwt-token>
```

#### Update Order Status (Admin)
```http
PATCH /api/admin/orders/:id/status
Authorization: Bearer <admin-jwt-token>
Content-Type: application/json

{
  "status": "SHIPPED"
}
```

#### Get Admin Statistics
```http
GET /api/admin/stats
Authorization: Bearer <admin-jwt-token>
```

## 🔄 System Workflow

### Typical User Flow

1. **User Registration/Login** - User creates account or logs in, receives JWT token
2. **Browse Products** - User views available products with pagination and filtering
3. **Add to Cart** - User adds products to their cart with quantity validation
4. **Checkout Process** - User initiates checkout, creating order with `PENDING_PAYMENT` status
5. **Stock Reservation** - System atomically reserves stock (moves from `availableStock` to `reservedStock`)
6. **Payment Processing** - User completes mock payment within 15 minutes
7. **Order Confirmation** - On successful payment:
   - Order status updated to `PAID`
   - Reserved stock cleared and `availableStock` permanently reduced
   - Asynchronous email notification job queued
8. **Order Management** - Admin can update order status to `SHIPPED` or `DELIVERED`
9. **Timeout Handling** - Unpaid orders automatically cancelled after 15 minutes, stock released

### Order Status Flow

```
PENDING_PAYMENT → PAID → SHIPPED → DELIVERED
       ↓
   CANCELLED (timeout or manual)
```

## 🏗️ Architecture

### Database Models

- **User** - User authentication and profile information
- **Product** - Product catalog with stock management
- **Cart** - User shopping cart with items
- **Order** - Order management with status tracking
- **Payment** - Payment transaction records

### Key Features

- **Atomic Transactions** - MongoDB transactions ensure data consistency
- **Stock Management** - Three-tier stock system (total, available, reserved)
- **Asynchronous Processing** - Bull queue for background email jobs
- **Order Timeout** - Cron job automatically cancels expired orders
- **Input Validation** - Joi schemas for comprehensive request validation
- **Error Handling** - Centralized error handling with meaningful responses

## 🧪 Testing

### Using Postman Collection

1. Import the provided Postman collection
2. Set up environment variables:
   - `baseUrl`: `http://localhost:3000/api`
   - `userToken`: JWT token from user login
   - `adminToken`: JWT token from admin login

### Manual Testing Flow

1. **Create Admin User** - Register with admin role
2. **Create Products** - Add products to catalog
3. **Create Regular User** - Register regular user
4. **Add to Cart** - Add products to user's cart
5. **Checkout** - Create order from cart
6. **Payment** - Process payment for order
7. **Admin Management** - Update order status as admin

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `development` |
| `PORT` | Server port | `3000` |
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/ecommerce-api` |
| `JWT_SECRET` | JWT signing secret | Required |
| `JWT_EXPIRE` | JWT expiration time | `7d` |
| `REDIS_URL` | Redis connection string | `redis://localhost:6379` |

### Email Configuration

Configure email settings for async notifications:
- `EMAIL_HOST` - SMTP host
- `EMAIL_PORT` - SMTP port
- `EMAIL_USER` - SMTP username
- `EMAIL_PASS` - SMTP password

## 🚀 Production Deployment

### Security Considerations

1. **Change JWT Secret** - Use a strong, unique secret in production
2. **Environment Variables** - Never commit sensitive data
3. **Rate Limiting** - Adjust rate limits based on expected traffic
4. **CORS** - Configure CORS for your frontend domain
5. **HTTPS** - Use HTTPS in production
6. **Database Security** - Enable MongoDB authentication

### Performance Optimization

1. **Database Indexing** - Ensure proper indexes on frequently queried fields
2. **Connection Pooling** - Configure MongoDB connection pooling
3. **Caching** - Implement Redis caching for frequently accessed data
4. **Load Balancing** - Use load balancers for high availability

## 📝 API Response Format

### Success Response
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": {
    // Response data
  }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description",
  "errors": ["Detailed error messages"]
}
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions, please open an issue in the repository.

---

**Note**: This is a demonstration API for educational purposes. For production use, additional security measures, monitoring, and testing should be implemented.

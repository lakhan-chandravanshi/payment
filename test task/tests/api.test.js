const request = require('supertest');
const app = require('../server');

describe('E-Commerce API Tests', () => {
  let userToken;
  let adminToken;
  let productId;
  let orderId;

  describe('Authentication', () => {
    test('Should register a new user', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test User',
          email: 'test@example.com',
          password: 'password123'
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user).toBeDefined();
      expect(response.body.data.token).toBeDefined();
    });

    test('Should login user', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.token).toBeDefined();
      
      userToken = response.body.data.token;
    });

    test('Should register admin user', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Admin User',
          email: 'admin@example.com',
          password: 'admin123'
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
    });

    test('Should login admin', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@example.com',
          password: 'admin123'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.token).toBeDefined();
      
      adminToken = response.body.data.token;
    });
  });

  describe('Products', () => {
    test('Should create a product (Admin)', async () => {
      const response = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Test Product',
          price: 99.99,
          description: 'A test product',
          stock: 100
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.product).toBeDefined();
      
      productId = response.body.data.product._id;
    });

    test('Should get all products', async () => {
      const response = await request(app)
        .get('/api/products');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.products).toBeDefined();
    });
  });

  describe('Cart', () => {
    test('Should add item to cart', async () => {
      const response = await request(app)
        .post('/api/cart/items')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          productId: productId,
          quantity: 2
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.cart).toBeDefined();
    });

    test('Should get user cart', async () => {
      const response = await request(app)
        .get('/api/cart')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.cart).toBeDefined();
    });
  });

  describe('Orders', () => {
    test('Should create order from cart', async () => {
      const response = await request(app)
        .post('/api/orders/checkout')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.order).toBeDefined();
      
      orderId = response.body.data.order._id;
    });

    test('Should process payment', async () => {
      const response = await request(app)
        .post(`/api/orders/${orderId}/pay`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.payment).toBeDefined();
    });

    test('Should get user orders', async () => {
      const response = await request(app)
        .get('/api/orders')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.orders).toBeDefined();
    });
  });

  describe('Admin', () => {
    test('Should get all orders (Admin)', async () => {
      const response = await request(app)
        .get('/api/admin/orders')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.orders).toBeDefined();
    });

    test('Should update order status (Admin)', async () => {
      const response = await request(app)
        .patch(`/api/admin/orders/${orderId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: 'SHIPPED'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    test('Should get admin statistics', async () => {
      const response = await request(app)
        .get('/api/admin/stats')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
    });
  });

  describe('System', () => {
    test('Should return health check', async () => {
      const response = await request(app)
        .get('/api/health');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('E-Commerce API is running');
    });
  });
});

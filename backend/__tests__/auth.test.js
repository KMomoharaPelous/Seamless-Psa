const mongoose = require('mongoose');
const request = require('supertest');
const app = require('../server');
const User = require('../models/user.model');

// Connect to test DB before tests run
beforeAll(async () => {
    const dbURI = process.env.MONGO_URI_TEST || process.env.MONGO_URI;
    await mongoose.connect(dbURI);
});

// Clean up DB between tests
afterEach(async () => {
    await User.deleteMany();
});

// Close DB connection after tests
afterAll(async () => {
    await mongoose.connection.close();
});

// Testing suites
describe('Auth Routes', () => {
    // Test user registration
    it('should register a new user', async () => {
        const res = await request(app)
            .post('/api/users/register')
            .send({
                name: 'Test User',
                email: 'test@example.com',
                password: 'testpass123',
                role: 'Client',
            });

        expect(res.statusCode).toBe(201);
        expect(res.body).toHaveProperty('token');
        expect(res.body.user.email).toBe('test@example.com');
    });

    // Test Duplicate Registration
    it('should not allow duplicate email registration', async () => {
        await request(app)
            .post('/api/users/register')
            .send({
                name: 'Admin User',
                email: 'admin@example.com',
                password: 'adminpass123',
                role: 'Admin'
            });

        const res = await request(app)
            .post('/api/users/register')
            .send({
                name: 'Admin User 2',
                email: 'admin@example.com',
                password: 'adminpass123',
                role: 'Admin'
            });

        expect(res.statusCode).toBe(400);
        expect(res.body.message).toMatch(/User already exists/i);
    });

    // Tests User Login
    it('it should login a registered user', async () => {
        await request(app)
            .post('/api/users/register')
            .send({
                name: 'Login User',
                email: 'login@example.com',
                password: 'loginpass123',
                role: 'Admin'
            });

        const res = await request(app)
            .post('/api/users/login')
            .send({
                email: 'login@example.com',
                password: 'loginpass123'
            });
        
        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('user');
        expect(res.body.user.email).toBe('login@example.com');
    });

    // Tests invalid credentials
    it('should reject login with invalid credentials', async () => {
        const res = await request(app)
            .post('/api/users/login')
            .send({
                email: 'fake@example.com',
                password: 'wrongpass',
            });

        expect(res.statusCode).toBe(400);
        expect(res.body.message).toMatch(/invalid credentials/i);
    });
});
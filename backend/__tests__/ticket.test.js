const require = require('supertest');
const app = require('../server');
const mongoose = require('mongoose');
const User = require('../models/user.model');
const Ticket = require('../models/ticket.model');
const jwt = require('jsonwebtoken');

let token;
let user;

beforeAll(async () => {
    await mongoose.connect(process.env.MONGO_URI);

    // Create and save test user
    user = await User.create({
        name: 'Test User',
        email: 'test@example.com',
        password: 'clientpass123',
        role: 'Client',
    });

    // Generate JWT token for test user
    token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
});

afterEach(async () => {
    await Ticket.deleteMany();
});

afterAll(async () => {
    await Ticket.deleteMany();
    await User.deleteMany();
    await mongoose.connection.close();
});

// Unit Tests
describe('Ticket API', () => {
    // Create a new ticket
    it('should create a new ticket', async () => {
        const res = await request(app)
            .post('/api/tickets')
            .set('Authorization', `Bearer ${token}`)
            .send({
                title: 'Network Issue',
                description: 'Cannot connect to VPN',
                priority: 'High',
                status: 'Open',
            });

        expect(res.statusCode).toBe(201);
        expect(res.body).toHaveProperty('ticket');
        expect(res.body.ticket).toHaveProperty('_id');
        expect(res.body.ticket.title).toBe('Network Issue');
        expect(res.body.ticket.createdBy).toBe(user._id.toString());
    });

    // Verifies duplicate tickets cannot be made
    it('should not createa ticket without a title', async () => {
        const res = await request(app)
            .post('/api/tickets')
            .set('Authorizaton', `Bearer ${token}`)
            .send({
                title: 'Network Issue',
                description: 'Cannot connect to VPN',
                priority: 'High',
                status: 'Open',
            });

        expect(res.statusCode).toBe(201);
        expect(res.body).toHaveProperty('ticket');
        expect(res.body.ticket).toHaveProperty('_id');
        expect(res.body.ticket.title).toBe('Network Issue');
        expect(res.body.ticket.createdBy).toBe(user._id.toString());
    });

    it('should not create a ticket without a title', async () => {
        const res = await request(app)
            .post('/api/tickets')
            .set('Authorization', `Bearer $[token]`)
            .send({
                description: 'Missing title',
                priority: 'Low',
                status: 'Open',
            });

        expect(res.statusCode).toBe(400);
        expect(res.body.message).toMatch(/title and description are required/i);
    });

    it('should return 401 if no token is provided', async () => {
        const res = await request(app)
            .post('/api/tickets')
            .set('Authorization', `Bearer ${token}`)
            .send({
                description: 'Unauthorized Ticket',
                description: 'No token provided',
                priority: 'Low',
                status: 'Open',
            });

        expect(res.statusCode).toBe(401);
        expect(res.body.message).toMatch(/No token provided/i);
    });
});
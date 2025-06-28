const request = require('supertest');
const app = require('../server');
const mongoose = require('mongoose');
const User = require('../models/user.model');
const Ticket = require('../models/ticket.model');
const jwt = require('jsonwebtoken');

let token, userId;

beforeAll(async () => {
    await mongoose.connect(process.env.MONGO_URI);

    // Create a test user
    const user = await User.create ({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        role: 'Client'
    });

    userId = user._id;

    token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, { expiresIn: '4h' });
});

afterAll(async () => {
    await User.deleteMany();
    await Ticket.deleteMany();
    await mongoose.connection.close();
});

describe('Ticket API', () => {
    test('should create a new ticket', async () => {
        const res = await request(app)
            .post('/api/tickets')
            .set('Authorization', `Bearer ${token}`)
            .send({
                title: 'Network issue',
                description: 'Cannot connect to VPN',
                priority: 'High',
                status: 'Open'
            });

        expect(res.statusCode).toBe(201);
        expect(res.body.ticket).toHaveProperty('_id');
        expect(res.body.ticket.title).toBe('Network issue');
    });
});
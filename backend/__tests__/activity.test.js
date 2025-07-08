const mongoose = require('mongoose');
const request = require('supertest');
const app = require('../server');

const Ticket = require('../models/ticket.model');
const User = require('../models/user.model');
const ActivityLog = require('../models/activityLog.model');
const generateToken = require('../utils/generateToken');
const auth = require('../middleware/auth.middleware');

let token, user, ticket;

beforeAll(async () => {
    const dbURI = process.env.MONGO_URI_TEST || process.env.MONGO_URI;
    await mongoose.connect(dbURI);

    // Create test user and generate token
    user = await User.create({
        name: 'Test User',
        email: 'test@example.com',
        password: 'techpass123',
        role: 'technician'
    });
    token = generateToken(user);

    // Create a test ticket
    ticket = await Ticket.create({
        title: 'Test Ticket',
        description: 'This is a test ticket',
        status: 'Open',
        priority: 'Low',
        createdBy: user._id,
    });

    // Create some log entries
    await ActivityLog.create([
        {
            ticket: ticket._id,
            action: 'Created',
            performedBy: user._id,
            metadata: { note: 'Initial creation' }
        },
        {
            ticket: ticket._id,
            action: 'Updated',
            performedBy: user._id,
            metadata: { note: 'Changed title' }
        }
    ]);
});

afterEach(async () => {
    await ActivityLog.deleteMany();
    await Ticket.deleteMany();
    await User.deleteMany();
});

afterAll(async () => {
    await mongoose.connection.close();
});

// Unit tests
describe('Activity Log API', () => {
    // Retrieves Activity Logs
    test('should fetch activity logs for a ticket', async () => {
        const res = await request(app)
            .get(`/api/activity/ticket/${ticket._id}`)
            .set('Authorization', `Bearer ${token}`);

        expect(res.statusCode).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.length).toBe(2);
        expect(res.body[0]).toHaveProperty('action');
        expect(res.body[0]).toHaveProperty('performedBy');
    });
});
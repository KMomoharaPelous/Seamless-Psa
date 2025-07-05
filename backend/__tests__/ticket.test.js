const request = require('supertest');
const app = require('../server');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
const Ticket = require('../models/ticket.model');


let clientToken, adminToken, technicianToken;
let clientUser, adminUser, technicianUser;

beforeAll(async () => {
    await mongoose.connect(process.env.MONGO_URI);

    // Create and save test users
    clientUser = await User.create({
        name: 'Client User',
        email: 'client@example.com',
        password: 'clientPass123',
        role: 'Client',
    });

    adminUser = await User.create({
        name: 'Admin User',
        email: 'admin@example.com',
        password: 'adminPass123',
        role: 'Admin',
    });

    technicianUser = await User.create({
        name: 'Technician User',
        email: 'tech@example.com',
        password: 'techPass123',
        role: 'Technician',
    });

    // Generate JWT token for test users
    clientToken = jwt.sign({ _id: clientUser._id, role: clientUser.role, email: clientUser.email  }, process.env.JWT_SECRET, { expiresIn: '7d' });
    adminToken = jwt.sign({ _id: adminUser._id, role: adminUser.role, email: adminUser.email }, process.env.JWT_SECRET, { expiresIn: '7d' });
    technicianToken = jwt.sign({ _id: technicianUser._id, role: technicianUser.role, email: technicianUser.email }, process.env.JWT_SECRET, { expiresIn: '7d' });
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
    test('should create a new ticket', async () => {
        const res = await request(app)
            .post('/api/tickets')
            .set('Authorization', `Bearer ${clientToken}`)
            .send({
                title: 'Network Issue',
                description: 'Cannot connect to VPN',
                priority: 'High',
                status: 'Open',
            });

        expect(res.statusCode).toBe(201);
        expect(res.body.ticket).toHaveProperty('_id');
        expect(res.body.ticket.title).toBe('Network Issue');
    });

    // Verifies duplicate tickets cannot be made
    test('should not create a ticket without a title', async () => {
        const res = await request(app)
            .post('/api/tickets')
            .set('Authorization', `Bearer ${clientToken}`)
            .send({
                description: 'Missing title',
                priority: 'Low',
                status: 'Open',
            });

        expect(res.statusCode).toBe(400);
        expect(res.body.message).toMatch(/title and description are required/i);
    });

    // Verifies that a user cannot create a ticket without a token
    test('should return 401 if no token is provided', async () => {
        const res = await request(app)
            .post('/api/tickets')
            .send({
                description: 'Unauthorized Ticket',
                description: 'No token provided',
                priority: 'Low',
                status: 'Open',
            });

        expect(res.statusCode).toBe(401);
        expect(res.body.message).toMatch(/No token provided/i);
    });

    // Should Get all tickets created by a user
    test('should get all tickets created by a user', async () => {
        const ticket1 = await Ticket.create({
            title: 'Network Issue',
            description: 'Cannot connect to VPN',
            status: 'Open',
            createdBy: clientUser._id,
        });

       const res = await request(app)
        .get('/api/tickets')
        .set('Authorization', `Bearer ${clientToken}`);

        expect(res.statusCode).toBe(200);
        expect(res.body.tickets.length).toBeGreaterThan(0);
    });

    // Should only fetch a ticket by ID
    test('should only fetch a ticket by ID', async () => {
        const ticket = await Ticket.create({
            title: 'Printer Issue',
            description: 'Printer not printing',
            createdBy: clientUser._id,
        });

        const res = await request(app)
            .get(`/api/tickets/${ticket._id}`)
            .set('Authorization', `Bearer ${clientToken}`);

        expect(res.statusCode).toBe(200);
        expect(res.body.ticket.title).toBe('Printer Issue');
        expect(res.body.ticket.createdBy).toBe(String(clientUser._id));
    });

    // Test should update a ticket
    test('should update a ticket', async () => {
        const ticket = await Ticket.create({
            title: 'Printer Issue',
            description: 'Printer not printing',
            createdBy: clientUser._id,
        });

        const res = await request(app)
            .patch(`/api/tickets/${ticket._id}`)
            .set('Authorization', `Bearer ${clientToken}`)
            .send({
                title: 'Updated Title',
                description: 'Updated Description',
            });

        expect(res.statusCode).toBe(200);
        expect(res.body.ticket.title).toBe('Updated Title');
        expect(res.body.ticket.description).toBe('Updated Description');
    });


    // Allows admin to assign a ticket
    test('should allow an admin to assign a ticket', async () => {
        const ticket = await Ticket.create({
            title: 'Routing Issue',
            description: 'Packets Dropping',
            createdBy: clientUser._id,
        });

        const res = await request(app)
            .patch(`/api/tickets/${ticket._id}/assign`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ assignedTo: technicianUser._id });

        expect(res.statusCode).toBe(200);
        expect(res.body.ticket.assignedTo).toBe(String(technicianUser._id));
    });

    // Should prevent a client from assigning a ticket
    test('should prevent a client from assigning a ticket', async () => {
        const ticket = await Ticket.create({
            title: 'Unauthorized assignment',
            description: 'Unauthorized assignment',
            createdBy: clientUser._id,
        });

        const res = await request(app)
            .patch(`/api/tickets/${ticket._id}/assign`)
            .set('Authorization', `Bearer ${clientToken}`)
            .send({ assignedTo: technicianUser._id });

        expect(res.statusCode).toBe(403);
        expect(res.body.message).toBe('Unauthorized to assign this ticket');
    });

    // Verifies Ticket can be reopened by creator
    test('should reopen a closed ticket by the creator', async () => {
        const ticket = await Ticket.create({
            title: 'WiFi down',
            description: 'Closing now',
            status: 'Closed',
            createdBy: clientUser._id,
        });

        const res = await request(app)
            .patch(`/api/tickets/${ticket._id}/reopen`)
            .set('Authorization', `Bearer ${clientToken}`)
            .send({ status: 'ReOpened' });

        expect(res.statusCode).toBe(200);
        expect(res.body.message).toBe('Ticket reopened successfully');      
    });
});
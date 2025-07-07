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
                description: 'No token provided',
                priority: 'Low',
                status: 'Open',
            });

        expect(res.statusCode).toBe(401);
        expect(res.body.message).toMatch(/No token provided/i);
    });

    // Verifies that a user can update their own ticket
    test('should allow user to update their own ticket', async () => {
        const ticket = await Ticket.create({
            title: 'Old Title',
            description: 'Old description',
            priority: 'Low',
            status: 'Open',
            createdBy: clientUser._id,
        });

        const res = await request(app)
            .patch(`/api/tickets/${ticket._id}`)
            .set('Authorization', `Bearer ${clientToken}`)
            .send({ title: 'New Title' });

        expect(res.statusCode).toBe(200);
        expect(res.body.ticket.title).toBe('New Title');
    });

    // Verifies that an admin can update any ticket
    test('admin should update any ticket', async () => {
        const ticket = await Ticket.create({
            title: 'Email Issue',
            description: 'Cannot send emails',
            priority: 'Medium',
            status: 'Open',
            createdBy: clientUser._id,
        });

        const res = await request(app)
            .patch(`/api/tickets/${ticket._id}`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ title: 'Updated Title' });

        expect(res.statusCode).toBe(200);
        expect(res.body.ticket.title).toBe('Updated Title');
    });

    // Verifies that a technician can update an assigned ticket
    test('technician should update assigned ticket', async () => {
        const ticket = await Ticket.create({
            title: 'Router Issue',
            description: 'Not responding',
            createdBy: clientUser._id,
            assignedTo: technicianUser._id,
        });

        const res = await request(app)
            .patch(`/api/tickets/${ticket._id}`)
            .set('Authorization', `Bearer ${technicianToken}`)
            .send({ status: 'In Progress' });

        expect(res.statusCode).toBe(200);
    });

    // Verifies that a user cannot update another user's ticket
    test('user cannot update another user\'s ticket', async () => {
        const ticket = await Ticket.create({
            title: 'Unauthorized Update',
            description: 'Client trying to update admin ticket',
            createdBy: adminUser._id,
        });

        const res = await request(app)
            .patch(`/api/tickets/${ticket._id}`)
            .set('Authorization', `Bearer ${clientToken}`)
            .send({ title: 'Hacked' });

        expect(res.statusCode).toBe(403);
    });

    // Verifies that an admin can assign tickets to a technician
    test('admin can assign tickets to technician', async () => {
        const ticket = await Ticket.create({
            title: 'Firewall Issue',
            description: 'Blocked ports',
            createdBy: clientUser._id,
        });

        const res = await request(app)
            .patch(`/api/tickets/${ticket._id}/assign`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ assignedTo: technicianUser._id });

        expect(res.statusCode).toBe(200);
        expect(res.body.ticket.assignedTo).toBe(String(technicianUser._id));
    });

    // Verifies that a technician can assign a ticket to themselves
    test('technician can assign ticket to themselves', async () => {
        const ticket = await Ticket.create({
            title: 'Switch Issue',
            description: 'Ports down',
            createdBy: clientUser._id,
        });

        const res = await request(app)
            .patch(`/api/tickets/${ticket._id}/assign`)
            .set('Authorization', `Bearer ${technicianToken}`)
            .send({ assignedTo: technicianUser._id });

        expect(res.statusCode).toBe(200);
    });

    // Verifies that a technician cannot assign a ticket to another user
    test('technician cannot assign ticket to another user', async () => {
        const ticket = await Ticket.create({
            title: 'Unauthorized Assignment',
            description: 'Tech trying to assign to client',
            createdBy: clientUser._id,
        });

        const res = await request(app)
            .patch(`/api/tickets/${ticket._id}/assign`)
            .set('Authorization', `Bearer ${technicianToken}`)
            .send({ assignedTo: clientUser._id });

        expect(res.statusCode).toBe(403);
    });

    // Adin can delete any ticket
    test('admin can delete any ticket', async () => {
        const ticket = await Ticket.create({
            title: 'Delete Test',
            description: 'Admin deletes this',
            createdBy: clientUser._id,
        });

        const res = await request(app)
            .delete(`/api/tickets/${ticket._id}`)
            .set('Authorization', `Bearer ${adminToken}`);

        expect(res.statusCode).toBe(200);
    });

    // Verifies a user cannot delete another user's ticket
    test('user cannot delete another user\'s ticket', async () => {
        const ticket = await Ticket.create({
            title: 'Unauthorized Delete',
            description: 'User tries deleting admin ticket',
            createdBy: adminUser._id,
        });

        const res = await request(app)
            .delete(`/api/tickets/${ticket._id}`)
            .set('Authorization', `Bearer ${clientToken}`);

        expect(res.statusCode).toBe(403);
    });

    // Should reopen a ticket
    test('should reopen a closed ticket', async () => {
        const ticket = await Ticket.create({
            title: 'WiFi Issue',
            description: 'Was closed before',
            status: 'Closed',
            createdBy: clientUser._id,
        });

        const res = await request(app)
            .patch(`/api/tickets/${ticket._id}/reopen`)
            .set('Authorization', `Bearer ${clientToken}`);

        expect(res.statusCode).toBe(200);
        expect(res.body.message).toBe('Ticket reopened successfully');
    });
});
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
        role: 'client',
    });

    adminUser = await User.create({
        name: 'Admin User',
        email: 'admin@example.com',
        password: 'adminPass123',
        role: 'admin',
    });

    technicianUser = await User.create({
        name: 'Technician User',
        email: 'tech@example.com',
        password: 'techPass123',
        role: 'technician',
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
        expect(res.body.ticket.createdBy).toBe(String(clientUser._id));
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
                title: 'No token provided',
                description: 'No token provided',
                priority: 'Low',
                status: 'Open',
            });

        expect(res.statusCode).toBe(401);
        expect(res.body.message).toMatch(/No token provided/i);
    });

    // Test get all tickets for different user roles
    test('client should only see their own tickets', async () => {
        // Create tickets for different users
        await Ticket.create({
            title: 'Client Ticket',
            description: 'Client ticket',
            createdBy: clientUser._id,
        });

        await Ticket.create({
            title: 'Admin Ticket',
            description: 'Admin ticket',
            createdBy: adminUser._id,
        });

        const res = await request(app)
            .get('/api/tickets')
            .set('Authorization', `Bearer ${clientToken}`);

        expect(res.statusCode).toBe(200);
        expect(res.body.tickets).toHaveLength(1);
        expect(res.body.tickets[0].title).toBe('Client Ticket');
    });

    test('admin should see all tickets', async () => {
        // Create tickets for different users
        await Ticket.create({
            title: 'Client Ticket',
            description: 'Client ticket',
            createdBy: clientUser._id,
        });

        await Ticket.create({
            title: 'Admin Ticket',
            description: 'Admin ticket',
            createdBy: adminUser._id,
        });

        const res = await request(app)
            .get('/api/tickets')
            .set('Authorization', `Bearer ${adminToken}`);

        expect(res.statusCode).toBe(200);
        expect(res.body.tickets).toHaveLength(2);
    });

    test('technician should see assigned tickets and their own', async () => {
        // Create tickets
        await Ticket.create({
            title: 'Technician Own Ticket',
            description: 'Technician own ticket',
            createdBy: technicianUser._id,
        });

        await Ticket.create({
            title: 'Assigned to Technician',
            description: 'Assigned ticket',
            createdBy: clientUser._id,
            assignedTo: technicianUser._id,
        });

        await Ticket.create({
            title: 'Other Client Ticket',
            description: 'Other client ticket',
            createdBy: clientUser._id,
        });

        const res = await request(app)
            .get('/api/tickets')
            .set('Authorization', `Bearer ${technicianToken}`);

        expect(res.statusCode).toBe(200);
        expect(res.body.tickets).toHaveLength(2);
        const ticketTitles = res.body.tickets.map(t => t.title);
        expect(ticketTitles).toContain('Technician Own Ticket');
        expect(ticketTitles).toContain('Assigned to Technician');
    });

    // Test get ticket by ID
    test('should get ticket by ID if authorized', async () => {
        const ticket = await Ticket.create({
            title: 'Test Ticket',
            description: 'Test description',
            createdBy: clientUser._id,
        });

        const res = await request(app)
            .get(`/api/tickets/${ticket._id}`)
            .set('Authorization', `Bearer ${clientToken}`);

        expect(res.statusCode).toBe(200);
        expect(res.body.ticket._id).toBe(String(ticket._id));
        expect(res.body.ticket.title).toBe('Test Ticket');
    });

    test('should return 404 for non-existent ticket', async () => {
        const fakeId = new mongoose.Types.ObjectId();
        const res = await request(app)
            .get(`/api/tickets/${fakeId}`)
            .set('Authorization', `Bearer ${clientToken}`);

        expect(res.statusCode).toBe(404);
        expect(res.body.message).toBe('Ticket not found');
    });

    test('should return 400 for invalid ticket ID', async () => {
        const res = await request(app)
            .get('/api/tickets/invalid-id')
            .set('Authorization', `Bearer ${clientToken}`);

        expect(res.statusCode).toBe(400);
        expect(res.body.message).toBe('Invalid ticket ID');
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
        expect(res.body.ticket.status).toBe('In Progress');
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
        expect(res.body.message).toBe('Not authorized to update this ticket');
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
        expect(res.body.ticket.status).toBe('In Progress');
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
        expect(res.body.ticket.assignedTo).toBe(String(technicianUser._id));
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
        expect(res.body.message).toBe('Technicians can only assign tickets to themselves');
    });

    // Test assignment with invalid user ID
    test('should return 404 when assigning to non-existent user', async () => {
        const ticket = await Ticket.create({
            title: 'Test Assignment',
            description: 'Test assignment',
            createdBy: clientUser._id,
        });

        const fakeUserId = new mongoose.Types.ObjectId();
        const res = await request(app)
            .patch(`/api/tickets/${ticket._id}/assign`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ assignedTo: fakeUserId });

        expect(res.statusCode).toBe(404);
        expect(res.body.message).toBe('User to assign not found');
    });

    // Admin can delete any ticket
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
        expect(res.body.message).toBe('Ticket deleted successfully');
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
        expect(res.body.message).toBe('Not authorized to delete this ticket');
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
        expect(res.body.ticket.status).toBe('ReOpened');
    });

    // Test reopening already reopened ticket
    test('should return 400 when reopening already reopened ticket', async () => {
        const ticket = await Ticket.create({
            title: 'Already Reopened',
            description: 'Already reopened ticket',
            status: 'ReOpened',
            createdBy: clientUser._id,
        });

        const res = await request(app)
            .patch(`/api/tickets/${ticket._id}/reopen`)
            .set('Authorization', `Bearer ${clientToken}`);

        expect(res.statusCode).toBe(400);
        expect(res.body.message).toBe('Ticket is already reopened');
    });

    // Test reopening non-existent ticket
    test('should return 404 when reopening non-existent ticket', async () => {
        const fakeId = new mongoose.Types.ObjectId();
        const res = await request(app)
            .patch(`/api/tickets/${fakeId}/reopen`)
            .set('Authorization', `Bearer ${clientToken}`);

        expect(res.statusCode).toBe(404);
        expect(res.body.message).toBe('Ticket not found');
    });

    // Test ticket creation with due date
    test('should create ticket with due date', async () => {
        const dueDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now
        
        const res = await request(app)
            .post('/api/tickets')
            .set('Authorization', `Bearer ${clientToken}`)
            .send({
                title: 'Due Date Test',
                description: 'Testing due date functionality',
                dueDate: dueDate.toISOString(),
            });

        expect(res.statusCode).toBe(201);
        expect(res.body.ticket).toHaveProperty('dueDate');
        expect(new Date(res.body.ticket.dueDate).getTime()).toBe(dueDate.getTime());
    });

    // Test ticket creation with invalid due date
    test('should return 400 for invalid due date', async () => {
        const res = await request(app)
            .post('/api/tickets')
            .set('Authorization', `Bearer ${clientToken}`)
            .send({
                title: 'Invalid Date Test',
                description: 'Testing invalid date',
                dueDate: 'invalid-date',
            });

        expect(res.statusCode).toBe(400);
        expect(res.body.message).toBe('Invalid due date format');
    });
});
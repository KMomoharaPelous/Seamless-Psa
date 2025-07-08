const request = require('supertest');
const app = require('../server');
const mongoose = require('mongoose');
const Comment = require('../models/comment.model');
const Ticket = require('../models/ticket.model');
const User = require('../models/user.model');
const generateToken = require('../utils/generateToken');

describe('Comment API', () => {
    let server;
    let ticket;
    let user;
    let token;

    beforeAll(async () => {
        server = app.listen();
        await mongoose.connect(process.env.MONGO_URI);
    });

    beforeEach(async () => {
        // Create a default user (Technician)
        user = await User.create({
            name: 'Test User',
            email: 'test@example.com',
            password: 'tecPass123',
            role: 'technician',
        });

        token = generateToken(user);

        // Create a ticket to attach comments to
        ticket = await Ticket.create({
            title: 'Test Ticket',
            description: 'This is a test ticket',
            status: 'Open',
            priority: 'Low',
            createdBy: user._id,
        });
    });

    afterEach(async () => {
        await Comment.deleteMany();
        await Ticket.deleteMany();
        await User.deleteMany();
    });

    afterAll(async () => {
        await mongoose.connection.close();
        server.close();
    });

    // ✅ Create a comment
    test('should create a comment on a ticket', async () => {
        const res = await request(server)
            .post(`/api/tickets/${ticket._id}/comments`)
            .set('Authorization', `Bearer ${token}`)
            .send({ content: 'This is a test comment' });

        expect(res.statusCode).toBe(201);
        expect(res.body).toHaveProperty('content', 'This is a test comment');
        expect(res.body).toHaveProperty('ticket', ticket._id.toString());
        expect(res.body).toHaveProperty('user', user._id.toString());
    });

    // ✅ Get all comments for a ticket
    test('should get all comments for a ticket', async () => {
        await Comment.create({
            content: 'Existing comment',
            ticket: ticket._id,
            user: user._id,
        });

        const res = await request(server)
            .get(`/api/tickets/${ticket._id}/comments`)
            .set('Authorization', `Bearer ${token}`);

        expect(res.statusCode).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.length).toBeGreaterThanOrEqual(1);
        expect(res.body[0]).toHaveProperty('content', 'Existing comment');
    });

    // ✅ Update own comment
    test('should update a comment owned by the user', async () => {
        const comment = await Comment.create({
            content: 'Old content',
            ticket: ticket._id,
            user: user._id,
        });

        const res = await request(server)
            .put(`/api/comments/${comment._id}`)
            .set('Authorization', `Bearer ${token}`)
            .send({ content: 'Updated content' });

        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('content', 'Updated content');
    });

    // ✅ Delete own comment
    test('should delete a comment owned by the user', async () => {
        const comment = await Comment.create({
            content: 'Delete me',
            ticket: ticket._id,
            user: user._id,
        });

        const res = await request(server)
            .delete(`/api/comments/${comment._id}`)
            .set('Authorization', `Bearer ${token}`);

        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('message', 'Comment deleted successfully!');
    });

    // 🚫 Unauthorized access (no token)
    test('should block unauthenticated users from creating a comment', async () => {
        const res = await request(server)
            .post(`/api/tickets/${ticket._id}/comments`)
            .send({ content: 'Unauthorized comment' });

        expect(res.statusCode).toBe(401);
        expect(res.body).toHaveProperty('message');
    });

    // 🚫 Unauthorized update by another user
    test('should not allow a different user to update the comment', async () => {
        const comment = await Comment.create({
            content: 'User1 comment',
            ticket: ticket._id,
            user: user._id,
        });

        const otherUser = await User.create({
            name: 'Other User',
            email: 'other@example.com',
            password: 'pass456',
            role: 'technician',
        });
        const otherToken = generateToken(otherUser);

        const res = await request(server)
            .put(`/api/comments/${comment._id}`)
            .set('Authorization', `Bearer ${otherToken}`)
            .send({ content: 'Malicious edit' });

        expect(res.statusCode).toBe(403);
        expect(res.body).toHaveProperty('message', 'Not authorized to update this comment');
    });

    // 🚫 Unauthorized delete by another user
    test('should not allow a different user to delete the comment', async () => {
        const comment = await Comment.create({
            content: 'User1 comment',
            ticket: ticket._id,
            user: user._id,
        });

        const otherUser = await User.create({
            name: 'Other User',
            email: 'other@example.com',
            password: 'pass456',
            role: 'technician',
        });
        const otherToken = generateToken(otherUser);

        const res = await request(server)
            .delete(`/api/comments/${comment._id}`)
            .set('Authorization', `Bearer ${otherToken}`);

        expect(res.statusCode).toBe(403);
        expect(res.body).toHaveProperty('message', 'Not authorized to delete this comment');
    });

    // ❌ Invalid Comment ID on Update
    test('should return 400 for invalid comment ID on update', async () => {
        const res = await request(server)
            .put(`/api/comments/invalid-id`)
            .set('Authorization', `Bearer ${token}`)
            .send({ content: 'Invalid update' });

        expect(res.statusCode).toBe(400);
    });

    // ❌ Invalid Comment ID on Delete
    test('should return 400 for invalid comment ID on delete', async () => {
        const res = await request(server)
            .delete(`/api/comments/invalid-id`)
            .set('Authorization', `Bearer ${token}`);

        expect(res.statusCode).toBe(400);
    });
});
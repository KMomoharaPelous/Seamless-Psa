const request = require('supertest');
const app = require('../server');
const mongoose = require('mongoose');
const Comment = require('../models/comment.model');
const Ticket = require('../models/ticket.model');
const User = require('../models/user.model');
const generateToken = require('../utils/generateToken');

describe('Comment API', () => {
    let server;
    let user;
    let token;
    let ticket;

    beforeAll(async () => {
        server = app.listen();
        await mongoose.connect(process.env.MONGO_URI);
    });

    beforeEach(async () => {
        user = await User.create({
            name: 'Test User',
            email: 'test@example.com',
            password: 'tecPass123',
            role: 'Technician',
        });

        token = generateToken(user);

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

    // ✅ Create a Comment
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

    // ✅ Get comments for a ticket
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

    // ✅ Update a comment
    test('should update a comment', async () => {
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

    // ✅ Delete a comment
    test('should delete a comment', async () => {
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

    // 🚫 Unauthorized Access
    test('should block unauthenticated users', async () => {
        const res = await request(server)
            .post(`/api/tickets/${ticket._id}/comments`)
            .send({ content: 'Unauthorized comment' });

        expect(res.statusCode).toBe(401);
        expect(res.body).toHaveProperty('message');
    });

    // 🚫 Invalid Comment Update by Wrong User
    test('should not allow another user to update the comment', async () => {
        const comment = await Comment.create({
            content: 'User1 comment',
            ticket: ticket._id,
            user: user._id,
        });

        // Create a different user
        const otherUser = await User.create({
            name: 'Other User',
            email: 'other@example.com',
            password: 'pass456',
            role: 'Technician',
        });
        const otherToken = generateToken(otherUser);

        const res = await request(server)
            .put(`/api/comments/${comment._id}`)
            .set('Authorization', `Bearer ${otherToken}`)
            .send({ content: 'Malicious edit' });

        expect(res.statusCode).toBe(403);
        expect(res.body).toHaveProperty('message', 'Not authorized to update this comment');
    });
});

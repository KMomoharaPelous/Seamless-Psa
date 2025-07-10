const request = require('supertest');
const app = require('../server');
const mongoose = require('mongoose');
const User = require('../models/user.model');
const ActivityLog = require('../models/activityLog.model');
const generateToken = require('../utils/generateToken');

let clientToken, adminToken, technicianToken;
let clientUser, adminUser, technicianUser;

beforeAll(async () => {
    await mongoose.connect(process.env.MONGO_URI);
});

beforeEach(async () => {
    // Create test users
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

    // Generate JWT tokens for test users
    clientToken = generateToken(clientUser);
    adminToken = generateToken(adminUser);
    technicianToken = generateToken(technicianUser);
});

afterEach(async () => {
    await User.deleteMany();
    await ActivityLog.deleteMany();
});

afterAll(async () => {
    await User.deleteMany();
    await ActivityLog.deleteMany();
    await mongoose.connection.close();
});

// Unit Tests
describe('User Management API', () => {
    describe('GET /api/users', () => {
        // ✅ Admin can get all users
        test('admin should get all users', async () => {
            const res = await request(app)
                .get('/api/users')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.statusCode).toBe(200);
            expect(res.body.users).toHaveLength(3);
            expect(res.body.count).toBe(3);
            
            // Verify all user types are included
            const userRoles = res.body.users.map(user => user.role);
            expect(userRoles).toContain('admin');
            expect(userRoles).toContain('client');
            expect(userRoles).toContain('technician');
        });

        // 🚫 Non-admin users cannot access user list
        test('client should not access user list', async () => {
            const res = await request(app)
                .get('/api/users')
                .set('Authorization', `Bearer ${clientToken}`);

            expect(res.statusCode).toBe(403);
            expect(res.body.message).toMatch(/Forbidden/i);
        });

        test('technician should not access user list', async () => {
            const res = await request(app)
                .get('/api/users')
                .set('Authorization', `Bearer ${technicianToken}`);

            expect(res.statusCode).toBe(403);
            expect(res.body.message).toMatch(/Forbidden/i);
        });

        // 🚫 Unauthenticated access
        test('should return 401 without token', async () => {
            const res = await request(app)
                .get('/api/users');

            expect(res.statusCode).toBe(401);
            expect(res.body.message).toMatch(/No token provided/i);
        });
    });

    describe('GET /api/users/:id', () => {
        // ✅ Admin can get user by ID
        test('admin should get client user by ID', async () => {
            const res = await request(app)
                .get(`/api/users/${clientUser._id}`)
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.statusCode).toBe(200);
            expect(res.body.user._id).toBe(clientUser._id.toString());
            expect(res.body.user.email).toBe('client@example.com');
            expect(res.body.user.role).toBe('client');
        });

        test('admin should get technician user by ID', async () => {
            const res = await request(app)
                .get(`/api/users/${technicianUser._id}`)
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.statusCode).toBe(200);
            expect(res.body.user._id).toBe(technicianUser._id.toString());
            expect(res.body.user.email).toBe('tech@example.com');
            expect(res.body.user.role).toBe('technician');
        });

        // 🚫 Non-admin users cannot access user details
        test('client should not get user by ID', async () => {
            const res = await request(app)
                .get(`/api/users/${technicianUser._id}`)
                .set('Authorization', `Bearer ${clientToken}`);

            expect(res.statusCode).toBe(403);
        });

        test('technician should not get user by ID', async () => {
            const res = await request(app)
                .get(`/api/users/${clientUser._id}`)
                .set('Authorization', `Bearer ${technicianToken}`);

            expect(res.statusCode).toBe(403);
        });

        // ❌ Invalid user ID
        test('should return 404 for non-existent user', async () => {
            const fakeId = new mongoose.Types.ObjectId();
            const res = await request(app)
                .get(`/api/users/${fakeId}`)
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.statusCode).toBe(404);
            expect(res.body.message).toBe('User not found');
        });

        test('should return 400 for invalid user ID format', async () => {
            const res = await request(app)
                .get('/api/users/invalid-id')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.statusCode).toBe(400);
            expect(res.body.message).toBe('Invalid user ID');
        });
    });

    describe('PATCH /api/users/:id/role', () => {
        // ✅ Admin can update user roles and create activity logs
        test('admin should update client to technician and create activity log', async () => {
            const res = await request(app)
                .patch(`/api/users/${clientUser._id}/role`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ role: 'technician' });

            expect(res.statusCode).toBe(200);
            expect(res.body.user.role).toBe('technician');
            expect(res.body.message).toBe('User role updated successfully');

            // Verify activity log was created
            const activityLog = await ActivityLog.findOne({
                action: 'role updated',
                performedBy: adminUser._id
            });

            expect(activityLog).toBeTruthy();
            expect(activityLog.metadata.userId.toString()).toBe(clientUser._id.toString());
            expect(activityLog.metadata.userName).toBe('Client User');
            expect(activityLog.metadata.oldRole).toBe('client');
            expect(activityLog.metadata.newRole).toBe('technician');
        });

        test('admin should update technician to client and create activity log', async () => {
            const res = await request(app)
                .patch(`/api/users/${technicianUser._id}/role`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ role: 'client' });

            expect(res.statusCode).toBe(200);
            expect(res.body.user.role).toBe('client');

            // Verify activity log was created
            const activityLog = await ActivityLog.findOne({
                action: 'role updated',
                performedBy: adminUser._id
            });

            expect(activityLog).toBeTruthy();
            expect(activityLog.metadata.userId.toString()).toBe(technicianUser._id.toString());
            expect(activityLog.metadata.userName).toBe('Technician User');
            expect(activityLog.metadata.oldRole).toBe('technician');
            expect(activityLog.metadata.newRole).toBe('client');
        });

        test('admin should update client to admin and create activity log', async () => {
            const res = await request(app)
                .patch(`/api/users/${clientUser._id}/role`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ role: 'admin' });

            expect(res.statusCode).toBe(200);
            expect(res.body.user.role).toBe('admin');

            // Verify activity log was created
            const activityLog = await ActivityLog.findOne({
                action: 'role updated',
                performedBy: adminUser._id
            });

            expect(activityLog).toBeTruthy();
            expect(activityLog.metadata.oldRole).toBe('client');
            expect(activityLog.metadata.newRole).toBe('admin');
        });

        // 🚫 Self-protection: Admin cannot change their own role
        test('should not allow admin to change their own role', async () => {
            const res = await request(app)
                .patch(`/api/users/${adminUser._id}/role`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ role: 'client' });

            expect(res.statusCode).toBe(400);
            expect(res.body.message).toBe('Cannot change your own role');

            // Verify no activity log was created
            const activityLog = await ActivityLog.findOne({
                action: 'role updated',
                performedBy: adminUser._id
            });
            expect(activityLog).toBeNull();
        });

        // 🚫 Non-admin users cannot update roles
        test('client should not update user roles', async () => {
            const res = await request(app)
                .patch(`/api/users/${technicianUser._id}/role`)
                .set('Authorization', `Bearer ${clientToken}`)
                .send({ role: 'admin' });

            expect(res.statusCode).toBe(403);
            expect(res.body.message).toMatch(/Forbidden/i);
        });

        test('technician should not update user roles', async () => {
            const res = await request(app)
                .patch(`/api/users/${clientUser._id}/role`)
                .set('Authorization', `Bearer ${technicianToken}`)
                .send({ role: 'admin' });

            expect(res.statusCode).toBe(403);
            expect(res.body.message).toMatch(/Forbidden/i);
        });

        // ❌ Invalid role validation
        test('should reject invalid role', async () => {
            const res = await request(app)
                .patch(`/api/users/${clientUser._id}/role`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ role: 'invalid_role' });

            expect(res.statusCode).toBe(400);
            expect(res.body.message).toMatch(/Valid role is required/);
        });

        test('should reject empty role', async () => {
            const res = await request(app)
                .patch(`/api/users/${clientUser._id}/role`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ role: '' });

            expect(res.statusCode).toBe(400);
            expect(res.body.message).toMatch(/Valid role is required/);
        });

        // ❌ Invalid user ID
        test('should return 404 for non-existent user on role update', async () => {
            const fakeId = new mongoose.Types.ObjectId();
            const res = await request(app)
                .patch(`/api/users/${fakeId}/role`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ role: 'technician' });

            expect(res.statusCode).toBe(404);
            expect(res.body.message).toBe('User not found');
        });
    });

    describe('DELETE /api/users/:id', () => {
        // ✅ Admin can delete users and create activity logs
        test('admin should delete client user and create activity log', async () => {
            const res = await request(app)
                .delete(`/api/users/${clientUser._id}`)
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.statusCode).toBe(200);
            expect(res.body.message).toBe('User deleted successfully');

            // Verify user was actually deleted
            const deletedUser = await User.findById(clientUser._id);
            expect(deletedUser).toBeNull();

            // Verify activity log was created
            const activityLog = await ActivityLog.findOne({
                action: 'user deleted',
                performedBy: adminUser._id
            });

            expect(activityLog).toBeTruthy();
            expect(activityLog.metadata.userId.toString()).toBe(clientUser._id.toString());
            expect(activityLog.metadata.userName).toBe('Client User');
            expect(activityLog.metadata.userEmail).toBe('client@example.com');
            expect(activityLog.metadata.userRole).toBe('client');
        });

        test('admin should delete technician user and create activity log', async () => {
            const res = await request(app)
                .delete(`/api/users/${technicianUser._id}`)
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.statusCode).toBe(200);
            expect(res.body.message).toBe('User deleted successfully');

            // Verify user was actually deleted
            const deletedUser = await User.findById(technicianUser._id);
            expect(deletedUser).toBeNull();

            // Verify activity log was created
            const activityLog = await ActivityLog.findOne({
                action: 'user deleted',
                performedBy: adminUser._id
            });

            expect(activityLog).toBeTruthy();
            expect(activityLog.metadata.userId.toString()).toBe(technicianUser._id.toString());
            expect(activityLog.metadata.userName).toBe('Technician User');
            expect(activityLog.metadata.userEmail).toBe('tech@example.com');
            expect(activityLog.metadata.userRole).toBe('technician');
        });

        // 🚫 Self-protection: Admin cannot delete themselves
        test('should not allow admin to delete themselves', async () => {
            const res = await request(app)
                .delete(`/api/users/${adminUser._id}`)
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.statusCode).toBe(400);
            expect(res.body.message).toBe('Cannot delete your own account');

            // Verify no activity log was created
            const activityLog = await ActivityLog.findOne({
                action: 'user deleted',
                performedBy: adminUser._id
            });
            expect(activityLog).toBeNull();
        });

        // 🚫 Non-admin users cannot delete users
        test('client should not delete users', async () => {
            const res = await request(app)
                .delete(`/api/users/${technicianUser._id}`)
                .set('Authorization', `Bearer ${clientToken}`);

            expect(res.statusCode).toBe(403);
            expect(res.body.message).toMatch(/Forbidden/i);
        });

        test('technician should not delete users', async () => {
            const res = await request(app)
                .delete(`/api/users/${clientUser._id}`)
                .set('Authorization', `Bearer ${technicianToken}`);

            expect(res.statusCode).toBe(403);
            expect(res.body.message).toMatch(/Forbidden/i);
        });

        // ❌ Invalid user ID
        test('should return 404 for non-existent user on delete', async () => {
            const fakeId = new mongoose.Types.ObjectId();
            const res = await request(app)
                .delete(`/api/users/${fakeId}`)
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.statusCode).toBe(404);
            expect(res.body.message).toBe('User not found');
        });

        test('should return 400 for invalid user ID format on delete', async () => {
            const res = await request(app)
                .delete('/api/users/invalid-id')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.statusCode).toBe(400);
            expect(res.body.message).toBe('Invalid user ID');
        });
    });

    describe('GET /api/users/profile', () => {
        // ✅ Users can get their own profile
        test('client should get their own profile', async () => {
            const res = await request(app)
                .get('/api/users/profile')
                .set('Authorization', `Bearer ${clientToken}`);

            expect(res.statusCode).toBe(200);
            expect(res.body.user._id).toBe(clientUser._id.toString());
            expect(res.body.user.email).toBe('client@example.com');
            expect(res.body.user.role).toBe('client');
            expect(res.body.user.name).toBe('Client User');
        });

        test('technician should get their own profile', async () => {
            const res = await request(app)
                .get('/api/users/profile')
                .set('Authorization', `Bearer ${technicianToken}`);

            expect(res.statusCode).toBe(200);
            expect(res.body.user._id).toBe(technicianUser._id.toString());
            expect(res.body.user.email).toBe('tech@example.com');
            expect(res.body.user.role).toBe('technician');
            expect(res.body.user.name).toBe('Technician User');
        });

        test('admin should get their own profile', async () => {
            const res = await request(app)
                .get('/api/users/profile')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.statusCode).toBe(200);
            expect(res.body.user._id).toBe(adminUser._id.toString());
            expect(res.body.user.email).toBe('admin@example.com');
            expect(res.body.user.role).toBe('admin');
            expect(res.body.user.name).toBe('Admin User');
        });

        // 🚫 Unauthenticated access
        test('should return 401 without token', async () => {
            const res = await request(app)
                .get('/api/users/profile');

            expect(res.statusCode).toBe(401);
            expect(res.body.message).toMatch(/No token provided/i);
        });

        test('should return 401 with invalid token', async () => {
            const res = await request(app)
                .get('/api/users/profile')
                .set('Authorization', 'Bearer invalid-token');

            expect(res.statusCode).toBe(401);
            expect(res.body.message).toMatch(/Token is invalid/i);
        });
    });
}); 
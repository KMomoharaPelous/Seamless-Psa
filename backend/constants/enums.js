/**
 * Application Enum Constants
 * Centralized enum values for consistent usage across the application
 */

// User Roles
const USER_ROLES = {
    ADMIN: 'admin',
    TECHNICIAN: 'technician',
    CLIENT: 'client'
};

// Ticket Priorities
const TICKET_PRIORITIES = {
    LOW: 'low',
    MEDIUM: 'medium',
    HIGH: 'high'
};

// Ticket Statuses
const TICKET_STATUSES = {
    OPEN: 'open',
    IN_PROGRESS: 'in progress',
    CLOSED: 'closed',
    REOPENED: 'reopened'
};

// Activity Actions
const ACTIVITY_ACTIONS = {
    CREATED_TICKET: 'created ticket',
    UPDATED_TICKET: 'updated ticket',
    DELETED_TICKET: 'deleted ticket',
    ASSIGNED_TICKET: 'assigned ticket',
    REOPENED_TICKET: 'reopened ticket',
    COMMENT_ADDED: 'comment added',
    COMMENT_EDITED: 'comment edited',
    COMMENT_DELETED: 'comment deleted',
    ROLE_UPDATED: 'role updated',
    USER_CREATED: 'user created',
    USER_DELETED: 'user deleted'
};

// Arrays for validation
const USER_ROLE_VALUES = Object.values(USER_ROLES);
const TICKET_PRIORITY_VALUES = Object.values(TICKET_PRIORITIES);
const TICKET_STATUS_VALUES = Object.values(TICKET_STATUSES);
const ACTIVITY_ACTION_VALUES = Object.values(ACTIVITY_ACTIONS);

module.exports = {
    USER_ROLES,
    TICKET_PRIORITIES,
    TICKET_STATUSES,
    ACTIVITY_ACTIONS,
    USER_ROLE_VALUES,
    TICKET_PRIORITY_VALUES,
    TICKET_STATUS_VALUES,
    ACTIVITY_ACTION_VALUES
}; 
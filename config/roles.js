/**
 * Role-based access control configuration
 * 
 * SUPER_ADMIN: Can manage all gyms, users, and admins across the platform
 * ADMIN: Can manage gyms and users within their assigned gym(s)
 * GYM: Can view and manage registered users and point transactions for their gym
 * USER: Can view available gyms, their point balance, and redeem points
 */

const ROLES = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  GYM: 'gym',
  USER: 'user'
};

// Role hierarchy (higher roles have access to lower role permissions)
const ROLE_HIERARCHY = {
  [ROLES.SUPER_ADMIN]: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.GYM, ROLES.USER],
  [ROLES.ADMIN]: [ROLES.ADMIN, ROLES.GYM, ROLES.USER],
  [ROLES.GYM]: [ROLES.GYM, ROLES.USER],
  [ROLES.USER]: [ROLES.USER]
};

// Permission matrix for specific operations
const PERMISSIONS = {
  CREATE_GYM: [ROLES.SUPER_ADMIN, ROLES.ADMIN],
  UPDATE_GYM: [ROLES.SUPER_ADMIN, ROLES.ADMIN],
  DELETE_GYM: [ROLES.SUPER_ADMIN],
  
  CREATE_USER: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.GYM],
  UPDATE_USER: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.GYM],
  DELETE_USER: [ROLES.SUPER_ADMIN, ROLES.ADMIN],
  
  MANAGE_ADMINS: [ROLES.SUPER_ADMIN],
  ASSIGN_GYM: [ROLES.SUPER_ADMIN, ROLES.ADMIN],
  
  VIEW_ALL_TRANSACTIONS: [ROLES.SUPER_ADMIN, ROLES.ADMIN],
  CREATE_TRANSACTION: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.GYM],
  
  GENERATE_QR: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.GYM]
};

module.exports = {
  ROLES,
  ROLE_HIERARCHY,
  PERMISSIONS
};

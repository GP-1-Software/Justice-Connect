import { createClient } from "@supabase/supabase-js";

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Middleware to verify if user has required role
 * @param {Array|String} allowedRoles - Array of allowed roles or single role string
 * @returns {Function} Express middleware function
 */
export const requireRole = (allowedRoles) => {
  return async (req, res, next) => {
    try {
      // Get id_number and current_role from request body or headers
      const id_number =
        req.body.id_number ||
        req.headers["x-user-id"] ||
        req.query.id_number;
      const current_role =
        req.body.current_role ||
        req.headers["x-user-role"] ||
        req.query.current_role;

      if (!id_number || !current_role) {
        return res.status(401).json({
          success: false,
          message: "Authentication required: id_number and current_role needed",
        });
      }

      // Convert allowedRoles to array if it's a string
      const rolesArray = Array.isArray(allowedRoles)
        ? allowedRoles
        : [allowedRoles];

      // Check if user has the required role
      const { data: hasRole, error } = await supabase.rpc("has_role", {
        p_id_number: id_number,
        p_role_type: current_role,
      });

      if (error) {
        console.error("Error checking role:", error);
        return res.status(500).json({
          success: false,
          message: "Failed to verify role",
          error: error.message,
        });
      }

      if (!hasRole) {
        return res.status(403).json({
          success: false,
          message: "User does not have this role",
        });
      }

      // Check if current role is in allowed roles
      if (!rolesArray.includes(current_role)) {
        return res.status(403).json({
          success: false,
          message: `Access denied. Required role: ${rolesArray.join(" or ")}`,
          current_role: current_role,
        });
      }

      // Attach user info to request for use in route handlers
      req.user = {
        id_number,
        current_role,
      };

      next();
    } catch (error) {
      console.error("Role middleware error:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error.message,
      });
    }
  };
};

/**
 * Middleware to verify admin or super_admin role
 */
export const requireAdmin = requireRole(["admin", "super_admin"]);

/**
 * Middleware to verify super_admin role only
 */
export const requireSuperAdmin = requireRole("super_admin");

/**
 * Middleware to verify lawyer role
 */
export const requireLawyer = requireRole("lawyer");

/**
 * Middleware to verify client role
 */
export const requireClient = requireRole("client");

/**
 * Middleware to verify any authenticated user
 */
export const requireAuth = async (req, res, next) => {
  try {
    const id_number =
      req.body.id_number || req.headers["x-user-id"] || req.query.id_number;

    if (!id_number) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    // Get user roles to verify they exist
    const { data: roles, error } = await supabase.rpc("get_user_roles", {
      p_id_number: id_number,
    });

    if (error || !roles || roles.length === 0) {
      return res.status(401).json({
        success: false,
        message: "User not found or has no active roles",
      });
    }

    // Attach user info to request
    req.user = {
      id_number,
      available_roles: roles.map((r) => r.role_type),
    };

    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

/**
 * Middleware to get user's full role information
 */
export const attachUserRoles = async (req, res, next) => {
  try {
    const id_number =
      req.body.id_number || req.headers["x-user-id"] || req.query.id_number;

    if (!id_number) {
      return next(); // Continue without attaching roles
    }

    // Get all user roles
    const { data: roles, error } = await supabase.rpc("get_user_roles", {
      p_id_number: id_number,
    });

    if (!error && roles) {
      req.userRoles = roles;
    }

    next();
  } catch (error) {
    console.error("Attach roles middleware error:", error);
    next(); // Continue even if there's an error
  }
};

export default {
  requireRole,
  requireAdmin,
  requireSuperAdmin,
  requireLawyer,
  requireClient,
  requireAuth,
  attachUserRoles,
};

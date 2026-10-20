const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { normalizeIndianPhone } = require('../utils/phoneValidator');
const { JWT_SECRET } = require('../middleware/auth');

const signUserToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role, phone: user.phone },
    JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

// Customer Registration
const register = async (req, res) => {
  try {
    const { name, phone, email, password, smsConsent } = req.body;

    if (!name || !phone || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, mobile number, and password are required.'
      });
    }

    const normalizedPhone = normalizeIndianPhone(phone);
    if (!normalizedPhone) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid 10-digit Indian mobile number.'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long.'
      });
    }

    // Check existing phone
    const existingPhone = await User.findOne({ phone: normalizedPhone });
    if (existingPhone) {
      return res.status(409).json({
        success: false,
        message: 'A user with this mobile number is already registered.'
      });
    }

    // Check existing email if provided
    if (email && email.trim() !== '') {
      const existingEmail = await User.findOne({ email: email.trim().toLowerCase() });
      if (existingEmail) {
        return res.status(409).json({
          success: false,
          message: 'A user with this email address is already registered.'
        });
      }
    }

    const newUser = await User.create({
      name: name.trim(),
      phone: normalizedPhone,
      email: email ? email.trim().toLowerCase() : undefined,
      password,
      role: 'customer',
      smsConsent: smsConsent !== undefined ? Boolean(smsConsent) : true,
      smsConsentUpdatedAt: new Date()
    });

    const token = signUserToken(newUser);

    return res.status(201).json({
      success: true,
      message: 'Account registered successfully.',
      token,
      user: newUser
    });
  } catch (error) {
    console.error('[Auth Controller] Register error:', error.message);
    return res.status(500).json({
      success: false,
      message: error.message || 'Registration failed.'
    });
  }
};

// Customer Login
const login = async (req, res) => {
  try {
    const { identifier, phone, password } = req.body;
    const loginId = identifier || phone;

    if (!loginId || !password) {
      return res.status(400).json({
        success: false,
        message: 'Mobile number/email and password are required.'
      });
    }

    // Find by phone or email
    const normalized = normalizeIndianPhone(loginId);
    let user = null;

    if (normalized) {
      user = await User.findOne({ phone: normalized });
    }

    if (!user && loginId.includes('@')) {
      user = await User.findOne({ email: loginId.trim().toLowerCase() });
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. Please verify your mobile number/email.'
      });
    }

    if (user.status === 'suspended') {
      return res.status(403).json({
        success: false,
        message: 'This account has been suspended by an administrator.'
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. Password incorrect.'
      });
    }

    const token = signUserToken(user);

    return res.json({
      success: true,
      message: 'Login successful.',
      token,
      user
    });
  } catch (error) {
    console.error('[Auth Controller] Login error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Login failed due to an internal server error.'
    });
  }
};

// Admin Login
const adminLogin = async (req, res) => {
  try {
    const { email, phone, password } = req.body;
    const identifier = email || phone;

    if (!identifier || !password) {
      return res.status(400).json({
        success: false,
        message: 'Admin identifier and password are required.'
      });
    }

    let admin = null;
    if (identifier.includes('@')) {
      admin = await User.findOne({ email: identifier.trim().toLowerCase() });
    } else {
      const normPhone = normalizeIndianPhone(identifier);
      if (normPhone) {
        admin = await User.findOne({ phone: normPhone });
      }
    }

    if (!admin) {
      return res.status(401).json({
        success: false,
        message: 'Admin account not found or invalid credentials.'
      });
    }

    if (admin.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied: Administrative privileges required.'
      });
    }

    if (admin.status === 'suspended') {
      return res.status(403).json({
        success: false,
        message: 'This administrator account is suspended.'
      });
    }

    const isMatch = await admin.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. Password incorrect.'
      });
    }

    const token = signUserToken(admin);

    return res.json({
      success: true,
      message: 'Admin authentication successful.',
      token,
      user: admin
    });
  } catch (error) {
    console.error('[Auth Controller] Admin Login error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Admin login failed due to an internal server error.'
    });
  }
};

// Get Current User Profile
const getProfile = async (req, res) => {
  return res.json({
    success: true,
    user: req.user
  });
};

// Update Profile & Preferences
const updateProfile = async (req, res) => {
  try {
    const { name, email, smsConsent, reminderPreferences } = req.body;
    const user = req.user;

    if (name && name.trim()) {
      user.name = name.trim();
    }

    if (email !== undefined) {
      const cleanEmail = email ? email.trim().toLowerCase() : null;
      if (cleanEmail && cleanEmail !== user.email) {
        const duplicate = await User.findOne({ email: cleanEmail, _id: { $ne: user._id } });
        if (duplicate) {
          return res.status(409).json({
            success: false,
            message: 'Email address already associated with another account.'
          });
        }
        user.email = cleanEmail;
      } else if (!cleanEmail) {
        user.email = undefined;
      }
    }

    if (smsConsent !== undefined) {
      const newConsent = Boolean(smsConsent);
      if (user.smsConsent !== newConsent) {
        user.smsConsent = newConsent;
        user.smsConsentUpdatedAt = new Date();
      }
    }

    if (reminderPreferences && typeof reminderPreferences === 'object') {
      user.reminderPreferences = {
        daysBefore30: reminderPreferences.daysBefore30 !== undefined ? Boolean(reminderPreferences.daysBefore30) : user.reminderPreferences.daysBefore30,
        daysBefore7: reminderPreferences.daysBefore7 !== undefined ? Boolean(reminderPreferences.daysBefore7) : user.reminderPreferences.daysBefore7,
        daysBefore1: reminderPreferences.daysBefore1 !== undefined ? Boolean(reminderPreferences.daysBefore1) : user.reminderPreferences.daysBefore1,
        onExpiryDay: reminderPreferences.onExpiryDay !== undefined ? Boolean(reminderPreferences.onExpiryDay) : user.reminderPreferences.onExpiryDay
      };
    }

    await user.save();

    return res.json({
      success: true,
      message: 'Profile and preferences updated successfully.',
      user
    });
  } catch (error) {
    console.error('[Auth Controller] Update profile error:', error.message);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to update profile.'
    });
  }
};

// Change Password
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required.'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters.'
      });
    }

    const user = await User.findById(req.user._id);
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect.'
      });
    }

    user.password = newPassword;
    await user.save();

    return res.json({
      success: true,
      message: 'Password changed successfully.'
    });
  } catch (error) {
    console.error('[Auth Controller] Change password error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to change password.'
    });
  }
};

module.exports = {
  register,
  login,
  adminLogin,
  getProfile,
  updateProfile,
  changePassword
};

import userModel from "../models/userModel.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

// Email validation function
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    // Check for missing fields
    if (!name || !email || !password) {
      return res.status(400).json({ message: "Missing details. Name, email and password are required" });
    }
    
    // Validate email format
    if (!isValidEmail(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }
    
    // Validate password length
    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters long" });
    }
    
    // Check if user already exists
    const existingUser = await userModel.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: "User with this email already exists" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const userData = {
      name,
      email,
      password: hashedPassword,
      creditBalance: 20 // Explicitly set initial credits
    };

    const newUser = new userModel(userData);
    const user = await newUser.save();

    console.log("New user created with credits:", user.creditBalance);

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({ 
      token, 
      user: { 
        id: user._id, 
        name: user.name, 
        email: user.email,
        credits: user.creditBalance // Make sure credits are returned
      } 
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Validate fields
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }
    
    // Validate email format
    if (!isValidEmail(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }
    
    const user = await userModel.findOne({ email });

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (isMatch) {
      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
      res.status(200).json({
        token,
        user: { 
          id: user._id, 
          name: user.name, 
          email: user.email,
          credits: user.creditBalance 
        }
      });
    } else {
      return res.status(401).json({ message: "Invalid credentials" });
    }
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const verifyToken = async (req, res) => {
  try {
    // The auth middleware has already verified the token
    // and added userId to the request object
    const userId = req.userId;
    
    const user = await userModel.findById(userId).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Fix for zero credit bug - ensure credits are properly set
    if (user.creditBalance === undefined || user.creditBalance === null) {
      // Set default credits if not set
      user.creditBalance = 20;
      await user.save();
      console.log(`Fixed credits for user ${user._id}, set to ${user.creditBalance}`);
    }
    
    res.status(200).json({ 
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        credits: user.creditBalance // Ensure credits are included
      }
    });
  } catch (error) {
    console.error("Token verification error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getUserProfile = async (req, res) => {
  try {
    const userId = req.userId;
    
    const user = await userModel.findById(userId).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    res.status(200).json({ 
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        credits: user.creditBalance
      }
    });
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const userCredits = async (req, res) => {
  try {
    const userId = req.userId;
    const user = await userModel.findById(userId);
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    res.status(200).json({
      credits: user.creditBalance
    });
  } catch (error) {
    console.error("Get credits error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export { registerUser, loginUser, verifyToken, getUserProfile, userCredits };

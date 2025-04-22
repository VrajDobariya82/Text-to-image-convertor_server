import axios from "axios";
import userModel from "../models/userModel.js";
import FormData from "form-data";
import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { CLIENT_RENEG_LIMIT } from "tls";

// Import the API key once at the module level
const API_KEY = process.env.CLIPDROP_API || "";
console.log(API_KEY)

// Simple function to check if an API key is valid format
const isValidApiKey = (key) => {
  return key && key.length > 20 && !key.includes(" ") && !key.includes("\n");
};

// Function to optimize response size
const optimizeResponseSize = (buffer) => {
  // Convert buffer to base64 string
  const base64 = buffer.toString('base64');
  
  // For very large images, we might want to compress them in the future
  // This is where you would add compression logic if needed
  
  return base64;
};

const generateImage = async (req, res) => {
  try {
    const { prompt } = req.body;
    const userId = req.userId; // From auth middleware

    console.log("Image generation request received:", { prompt, userId });

    if (!prompt) {
      return res.status(400).json({ message: "Prompt is required" });
    }

    const user = await userModel.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Fix for credits showing as undefined
    if (user.creditBalance === undefined || user.creditBalance === null) {
      user.creditBalance = 20;
      await user.save();
      console.log(`Fixed credits for user ${user._id}, set to ${user.creditBalance}`);
    }

    if (user.creditBalance <= 0) {
      return res.status(403).json({
        message: "Insufficient credits",
        creditIssue: true,
        credits: user.creditBalance,
      });
    }

    // Always deduct the credit first, regardless of successful image generation
    const updatedUser = await userModel.findByIdAndUpdate(
      userId,
      { $inc: { creditBalance: -1 } },
      { new: true }
    );
    
    console.log(`User ${userId} credits updated: ${updatedUser.creditBalance}`);

    // Check if API key is valid
    if (!isValidApiKey(API_KEY)) {
      console.error("Invalid ClipDrop API key format:", API_KEY?.substring(0, 5) + "...");
      return generateMockImage(prompt, updatedUser, res);
    }

    try {
      console.log("Using ClipDrop API with key:", API_KEY.substring(0, 5) + "...");
      
      // Create form data with the prompt
      const formData = new FormData();
      formData.append("prompt", prompt);
      
      // Set a timeout for the API request
      const axiosConfig = {
        method: "post",
        url: "https://clipdrop-api.co/text-to-image/v1",
        data: formData,
        headers: {
          "x-api-key": API_KEY,
          ...formData.getHeaders()
        },
        responseType: "arraybuffer",
        timeout: 30000 // 30 seconds timeout
      };
      
      // Make the request to the ClipDrop API
      const response = await axios(axiosConfig);
      
      console.log("ClipDrop API response status:", response.status);
      console.log("Response size:", response.data.length, "bytes");
      
      // Check if we got a valid response
      if (!response.data || response.data.length < 100) {
        throw new Error("Empty or invalid response from ClipDrop API");
      }
      
      // Optimize the response size
      const optimizedBase64 = optimizeResponseSize(response.data);
      
      // Convert to data URL format
      const imageUrl = `data:image/png;base64,${optimizedBase64}`;
      
      // Calculate response size
      const estimatedSize = imageUrl.length * 2 / 1024 / 1024; // Approximate MB
      console.log(`Sending response with estimated size: ${estimatedSize.toFixed(2)}MB`);
      
      // If image is too large (>40MB after optimization), return error
      if (estimatedSize > 40) {
        console.error("Image too large to return:", estimatedSize.toFixed(2) + "MB");
        return res.status(413).json({
          message: "Generated image is too large to process. Please try a different prompt.",
          size: estimatedSize.toFixed(2) + "MB"
        });
      }
      
      console.log("Successfully generated image");
      
      return res.status(200).json({
        imageUrl,
        message: "Image generated successfully",
        user: {
          id: updatedUser._id,
          name: updatedUser.name,
          email: updatedUser.email,
          credits: updatedUser.creditBalance
        }
      });
    } catch (clipdropError) {
      console.error("ClipDrop API error:", clipdropError.message);
      return generateMockImage(prompt, updatedUser, res);
    }
  } catch (error) {
    console.error("General image generation error:", error);
    return res.status(500).json({ 
      message: "Server error during image generation", 
      error: error.message 
    });
  }
};

// Helper function to generate a mock image when API fails
const generateMockImage = (prompt, user, res) => {
  console.log("Generating mock image for prompt:", prompt);
  
  // Generate a mock image based on the prompt
  const colors = ['red', 'blue', 'green', 'purple', 'orange', 'teal'];
  const promptHash = prompt.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const colorIndex = promptHash % colors.length;
  const color = colors[colorIndex];
  
  // Simple SVG image with text based on the prompt
  const svgContent = `
  <svg width="512" height="512" xmlns="http://www.w3.org/2000/svg">
    <rect width="512" height="512" fill="${color}" />
    <text x="50%" y="50%" font-family="Arial" font-size="20" fill="white" text-anchor="middle">
      ${prompt.substring(0, 30)}${prompt.length > 30 ? '...' : ''}
    </text>
  </svg>
  `;
  
  // Convert SVG to base64
  const base64Image = Buffer.from(svgContent).toString('base64');
  const imageUrl = `data:image/svg+xml;base64,${base64Image}`;
  
  console.log("Successfully generated mock image");
  
  return res.status(200).json({
    imageUrl,
    message: "Image generated (fallback mode)",
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      credits: user.creditBalance
    }
  });
};

export { generateImage };

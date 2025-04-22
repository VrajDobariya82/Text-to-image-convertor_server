import mongoose from "mongoose";

const connectedDB = async () => {
  try {
    mongoose.connection.on("connected", () => {
      console.log("Database connected successfully");
    });

    // Connect to MongoDB using the URL from .env file
    // This can be a local MongoDB instance (for MongoDB Compass)
    await mongoose.connect(process.env.MONGODB_URL);
    console.log(`Connected to MongoDB at: ${process.env.MONGODB_URL}`);
    
  } catch (error) {
    console.error("MongoDB connection error:", error);
  }
};

export default connectedDB;

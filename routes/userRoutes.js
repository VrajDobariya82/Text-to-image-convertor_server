import express from "express";
import { registerUser, loginUser, verifyToken, getUserProfile, userCredits } from "../controllers/userController.js";
import { 
  addToFavorites, 
  getFavorites, 
  removeFavorite,
  addToHistory, 
  getHistory 
} from "../controllers/userDataController.js";
import userAuth from "../middleware/auth.js";

const router = express.Router();

// Authentication routes
router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/verify", userAuth, verifyToken);
router.get("/profile", userAuth, getUserProfile);
router.get("/credits", userAuth, userCredits);

// Favorites routes
router.post("/favorites", userAuth, addToFavorites);
router.get("/favorites", userAuth, getFavorites);
router.delete("/favorites/:id", userAuth, removeFavorite);

// History routes
router.post("/history", userAuth, addToHistory);
router.get("/history", userAuth, getHistory);

export default router;

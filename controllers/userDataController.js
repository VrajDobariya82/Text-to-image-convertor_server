import favoriteModel from "../models/favoriteModel.js";
import historyModel from "../models/historyModel.js";

// Favorites Controllers
export const addToFavorites = async (req, res) => {
  try {
    const { imageUrl, prompt } = req.body;
    const userId = req.userId; // From auth middleware

    if (!imageUrl || !prompt) {
      return res.status(400).json({ message: "Image URL and prompt are required" });
    }

    // Check if already in favorites
    const existingFavorite = await favoriteModel.findOne({ userId, imageUrl });
    if (existingFavorite) {
      return res.status(200).json({ message: "Image already in favorites" });
    }

    // Create new favorite
    const newFavorite = new favoriteModel({
      userId,
      imageUrl,
      prompt,
    });

    await newFavorite.save();
    return res.status(201).json({ message: "Added to favorites", favorite: newFavorite });
  } catch (error) {
    console.error("Error adding to favorites:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const getFavorites = async (req, res) => {
  try {
    const userId = req.userId; // From auth middleware

    const favorites = await favoriteModel.find({ userId }).sort({ createdAt: -1 });
    return res.status(200).json({ favorites });
  } catch (error) {
    console.error("Error getting favorites:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const removeFavorite = async (req, res) => {
  try {
    const favoriteId = req.params.id;
    const userId = req.userId; // From auth middleware

    const favorite = await favoriteModel.findById(favoriteId);
    if (!favorite) {
      return res.status(404).json({ message: "Favorite not found" });
    }

    // Check if the favorite belongs to the user
    if (favorite.userId.toString() !== userId) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    await favoriteModel.findByIdAndDelete(favoriteId);
    return res.status(200).json({ message: "Removed from favorites" });
  } catch (error) {
    console.error("Error removing favorite:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

// History Controllers
export const addToHistory = async (req, res) => {
  try {
    const { imageUrl, prompt } = req.body;
    const userId = req.userId; // From auth middleware

    if (!imageUrl || !prompt) {
      return res.status(400).json({ message: "Image URL and prompt are required" });
    }

    // Create new history entry
    const newHistoryItem = new historyModel({
      userId,
      imageUrl,
      prompt,
    });

    await newHistoryItem.save();
    return res.status(201).json({ message: "Added to history", historyItem: newHistoryItem });
  } catch (error) {
    console.error("Error adding to history:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const getHistory = async (req, res) => {
  try {
    const userId = req.userId; // From auth middleware

    const history = await historyModel.find({ userId }).sort({ createdAt: -1 });
    return res.status(200).json({ history });
  } catch (error) {
    console.error("Error getting history:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
}; 
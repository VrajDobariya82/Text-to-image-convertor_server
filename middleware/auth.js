import jwt from "jsonwebtoken";

const userAuth = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization || req.headers.Authorization;
    
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ message: "Unauthorized - No token provided" });
    }
    
    const token = authHeader.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ message: "Unauthorized - Invalid token format" });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    if (!decoded.id) {
      return res.status(401).json({ message: "Unauthorized - Invalid token payload" });
    }
    
    // Add userId to request object
    req.userId = decoded.id;
    
    next();
  } catch (error) {
    console.error("Auth error:", error);
    
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Session expired, please login again" });
    }
    
    return res.status(401).json({ message: "Unauthorized - Invalid token" });
  }
};

export default userAuth;

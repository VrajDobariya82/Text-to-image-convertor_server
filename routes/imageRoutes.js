import express from 'express'
import {generateImage} from '../controllers/imageController.js'
import userAuth from '../middleware/auth.js'

const router = express.Router()

// Apply auth middleware to image generation route
router.post('/generate-image', userAuth, generateImage)

export default router
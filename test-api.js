// Test script to check the ClipDrop API integration
import 'dotenv/config';
import axios from 'axios';
import fs from 'fs';
import FormData from 'form-data';

async function testClipDropAPI() {
  console.log('Testing ClipDrop API integration...');
  
  try {
    // Check if API key exists in .env
    const apiKey = process.env.CLIPDROP_API;
    if (!apiKey) {
      console.error('ERROR: CLIPDROP_API key is missing in .env file');
      return;
    }
    
    console.log(`API Key found, length: ${apiKey.length}`);
    console.log(`API Key: ${apiKey.substring(0, 10)}...${apiKey.substring(apiKey.length - 5)}`);
    
    // Create test form data
    const formData = new FormData();
    formData.append('prompt', 'A beautiful sunset over mountains, digital art');
    
    console.log('Sending test request to ClipDrop API...');
    
    // Make test request
    const response = await axios({
      method: 'post',
      url: 'https://clipdrop-api.co/text-to-image/v1',
      data: formData,
      headers: {
        'x-api-key': apiKey,
        ...formData.getHeaders()
      },
      responseType: 'arraybuffer',
      timeout: 30000 // 30 seconds
    });
    
    console.log(`Response received with status: ${response.status}`);
    
    // Save test image
    const imageBuffer = Buffer.from(response.data);
    fs.writeFileSync('test-image.png', imageBuffer);
    
    console.log('SUCCESS: Test image saved to test-image.png');
    console.log('API integration is working correctly');
    
  } catch (error) {
    console.error('ERROR: ClipDrop API test failed');
    console.error(error);
    
    if (error.response) {
      console.error(`Status code: ${error.response.status}`);
      console.error(`Response data: ${error.response.data.toString()}`);
    }
  }
}

testClipDropAPI(); 
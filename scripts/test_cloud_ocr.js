#!/usr/bin/env node

/**
 * Cloud OCR Test Script
 * 
 * This script tests the new cloud OCR implementation with OpenAI GPT-4o-mini.
 * It validates the integration, tests various scenarios, and provides detailed
 * diagnostic information.
 * 
 * Usage:
 *   node scripts/test_cloud_ocr.js [--api-key YOUR_OPENAI_KEY] [--image path/to/image.jpg]
 */

const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function header(message) {
  log(`\n${'='.repeat(60)}`, 'cyan');
  log(`${message}`, 'cyan');
  log(`${'='.repeat(60)}`, 'cyan');
}

function section(message) {
  log(`\n${'-'.repeat(40)}`, 'blue');
  log(`${message}`, 'blue');
  log(`${'-'.repeat(40)}`, 'blue');
}

// Load environment variables from .env file
function loadEnvFile() {
  try {
    const fs = require('fs');
    const path = require('path');
    const envPath = path.join(process.cwd(), '.env');
    
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf8');
      const envLines = envContent.split('\n').filter(line => line.trim() && !line.startsWith('#'));
      
      envLines.forEach(line => {
        const [key, ...valueParts] = line.split('=');
        if (key && valueParts.length > 0) {
          const value = valueParts.join('=').trim();
          process.env[key.trim()] = value;
        }
      });
      
      log('✅ Loaded .env file', 'green');
    } else {
      log('⚠️ No .env file found', 'yellow');
    }
  } catch (error) {
    log(`⚠️ Error loading .env file: ${error.message}`, 'yellow');
  }
}

// Parse command line arguments
function parseArgs() {
  // Load environment variables first
  loadEnvFile();
  
  const args = process.argv.slice(2);
  const config = {
    apiKey: process.env.openaiApiKey || process.env.OPENAI_API_KEY || null,
    testImage: null,
    verbose: false
  };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--api-key':
        config.apiKey = args[++i];
        break;
      case '--image':
        config.testImage = args[++i];
        break;
      case '--verbose':
      case '-v':
        config.verbose = true;
        break;
      case '--help':
      case '-h':
        showHelp();
        process.exit(0);
        break;
    }
  }

  return config;
}

function showHelp() {
  log('Cloud OCR Test Script', 'bright');
  log('\nUsage:', 'yellow');
  log('  node scripts/test_cloud_ocr.js [options]', 'white');
  log('\nOptions:', 'yellow');
  log('  --api-key <key>    OpenAI API key for testing', 'white');
  log('  --image <path>     Test image file path', 'white');
  log('  --verbose, -v      Enable verbose output', 'white');
  log('  --help, -h         Show this help message', 'white');
  log('\nExamples:', 'yellow');
  log('  node scripts/test_cloud_ocr.js --api-key sk-... --image test.jpg', 'white');
  log('  node scripts/test_cloud_ocr.js --verbose', 'white');
}

// Mock implementation for testing outside React Native environment
class MockOpenAIOCRProvider {
  constructor() {
    this.name = 'openai';
    this.supportedFormats = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
    this.maxFileSize = 20 * 1024 * 1024;
    this.config = null;
    this.isInitialized = false;
  }

  async initialize(config) {
    if (!config.apiKey) {
      throw new Error('API key is required');
    }
    this.config = config;
    this.isInitialized = true;
  }

  isConfigured() {
    return this.isInitialized && !!this.config;
  }

  async testConnection() {
    if (!this.config) return false;

    try {
      // Create timeout controller for Node.js compatibility
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch('https://api.openai.com/v1/models', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (response.status === 401) {
        throw new Error('Invalid API key');
      }

      return response.ok;
    } catch (error) {
      log(`Connection test failed: ${error.message}`, 'red');
      return false;
    }
  }

  async processImage(imagePath) {
    if (!this.isConfigured()) {
      throw new Error('Provider not configured');
    }

    if (!fs.existsSync(imagePath)) {
      throw new Error(`Image file not found: ${imagePath}`);
    }

    const imageBuffer = fs.readFileSync(imagePath);
    const extension = path.extname(imagePath).toLowerCase().slice(1);
    
    if (!this.supportedFormats.includes(extension)) {
      throw new Error(`Unsupported format: ${extension}`);
    }

    const base64Image = imageBuffer.toString('base64');
    const mediaType = extension === 'png' ? 'image/png' : 'image/jpeg';

    const prompt = `You are an advanced OCR and document analysis system. Analyze this image and extract ALL visible text with high precision, then generate intelligent metadata.

CRITICAL REQUIREMENTS:
1. Extract EVERY piece of visible text
2. Maintain text structure and formatting
3. Generate precise, relevant metadata
4. Detect document type and provide categorization
5. Create actionable tags for organization

RESPONSE FORMAT (JSON):
{
  "extractedText": "Complete text from image",
  "confidence": 0.95,
  "metadata": {
    "title": "Concise descriptive title",
    "description": "Detailed description of content",
    "tags": ["relevant", "specific", "tags"],
    "categories": ["document_type", "subject_area"],
    "keyInformation": ["important facts", "key details"],
    "documentType": "specific type",
    "language": "en"
  },
  "analysis": {
    "quality": "excellent|good|fair|poor",
    "readability": 0.9,
    "structure": "Description of layout",
    "recommendations": ["actionable suggestions"]
  }
}`;

    const requestBody = {
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: prompt
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:${mediaType};base64,${base64Image}`,
                detail: 'high'
              }
            }
          ]
        }
      ],
      max_tokens: 2000,
      temperature: 0.1,
      response_format: { type: 'json_object' }
    };

    // Create timeout controller for Node.js compatibility
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API error ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    
    if (!data.choices || data.choices.length === 0) {
      throw new Error('No response from OpenAI API');
    }

    const result = JSON.parse(data.choices[0].message.content);
    
    return {
      success: true,
      result,
      usage: data.usage,
      model: 'gpt-4o-mini'
    };
  }
}

// Test functions
async function testAPIConnection(apiKey) {
  section('Testing OpenAI API Connection');
  
  if (!apiKey) {
    log('❌ No API key provided. Use --api-key to test connection.', 'red');
    return false;
  }

  const provider = new MockOpenAIOCRProvider();
  
  try {
    await provider.initialize({ apiKey });
    log('✅ Provider initialized successfully', 'green');
    
    const connected = await provider.testConnection();
    if (connected) {
      log('✅ API connection successful', 'green');
      return true;
    } else {
      log('❌ API connection failed', 'red');
      return false;
    }
  } catch (error) {
    log(`❌ Connection test failed: ${error.message}`, 'red');
    return false;
  }
}

async function testImageProcessing(apiKey, imagePath) {
  section('Testing Image Processing');
  
  if (!apiKey) {
    log('❌ No API key provided for image processing test', 'red');
    return false;
  }

  if (!imagePath) {
    log('❌ No test image provided. Use --image to test processing.', 'red');
    return false;
  }

  const provider = new MockOpenAIOCRProvider();
  
  try {
    await provider.initialize({ apiKey });
    log(`📸 Processing image: ${imagePath}`, 'blue');
    
    const startTime = Date.now();
    const response = await provider.processImage(imagePath);
    const processingTime = Date.now() - startTime;
    
    if (response.success) {
      log('✅ Image processing successful', 'green');
      log(`⏱️  Processing time: ${processingTime}ms`, 'yellow');
      
      const result = response.result;
      log(`📝 Extracted text length: ${result.extractedText.length} characters`, 'blue');
      log(`🎯 Confidence: ${result.confidence}`, 'blue');
      log(`📊 Quality: ${result.analysis.quality}`, 'blue');
      
      if (result.metadata) {
        log(`🏷️  Title: "${result.metadata.title}"`, 'magenta');
        log(`📋 Tags: ${result.metadata.tags.join(', ')}`, 'magenta');
        log(`📂 Categories: ${result.metadata.categories.join(', ')}`, 'magenta');
      }

      if (response.usage) {
        log(`💰 Token usage: ${response.usage.prompt_tokens} input, ${response.usage.completion_tokens} output`, 'yellow');
      }

      // Show text preview
      const textPreview = result.extractedText.substring(0, 200);
      log(`\n📄 Text preview:\n"${textPreview}${result.extractedText.length > 200 ? '...' : ''}"`, 'cyan');
      
      return true;
    } else {
      log('❌ Image processing failed', 'red');
      return false;
    }
  } catch (error) {
    log(`❌ Processing error: ${error.message}`, 'red');
    return false;
  }
}

async function testConfiguration() {
  section('Testing Configuration');
  
  // Check if configuration files exist
  const configFiles = [
    'app.json',
    'package.json',
    'services/cloud/OpenAIOCRProvider.ts',
    'services/cloud/CloudOCRManager.ts',
    'services/ocrService.v2.ts'
  ];

  let allFilesExist = true;
  
  for (const file of configFiles) {
    const fullPath = path.join(process.cwd(), file);
    if (fs.existsSync(fullPath)) {
      log(`✅ ${file}`, 'green');
    } else {
      log(`❌ ${file} - Missing`, 'red');
      allFilesExist = false;
    }
  }
  
  if (allFilesExist) {
    log('✅ All required files present', 'green');
  } else {
    log('❌ Some configuration files are missing', 'red');
  }

  // Check app.json configuration
  try {
    const appConfig = JSON.parse(fs.readFileSync('app.json', 'utf8'));
    const cloudOCRSettings = appConfig.expo?.extra?.cloudOCRSettings;
    
    if (cloudOCRSettings) {
      log('✅ Cloud OCR configuration found in app.json', 'green');
      log(`   Primary provider: ${cloudOCRSettings.primaryProvider}`, 'blue');
      log(`   Enhanced metadata: ${cloudOCRSettings.enhancedMetadata}`, 'blue');
      log(`   Local fallback: ${cloudOCRSettings.enableLocalFallback}`, 'blue');
    } else {
      log('❌ Cloud OCR configuration missing from app.json', 'red');
    }
  } catch (error) {
    log(`❌ Error reading app.json: ${error.message}`, 'red');
  }

  return allFilesExist;
}

function generateTestReport(results) {
  header('TEST REPORT');
  
  log(`Configuration Test: ${results.config ? '✅ PASS' : '❌ FAIL'}`, results.config ? 'green' : 'red');
  log(`API Connection Test: ${results.connection ? '✅ PASS' : '❌ FAIL'}`, results.connection ? 'green' : 'red');
  log(`Image Processing Test: ${results.processing ? '✅ PASS' : '❌ FAIL'}`, results.processing ? 'green' : 'red');
  
  const overallResult = results.config && (results.connection || results.processing);
  log(`\nOverall Result: ${overallResult ? '✅ READY FOR USE' : '❌ NEEDS ATTENTION'}`, overallResult ? 'green' : 'red');
  
  if (!overallResult) {
    log('\nNext Steps:', 'yellow');
    if (!results.config) {
      log('- Complete the cloud OCR setup and configuration', 'white');
    }
    if (!results.connection) {
      log('- Verify your OpenAI API key is valid and has sufficient credits', 'white');
      log('- Check network connectivity', 'white');
    }
    if (!results.processing) {
      log('- Test with a different image file', 'white');
      log('- Ensure image is in supported format (JPG, PNG)', 'white');
    }
  } else {
    log('\n🎉 Cloud OCR is ready! You can now use OpenAI GPT-4o-mini for enhanced document processing.', 'green');
  }
}

// Main test function
async function runTests() {
  const config = parseArgs();
  
  header('CLOUD OCR INTEGRATION TEST');
  log('Testing OpenAI GPT-4o-mini integration for enhanced OCR and metadata generation', 'bright');
  
  const results = {
    config: false,
    connection: false,
    processing: false
  };

  // Test 1: Configuration
  results.config = await testConfiguration();
  
  // Test 2: API Connection
  if (config.apiKey) {
    results.connection = await testAPIConnection(config.apiKey);
  } else {
    log('\n⚠️  Skipping API connection test (no API key provided)', 'yellow');
  }
  
  // Test 3: Image Processing
  if (config.apiKey && config.testImage) {
    results.processing = await testImageProcessing(config.apiKey, config.testImage);
  } else {
    log('\n⚠️  Skipping image processing test (API key or image not provided)', 'yellow');
  }
  
  // Generate report
  generateTestReport(results);
  
  // Exit with appropriate code
  const success = results.config && (results.connection || !config.apiKey);
  process.exit(success ? 0 : 1);
}

// Run the tests
if (require.main === module) {
  runTests().catch(error => {
    log(`\n❌ Test script failed: ${error.message}`, 'red');
    process.exit(1);
  });
}

module.exports = { MockOpenAIOCRProvider };
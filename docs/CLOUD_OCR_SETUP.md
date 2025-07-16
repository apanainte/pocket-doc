# Cloud OCR Setup Guide

This guide will help you integrate the new cloud-first OCR system with OpenAI GPT-4o-mini for enhanced document processing and metadata generation.

## 🚀 Quick Start

### 1. Install Dependencies

The cloud OCR system is built on top of the existing Expo infrastructure and doesn't require additional dependencies. All required modules are already included in your `package.json`.

### 2. Configure API Keys

#### Option A: Environment Variables (Recommended)
Create a `.env` file in your project root:

```bash
# OpenAI Configuration (multiple formats supported)
openaiApiKey=sk-your-openai-api-key-here
# Alternative formats also work:
# OPENAI_API_KEY=sk-your-openai-api-key-here
# EXPO_PUBLIC_OPENAI_API_KEY=sk-your-openai-api-key-here

# Optional: Other providers (for future use)
# googleCloudApiKey=your-google-cloud-key
# azureApiKey=your-azure-key
# deepSeekApiKey=your-deepseek-key
```

**Environment Variable Priority:**
The system checks for API keys in this order:
1. `openaiApiKey` (from .env file)
2. `OPENAI_API_KEY` (standard environment variable)
3. `EXPO_PUBLIC_OPENAI_API_KEY` (Expo public variable)
4. Runtime configuration (passed to initialize method)

#### Option B: App Configuration
Update your app configuration to include the API key:

```typescript
// In your app initialization
import { setupCloudOCR } from '@/services/cloud';

await setupCloudOCR({
  openaiApiKey: 'sk-your-openai-api-key-here',
  primaryProvider: 'openai',
  enableLocalFallback: true
});
```

### 3. Basic Usage

The enhanced OCR service automatically reads your API key from the `.env` file:

```typescript
// NEW: Using enhanced cloud OCR service with automatic configuration
import { enhancedOCRService } from '@/services/cloud';

// Initialize with automatic environment configuration
await enhancedOCRService.initialize(); // Reads from .env automatically

// Process images with enhanced OCR
const result = await enhancedOCRService.recognizeText(imageUri);

// OLD: Using legacy OCR service (still available as fallback)
import { ocrService } from '@/services/ocrService';
const result = await ocrService.recognizeText(imageUri);
```

**Automatic Configuration:**
- If you have your API key in `.env`, the service will automatically detect and use it
- No manual configuration needed - just call `initialize()` without parameters
- Falls back to local OCR if cloud configuration is missing

### 4. Enhanced Metadata Generation

```typescript
// OLD: Basic metadata generation
import { generateMetadata } from '@/services/aiMetadata';
const metadata = await generateMetadata(imageUri, 'image');

// NEW: Enhanced cloud metadata generation
import { generateEnhancedMetadata } from '@/services/cloud';
const metadata = await generateEnhancedMetadata(imageUri, 'image');

// The enhanced metadata includes:
// - More accurate text extraction
// - Intelligent categorization
// - Precise tagging
// - Key information extraction
// - Document type detection
// - Quality analysis and recommendations
```

## 🔧 Advanced Configuration

### Full Service Configuration

```typescript
import { enhancedOCRService } from '@/services/cloud';

await enhancedOCRService.initialize({
  // Cloud OCR settings
  useCloudOCR: true,
  primaryProvider: 'openai',
  enableLocalFallback: true,
  
  // API keys
  openaiApiKey: process.env.EXPO_PUBLIC_OPENAI_API_KEY,
  
  // Processing options
  enhancedMetadata: true,
  enableRetries: true,
  maxRetries: 3,
  timeout: 30000,
  
  // Quality settings
  confidenceThreshold: 0.7,
  enableQualityAnalysis: true
});
```

### Provider-Specific Settings

```typescript
// OpenAI-specific configuration
const openaiConfig = {
  provider: 'openai',
  apiKey: 'sk-your-key',
  model: 'gpt-4o-mini',
  timeout: 30000,
  maxRetries: 3,
  enableEnhancedMetadata: true
};
```

## 🧪 Testing Your Setup

### Command Line Testing

```bash
# Test basic configuration (automatically reads from .env)
npm run test:cloud-ocr

# Test with image processing (uses .env API key)
npm run test:cloud-ocr -- --image path/to/test-image.jpg

# Override API key if needed
npm run test:cloud-ocr -- --api-key sk-your-key --image path/to/test-image.jpg

# Get help
npm run test:cloud-ocr:help
```

**✅ Example successful test output:**
```
✅ Loaded .env file
✅ Configuration Test: PASS
✅ API Connection Test: PASS  
✅ Image Processing Test: PASS
🎉 Cloud OCR is ready! You can now use OpenAI GPT-4o-mini for enhanced document processing.
```

### Programmatic Testing

```typescript
import { testCloudOCRSetup } from '@/services/cloud';

const testResults = await testCloudOCRSetup({
  openaiApiKey: 'sk-your-key',
  testImageUri: 'path/to/test-image.jpg'
});

if (testResults.success) {
  console.log('✅ Cloud OCR is ready!');
} else {
  console.log('❌ Setup needs attention:', testResults.recommendations);
}
```

## 📊 Features & Benefits

### Enhanced Text Extraction
- **Higher Accuracy**: GPT-4o-mini provides superior text recognition compared to local OCR
- **Better Formatting**: Maintains document structure and formatting
- **Multi-language Support**: Automatic language detection and processing
- **Complex Documents**: Handles tables, forms, and complex layouts better

### Intelligent Metadata Generation
- **Smart Titles**: AI-generated titles based on document content
- **Precise Tagging**: Relevant, actionable tags for organization
- **Document Classification**: Automatic document type detection
- **Key Information**: Extraction of important facts and details
- **Quality Analysis**: Assessment of processing quality with recommendations

### Fallback Mechanism
- **Reliability**: Automatic fallback to local OCR if cloud service is unavailable
- **Offline Support**: Continues working without internet connection
- **Error Recovery**: Graceful handling of API failures or rate limits

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Enhanced OCR Service                     │
├─────────────────────────────────────────────────────────────┤
│  Cloud Providers        │        Local Fallback            │
│  ┌─────────────────┐    │    ┌─────────────────────────┐    │
│  │ OpenAI GPT-4o   │    │    │  ML Kit OCR             │    │
│  │ - High accuracy │    │    │  - iOS/Android          │    │
│  │ - Smart metadata│    │    │  - Offline capable      │    │
│  │ - 20MB limit    │    │    │  - Fast processing      │    │
│  └─────────────────┘    │    └─────────────────────────┘    │
│                         │                                   │
│  ┌─────────────────┐    │    ┌─────────────────────────┐    │
│  │ Google Cloud    │    │    │  VisionKit OCR          │    │
│  │ (Future)        │    │    │  - iOS only             │    │
│  └─────────────────┘    │    │  - System integration   │    │
│                         │    └─────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

## 🔐 Security & Privacy

### Data Handling
- **Temporary Processing**: Images are sent to OpenAI for processing and not stored
- **No Training**: Data is not used to train OpenAI models (as per API terms)
- **Local Fallback**: Sensitive documents can be processed locally if configured

### API Key Security
- **Environment Variables**: Store API keys securely in environment variables
- **Expo SecureStore**: Consider using SecureStore for API key storage in production
- **Rate Limiting**: Built-in retry logic and rate limit handling

## 🚨 Error Handling

The system includes comprehensive error handling:

```typescript
try {
  const result = await enhancedOCRService.recognizeText(imageUri);
  // Handle successful result
} catch (error) {
  if (error.code === 'INVALID_API_KEY') {
    // Handle API key issues
  } else if (error.code === 'NETWORK_ERROR') {
    // Handle network issues
  } else if (error.code === 'PROCESSING_FAILED') {
    // Handle processing failures
  }
}
```

### Error Codes
- `INVALID_API_KEY`: API key is missing or invalid
- `NETWORK_ERROR`: Network connectivity issues
- `PROCESSING_FAILED`: OCR processing failed
- `PROVIDER_ERROR`: Cloud provider specific errors
- `UNSUPPORTED_FORMAT`: File format not supported

## 📈 Performance Optimization

### Best Practices
1. **Image Size**: Optimize images before processing (max 20MB for OpenAI)
2. **Caching**: Consider caching results for repeated processing
3. **Batch Processing**: Process multiple images efficiently
4. **Quality Settings**: Adjust confidence thresholds based on use case

### Monitoring
```typescript
// Enable debug mode for detailed logging
enhancedOCRService.enableDebugMode();

// Monitor processing times and success rates
const result = await enhancedOCRService.recognizeText(imageUri);
console.log(`Processing time: ${result.processingTime}ms`);
console.log(`Quality score: ${result.qualityScore}`);
console.log(`Provider used: ${result.provider}`);
```

## 🔮 Future Roadmap

### Additional Providers
- **Google Cloud Vision API**: For comparison and additional fallback
- **Azure Computer Vision**: Enterprise-grade OCR processing
- **DeepSeek**: Cost-effective alternative with good performance

### Enhanced Features
- **Batch Processing**: Process multiple documents simultaneously
- **Custom Models**: Fine-tuned models for specific document types
- **Real-time OCR**: Live camera OCR processing
- **Document Classification**: Advanced document type classification

## 🆘 Troubleshooting

### Common Issues

**Q: "API key invalid" error**
A: Verify your OpenAI API key is correct and has sufficient credits.

**Q: "Network timeout" errors**
A: Check internet connectivity and consider increasing timeout values.

**Q: Poor OCR accuracy**
A: Ensure images are clear, well-lit, and text is readable. Consider image preprocessing.

**Q: Local fallback not working**
A: Verify local OCR is properly configured for your platform (iOS/Android).

### Getting Help

1. **Check Logs**: Enable debug mode for detailed logging
2. **Test Configuration**: Run `npm run test:cloud-ocr` for diagnostics
3. **Review Documentation**: Check this guide and code comments
4. **Community Support**: Refer to project issues and discussions

## 📝 Migration Guide

### From Legacy OCR Service

1. **Update Imports**:
   ```typescript
   // Old
   import { ocrService } from '@/services/ocrService';
   
   // New
   import { enhancedOCRService } from '@/services/cloud';
   ```

2. **Initialize Service**:
   ```typescript
   // Add initialization step
   await enhancedOCRService.initialize({
     useCloudOCR: true,
     openaiApiKey: process.env.EXPO_PUBLIC_OPENAI_API_KEY
   });
   ```

3. **Update Result Handling**:
   ```typescript
   // Enhanced results include additional metadata
   const result = await enhancedOCRService.recognizeText(imageUri);
   
   // Access enhanced features
   console.log(result.enhancedMetadata); // AI-generated metadata
   console.log(result.qualityScore);     // Processing quality
   console.log(result.recommendations);  // Improvement suggestions
   ```

### Gradual Migration Strategy

1. **Start with New Documents**: Use enhanced OCR for new document processing
2. **A/B Testing**: Compare results between old and new systems
3. **Incremental Rollout**: Gradually migrate existing functionality
4. **Monitoring**: Track performance and accuracy improvements

---

🎉 **You're Ready!** With this setup, you'll have access to state-of-the-art OCR processing with intelligent metadata generation, providing your users with significantly improved document management capabilities.
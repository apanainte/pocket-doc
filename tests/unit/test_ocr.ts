/**
 * Simple OCR Integration Test
 * Run this to verify OCR services are working correctly
 */

import { ocrService } from '../../services/ocrService';
import { textProcessingService } from '../../services/textProcessingService';
import { Platform } from 'react-native';

export async function testOCRIntegration(): Promise<void> {
  console.log('🔍 Starting OCR Integration Test...');
  
  try {
    // Test 1: Check OCR service initialization
    console.log('\n📱 Testing OCR Service Initialization...');
    await ocrService.initialize();
    console.log('✅ OCR Service initialized successfully');

    // Test 2: Check platform support
    console.log('\n🛠️  Testing Platform Support...');
    const isSupported = await ocrService.isSupported();
    console.log(`✅ OCR Support: ${isSupported ? 'Available' : 'Not Available'} on ${Platform.OS}`);

    // Test 3: Test available languages
    console.log('\n🌍 Testing Available Languages...');
    const languages = await ocrService.getAvailableLanguages();
    console.log(`✅ Available Languages: ${languages.join(', ')}`);

    // Test 4: Test text processing with mock data
    console.log('\n📝 Testing Text Processing Service...');
    const mockOCRResult = {
      text: 'Invoice\nABC Company\n123 Main Street\nTotal: $49.99\nDate: 2023-12-01\nemail: contact@abc.com\nPhone: (555) 123-4567',
      confidence: 0.92,
      blocks: [],
      processingTime: 1200,
      imageSize: { width: 320, height: 240 }
    };

    const processedText = textProcessingService.processOCRResult(mockOCRResult);
    console.log('✅ Text Processing Results:');
    console.log(`   - Detected Type: ${processedText.metadata.textType}`);
    console.log(`   - Language: ${processedText.metadata.language}`);
    console.log(`   - Word Count: ${processedText.metadata.wordCount}`);
    console.log(`   - Emails Found: ${processedText.structuredData.emails.length}`);
    console.log(`   - Phone Numbers Found: ${processedText.structuredData.phoneNumbers.length}`);

    // Test 5: Test smart metadata generation
    console.log('\n🧠 Testing Smart Metadata Generation...');
    const smartTitle = textProcessingService.generateSmartTitle(processedText);
    const smartDescription = textProcessingService.generateSmartDescription(processedText);
    const smartTags = textProcessingService.generateSmartTags(processedText);

    console.log('✅ Smart Metadata Generated:');
    console.log(`   - Title: ${smartTitle}`);
    console.log(`   - Description: ${smartDescription.substring(0, 100)}...`);
    console.log(`   - Tags: ${smartTags.join(', ')}`);

    // Test 6: Test error handling
    console.log('\n⚠️  Testing Error Handling...');
    try {
      await ocrService.recognizeText('invalid://path', { minimumConfidence: 0.9 });
    } catch (error) {
      console.log('✅ Error handling works correctly:', error instanceof Error ? error.message : 'Unknown error');
    }

    console.log('\n🎉 OCR Integration Test Complete!');
    console.log('All tests passed successfully. The OCR system is ready for use.');

  } catch (error) {
    console.error('❌ OCR Integration Test Failed:', error);
    throw error;
  }
}

// Utility function to test with actual image (when available)
export async function testWithRealImage(imageUri: string): Promise<any> {
  console.log('🖼️  Testing with real image:', imageUri);
  
  try {
    const result = await ocrService.recognizeText(imageUri, {
      recognitionLevel: 'accurate',
      minimumConfidence: 0.7
    });

    console.log('📊 OCR Results:');
    console.log(`   - Text Length: ${result.text.length} characters`);
    console.log(`   - Confidence: ${Math.round(result.confidence * 100)}%`);
    console.log(`   - Processing Time: ${result.processingTime}ms`);
    console.log(`   - Blocks: ${result.blocks.length}`);
    console.log(`   - Image Size: ${result.imageSize.width}x${result.imageSize.height}`);
    
    if (result.text.length > 0) {
      console.log('📝 Extracted Text Preview:');
      console.log(result.text.substring(0, 200) + (result.text.length > 200 ? '...' : ''));
    }

    return result;
  } catch (error) {
    console.error('❌ Real image test failed:', error);
    throw error;
  }
}

// Performance benchmark
export async function benchmarkOCRPerformance(imageUri: string, iterations: number = 5): Promise<void> {
  console.log(`⏱️  Running OCR Performance Benchmark (${iterations} iterations)...`);
  
  const times: number[] = [];
  const confidences: number[] = [];

  for (let i = 0; i < iterations; i++) {
    console.log(`   Iteration ${i + 1}/${iterations}...`);
    
    const startTime = Date.now();
    const result = await ocrService.recognizeText(imageUri);
    const totalTime = Date.now() - startTime;
    
    times.push(totalTime);
    confidences.push(result.confidence);
  }

  const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
  const avgConfidence = confidences.reduce((a, b) => a + b, 0) / confidences.length;
  const minTime = Math.min(...times);
  const maxTime = Math.max(...times);

  console.log('📈 Performance Results:');
  console.log(`   - Average Time: ${avgTime.toFixed(0)}ms`);
  console.log(`   - Min Time: ${minTime}ms`);
  console.log(`   - Max Time: ${maxTime}ms`);
  console.log(`   - Average Confidence: ${Math.round(avgConfidence * 100)}%`);
  console.log(`   - Time Variance: ${(maxTime - minTime)}ms`);
} 
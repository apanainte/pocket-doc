import { MetadataGenerationResponse } from '@/types/document';

export async function generateMetadata(uri: string, type: 'image' | 'pdf'): Promise<MetadataGenerationResponse> {
  // Simulate AI processing delay
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Mock AI responses based on type
  const mockResponses = {
    image: [
      {
        title: 'Travel Photo',
        description: 'Beautiful landscape photo capturing scenic mountain views during sunset',
        tags: ['travel', 'landscape', 'mountains', 'sunset', 'photography', 'nature']
      },
      {
        title: 'Recipe Card',
        description: 'Handwritten recipe card with ingredients and cooking instructions',
        tags: ['recipe', 'cooking', 'food', 'handwritten', 'instructions']
      },
      {
        title: 'Business Document',
        description: 'Professional document with charts and business information',
        tags: ['business', 'document', 'charts', 'professional', 'data']
      }
    ],
    pdf: [
      {
        title: 'Contract Document',
        description: 'Legal contract with terms, conditions, and signature requirements',
        tags: ['contract', 'legal', 'agreement', 'terms', 'business', 'signature']
      },
      {
        title: 'Technical Manual',
        description: 'Comprehensive technical documentation with diagrams and specifications',
        tags: ['manual', 'technical', 'documentation', 'specifications', 'guide']
      },
      {
        title: 'Report Analysis',
        description: 'Detailed analytical report with data insights and recommendations',
        tags: ['report', 'analysis', 'data', 'insights', 'business', 'recommendations']
      }
    ]
  };

  // Return random mock response
  const responses = mockResponses[type];
  const randomResponse = responses[Math.floor(Math.random() * responses.length)];
  
  return randomResponse;
}
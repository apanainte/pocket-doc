export interface Document {
  id: string;
  title: string;
  description: string;
  tags: string[];
  type: 'image' | 'pdf';
  uri: string;
  thumbnail?: string;
  createdAt: Date;
  updatedAt: Date;
  fileSize?: number;
}

export interface MetadataGenerationResponse {
  description: string;
  tags: string[];
  title: string;
}
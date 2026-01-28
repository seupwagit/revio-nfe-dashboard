import { GetObjectCommand, HeadObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { NodeHttpHandler } from '@smithy/node-http-handler';
import mongoose from 'mongoose';
import { Readable } from 'stream';
import { databaseRouter } from './DatabaseRouter';

export interface S3Config {
  endpoint: string;
  accessKey: string;
  secretKey: string;
  bucket: string;
  region: string;
}

export interface S3DownloadResult {
  success: boolean;
  data?: Buffer;
  fileName?: string;
  error?: string;
}

export interface HistoricoUpload {
  _id: string;
  ARQUIVO: string;
}

export class S3Service {
  private client!: S3Client; // Use definite assignment assertion
  private config: S3Config;

  constructor() {
    this.config = {
      endpoint: process.env.VITE_S3_ENDPOINT || '',
      accessKey: process.env.VITE_S3_ACCESS_KEY || '',
      secretKey: process.env.VITE_S3_SECRET_KEY || '',
      bucket: process.env.VITE_S3_BUCKET || '',
      region: process.env.VITE_S3_REGION || 'us-east-1'
    };

    this.validateCredentials();
    this.initializeClient();
  }

  private validateCredentials(): void {
    const requiredFields = ['endpoint', 'accessKey', 'secretKey', 'bucket'];
    const missingFields = requiredFields.filter(field => !this.config[field as keyof S3Config]);
    
    if (missingFields.length > 0) {
      throw new Error(`Missing S3 configuration: ${missingFields.join(', ')}`);
    }
  }

  private initializeClient(): void {
    this.client = new S3Client({
      endpoint: this.config.endpoint,
      region: this.config.region,
      credentials: {
        accessKeyId: this.config.accessKey,
        secretAccessKey: this.config.secretKey,
      },
      forcePathStyle: true, // Required for Wasabi
      requestHandler: new NodeHttpHandler({
        connectionTimeout: 10000,
        requestTimeout: 10000,
      }),
    });
  }

  /**
   * Gets the filename from tbl_historico_upload collection using document ID
   * Uses user-specific database routing for proper authentication
   */
  async getFileName(documentId: string): Promise<string | null| undefined> {
    try {
      console.log(`[S3Service] Querying filename for document ID: ${documentId}`);

      // Get user-specific MongoDB connection through DatabaseRouter
      const mongoConnection = await databaseRouter.getCurrentMongoConnection();
      
      if (!mongoConnection) {
        throw new Error('MongoDB connection not available');
      }

      // Create a model for the collection using the user-specific connection
      const HistoricoUploadSchema = new mongoose.Schema({
        _id: String,
        ARQUIVO: String
      }, { collection: 'tbl_historico_upload' });

      // Use the user-specific connection to create the model (reusing if already exists)
      const HistoricoUploadModel = mongoConnection.models.HistoricoUpload || 
                                    mongoConnection.model('HistoricoUpload', HistoricoUploadSchema);

      const document = await HistoricoUploadModel.findById(documentId).select('ARQUIVO').lean();
      
      if (!document) {
        console.log(`[S3Service] No document found with ID: ${documentId}`);
        return null;
      }

      console.log(`[S3Service] Found filename: ${document.ARQUIVO} for ID: ${documentId}`);
      return document.ARQUIVO;

    } catch (error: any) {
      console.error(`[S3Service] Error querying filename for ${documentId}:`, error);
      return null;
    }
  }

  /**
   * Downloads an XML file from S3 using the document ID as object name
   */
  async downloadXMLFile(objectName: string): Promise<S3DownloadResult> {
    try {
      console.log(`[S3Service] Starting download process for document ID: ${objectName}`);

      // First, get the actual filename from the database
      const fileName = await this.getFileName(objectName);
      if (!fileName) {
        return {
          success: false,
          error: `Documento não encontrado na base de dados: ${objectName}`
        };
      }

      console.log(`[S3Service] Downloading file: ${fileName} (ID: ${objectName}) from bucket: ${this.config.bucket} using endpoint: ${this.config.endpoint}`);
      console.log(`[S3Service] S3 Key used: ${objectName}`);

      // Check if the object exists in S3
      try {
        await this.client.send(new HeadObjectCommand({
          Bucket: this.config.bucket,
          Key: objectName // Use the document ID as the S3 key
        }));
      } catch (headError: any) {
        if (headError.name === 'NotFound' || headError.$metadata?.httpStatusCode === 404) {
          return {
            success: false,
            error: `Arquivo não encontrado no S3: ${objectName}`
          };
        }
        throw headError;
      }

      // Download the object using document ID as key
      const command = new GetObjectCommand({
        Bucket: this.config.bucket,
        Key: objectName
      });

      const response = await this.client.send(command);
      
      if (!response.Body) {
        return {
          success: false,
          error: 'Resposta vazia do S3'
        };
      }

      // Convert stream to buffer
      const buffer = await this.streamToBuffer(response.Body as Readable);
      
      const isSummary = buffer.toString('utf8').includes('<resNFe');
      console.log(`[S3Service] ✅ Download concluído: ${fileName} (${buffer.length} bytes, Tipo: ${isSummary ? 'Resumo/resNFe' : 'Completo/procNFe'})`);
      
      return {
        success: true,
        data: buffer,
        fileName
      };

    } catch (error: any) {
      console.error(`[S3Service] Error downloading ${objectName}:`, error);
      
      let errorMessage = 'Erro desconhecido ao baixar arquivo do S3';
      
      if (error.name === 'NetworkingError') {
        errorMessage = 'Erro de conexão com o servidor S3';
      } else if (error.name === 'CredentialsProviderError') {
        errorMessage = 'Credenciais S3 inválidas';
      } else if (error.message) {
        errorMessage = `Erro S3: ${error.message}`;
      }

      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Converts a readable stream to buffer
   */
  private async streamToBuffer(stream: Readable): Promise<Buffer> {
    const chunks: Buffer[] = [];
    
    return new Promise((resolve, reject) => {
      stream.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
      stream.on('error', (err) => reject(err));
      stream.on('end', () => resolve(Buffer.concat(chunks)));
    });
  }

  /**
   * Tests the S3 connection and credentials
   */
  async testConnection(): Promise<boolean> {
    try {
      // Try to list objects in the bucket (limit to 1 for efficiency)
      const command = new GetObjectCommand({
        Bucket: this.config.bucket,
        Key: 'test-connection-key-that-should-not-exist'
      });

      await this.client.send(command);
      return true;
    } catch (error: any) {
      // If we get a 404, it means we can connect but the object doesn't exist (which is expected)
      if (error.name === 'NoSuchKey' || error.$metadata?.httpStatusCode === 404) {
        return true;
      }
      
      console.error('[S3Service] Connection test failed:', error);
      return false;
    }
  }

  /**
   * Gets the current S3 configuration (without sensitive data)
   */
  getConfig(): Omit<S3Config, 'accessKey' | 'secretKey'> {
    return {
      endpoint: this.config.endpoint,
      bucket: this.config.bucket,
      region: this.config.region
    };
  }
}

// Export singleton instance
export const s3Service = new S3Service();
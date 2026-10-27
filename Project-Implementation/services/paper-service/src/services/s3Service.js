const { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { createLogger } = require('../../../../shared/logger');

const logger = createLogger('s3-service');

// Determine if using MinIO (local) or AWS S3
const isLocal = process.env.NODE_ENV !== 'production' && process.env.MINIO_ENDPOINT;

const s3Config = isLocal
  ? {
      endpoint: `http://${process.env.MINIO_ENDPOINT || 'localhost'}:${process.env.MINIO_PORT || 9000}`,
      region: 'us-east-1',
      credentials: {
        accessKeyId: process.env.MINIO_ACCESS_KEY || 'minioadmin',
        secretAccessKey: process.env.MINIO_SECRET_KEY || 'minioadmin',
      },
      forcePathStyle: true,
    }
  : {
      region: process.env.AWS_REGION || 'ap-south-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    };

const s3Client = new S3Client(s3Config);
const BUCKET = isLocal
  ? process.env.MINIO_BUCKET || 'research-papers'
  : process.env.AWS_S3_BUCKET || 'research-platform-pdfs';

/**
 * Upload a file to S3/MinIO
 */
const uploadFile = async (fileBuffer, key, contentType = 'application/pdf') => {
  try {
    const command = new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: fileBuffer,
      ContentType: contentType,
    });

    await s3Client.send(command);
    logger.info(`File uploaded: ${key}`);

    // Return URL
    if (isLocal) {
      return `http://${process.env.MINIO_ENDPOINT || 'localhost'}:${process.env.MINIO_PORT || 9000}/${BUCKET}/${key}`;
    }
    return `https://${BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
  } catch (error) {
    logger.error('S3 upload failed:', error);
    throw error;
  }
};

/**
 * Get a signed URL for secure file download
 */
const getDownloadUrl = async (key, expiresIn = 3600) => {
  try {
    const command = new GetObjectCommand({
      Bucket: BUCKET,
      Key: key,
    });

    const url = await getSignedUrl(s3Client, command, { expiresIn });
    return url;
  } catch (error) {
    logger.error('Failed to generate signed URL:', error);
    throw error;
  }
};

/**
 * Delete a file from S3/MinIO
 */
const deleteFile = async (key) => {
  try {
    const command = new DeleteObjectCommand({
      Bucket: BUCKET,
      Key: key,
    });

    await s3Client.send(command);
    logger.info(`File deleted: ${key}`);
  } catch (error) {
    logger.error('S3 delete failed:', error);
    throw error;
  }
};

/**
 * Get the file buffer from S3
 */
const getFile = async (key) => {
  try {
    const command = new GetObjectCommand({
      Bucket: BUCKET,
      Key: key,
    });

    const response = await s3Client.send(command);
    const chunks = [];
    for await (const chunk of response.Body) {
      chunks.push(chunk);
    }
    return Buffer.concat(chunks);
  } catch (error) {
    logger.error('S3 get failed:', error);
    throw error;
  }
};

module.exports = { uploadFile, getDownloadUrl, deleteFile, getFile, BUCKET };

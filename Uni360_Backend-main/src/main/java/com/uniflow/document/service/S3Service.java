package com.uniflow.document.service;

import com.uniflow.config.S3Properties;
import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import java.nio.ByteBuffer;
import java.time.Duration;
import java.time.Instant;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.http.codec.multipart.FilePart;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.core.async.AsyncRequestBody;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3AsyncClient;
import software.amazon.awssdk.services.s3.model.*;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.GetObjectPresignRequest;
import software.amazon.awssdk.services.s3.presigner.model.PresignedGetObjectRequest;

/**
 * Reactive S3 service for document management operations
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class S3Service {

    private final S3Properties s3Properties;
    private S3AsyncClient s3AsyncClient;
    private S3Presigner s3Presigner;

    @PostConstruct
    public void initializeS3Client() {
        log.info(
            "Initializing S3 client for bucket: {}, region: {}",
            s3Properties.getBucketName(),
            s3Properties.getRegion()
        );

        try {
            // Create credentials provider
            AwsBasicCredentials awsCredentials = AwsBasicCredentials.create(
                s3Properties.getAccessKey(),
                s3Properties.getSecretKey()
            );

            StaticCredentialsProvider credentialsProvider =
                StaticCredentialsProvider.create(awsCredentials);

            // Initialize S3 async client
            this.s3AsyncClient = S3AsyncClient.builder()
                .region(Region.of(s3Properties.getRegion()))
                .credentialsProvider(credentialsProvider)
                .build();

            // Initialize S3 presigner
            this.s3Presigner = S3Presigner.builder()
                .region(Region.of(s3Properties.getRegion()))
                .credentialsProvider(credentialsProvider)
                .build();

            log.info("S3 client initialized successfully");
        } catch (Exception e) {
            log.error("Failed to initialize S3 client: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to initialize S3 client", e);
        }
    }

    @PreDestroy
    public void closeS3Client() {
        if (s3AsyncClient != null) {
            s3AsyncClient.close();
        }
        if (s3Presigner != null) {
            s3Presigner.close();
        }
        log.info("S3 client closed");
    }

    /**
     * Upload file to S3 bucket
     */
    public Mono<String> uploadFile(
        FilePart filePart,
        String studentId,
        String documentType
    ) {
        return validateFile(filePart).flatMap(validatedFile -> {
            String fileName = generateFileName(
                studentId,
                documentType,
                validatedFile.filename()
            );
            String s3Key = s3Properties.getDocumentPathWithSlash() + fileName;

            log.info(
                "Uploading file to S3: bucket={}, key={}",
                s3Properties.getBucketName(),
                s3Key
            );

            return uploadFileToS3(validatedFile, s3Key).map(response -> {
                String fileUrl = String.format(
                    "https://%s.s3.%s.amazonaws.com/%s",
                    s3Properties.getBucketName(),
                    s3Properties.getRegion(),
                    s3Key
                );
                log.info("File uploaded successfully: {}", fileUrl);
                return fileUrl;
            });
        });
    }

    /**
     * Generate presigned URL for viewing documents
     */
    public Mono<String> generatePresignedViewUrl(String fileUrl) {
        return Mono.fromCallable(() -> {
            try {
                String s3Key = extractS3KeyFromUrl(fileUrl);

                GetObjectRequest getObjectRequest = GetObjectRequest.builder()
                    .bucket(s3Properties.getBucketName())
                    .key(s3Key)
                    .build();

                GetObjectPresignRequest presignRequest =
                    GetObjectPresignRequest.builder()
                        .signatureDuration(
                            Duration.ofSeconds(
                                s3Properties.getPresignedUrlExpiration()
                            )
                        )
                        .getObjectRequest(getObjectRequest)
                        .build();

                PresignedGetObjectRequest presignedRequest =
                    s3Presigner.presignGetObject(presignRequest);
                String presignedUrl = presignedRequest.url().toString();

                log.debug("Generated presigned URL for key: {}", s3Key);
                return presignedUrl;
            } catch (Exception e) {
                log.error(
                    "Failed to generate presigned URL for: {}",
                    fileUrl,
                    e
                );
                throw new RuntimeException(
                    "Failed to generate presigned URL",
                    e
                );
            }
        });
    }

    /**
     * Delete file from S3 bucket
     */
    public Mono<Boolean> deleteFile(String fileUrl) {
        return Mono.fromCompletionStage(() -> {
            try {
                String s3Key = extractS3KeyFromUrl(fileUrl);

                DeleteObjectRequest deleteRequest =
                    DeleteObjectRequest.builder()
                        .bucket(s3Properties.getBucketName())
                        .key(s3Key)
                        .build();

                CompletableFuture<DeleteObjectResponse> deleteFuture =
                    s3AsyncClient.deleteObject(deleteRequest);

                return deleteFuture.thenApply(response -> {
                    log.info("File deleted successfully from S3: {}", s3Key);
                    return true;
                });
            } catch (Exception e) {
                log.error("Failed to delete file from S3: {}", fileUrl, e);
                return CompletableFuture.completedFuture(false);
            }
        });
    }

    /**
     * Validate file before upload
     */
    public Mono<FilePart> validateFile(FilePart filePart) {
        return Mono.just(filePart).flatMap(file -> {
            // Check if file is empty
            if (file.filename() == null || file.filename().isEmpty()) {
                return Mono.error(
                    new IllegalArgumentException("File name cannot be empty")
                );
            }

            // Extract file extension
            String fileExtension = getFileExtension(file.filename());
            if (!s3Properties.isFileTypeAllowed(fileExtension)) {
                return Mono.error(
                    new IllegalArgumentException(
                        "File type not allowed: " +
                            fileExtension +
                            ". Allowed types: " +
                            s3Properties.getAllowedTypes()
                    )
                );
            }

            return Mono.just(file);
        });
    }

    /**
     * Check if S3 bucket exists and is accessible
     */
    public Mono<Boolean> checkBucketAccess() {
        return Mono.fromCompletionStage(() -> {
            HeadBucketRequest headBucketRequest = HeadBucketRequest.builder()
                .bucket(s3Properties.getBucketName())
                .build();

            return s3AsyncClient
                .headBucket(headBucketRequest)
                .thenApply(response -> {
                    log.info(
                        "S3 bucket access verified: {}",
                        s3Properties.getBucketName()
                    );
                    return true;
                })
                .exceptionally(throwable -> {
                    log.error(
                        "S3 bucket access failed: {}",
                        throwable.getMessage()
                    );
                    return false;
                });
        });
    }

    /**
     * Upload file data to S3
     */
    private Mono<PutObjectResponse> uploadFileToS3(
        FilePart filePart,
        String s3Key
    ) {
        return filePart
            .content()
            .reduce(DataBuffer::write)
            .map(dataBuffer -> {
                byte[] bytes = new byte[dataBuffer.readableByteCount()];
                dataBuffer.read(bytes);
                return bytes;
            })
            .flatMap(fileBytes -> {
                // Validate file size
                if (fileBytes.length > s3Properties.getMaxFileSizeInBytes()) {
                    return Mono.error(
                        new IllegalArgumentException(
                            "File size exceeds maximum allowed: " +
                                s3Properties.getMaxFileSize()
                        )
                    );
                }

                PutObjectRequest putObjectRequest = PutObjectRequest.builder()
                    .bucket(s3Properties.getBucketName())
                    .key(s3Key)
                    .contentType(
                        getContentType(getFileExtension(filePart.filename()))
                    )
                    .contentLength((long) fileBytes.length)
                    .build();

                AsyncRequestBody requestBody = AsyncRequestBody.fromBytes(
                    fileBytes
                );

                return Mono.fromCompletionStage(
                    s3AsyncClient.putObject(putObjectRequest, requestBody)
                );
            });
    }

    /**
     * Generate unique file name
     */
    private String generateFileName(
        String studentId,
        String documentType,
        String originalFilename
    ) {
        String fileExtension = getFileExtension(originalFilename);
        String timestamp = String.valueOf(Instant.now().getEpochSecond());
        String uuid = UUID.randomUUID().toString().substring(0, 8);

        return String.format(
            "%s_%s_%s_%s.%s",
            studentId,
            documentType,
            timestamp,
            uuid,
            fileExtension
        );
    }

    /**
     * Extract file extension from filename
     */
    private String getFileExtension(String filename) {
        if (filename == null || !filename.contains(".")) {
            return "";
        }
        return filename.substring(filename.lastIndexOf(".") + 1).toLowerCase();
    }

    /**
     * Get content type based on file extension
     */
    private String getContentType(String fileExtension) {
        switch (fileExtension.toLowerCase()) {
            case "pdf":
                return "application/pdf";
            case "doc":
                return "application/msword";
            case "docx":
                return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
            case "jpg":
            case "jpeg":
                return "image/jpeg";
            case "png":
                return "image/png";
            default:
                return "application/octet-stream";
        }
    }

    /**
     * Extract S3 key from full S3 URL
     */
    private String extractS3KeyFromUrl(String fileUrl) {
        if (fileUrl == null || fileUrl.isEmpty()) {
            throw new IllegalArgumentException(
                "File URL cannot be null or empty"
            );
        }

        try {
            // Handle both path-style and virtual-hosted-style URLs
            if (fileUrl.contains("amazonaws.com/")) {
                return fileUrl.substring(
                    fileUrl.indexOf("amazonaws.com/") + 14
                );
            } else if (
                fileUrl.contains(s3Properties.getBucketName() + ".s3.")
            ) {
                return fileUrl.substring(
                    fileUrl.indexOf(".amazonaws.com/") + 15
                );
            }

            throw new IllegalArgumentException(
                "Invalid S3 URL format: " + fileUrl
            );
        } catch (Exception e) {
            log.error("Failed to extract S3 key from URL: {}", fileUrl, e);
            throw new IllegalArgumentException("Invalid S3 URL format", e);
        }
    }
}

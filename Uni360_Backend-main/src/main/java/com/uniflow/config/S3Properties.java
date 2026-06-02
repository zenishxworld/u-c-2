package com.uniflow.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * Configuration properties for AWS S3 integration
 */
@Data
@Component
@ConfigurationProperties(prefix = "uniflow.aws.s3")
public class S3Properties {

    /**
     * S3 bucket name for document storage
     */
    private String bucketName;

    /**
     * AWS region for S3 service
     */
    private String region;

    /**
     * AWS access key ID
     */
    private String accessKey;

    /**
     * AWS secret access key
     */
    private String secretKey;

    /**
     * Base path for documents in S3 bucket
     */
    private String documentPath = "documents/";

    /**
     * Maximum file size allowed for upload
     */
    private String maxFileSize = "10MB";

    /**
     * List of allowed file types for upload
     */
    private List<String> allowedTypes = List.of("pdf", "doc", "docx", "jpg", "jpeg", "png");

    /**
     * Presigned URL expiration time in seconds
     */
    private Long presignedUrlExpiration = 3600L;

    /**
     * Get max file size in bytes
     */
    public long getMaxFileSizeInBytes() {
        String size = maxFileSize.toLowerCase();
        if (size.endsWith("mb")) {
            return Long.parseLong(size.substring(0, size.length() - 2)) * 1024 * 1024;
        } else if (size.endsWith("kb")) {
            return Long.parseLong(size.substring(0, size.length() - 2)) * 1024;
        } else if (size.endsWith("gb")) {
            return Long.parseLong(size.substring(0, size.length() - 2)) * 1024 * 1024 * 1024;
        }
        return Long.parseLong(size);
    }

    /**
     * Check if file type is allowed
     */
    public boolean isFileTypeAllowed(String fileType) {
        if (fileType == null) {
            return false;
        }
        return allowedTypes.contains(fileType.toLowerCase());
    }

    /**
     * Get document path with trailing slash
     */
    public String getDocumentPathWithSlash() {
        if (documentPath == null || documentPath.isEmpty()) {
            return "documents/";
        }
        return documentPath.endsWith("/") ? documentPath : documentPath + "/";
    }
}

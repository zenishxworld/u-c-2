package com.uniflow.visa.entity;

import java.time.LocalDateTime;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

/**
 * VisaChecklist entity - stores country-level visa checklist set by admin.
 * One checklist per country (UK / GERMANY). Items stored as JSON array.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table("visa_checklists")
public class VisaChecklist {

    @Id
    @Column("id")
    private UUID id;

    /** Target country - UK or GERMANY */
    @Column("country")
    private String country;

    /** Human-readable title for the checklist */
    @Column("title")
    private String title;

    /**
     * Checklist items stored as a JSON array string (e.g. ["Passport","Bank Statement"]).
     * R2DBC stores as TEXT; service layer handles Jackson serialization.
     */
    @Column("items")
    private String items;

    /** Admin who last updated this checklist */
    @Column("admin_id")
    private Long adminId;

    @CreatedDate
    @Column("created_at")
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column("updated_at")
    private LocalDateTime updatedAt;
}

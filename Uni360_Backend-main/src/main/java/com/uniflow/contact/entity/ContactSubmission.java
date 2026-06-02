package com.uniflow.contact.entity;

import java.time.LocalDateTime;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Table("contact_submissions")
public class ContactSubmission {

    @Id
    private UUID id;

    @Column("first_name")
    private String firstName;

    @Column("last_name")
    private String lastName;

    @Column("email")
    private String email;

    @Column("phone")
    private String phone;

    @Column("country")
    private String country;

    @Column("subject")
    private String subject;

    @Column("message")
    private String message;

    @Builder.Default
    @Column("status")
    private String status = "NEW";

    @Column("created_at")
    private LocalDateTime createdAt;
}

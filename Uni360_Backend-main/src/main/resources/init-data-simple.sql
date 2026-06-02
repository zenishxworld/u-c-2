-- UniFlow Platform - Simplified Demo Data
-- This file creates minimal demo data for testing
-- Universities and their courses using simplified schema

-- Technical University of Munich
INSERT INTO universities (
    name, code, is_active, data, created_by, updated_by
) VALUES (
    'Technical University of Munich', 'TUM', true,
    '{
        "official_name": "Technische Universität München",
        "short_name": "TUM",
        "acronym": "TUM",
        "former_names": ["Königlich Bayerische Technische Hochschule München"],
        "country": "Germany",
        "country_code": "DE",
        "state": "Bavaria",
        "city": "Munich",
        "address": "Arcisstraße 21, 80333 München, Germany",
        "website_url": "https://www.tum.de",
        "email": "studium@tum.de",
        "phone": "+49-89-289-01",
        "admissions_email": "studium@tum.de",
        "admissions_phone": "+49-89-289-22245",
        "institution_type": "PUBLIC",
        "type": "RESEARCH",
        "founding_year": 1868,
        "total_students": 45356,
        "undergraduate_students": 32000,
        "graduate_students": 13356,
        "faculty_count": 10400,
        "world_ranking": 50,
        "national_ranking": 1,
        "qs_ranking": 37,
        "tuition_international_undergraduate": 0.00,
        "tuition_international_graduate": 0.00,
        "application_fee": 50.00,
        "currency": "EUR",
        "scholarships_available": true,
        "acceptance_rate": 0.08,
        "application_deadline_fall": "2024-07-15",
        "commission_rate": 10.0,
        "english_requirements": {
            "TOEFL_min": 88,
            "IELTS_min": 6.5,
            "TestDaF": 4,
            "DSH": 2
        },
        "affiliations": ["TU9", "CESAER", "EuroTech Universities", "PEGASUS"],
        "languages_of_instruction": ["German", "English"],
        "research_facilities": ["Machine Learning Lab", "Physics Department", "Chemistry Institute", "Robotics Research"],
        "sports_facilities": ["Olympic Park", "Swimming Pool", "Fitness Center", "Tennis Courts", "Football Field"],
        "student_services": ["Student Advisory Service", "Career Center", "International Office", "Library Services"],
        "schools_colleges": ["School of Engineering and Design", "School of Natural Sciences", "School of Medicine", "School of Management"],
        "degree_levels": ["Bachelor", "Master", "Doctorate", "Diploma"],
        "popular_majors": ["Computer Science", "Mechanical Engineering", "Electrical Engineering", "Physics", "Mathematics"],
        "description": "Leading technical university in Germany, renowned for engineering, natural sciences and medicine.",
        "verification_status": "VERIFIED",
        "status": "ACTIVE",
        "is_featured": true,
        "client_id": "uniflow"
    }'::jsonb,
    'system', 'system'
) ON CONFLICT (code) DO NOTHING;

-- Ludwig Maximilian University of Munich
INSERT INTO universities (
    name, code, is_active, data, created_by, updated_by
) VALUES (
    'Ludwig Maximilian University of Munich', 'LMU', true,
    '{
        "official_name": "Ludwig-Maximilians-Universität München",
        "short_name": "LMU Munich",
        "former_names": ["Universitas Ludovico Maximilianea"],
        "country": "Germany",
        "country_code": "DE",
        "state": "Bavaria",
        "city": "Munich",
        "address": "Geschwister-Scholl-Platz 1, 80539 München, Germany",
        "website_url": "https://www.lmu.de",
        "email": "studium@lmu.de",
        "phone": "+49-89-2180-0",
        "admissions_email": "studium@lmu.de",
        "admissions_phone": "+49-89-2180-2967",
        "institution_type": "PUBLIC",
        "type": "RESEARCH",
        "founding_year": 1472,
        "total_students": 52000,
        "undergraduate_students": 38000,
        "graduate_students": 14000,
        "faculty_count": 4500,
        "world_ranking": 64,
        "national_ranking": 2,
        "qs_ranking": 34,
        "tuition_international_undergraduate": 0.00,
        "tuition_international_graduate": 0.00,
        "application_fee": 75.00,
        "currency": "EUR",
        "scholarships_available": true,
        "acceptance_rate": 0.10,
        "application_deadline_fall": "2024-07-15",
        "commission_rate": 10.0,
        "english_requirements": {
            "TOEFL_min": 80,
            "IELTS_min": 6.0,
            "TestDaF": 4,
            "DSH": 2
        },
        "affiliations": ["German U15", "League of European Research Universities", "Universitas 21"],
        "languages_of_instruction": ["German", "English"],
        "research_facilities": ["Max Planck Institute", "Medical Research Center", "Philosophy Institute", "Law Faculty"],
        "sports_facilities": ["University Sports Center", "Rowing Club", "Basketball Courts", "Climbing Wall"],
        "student_services": ["Student Counseling", "International Office", "Career Services", "Academic Writing Center"],
        "schools_colleges": ["Faculty of Medicine", "Faculty of Law", "Faculty of Philosophy", "Faculty of Mathematics"],
        "degree_levels": ["Bachelor", "Master", "Doctorate", "State Examination"],
        "popular_majors": ["Medicine", "Law", "Psychology", "Biology", "Philosophy"],
        "description": "One of Germanys oldest universities, excellence in research and teaching across all disciplines.",
        "verification_status": "VERIFIED",
        "status": "ACTIVE",
        "is_featured": true,
        "client_id": "uniflow"
    }'::jsonb,
    'system', 'system'
) ON CONFLICT (code) DO NOTHING;

-- RWTH Aachen University
INSERT INTO universities (
    name, code, is_active, data, created_by, updated_by
) VALUES (
    'RWTH Aachen University', 'RWTH', true,
    '{
        "official_name": "Rheinisch-Westfälische Technische Hochschule Aachen",
        "short_name": "RWTH Aachen",
        "former_names": ["Königlich Rheinisch-Westfälische Polytechnische Schule"],
        "country": "Germany",
        "country_code": "DE",
        "state": "North Rhine-Westphalia",
        "city": "Aachen",
        "address": "Templergraben 55, 52062 Aachen, Germany",
        "website_url": "https://www.rwth-aachen.de",
        "email": "studierendensekretariat@rwth-aachen.de",
        "phone": "+49-241-80-1",
        "admissions_email": "studierendensekretariat@rwth-aachen.de",
        "admissions_phone": "+49-241-80-94016",
        "institution_type": "PUBLIC",
        "type": "TECHNICAL",
        "founding_year": 1870,
        "total_students": 47000,
        "undergraduate_students": 33500,
        "graduate_students": 13500,
        "faculty_count": 9500,
        "world_ranking": 106,
        "national_ranking": 3,
        "qs_ranking": 145,
        "tuition_international_undergraduate": 0.00,
        "tuition_international_graduate": 0.00,
        "application_fee": 60.00,
        "currency": "EUR",
        "scholarships_available": true,
        "acceptance_rate": 0.15,
        "application_deadline_fall": "2024-07-15",
        "commission_rate": 10.0,
        "english_requirements": {
            "TOEFL_min": 90,
            "IELTS_min": 6.5,
            "TestDaF": 4,
            "DSH": 2
        },
        "affiliations": ["TU9", "CESAER", "CLUSTER", "TIME", "UNITECH International"],
        "languages_of_instruction": ["German", "English"],
        "research_facilities": ["Automotive Engineering Center", "Production Technology", "Materials Science Institute", "Energy Research"],
        "sports_facilities": ["University Sports Center", "Soccer Fields", "Athletic Track", "Gym Facilities", "Tennis Courts"],
        "student_services": ["Student Services", "International Office", "Career Center", "Psychological Counseling"],
        "schools_colleges": ["Faculty of Mechanical Engineering", "Faculty of Electrical Engineering", "Faculty of Medicine", "School of Business and Economics"],
        "degree_levels": ["Bachelor", "Master", "Doctorate"],
        "popular_majors": ["Mechanical Engineering", "Electrical Engineering", "Computer Science", "Materials Science", "Business Administration"],
        "description": "Largest technical university in Germany, leading in engineering and natural sciences research.",
        "verification_status": "VERIFIED",
        "status": "ACTIVE",
        "is_featured": true,
        "client_id": "uniflow"
    }'::jsonb,
    'system', 'system'
) ON CONFLICT (code) DO NOTHING;

-- TUM Courses
INSERT INTO courses (
    university_id, name, course_code, is_active, data, created_by, updated_by
) VALUES (
    (SELECT id FROM universities WHERE code = 'TUM' LIMIT 1),
    'Master of Science in Computer Science', 'MSc-CS', true,
    '{
        "official_name": "Master of Science in Informatik",
        "degree_level": "MASTERS",
        "degree_type": "Master of Science",
        "field_of_study": "Computer Science",
        "subject_area": "Engineering",
        "academic_department": "Department of Computer Science",
        "duration_years": 2.0,
        "study_mode": "FULL_TIME",
        "tuition_international": 0.00,
        "currency": "EUR",
        "admission_requirements": {
            "min_gpa": 2.5,
            "bachelor_required": true,
            "german_proficiency": "B2"
        }
    }'::jsonb,
    'system', 'system'
) ON CONFLICT (course_code, university_id) DO NOTHING;

INSERT INTO courses (
    university_id, name, course_code, is_active, data, created_by, updated_by
) VALUES (
    (SELECT id FROM universities WHERE code = 'TUM' LIMIT 1),
    'Bachelor of Science in Mechanical Engineering', 'BSc-ME', true,
    '{
        "official_name": "Bachelor of Science in Maschinenwesen",
        "degree_level": "BACHELORS",
        "degree_type": "Bachelor of Science",
        "field_of_study": "Mechanical Engineering",
        "subject_area": "Engineering",
        "academic_department": "Department of Mechanical Engineering",
        "duration_years": 3.5,
        "study_mode": "FULL_TIME",
        "tuition_international": 0.00,
        "currency": "EUR",
        "admission_requirements": {
            "abitur_required": true,
            "german_proficiency": "C1",
            "mathematics_prerequisite": true
        }
    }'::jsonb,
    'system', 'system'
) ON CONFLICT (course_code, university_id) DO NOTHING;

-- LMU Courses
INSERT INTO courses (
    university_id, name, course_code, is_active, data, created_by, updated_by
) VALUES (
    (SELECT id FROM universities WHERE code = 'LMU' LIMIT 1),
    'Master of Arts in Philosophy', 'MA-PHIL', true,
    '{
        "official_name": "Master of Arts in Philosophie",
        "degree_level": "MASTERS",
        "degree_type": "Master of Arts",
        "field_of_study": "Philosophy",
        "subject_area": "Humanities",
        "academic_department": "Faculty of Philosophy",
        "duration_years": 2.0,
        "study_mode": "FULL_TIME",
        "tuition_international": 0.00,
        "currency": "EUR",
        "admission_requirements": {
            "bachelor_philosophy": true,
            "german_proficiency": "C2",
            "thesis_required": true
        }
    }'::jsonb,
    'system', 'system'
) ON CONFLICT (course_code, university_id) DO NOTHING;

INSERT INTO courses (
    university_id, name, course_code, is_active, data, created_by, updated_by
) VALUES (
    (SELECT id FROM universities WHERE code = 'LMU' LIMIT 1),
    'Bachelor of Science in Medicine', 'BSc-MED', true,
    '{
        "official_name": "Bachelor of Science in Medizin",
        "degree_level": "BACHELORS",
        "degree_type": "Bachelor of Science",
        "field_of_study": "Medicine",
        "subject_area": "Medical Sciences",
        "academic_department": "Faculty of Medicine",
        "duration_years": 6.0,
        "study_mode": "FULL_TIME",
        "tuition_international": 0.00,
        "currency": "EUR",
        "admission_requirements": {
            "abitur_required": true,
            "german_proficiency": "C1",
            "chemistry_prerequisite": true
        }
    }'::jsonb,
    'system', 'system'
) ON CONFLICT (course_code, university_id) DO NOTHING;

-- RWTH Courses
INSERT INTO courses (
    university_id, name, course_code, is_active, data, created_by, updated_by
) VALUES (
    (SELECT id FROM universities WHERE code = 'RWTH' LIMIT 1),
    'Master of Science in Electrical Engineering', 'MSc-EE', true,
    '{
        "official_name": "Master of Science in Elektrotechnik",
        "degree_level": "MASTERS",
        "degree_type": "Master of Science",
        "field_of_study": "Electrical Engineering",
        "subject_area": "Engineering",
        "academic_department": "Faculty of Electrical Engineering and Information Technology",
        "duration_years": 2.0,
        "study_mode": "FULL_TIME",
        "tuition_international": 0.00,
        "currency": "EUR",
        "admission_requirements": {
            "bachelor_engineering": true,
            "german_proficiency": "B2",
            "gre_recommended": false
        }
    }'::jsonb,
    'system', 'system'
) ON CONFLICT (course_code, university_id) DO NOTHING;

INSERT INTO courses (
    university_id, name, course_code, is_active, data, created_by, updated_by
) VALUES (
    (SELECT id FROM universities WHERE code = 'RWTH' LIMIT 1),
    'Bachelor of Science in Materials Science', 'BSc-MS', true,
    '{
        "official_name": "Bachelor of Science in Werkstoffwissenschaft",
        "degree_level": "BACHELORS",
        "degree_type": "Bachelor of Science",
        "field_of_study": "Materials Science",
        "subject_area": "Engineering",
        "academic_department": "Faculty of Materials Science",
        "duration_years": 3.0,
        "study_mode": "FULL_TIME",
        "tuition_international": 0.00,
        "currency": "EUR",
        "admission_requirements": {
            "abitur_required": true,
            "german_proficiency": "C1",
            "physics_prerequisite": true
        }
    }'::jsonb,
    'system', 'system'
) ON CONFLICT (course_code, university_id) DO NOTHING;

-- MOGU Edu Database Backup
-- Generated: Tue Dec 30 08:51:31 UTC 2025
-- Database: moguedu-production
-- Mode: local

BEGIN TRANSACTION;


-- training_centers
[
  {
    "results": [
      {
        "id": 1,
        "name": "Excellence Training Institute",
        "country": "Canada",
        "accreditation_status": "active",
        "accreditation_date": "2024-01-15",
        "expiry_date": "null",
        "contact_email": "info@excellence.ca",
        "website": "https://excellence.ca",
        "created_at": "2025-12-29 21:24:32",
        "updated_at": "2025-12-29 21:24:32"
      },
      {
        "id": 2,
        "name": "Professional Development Center",
        "country": "Canada",
        "accreditation_status": "active",
        "accreditation_date": "2024-02-20",
        "expiry_date": "null",
        "contact_email": "contact@pdc.ca",
        "website": "https://pdc.ca",
        "created_at": "2025-12-29 21:24:32",
        "updated_at": "2025-12-29 21:24:32"
      },
      {
        "id": 3,
        "name": "Leadership Academy",
        "country": "Canada",
        "accreditation_status": "active",
        "accreditation_date": "2024-03-10",
        "expiry_date": "null",
        "contact_email": "admin@leadership.ca",
        "website": "https://leadership.ca",
        "created_at": "2025-12-29 21:24:32",
        "updated_at": "2025-12-29 21:24:32"
      },
      {
        "id": 4,
        "name": "Egyptian Training Institute",
        "country": "Egypt",
        "accreditation_status": "active",
        "accreditation_date": "2024-12-29",
        "expiry_date": "null",
        "contact_email": "info@eti.com",
        "website": "https://eti-egypt.com",
        "created_at": "2025-12-29 21:33:38",
        "updated_at": "2025-12-29 21:33:38"
      }
    ],
    "success": true,
    "meta": {
      "duration": 2
    }
  }
]

-- training_programs
[
  {
    "results": [
      {
        "id": 1,
        "center_id": 1,
        "program_name": "Project Management Professional",
        "program_code": "PMP-2024",
        "description": "Comprehensive project management training",
        "duration_hours": 40,
        "accreditation_status": "active",
        "accreditation_date": "2024-01-15",
        "created_at": "2025-12-29 21:24:32",
        "updated_at": "2025-12-29 21:24:32"
      },
      {
        "id": 2,
        "center_id": 1,
        "program_name": "Digital Marketing Certification",
        "program_code": "DMC-2024",
        "description": "Modern digital marketing strategies",
        "duration_hours": 30,
        "accreditation_status": "active",
        "accreditation_date": "2024-01-20",
        "created_at": "2025-12-29 21:24:32",
        "updated_at": "2025-12-29 21:24:32"
      },
      {
        "id": 3,
        "center_id": 2,
        "program_name": "Leadership Excellence Program",
        "program_code": "LEP-2024",
        "description": "Advanced leadership skills development",
        "duration_hours": 35,
        "accreditation_status": "active",
        "accreditation_date": "2024-02-20",
        "created_at": "2025-12-29 21:24:32",
        "updated_at": "2025-12-29 21:24:32"
      },
      {
        "id": 4,
        "center_id": 2,
        "program_name": "Data Analytics Fundamentals",
        "program_code": "DAF-2024",
        "description": "Introduction to data analysis",
        "duration_hours": 25,
        "accreditation_status": "active",
        "accreditation_date": "2024-02-25",
        "created_at": "2025-12-29 21:24:32",
        "updated_at": "2025-12-29 21:24:32"
      },
      {
        "id": 5,
        "center_id": 3,
        "program_name": "Executive Coaching Certification",
        "program_code": "ECC-2024",
        "description": "Professional coaching techniques",
        "duration_hours": 50,
        "accreditation_status": "active",
        "accreditation_date": "2024-03-10",
        "created_at": "2025-12-29 21:24:32",
        "updated_at": "2025-12-29 21:24:32"
      }
    ],
    "success": true,
    "meta": {
      "duration": 2
    }
  }
]

-- certificates
[
  {
    "results": [
      {
        "id": 1,
        "certificate_number": "MOGU-2024-001",
        "holder_name": "Sarah Johnson",
        "program_id": 1,
        "center_id": 1,
        "issue_date": "2024-06-15",
        "expiry_date": "null",
        "status": "valid",
        "qr_code": "null",
        "created_at": "2025-12-29 21:24:32",
        "updated_at": "2025-12-29 21:24:32"
      },
      {
        "id": 2,
        "certificate_number": "MOGU-2024-002",
        "holder_name": "Michael Chen",
        "program_id": 1,
        "center_id": 1,
        "issue_date": "2024-06-15",
        "expiry_date": "null",
        "status": "valid",
        "qr_code": "null",
        "created_at": "2025-12-29 21:24:32",
        "updated_at": "2025-12-29 21:24:32"
      },
      {
        "id": 3,
        "certificate_number": "MOGU-2024-003",
        "holder_name": "Emily Rodriguez",
        "program_id": 2,
        "center_id": 1,
        "issue_date": "2024-07-20",
        "expiry_date": "null",
        "status": "valid",
        "qr_code": "null",
        "created_at": "2025-12-29 21:24:32",
        "updated_at": "2025-12-29 21:24:32"
      },
      {
        "id": 4,
        "certificate_number": "MOGU-2024-004",
        "holder_name": "David Kim",
        "program_id": 3,
        "center_id": 2,
        "issue_date": "2024-08-10",
        "expiry_date": "null",
        "status": "valid",
        "qr_code": "null",
        "created_at": "2025-12-29 21:24:32",
        "updated_at": "2025-12-29 21:24:32"
      },
      {
        "id": 5,
        "certificate_number": "MOGU-2024-005",
        "holder_name": "Jennifer Brown",
        "program_id": 4,
        "center_id": 2,
        "issue_date": "2024-09-05",
        "expiry_date": "null",
        "status": "valid",
        "qr_code": "null",
        "created_at": "2025-12-29 21:24:32",
        "updated_at": "2025-12-29 21:24:32"
      },
      {
        "id": 6,
        "certificate_number": "MOGU-2024-006",
        "holder_name": "Robert Taylor",
        "program_id": 5,
        "center_id": 3,
        "issue_date": "2024-10-12",
        "expiry_date": "null",
        "status": "valid",
        "qr_code": "null",
        "created_at": "2025-12-29 21:24:32",
        "updated_at": "2025-12-29 21:24:32"
      },
      {
        "id": 7,
        "certificate_number": "MOGU-2024-007",
        "holder_name": "Lisa Anderson",
        "program_id": 1,
        "center_id": 1,
        "issue_date": "2024-11-08",
        "expiry_date": "null",
        "status": "valid",
        "qr_code": "null",
        "created_at": "2025-12-29 21:24:32",
        "updated_at": "2025-12-29 21:24:32"
      },
      {
        "id": 8,
        "certificate_number": "MOGU-2024-008",
        "holder_name": "James Wilson",
        "program_id": 2,
        "center_id": 1,
        "issue_date": "2024-11-15",
        "expiry_date": "null",
        "status": "valid",
        "qr_code": "null",
        "created_at": "2025-12-29 21:24:32",
        "updated_at": "2025-12-29 21:24:32"
      }
    ],
    "success": true,
    "meta": {
      "duration": 1
    }
  }
]

-- accreditation_standards
[
  {
    "results": [
      {
        "id": 1,
        "standard_name": "Trainer Qualification",
        "category": "MOGU Method",
        "description": "Verification of trainer credentials, experience, and expertise",
        "created_at": "2025-12-29 21:24:32"
      },
      {
        "id": 2,
        "standard_name": "Training Material Quality",
        "category": "MOGU Method",
        "description": "Assessment of training content, structure, and relevance",
        "created_at": "2025-12-29 21:24:32"
      },
      {
        "id": 3,
        "standard_name": "Learning Process Design",
        "category": "MOGU Method",
        "description": "Evaluation of pedagogical approaches and learning methodologies",
        "created_at": "2025-12-29 21:24:32"
      },
      {
        "id": 4,
        "standard_name": "Delivery Methods",
        "category": "MOGU Method",
        "description": "Review of training delivery techniques and effectiveness",
        "created_at": "2025-12-29 21:24:32"
      },
      {
        "id": 5,
        "standard_name": "Assessment & Evaluation",
        "category": "MOGU Method",
        "description": "Quality of learner assessment and outcome measurement",
        "created_at": "2025-12-29 21:24:32"
      },
      {
        "id": 6,
        "standard_name": "Governance & Management",
        "category": "Institutional",
        "description": "Organizational structure and management practices",
        "created_at": "2025-12-29 21:24:32"
      },
      {
        "id": 7,
        "standard_name": "Continuous Improvement",
        "category": "Quality Assurance",
        "description": "Systems for ongoing quality enhancement",
        "created_at": "2025-12-29 21:24:32"
      }
    ],
    "success": true,
    "meta": {
      "duration": 1
    }
  }
]

-- admin_users (passwords excluded for security)
[
  {
    "results": [
      {
        "id": 1,
        "username": "admin",
        "created_at": "2025-12-29 21:24:32",
        "last_login": "2025-12-29 21:33:38"
      }
    ],
    "success": true,
    "meta": {
      "duration": 1
    }
  }
]

-- contact_submissions
[
  {
    "results": [
      {
        "id": 1,
        "name": "Test User",
        "email": "test@example.com",
        "organization": "",
        "inquiry_type": "General Inquiry",
        "message": "This is a test message",
        "created_at": "2025-12-29 22:45:59",
        "is_read": 0
      },
      {
        "id": 2,
        "name": "Ahmed Mohamed",
        "email": "ahmed@example.com",
        "organization": "",
        "inquiry_type": "Training Center Accreditation",
        "message": "مرحباً، أريد الاستفسار عن اعتماد مركز التدريب",
        "created_at": "2025-12-29 22:53:10",
        "is_read": 0
      }
    ],
    "success": true,
    "meta": {
      "duration": 1
    }
  }
]

COMMIT;

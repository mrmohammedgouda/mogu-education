# MOGU Education - Trusted Accreditation for Quality Education

## Project Overview

MOGU Education is a Canadian registered accreditation website specialized in accrediting training centers, professional programs, and certifications to ensure quality, credibility, and excellence in education and training.

**Live Website**: https://3000-ife4zimfunsdxfan09n1m-dfc00ec5.sandbox.novita.ai

## Key Features

### ✅ Currently Implemented

1. **Complete Website Structure**
   - Home page with hero section, statistics, and why choose MOGU
   - About Us page with vision, mission, and legal status
   - Services page detailing all accreditation services
   - Standards page featuring the MOGU Edu Method
   - Certificate Verification page with search functionality
   - Accredited Centers directory
   - Contact page with inquiry form

2. **MOGU Edu Method**
   - Comprehensive 4-component accreditation framework:
     - Trainer Qualification Verification
     - Training Material Quality Assessment
     - Learning Process Design Evaluation
     - Delivery Methods Review
   - Complete accreditation workflow explained
   - Certificate approval based on pre-approved methodology

3. **Certificate Verification System**
   - Real-time certificate validation via API
   - Search by:
     - Certificate Number
     - Holder Name
     - Training Provider
   - Displays complete certificate information:
     - Certificate number and holder name
     - Program name and training center
     - Issue date and status
     - Country of accredited institution

4. **Backend API Endpoints**
   - `POST /api/verify` - Certificate verification
   - `GET /api/certificates/search` - Search certificates
   - `GET /api/centers` - List accredited centers
   - `GET /api/standards` - Get accreditation standards
   - `GET /api/stats` - Website statistics

5. **Database Architecture**
   - Training Centers table with accreditation status
   - Training Programs with program codes
   - Certificates with verification data
   - Accreditation Standards (MOGU Method components)

## Technology Stack

- **Framework**: Hono (lightweight web framework)
- **Runtime**: Cloudflare Workers / Cloudflare Pages
- **Database**: Cloudflare D1 (SQLite)
- **Frontend**: TailwindCSS + FontAwesome icons
- **Build Tool**: Vite
- **Process Manager**: PM2 (development)

## Project Structure

```
webapp/
├── src/
│   ├── index.tsx           # Main application with all routes
│   └── renderer.tsx        # React renderer
├── migrations/
│   └── 0001_initial_schema.sql  # Database schema
├── public/
│   ├── mogu-logo.png       # MOGU logo
│   └── static/             # Static assets
├── seed.sql                # Sample data for development
├── ecosystem.config.cjs    # PM2 configuration
├── wrangler.jsonc          # Cloudflare configuration
├── package.json            # Dependencies and scripts
└── README.md              # This file
```

## Database Schema

### Tables

1. **training_centers**
   - id, name, country, accreditation_status
   - accreditation_date, expiry_date
   - contact_email, website

2. **training_programs**
   - id, center_id, program_name, program_code
   - description, duration_hours
   - accreditation_status, accreditation_date

3. **certificates**
   - id, certificate_number, holder_name
   - program_id, center_id
   - issue_date, expiry_date, status

4. **accreditation_standards**
   - id, standard_name, category, description

## API Documentation

### Certificate Verification

**Endpoint**: `POST /api/verify`

**Request Body**:
```json
{
  "certificateNumber": "MOGU-2024-001",
  "holderName": "Sarah Johnson",
  "trainingProvider": "Excellence Training"
}
```

**Response**:
```json
{
  "success": true,
  "certificate": {
    "certificate_number": "MOGU-2024-001",
    "holder_name": "Sarah Johnson",
    "issue_date": "2024-06-15",
    "status": "valid",
    "program_name": "Project Management Professional",
    "training_center": "Excellence Training Institute",
    "country": "Canada"
  }
}
```

### Get Statistics

**Endpoint**: `GET /api/stats`

**Response**:
```json
{
  "success": true,
  "stats": {
    "accreditedCenters": 3,
    "accreditedPrograms": 5,
    "issuedCertificates": 8
  }
}
```

## Sample Data

The database includes sample data for testing:

- **3 Training Centers**: Excellence Training Institute, Professional Development Center, Leadership Academy
- **5 Training Programs**: PMP, Digital Marketing, Leadership, Data Analytics, Executive Coaching
- **8 Certificates**: MOGU-2024-001 through MOGU-2024-008
- **7 Accreditation Standards**: MOGU Method components + institutional standards

## Development Setup

### Prerequisites
- Node.js 18+
- npm or pnpm

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd webapp
```

2. Install dependencies:
```bash
npm install
```

3. Initialize database:
```bash
npm run db:migrate:local
npm run db:seed
```

4. Build the project:
```bash
npm run build
```

5. Start development server:
```bash
npm run clean-port
pm2 start ecosystem.config.cjs
```

6. Access the website:
- Local: http://localhost:3000
- Public: https://3000-ife4zimfunsdxfan09n1m-dfc00ec5.sandbox.novita.ai

## Available Scripts

```json
{
  "dev": "vite",
  "dev:sandbox": "wrangler pages dev dist --d1=webapp-production --local --ip 0.0.0.0 --port 3000",
  "build": "vite build",
  "deploy": "npm run build && wrangler pages deploy",
  "deploy:prod": "npm run build && wrangler pages deploy dist --project-name webapp",
  "db:migrate:local": "wrangler d1 migrations apply webapp-production --local",
  "db:seed": "wrangler d1 execute webapp-production --local --file=./seed.sql",
  "db:reset": "rm -rf .wrangler/state/v3/d1 && npm run db:migrate:local && npm run db:seed",
  "clean-port": "fuser -k 3000/tcp 2>/dev/null || true"
}
```

## MOGU Edu Method Workflow

1. **Training Organization Submits Application**
   - Complete documentation package submitted
   - Includes trainer credentials, materials, processes, methods

2. **MOGU Edu Reviews & Approves Program**
   - Comprehensive evaluation against MOGU Method standards
   - All 4 components assessed

3. **Program Accreditation Confirmation Sent**
   - Official accreditation confirmation issued
   - Unique program code assigned

4. **Program Scheduled & Delivered**
   - Training organization conducts program
   - Follows approved methodology

5. **Certificates Accredited for Attendees**
   - Upon completion, MOGU Edu accredits certificates
   - Based on pre-approved methodology
   - Listed in verification system

## Deployment to Cloudflare Pages

### Prerequisites
1. Cloudflare account
2. Wrangler CLI configured

### Steps

1. **Create D1 Database**:
```bash
npx wrangler d1 create webapp-production
# Copy database_id to wrangler.jsonc
```

2. **Apply Migrations to Production**:
```bash
npx wrangler d1 migrations apply webapp-production
```

3. **Create Cloudflare Pages Project**:
```bash
npx wrangler pages project create moguedu --production-branch main
```

4. **Deploy**:
```bash
npm run deploy:prod
```

5. **Access**:
- Production: https://moguedu.pages.dev
- Or your custom domain

## User Guide

### For Visitors
1. **Home Page**: Learn about MOGU Education and view statistics
2. **About Page**: Understand our mission, vision, and legal status
3. **Services Page**: Explore accreditation services offered
4. **Standards Page**: Learn about the MOGU Edu Method
5. **Verify Certificate**: Check certificate authenticity online
6. **Accredited Centers**: Browse accredited training institutions
7. **Contact**: Reach out for inquiries or accreditation applications

### For Training Centers
1. Review accreditation standards and requirements
2. Prepare documentation (trainer credentials, materials, processes)
3. Submit application via contact form
4. Undergo evaluation process
5. Receive accreditation upon approval
6. Issue MOGU-accredited certificates to graduates

### For Certificate Holders
1. Navigate to "Verify Certificate" page
2. Enter certificate number or your name
3. View certificate details and validity status
4. Share verification link with employers

### For Employers
1. Visit "Verify Certificate" page
2. Enter candidate's certificate number or name
3. Verify certificate authenticity
4. Check training center accreditation status

## Next Steps & Future Enhancements

### Pending Features
- Admin dashboard for certificate management
- PDF certificate download with QR codes
- Multi-language support (Arabic + English)
- Email notification system
- Online application portal for training centers
- Payment integration for accreditation fees
- Automated expiry date tracking
- Certificate renewal system

### Recommended Development Priorities
1. Admin authentication and dashboard
2. QR code generation for certificates
3. PDF certificate templates
4. Email notification service
5. Online application submission system

## Technical Notes

- **Environment**: Cloudflare Workers (edge runtime)
- **Database**: D1 (local SQLite for dev, D1 for production)
- **No file system access**: All data stored in database
- **Static assets**: Served from `public/` directory
- **API design**: RESTful with JSON responses
- **Security**: Input validation, prepared statements for SQL
- **Performance**: Edge deployment for global low latency

## Support & Contact

- **Email**: info@moguedu.ca
- **Website**: https://moguedu.ca (production)
- **Business Hours**: Mon-Fri, 9AM-5PM EST
- **Location**: Canada

## Legal Notice

MOGU Education is a Canadian registered accreditation body. Accreditation does not represent governmental endorsement. All displayed data complies with privacy and data protection regulations.

## License

© 2024 MOGU Education. All rights reserved.

---

**Accrediting Excellence. Empowering Learning.**

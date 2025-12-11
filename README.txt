Notes for Flood Relief - Supabase Integrated Version
---------------------------------------------------
A fully functional web application for sharing study materials with Supabase backend.

Features:
✅ Supabase PostgreSQL Database Integration
✅ Supabase Storage for File Uploads
✅ Real-time File Upload/Download
✅ Bilingual Support (English/Sinhala)
✅ File Type Detection & Icons
✅ Download Counter
✅ Report/Moderation System
✅ Responsive Design

Setup:
1. Create a Supabase project at https://supabase.com
2. Run the SQL commands in SQL Editor to create tables
3. Update app.js with your Supabase URL and anon key
4. All files should be in the same folder
5. Open index.html in a web browser

Supabase Services Used:
- PostgreSQL Database (for metadata)
- Storage (for files)
- Row Level Security (for permissions)

File Support:
- PDF, DOC, DOCX, JPG, PNG
- Max file size: 10MB

Languages:
- English (default)
- Sinhala (toggle with language button)

Deployment:
This can be deployed to any static hosting service (Netlify, Vercel, GitHub Pages).
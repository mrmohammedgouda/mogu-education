import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serveStatic } from 'hono/cloudflare-workers'

type Bindings = {
  DB: D1Database
}

const app = new Hono<{ Bindings: Bindings }>()

// Enable CORS for API routes
app.use('/api/*', cors())

// Serve static files
app.use('/static/*', serveStatic({ root: './public' }))

// Serve logo file
app.get('/mogu-logo.png', serveStatic({ path: './mogu-logo.png' }))

// API Routes

// Certificate Verification API
app.post('/api/verify', async (c) => {
  const { DB } = c.env
  const body = await c.req.json()
  const { certificateNumber, holderName, trainingProvider } = body

  try {
    let query = `
      SELECT 
        c.certificate_number,
        c.holder_name,
        c.issue_date,
        c.expiry_date,
        c.status,
        p.program_name,
        p.program_code,
        tc.name as training_center,
        tc.country
      FROM certificates c
      JOIN training_programs p ON c.program_id = p.id
      JOIN training_centers tc ON c.center_id = tc.id
      WHERE 1=1
    `
    const params: any[] = []

    if (certificateNumber) {
      query += ` AND c.certificate_number = ?`
      params.push(certificateNumber)
    }
    if (holderName) {
      query += ` AND LOWER(c.holder_name) LIKE LOWER(?)`
      params.push(`%${holderName}%`)
    }
    if (trainingProvider) {
      query += ` AND LOWER(tc.name) LIKE LOWER(?)`
      params.push(`%${trainingProvider}%`)
    }

    const stmt = DB.prepare(query).bind(...params)
    const result = await stmt.first()

    if (!result) {
      return c.json({ 
        success: false, 
        message: 'Certificate not found in our records' 
      }, 404)
    }

    return c.json({
      success: true,
      certificate: result
    })
  } catch (error) {
    console.error('Verification error:', error)
    return c.json({ 
      success: false, 
      message: 'Error verifying certificate' 
    }, 500)
  }
})

// Search Certificates API
app.get('/api/certificates/search', async (c) => {
  const { DB } = c.env
  const searchTerm = c.req.query('q') || ''

  try {
    const stmt = DB.prepare(`
      SELECT 
        c.certificate_number,
        c.holder_name,
        c.issue_date,
        c.status,
        p.program_name,
        tc.name as training_center
      FROM certificates c
      JOIN training_programs p ON c.program_id = p.id
      JOIN training_centers tc ON c.center_id = tc.id
      WHERE 
        LOWER(c.holder_name) LIKE LOWER(?) OR
        LOWER(c.certificate_number) LIKE LOWER(?) OR
        LOWER(tc.name) LIKE LOWER(?)
      ORDER BY c.issue_date DESC
      LIMIT 20
    `).bind(`%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`)

    const { results } = await stmt.all()

    return c.json({
      success: true,
      results: results || []
    })
  } catch (error) {
    console.error('Search error:', error)
    return c.json({ 
      success: false, 
      message: 'Error searching certificates' 
    }, 500)
  }
})

// Get Accredited Centers
app.get('/api/centers', async (c) => {
  const { DB } = c.env

  try {
    const stmt = DB.prepare(`
      SELECT 
        id,
        name,
        country,
        accreditation_status,
        accreditation_date,
        website
      FROM training_centers
      WHERE accreditation_status = 'active'
      ORDER BY name
    `)

    const { results } = await stmt.all()

    return c.json({
      success: true,
      centers: results || []
    })
  } catch (error) {
    console.error('Centers error:', error)
    return c.json({ 
      success: false, 
      message: 'Error fetching centers' 
    }, 500)
  }
})

// Get Accreditation Standards (MOGU Method)
app.get('/api/standards', async (c) => {
  const { DB } = c.env

  try {
    const stmt = DB.prepare(`
      SELECT 
        standard_name,
        category,
        description
      FROM accreditation_standards
      ORDER BY category, standard_name
    `)

    const { results } = await stmt.all()

    return c.json({
      success: true,
      standards: results || []
    })
  } catch (error) {
    console.error('Standards error:', error)
    return c.json({ 
      success: false, 
      message: 'Error fetching standards' 
    }, 500)
  }
})

// Get Statistics
app.get('/api/stats', async (c) => {
  const { DB } = c.env

  try {
    const centersCount = await DB.prepare(
      `SELECT COUNT(*) as count FROM training_centers WHERE accreditation_status = 'active'`
    ).first()

    const programsCount = await DB.prepare(
      `SELECT COUNT(*) as count FROM training_programs WHERE accreditation_status = 'active'`
    ).first()

    const certificatesCount = await DB.prepare(
      `SELECT COUNT(*) as count FROM certificates WHERE status = 'valid'`
    ).first()

    return c.json({
      success: true,
      stats: {
        accreditedCenters: centersCount?.count || 0,
        accreditedPrograms: programsCount?.count || 0,
        issuedCertificates: certificatesCount?.count || 0
      }
    })
  } catch (error) {
    console.error('Stats error:', error)
    return c.json({ 
      success: false, 
      message: 'Error fetching statistics' 
    }, 500)
  }
})

// ============================================

// ============================================
// ADMIN AUTHENTICATION & MANAGEMENT SYSTEM
// ============================================

// Admin Authentication & Session Management Helper Functions

// Simple password hashing (in production, use bcrypt)
function hashPassword(password: string): string {
  // For demo: simple hash. In production, use proper bcrypt
  return btoa(password + 'MOGU_SALT_2024');
}

function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash;
}

function generateSessionToken(): string {
  return btoa(Math.random().toString(36) + Date.now().toString(36));
}

// Admin Authentication Middleware
async function adminAuth(c: any, next: any) {
  const sessionToken = c.req.cookie('admin_session');
  
  if (!sessionToken) {
    return c.redirect('/admin/login');
  }

  const { DB } = c.env;
  const session = await DB.prepare(`
    SELECT s.*, u.username, u.full_name, u.role 
    FROM admin_sessions s
    JOIN admin_users u ON s.admin_id = u.id
    WHERE s.session_token = ? AND s.expires_at > datetime('now') AND u.is_active = 1
  `).bind(sessionToken).first();

  if (!session) {
    return c.redirect('/admin/login');
  }

  c.set('admin', session);
  await next();
}

// Admin Login API
app.post('/api/admin/login', async (c) => {
  const { DB } = c.env;
  const { username, password } = await c.req.json();

  try {
    const user = await DB.prepare(`
      SELECT * FROM admin_users WHERE username = ? AND is_active = 1
    `).bind(username).first();

    if (!user || !verifyPassword(password, user.password_hash)) {
      return c.json({ success: false, message: 'Invalid credentials' }, 401);
    }

    // Create session
    const sessionToken = generateSessionToken();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24 hours

    await DB.prepare(`
      INSERT INTO admin_sessions (admin_id, session_token, expires_at)
      VALUES (?, ?, ?)
    `).bind(user.id, sessionToken, expiresAt).run();

    // Update last login
    await DB.prepare(`
      UPDATE admin_users SET last_login = datetime('now') WHERE id = ?
    `).bind(user.id).run();

    return c.json({ 
      success: true, 
      sessionToken,
      user: {
        id: user.id,
        username: user.username,
        full_name: user.full_name,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return c.json({ success: false, message: 'Login failed' }, 500);
  }
});

// Admin Logout API
app.post('/api/admin/logout', async (c) => {
  const { DB } = c.env;
  const sessionToken = c.req.cookie('admin_session');

  if (sessionToken) {
    await DB.prepare(`DELETE FROM admin_sessions WHERE session_token = ?`)
      .bind(sessionToken).run();
  }

  return c.json({ success: true });
});

// Admin Change Password API
app.post('/api/admin/change-password', async (c) => {
  const { DB } = c.env;
  const sessionToken = c.req.cookie('admin_session');
  
  if (!sessionToken) {
    return c.json({ success: false, message: 'Unauthorized' }, 401);
  }

  try {
    const { currentPassword, newPassword } = await c.req.json();

    // Validate input
    if (!currentPassword || !newPassword) {
      return c.json({ success: false, message: 'Current password and new password are required' }, 400);
    }

    if (newPassword.length < 6) {
      return c.json({ success: false, message: 'New password must be at least 6 characters' }, 400);
    }

    // Get admin user from session
    const session = await DB.prepare(`
      SELECT s.admin_id, u.username, u.password_hash 
      FROM admin_sessions s
      JOIN admin_users u ON s.admin_id = u.id
      WHERE s.session_token = ? AND s.expires_at > datetime('now')
    `).bind(sessionToken).first();

    if (!session) {
      return c.json({ success: false, message: 'Invalid session' }, 401);
    }

    // Verify current password
    if (!verifyPassword(currentPassword, session.password_hash)) {
      return c.json({ success: false, message: 'Current password is incorrect' }, 401);
    }

    // Update password (direct hash - simple method)
    await DB.prepare(`
      UPDATE admin_users 
      SET password_hash = ? 
      WHERE id = ?
    `).bind(newPassword, session.admin_id).run();

    return c.json({ success: true, message: 'Password changed successfully' });

  } catch (error) {
    console.error('Change password error:', error);
    return c.json({ success: false, message: 'Failed to change password' }, 500);
  }
});

// Admin API - Get all certificates
app.get('/api/admin/certificates', async (c) => {
  const { DB } = c.env;

  try {
    const stmt = DB.prepare(`
      SELECT 
        c.id,
        c.certificate_number,
        c.holder_name,
        c.issue_date,
        c.expiry_date,
        c.status,
        p.program_name,
        p.program_code,
        tc.name as training_center
      FROM certificates c
      JOIN training_programs p ON c.program_id = p.id
      JOIN training_centers tc ON c.center_id = tc.id
      ORDER BY c.created_at DESC
    `);

    const { results } = await stmt.all();
    return c.json({ success: true, certificates: results || [] });
  } catch (error) {
    console.error('Error fetching certificates:', error);
    return c.json({ success: false, message: 'Error fetching certificates' }, 500);
  }
});

// Admin API - Add certificate
app.post('/api/admin/certificates', async (c) => {
  const { DB } = c.env;
  const data = await c.req.json();

  try {
    const result = await DB.prepare(`
      INSERT INTO certificates (certificate_number, holder_name, program_id, center_id, issue_date, expiry_date, status)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(
      data.certificate_number,
      data.holder_name,
      data.program_id,
      data.center_id,
      data.issue_date,
      data.expiry_date || null,
      data.status || 'valid'
    ).run();

    return c.json({ success: true, id: result.meta.last_row_id });
  } catch (error) {
    console.error('Error adding certificate:', error);
    return c.json({ success: false, message: 'Error adding certificate' }, 500);
  }
});

// Admin API - Update certificate
app.put('/api/admin/certificates/:id', async (c) => {
  const { DB } = c.env;
  const id = c.req.param('id');
  const data = await c.req.json();

  try {
    await DB.prepare(`
      UPDATE certificates 
      SET certificate_number = ?, holder_name = ?, program_id = ?, center_id = ?, 
          issue_date = ?, expiry_date = ?, status = ?, updated_at = datetime('now')
      WHERE id = ?
    `).bind(
      data.certificate_number,
      data.holder_name,
      data.program_id,
      data.center_id,
      data.issue_date,
      data.expiry_date || null,
      data.status,
      id
    ).run();

    return c.json({ success: true });
  } catch (error) {
    console.error('Error updating certificate:', error);
    return c.json({ success: false, message: 'Error updating certificate' }, 500);
  }
});

// Admin API - Delete certificate
app.delete('/api/admin/certificates/:id', async (c) => {
  const { DB } = c.env;
  const id = c.req.param('id');

  try {
    await DB.prepare(`DELETE FROM certificates WHERE id = ?`).bind(id).run();
    return c.json({ success: true });
  } catch (error) {
    console.error('Error deleting certificate:', error);
    return c.json({ success: false, message: 'Error deleting certificate' }, 500);
  }
});

// Admin API - Get all programs
app.get('/api/admin/programs', async (c) => {
  const { DB } = c.env;

  try {
    const stmt = DB.prepare(`
      SELECT p.*, tc.name as center_name
      FROM training_programs p
      JOIN training_centers tc ON p.center_id = tc.id
      ORDER BY p.program_name
    `);

    const { results } = await stmt.all();
    return c.json({ success: true, programs: results || [] });
  } catch (error) {
    return c.json({ success: false, message: 'Error fetching programs' }, 500);
  }
});

// Admin API - Get all centers (simple list for dropdowns)
app.get('/api/admin/centers/list', async (c) => {
  const { DB } = c.env;

  try {
    const stmt = DB.prepare(`SELECT id, name FROM training_centers WHERE accreditation_status = 'active' ORDER BY name`);
    const { results } = await stmt.all();
    return c.json({ success: true, centers: results || [] });
  } catch (error) {
    return c.json({ success: false, message: 'Error fetching centers' }, 500);
  }
});
// Admin Login Page
app.get('/admin/login', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Admin Login - MOGU Edu</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <style>
          .gradient-bg { background: linear-gradient(135deg, #8B1D1D 0%, #1F1F1F 100%); }
        </style>
    </head>
    <body class="gradient-bg min-h-screen flex items-center justify-center">
        <div class="bg-white p-8 rounded-lg shadow-2xl w-full max-w-md">
            <div class="text-center mb-8">
                <img src="/mogu-logo.png" alt="MOGU Edu" class="h-16 mx-auto mb-4">
                <h1 class="text-2xl font-bold text-gray-800">Admin Login</h1>
                <p class="text-gray-600 mt-2">MOGU Education Administration Panel</p>
            </div>

            <form id="login-form" class="space-y-6">
                <div>
                    <label class="block text-gray-700 font-semibold mb-2">
                        <i class="fas fa-user mr-2"></i>Username
                    </label>
                    <input 
                        type="text" 
                        id="username"
                        required
                        class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-800"
                        placeholder="Enter your username">
                </div>

                <div>
                    <label class="block text-gray-700 font-semibold mb-2">
                        <i class="fas fa-lock mr-2"></i>Password
                    </label>
                    <input 
                        type="password" 
                        id="password"
                        required
                        class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-800"
                        placeholder="Enter your password">
                </div>

                <div id="error-message" class="hidden p-3 bg-red-50 border-l-4 border-red-500 text-red-700 rounded"></div>

                <button 
                    type="submit"
                    class="w-full bg-red-800 text-white py-3 rounded-lg font-semibold hover:bg-red-900 transition">
                    <i class="fas fa-sign-in-alt mr-2"></i>Login
                </button>
            </form>

            <div class="mt-6 text-center">
                <a href="/" class="text-red-800 hover:underline text-sm">
                    <i class="fas fa-arrow-left mr-1"></i>Back to Website
                </a>
            </div>
        </div>

        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <script>
          document.getElementById('login-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            const errorDiv = document.getElementById('error-message');

            errorDiv.classList.add('hidden');

            try {
              const response = await axios.post('/api/admin/login', { username, password });
              
              if (response.data.success) {
                document.cookie = 'admin_session=' + response.data.sessionToken + '; path=/; max-age=86400';
                window.location.href = '/admin/dashboard';
              } else {
                errorDiv.textContent = response.data.message || 'Invalid credentials';
                errorDiv.classList.remove('hidden');
              }
            } catch (error) {
              errorDiv.textContent = 'Login failed. Please check your credentials.';
              errorDiv.classList.remove('hidden');
            }
          });
        </script>
    </body>
    </html>
  `)
})

// Admin Dashboard Page
app.get('/admin/dashboard', async (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Admin Dashboard - MOGU Edu</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    </head>
    <body class="bg-gray-100">
        <!-- Admin Navigation -->
        <nav class="bg-red-800 text-white shadow-lg">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="flex justify-between items-center h-16">
                    <div class="flex items-center">
                        <img src="/mogu-logo.png" alt="MOGU Edu" class="h-12 brightness-0 invert">
                        <span class="ml-3 text-xl font-bold">Admin Panel</span>
                    </div>
                    <div class="flex items-center space-x-6">
                        <a href="/admin/dashboard" class="hover:text-gray-200 font-semibold border-b-2 border-white pb-1">
                            <i class="fas fa-home mr-1"></i>Dashboard
                        </a>
                        <a href="/admin/certificates" class="hover:text-gray-200">
                            <i class="fas fa-certificate mr-1"></i>Certificates
                        </a>
                        <a href="/admin/centers" class="hover:text-gray-200">
                            <i class="fas fa-building mr-1"></i>Centers
                        </a>
                        <a href="/admin/programs" class="hover:text-gray-200">
                            <i class="fas fa-book mr-1"></i>Programs
                        </a>
                        <button onclick="logout()" class="hover:text-gray-200">
                            <i class="fas fa-sign-out-alt mr-1"></i>Logout
                        </button>
                    </div>
                </div>
            </div>
        </nav>

        <!-- Dashboard Content -->
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <h1 class="text-3xl font-bold text-gray-800 mb-8">
                <i class="fas fa-chart-line mr-2"></i>Dashboard Overview
            </h1>

            <!-- Statistics Cards -->
            <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div class="bg-white p-6 rounded-lg shadow-md">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-gray-500 text-sm">Total Certificates</p>
                            <p class="text-3xl font-bold text-gray-800" id="total-certificates">-</p>
                        </div>
                        <div class="text-4xl text-blue-500">
                            <i class="fas fa-certificate"></i>
                        </div>
                    </div>
                </div>

                <div class="bg-white p-6 rounded-lg shadow-md">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-gray-500 text-sm">Active Centers</p>
                            <p class="text-3xl font-bold text-gray-800" id="total-centers">-</p>
                        </div>
                        <div class="text-4xl text-green-500">
                            <i class="fas fa-building"></i>
                        </div>
                    </div>
                </div>

                <div class="bg-white p-6 rounded-lg shadow-md">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-gray-500 text-sm">Active Programs</p>
                            <p class="text-3xl font-bold text-gray-800" id="total-programs">-</p>
                        </div>
                        <div class="text-4xl text-purple-500">
                            <i class="fas fa-book"></i>
                        </div>
                    </div>
                </div>

                <div class="bg-white p-6 rounded-lg shadow-md">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-gray-500 text-sm">Valid Certificates</p>
                            <p class="text-3xl font-bold text-gray-800" id="valid-certificates">-</p>
                        </div>
                        <div class="text-4xl text-green-600">
                            <i class="fas fa-check-circle"></i>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Quick Actions -->
            <div class="bg-white p-6 rounded-lg shadow-md">
                <h2 class="text-xl font-bold text-gray-800 mb-4">
                    <i class="fas fa-bolt mr-2"></i>Quick Actions
                </h2>
                <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <a href="/admin/certificates?action=add" class="bg-blue-50 border-2 border-blue-200 p-4 rounded-lg hover:bg-blue-100 transition text-center">
                        <i class="fas fa-plus-circle text-3xl text-blue-600 mb-2"></i>
                        <p class="font-semibold text-blue-800">Add New Certificate</p>
                    </a>
                    <a href="/admin/centers?action=add" class="bg-green-50 border-2 border-green-200 p-4 rounded-lg hover:bg-green-100 transition text-center">
                        <i class="fas fa-building text-3xl text-green-600 mb-2"></i>
                        <p class="font-semibold text-green-800">Add Training Center</p>
                    </a>
                    <a href="/admin/programs?action=add" class="bg-purple-50 border-2 border-purple-200 p-4 rounded-lg hover:bg-purple-100 transition text-center">
                        <i class="fas fa-book text-3xl text-purple-600 mb-2"></i>
                        <p class="font-semibold text-purple-800">Add Training Program</p>
                    </a>
                    <a href="/admin/change-password" class="bg-orange-50 border-2 border-orange-200 p-4 rounded-lg hover:bg-orange-100 transition text-center">
                        <i class="fas fa-key text-3xl text-orange-600 mb-2"></i>
                        <p class="font-semibold text-orange-800">Change Password</p>
                    </a>
                </div>
            </div>
        </div>

        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <script>
          // Load statistics
          axios.get('/api/stats')
            .then(response => {
              if (response.data.success) {
                const stats = response.data.stats;
                document.getElementById('total-certificates').textContent = stats.issuedCertificates;
                document.getElementById('total-centers').textContent = stats.accreditedCenters;
                document.getElementById('total-programs').textContent = stats.accreditedPrograms;
                document.getElementById('valid-certificates').textContent = stats.issuedCertificates;
              }
            })
            .catch(error => console.error('Error loading stats:', error));

          function logout() {
            axios.post('/api/admin/logout')
              .then(() => {
                document.cookie = 'admin_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
                window.location.href = '/admin/login';
              })
              .catch(error => console.error('Logout error:', error));
          }
        </script>
    </body>
    </html>
  `)
})
// ============================================
// ADMIN CERTIFICATE MANAGEMENT PAGE
// ============================================

app.get('/admin/certificates', async (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Manage Certificates - MOGU Edu</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    </head>
    <body class="bg-gray-100">
        <!-- Admin Navigation -->
        <nav class="bg-red-800 text-white shadow-lg">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="flex justify-between items-center h-16">
                    <div class="flex items-center">
                        <img src="/mogu-logo.png" alt="MOGU Edu" class="h-12">
                        <span class="ml-3 text-xl font-bold">Admin Panel</span>
                    </div>
                    <div class="flex items-center space-x-6">
                        <a href="/admin/dashboard" class="hover:text-gray-200">
                            <i class="fas fa-home mr-1"></i>Dashboard
                        </a>
                        <a href="/admin/certificates" class="hover:text-gray-200 font-semibold border-b-2 border-white pb-1">
                            <i class="fas fa-certificate mr-1"></i>Certificates
                        </a>
                        <a href="/admin/centers" class="hover:text-gray-200">
                            <i class="fas fa-building mr-1"></i>Centers
                        </a>
                        <a href="/admin/programs" class="hover:text-gray-200">
                            <i class="fas fa-book mr-1"></i>Programs
                        </a>
                        <button onclick="logout()" class="hover:text-gray-200">
                            <i class="fas fa-sign-out-alt mr-1"></i>Logout
                        </button>
                    </div>
                </div>
            </div>
        </nav>

        <!-- Main Content -->
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div class="flex justify-between items-center mb-6">
                <h1 class="text-3xl font-bold text-gray-800">
                    <i class="fas fa-certificate mr-2"></i>Certificate Management
                </h1>
                <button onclick="showAddModal()" class="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition">
                    <i class="fas fa-plus mr-2"></i>Add Certificate
                </button>
            </div>

            <!-- Search Bar -->
            <div class="bg-white p-4 rounded-lg shadow-md mb-6">
                <div class="flex gap-4">
                    <input 
                        type="text" 
                        id="search-input" 
                        placeholder="Search by certificate number or holder name..."
                        class="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-800">
                    <button onclick="searchCertificates()" class="bg-red-800 text-white px-6 py-2 rounded-lg hover:bg-red-900 transition">
                        <i class="fas fa-search mr-2"></i>Search
                    </button>
                </div>
            </div>

            <!-- Certificates Table -->
            <div class="bg-white rounded-lg shadow-md overflow-hidden">
                <table class="w-full">
                    <thead class="bg-gray-200">
                        <tr>
                            <th class="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Certificate #</th>
                            <th class="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Holder Name</th>
                            <th class="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Program</th>
                            <th class="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Issue Date</th>
                            <th class="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Status</th>
                            <th class="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody id="certificates-table" class="divide-y divide-gray-200">
                        <tr>
                            <td colspan="6" class="px-6 py-12 text-center text-gray-500">
                                <i class="fas fa-spinner fa-spin text-3xl mb-2"></i>
                                <p>Loading certificates...</p>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>

        <!-- Add/Edit Modal -->
        <div id="modal" class="hidden fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div class="bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-screen overflow-y-auto m-4">
                <div class="bg-red-800 text-white px-6 py-4 flex justify-between items-center">
                    <h2 id="modal-title" class="text-xl font-bold">Add New Certificate</h2>
                    <button onclick="closeModal()" class="text-white hover:text-gray-200">
                        <i class="fas fa-times text-2xl"></i>
                    </button>
                </div>
                
                <form id="certificate-form" class="p-6 space-y-4">
                    <input type="hidden" id="cert-id">
                    
                    <div>
                        <label class="block text-gray-700 font-semibold mb-2">Certificate Number *</label>
                        <input type="text" id="cert-number" required
                            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-800"
                            placeholder="e.g., MOGU-2024-001">
                    </div>

                    <div>
                        <label class="block text-gray-700 font-semibold mb-2">Holder Name *</label>
                        <input type="text" id="cert-holder" required
                            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-800"
                            placeholder="Full name of certificate holder">
                    </div>

                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="block text-gray-700 font-semibold mb-2">Training Center *</label>
                            <select id="cert-center" required
                                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-800">
                                <option value="">Loading...</option>
                            </select>
                        </div>

                        <div>
                            <label class="block text-gray-700 font-semibold mb-2">Training Program *</label>
                            <select id="cert-program" required
                                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-800">
                                <option value="">Select center first</option>
                            </select>
                        </div>
                    </div>

                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="block text-gray-700 font-semibold mb-2">Issue Date *</label>
                            <input type="date" id="cert-issue-date" required
                                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-800">
                        </div>

                        <div>
                            <label class="block text-gray-700 font-semibold mb-2">Expiry Date</label>
                            <input type="date" id="cert-expiry-date"
                                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-800">
                        </div>
                    </div>

                    <div>
                        <label class="block text-gray-700 font-semibold mb-2">Status *</label>
                        <select id="cert-status" required
                            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-800">
                            <option value="valid">Valid</option>
                            <option value="expired">Expired</option>
                            <option value="suspended">Suspended</option>
                        </select>
                    </div>

                    <div class="flex gap-4 pt-4">
                        <button type="submit" class="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition font-semibold">
                            <i class="fas fa-save mr-2"></i>Save Certificate
                        </button>
                        <button type="button" onclick="closeModal()" class="flex-1 bg-gray-400 text-white py-2 rounded-lg hover:bg-gray-500 transition font-semibold">
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>

        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <script>
          let allCertificates = [];
          let allCenters = [];
          let allPrograms = [];

          // Load data on page load
          window.onload = async () => {
            await loadCenters();
            await loadPrograms();
            await loadCertificates();
          };

          async function loadCertificates() {
            try {
              const response = await axios.get('/api/admin/certificates');
              if (response.data.success) {
                allCertificates = response.data.certificates;
                displayCertificates(allCertificates);
              }
            } catch (error) {
              console.error('Error loading certificates:', error);
              alert('Error loading certificates');
            }
          }

          async function loadCenters() {
            try {
              const response = await axios.get('/api/admin/centers/list');
              if (response.data.success) {
                allCenters = response.data.centers;
                const select = document.getElementById('cert-center');
                select.innerHTML = '<option value="">Select center</option>';
                allCenters.forEach(center => {
                  select.innerHTML += \`<option value="\${center.id}">\${center.name}</option>\`;
                });
              }
            } catch (error) {
              console.error('Error loading centers:', error);
            }
          }

          async function loadPrograms() {
            try {
              const response = await axios.get('/api/admin/programs');
              if (response.data.success) {
                allPrograms = response.data.programs;
              }
            } catch (error) {
              console.error('Error loading programs:', error);
            }
          }

          // Update program dropdown based on selected center
          document.getElementById('cert-center').addEventListener('change', function() {
            const centerId = this.value;
            const programSelect = document.getElementById('cert-program');
            
            if (!centerId) {
              programSelect.innerHTML = '<option value="">Select center first</option>';
              return;
            }

            const centerPrograms = allPrograms.filter(p => p.center_id == centerId);
            programSelect.innerHTML = '<option value="">Select program</option>';
            centerPrograms.forEach(prog => {
              programSelect.innerHTML += \`<option value="\${prog.id}">\${prog.program_name} (\${prog.program_code})</option>\`;
            });
          });

          function displayCertificates(certificates) {
            const tbody = document.getElementById('certificates-table');
            
            if (certificates.length === 0) {
              tbody.innerHTML = \`
                <tr>
                  <td colspan="6" class="px-6 py-12 text-center text-gray-500">
                    <i class="fas fa-inbox text-3xl mb-2"></i>
                    <p>No certificates found</p>
                  </td>
                </tr>
              \`;
              return;
            }

            tbody.innerHTML = certificates.map(cert => \`
              <tr class="hover:bg-gray-50">
                <td class="px-6 py-4 font-mono text-sm">\${cert.certificate_number}</td>
                <td class="px-6 py-4">\${cert.holder_name}</td>
                <td class="px-6 py-4">
                  <div class="text-sm font-semibold">\${cert.program_name}</div>
                  <div class="text-xs text-gray-500">\${cert.training_center}</div>
                </td>
                <td class="px-6 py-4 text-sm">\${cert.issue_date}</td>
                <td class="px-6 py-4">
                  <span class="px-2 py-1 rounded-full text-xs font-semibold 
                    \${cert.status === 'valid' ? 'bg-green-100 text-green-800' : 
                      cert.status === 'expired' ? 'bg-red-100 text-red-800' : 
                      'bg-yellow-100 text-yellow-800'}">
                    \${cert.status.toUpperCase()}
                  </span>
                </td>
                <td class="px-6 py-4">
                  <button onclick="editCertificate(\${cert.id})" class="text-blue-600 hover:text-blue-800 mr-3" title="Edit">
                    <i class="fas fa-edit"></i>
                  </button>
                  <button onclick="deleteCertificate(\${cert.id})" class="text-red-600 hover:text-red-800" title="Delete">
                    <i class="fas fa-trash"></i>
                  </button>
                </td>
              </tr>
            \`).join('');
          }

          function showAddModal() {
            document.getElementById('modal-title').textContent = 'Add New Certificate';
            document.getElementById('certificate-form').reset();
            document.getElementById('cert-id').value = '';
            document.getElementById('modal').classList.remove('hidden');
          }

          function closeModal() {
            document.getElementById('modal').classList.add('hidden');
          }

          async function editCertificate(id) {
            const cert = allCertificates.find(c => c.id === id);
            if (!cert) return;

            document.getElementById('modal-title').textContent = 'Edit Certificate';
            document.getElementById('cert-id').value = cert.id;
            document.getElementById('cert-number').value = cert.certificate_number;
            document.getElementById('cert-holder').value = cert.holder_name;
            document.getElementById('cert-center').value = cert.center_id;
            
            // Trigger center change to load programs
            document.getElementById('cert-center').dispatchEvent(new Event('change'));
            
            setTimeout(() => {
              document.getElementById('cert-program').value = cert.program_id;
              document.getElementById('cert-issue-date').value = cert.issue_date;
              document.getElementById('cert-expiry-date').value = cert.expiry_date || '';
              document.getElementById('cert-status').value = cert.status;
            }, 100);

            document.getElementById('modal').classList.remove('hidden');
          }

          async function deleteCertificate(id) {
            if (!confirm('Are you sure you want to delete this certificate?')) return;

            try {
              const response = await axios.delete(\`/api/admin/certificates/\${id}\`);
              if (response.data.success) {
                alert('Certificate deleted successfully');
                await loadCertificates();
              }
            } catch (error) {
              console.error('Error deleting certificate:', error);
              alert('Error deleting certificate');
            }
          }

          document.getElementById('certificate-form').addEventListener('submit', async (e) => {
            e.preventDefault();

            const id = document.getElementById('cert-id').value;
            const data = {
              certificate_number: document.getElementById('cert-number').value,
              holder_name: document.getElementById('cert-holder').value,
              center_id: parseInt(document.getElementById('cert-center').value),
              program_id: parseInt(document.getElementById('cert-program').value),
              issue_date: document.getElementById('cert-issue-date').value,
              expiry_date: document.getElementById('cert-expiry-date').value || null,
              status: document.getElementById('cert-status').value
            };

            try {
              let response;
              if (id) {
                response = await axios.put(\`/api/admin/certificates/\${id}\`, data);
              } else {
                response = await axios.post('/api/admin/certificates', data);
              }

              if (response.data.success) {
                alert(id ? 'Certificate updated successfully' : 'Certificate added successfully');
                closeModal();
                await loadCertificates();
              }
            } catch (error) {
              console.error('Error saving certificate:', error);
              alert('Error saving certificate');
            }
          });

          function searchCertificates() {
            const searchTerm = document.getElementById('search-input').value.toLowerCase();
            if (!searchTerm) {
              displayCertificates(allCertificates);
              return;
            }

            const filtered = allCertificates.filter(cert => 
              cert.certificate_number.toLowerCase().includes(searchTerm) ||
              cert.holder_name.toLowerCase().includes(searchTerm)
            );
            displayCertificates(filtered);
          }

          function logout() {
            axios.post('/api/admin/logout')
              .then(() => {
                document.cookie = 'admin_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
                window.location.href = '/admin/login';
              })
              .catch(error => console.error('Logout error:', error));
          }
        </script>
    </body>
    </html>
  `)
})


// ============================================
// ADMIN CENTERS MANAGEMENT PAGE
// ============================================

app.get('/admin/centers', async (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Manage Centers - MOGU Edu</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    </head>
    <body class="bg-gray-100">
        <!-- Admin Navigation -->
        <nav class="bg-red-800 text-white shadow-lg">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="flex justify-between items-center h-16">
                    <div class="flex items-center">
                        <img src="/mogu-logo.png" alt="MOGU Edu" class="h-12">
                        <span class="ml-3 text-xl font-bold">Admin Panel</span>
                    </div>
                    <div class="flex items-center space-x-6">
                        <a href="/admin/dashboard" class="hover:text-gray-200">
                            <i class="fas fa-home mr-1"></i>Dashboard
                        </a>
                        <a href="/admin/certificates" class="hover:text-gray-200">
                            <i class="fas fa-certificate mr-1"></i>Certificates
                        </a>
                        <a href="/admin/centers" class="hover:text-gray-200 font-semibold border-b-2 border-white pb-1">
                            <i class="fas fa-building mr-1"></i>Centers
                        </a>
                        <a href="/admin/programs" class="hover:text-gray-200">
                            <i class="fas fa-book mr-1"></i>Programs
                        </a>
                        <button onclick="logout()" class="hover:text-gray-200">
                            <i class="fas fa-sign-out-alt mr-1"></i>Logout
                        </button>
                    </div>
                </div>
            </div>
        </nav>

        <!-- Main Content -->
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div class="flex justify-between items-center mb-6">
                <h1 class="text-3xl font-bold text-gray-800">
                    <i class="fas fa-building mr-2"></i>Training Centers Management
                </h1>
                <button onclick="showAddModal()" class="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition">
                    <i class="fas fa-plus mr-2"></i>Add Center
                </button>
            </div>

            <!-- Centers Grid -->
            <div id="centers-grid" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div class="col-span-full text-center py-12">
                    <i class="fas fa-spinner fa-spin text-4xl text-gray-400 mb-3"></i>
                    <p class="text-gray-500">Loading centers...</p>
                </div>
            </div>
        </div>

        <!-- Add/Edit Modal -->
        <div id="modal" class="hidden fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div class="bg-white rounded-lg shadow-2xl w-full max-w-2xl m-4">
                <div class="bg-red-800 text-white px-6 py-4 flex justify-between items-center">
                    <h2 id="modal-title" class="text-xl font-bold">Add New Center</h2>
                    <button onclick="closeModal()" class="text-white hover:text-gray-200">
                        <i class="fas fa-times text-2xl"></i>
                    </button>
                </div>
                
                <form id="center-form" class="p-6 space-y-4">
                    <input type="hidden" id="center-id">
                    
                    <div>
                        <label class="block text-gray-700 font-semibold mb-2">Center Name *</label>
                        <input type="text" id="center-name" required
                            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-800"
                            placeholder="Training center name">
                    </div>

                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="block text-gray-700 font-semibold mb-2">Country *</label>
                            <input type="text" id="center-country" required
                                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-800"
                                placeholder="e.g., Canada">
                        </div>

                        <div>
                            <label class="block text-gray-700 font-semibold mb-2">City</label>
                            <input type="text" id="center-city"
                                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-800"
                                placeholder="City name">
                        </div>
                    </div>

                    <div>
                        <label class="block text-gray-700 font-semibold mb-2">Website</label>
                        <input type="url" id="center-website"
                            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-800"
                            placeholder="https://example.com">
                    </div>

                    <div>
                        <label class="block text-gray-700 font-semibold mb-2">Accreditation Date *</label>
                        <input type="date" id="center-accred-date" required
                            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-800">
                    </div>

                    <div>
                        <label class="block text-gray-700 font-semibold mb-2">Status *</label>
                        <select id="center-status" required
                            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-800">
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                            <option value="suspended">Suspended</option>
                        </select>
                    </div>

                    <div class="flex gap-4 pt-4">
                        <button type="submit" class="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition font-semibold">
                            <i class="fas fa-save mr-2"></i>Save Center
                        </button>
                        <button type="button" onclick="closeModal()" class="flex-1 bg-gray-400 text-white py-2 rounded-lg hover:bg-gray-500 transition font-semibold">
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>

        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <script>
          let allCenters = [];

          window.onload = async () => {
            await loadCenters();
          };

          async function loadCenters() {
            try {
              const response = await axios.get('/api/admin/centers');
              if (response.data.success) {
                allCenters = response.data.centers;
                displayCenters(allCenters);
              }
            } catch (error) {
              console.error('Error loading centers:', error);
              alert('Error loading centers');
            }
          }

          function displayCenters(centers) {
            const grid = document.getElementById('centers-grid');
            
            if (centers.length === 0) {
              grid.innerHTML = \`
                <div class="col-span-full text-center py-12">
                  <i class="fas fa-inbox text-4xl text-gray-400 mb-3"></i>
                  <p class="text-gray-500">No centers found</p>
                </div>
              \`;
              return;
            }

            grid.innerHTML = centers.map(center => \`
              <div class="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition">
                <div class="flex items-start justify-between mb-4">
                  <div class="flex-1">
                    <h3 class="text-lg font-bold text-gray-800 mb-2">\${center.name}</h3>
                    <p class="text-sm text-gray-600">
                      <i class="fas fa-map-marker-alt mr-1"></i>
                      \${center.city ? center.city + ', ' : ''}\${center.country}
                    </p>
                  </div>
                  <span class="px-3 py-1 rounded-full text-xs font-semibold
                    \${center.accreditation_status === 'active' ? 'bg-green-100 text-green-800' : 
                      center.accreditation_status === 'suspended' ? 'bg-yellow-100 text-yellow-800' : 
                      'bg-red-100 text-red-800'}">
                    \${center.accreditation_status.toUpperCase()}
                  </span>
                </div>

                <div class="space-y-2 mb-4">
                  <p class="text-sm text-gray-600">
                    <i class="fas fa-calendar mr-2"></i>
                    Accredited: \${center.accreditation_date}
                  </p>
                  \${center.website ? \`
                    <p class="text-sm text-blue-600 hover:underline">
                      <i class="fas fa-globe mr-2"></i>
                      <a href="\${center.website}" target="_blank">\${center.website}</a>
                    </p>
                  \` : ''}
                </div>

                <div class="flex gap-2 pt-4 border-t">
                  <button onclick="editCenter(\${center.id})" class="flex-1 bg-blue-50 text-blue-600 px-4 py-2 rounded hover:bg-blue-100 transition">
                    <i class="fas fa-edit mr-1"></i>Edit
                  </button>
                  <button onclick="deleteCenter(\${center.id})" class="flex-1 bg-red-50 text-red-600 px-4 py-2 rounded hover:bg-red-100 transition">
                    <i class="fas fa-trash mr-1"></i>Delete
                  </button>
                </div>
              </div>
            \`).join('');
          }

          function showAddModal() {
            document.getElementById('modal-title').textContent = 'Add New Center';
            document.getElementById('center-form').reset();
            document.getElementById('center-id').value = '';
            document.getElementById('modal').classList.remove('hidden');
          }

          function closeModal() {
            document.getElementById('modal').classList.add('hidden');
          }

          async function editCenter(id) {
            const center = allCenters.find(c => c.id === id);
            if (!center) return;

            document.getElementById('modal-title').textContent = 'Edit Center';
            document.getElementById('center-id').value = center.id;
            document.getElementById('center-name').value = center.name;
            document.getElementById('center-country').value = center.country;
            document.getElementById('center-city').value = center.city || '';
            document.getElementById('center-website').value = center.website || '';
            document.getElementById('center-accred-date').value = center.accreditation_date;
            document.getElementById('center-status').value = center.accreditation_status;

            document.getElementById('modal').classList.remove('hidden');
          }

          async function deleteCenter(id) {
            if (!confirm('Are you sure you want to delete this center? This will affect related certificates and programs.')) return;

            try {
              const response = await axios.delete(\`/api/admin/centers/\${id}\`);
              if (response.data.success) {
                alert('Center deleted successfully');
                await loadCenters();
              }
            } catch (error) {
              console.error('Error deleting center:', error);
              alert('Error deleting center');
            }
          }

          document.getElementById('center-form').addEventListener('submit', async (e) => {
            e.preventDefault();

            const id = document.getElementById('center-id').value;
            const data = {
              name: document.getElementById('center-name').value,
              country: document.getElementById('center-country').value,
              city: document.getElementById('center-city').value || null,
              website: document.getElementById('center-website').value || null,
              accreditation_date: document.getElementById('center-accred-date').value,
              accreditation_status: document.getElementById('center-status').value
            };

            try {
              let response;
              if (id) {
                response = await axios.put(\`/api/admin/centers/\${id}\`, data);
              } else {
                response = await axios.post('/api/admin/centers', data);
              }

              if (response.data.success) {
                alert(id ? 'Center updated successfully' : 'Center added successfully');
                closeModal();
                await loadCenters();
              }
            } catch (error) {
              console.error('Error saving center:', error);
              alert('Error saving center');
            }
          });

          function logout() {
            axios.post('/api/admin/logout')
              .then(() => {
                document.cookie = 'admin_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
                window.location.href = '/admin/login';
              })
              .catch(error => console.error('Logout error:', error));
          }
        </script>
    </body>
    </html>
  `)
})


// ============================================
// ADMIN PROGRAMS MANAGEMENT PAGE
// ============================================

app.get('/admin/programs', async (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Manage Programs - MOGU Edu</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    </head>
    <body class="bg-gray-100">
        <!-- Admin Navigation -->
        <nav class="bg-red-800 text-white shadow-lg">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="flex justify-between items-center h-16">
                    <div class="flex items-center">
                        <img src="/mogu-logo.png" alt="MOGU Edu" class="h-12">
                        <span class="ml-3 text-xl font-bold">Admin Panel</span>
                    </div>
                    <div class="flex items-center space-x-6">
                        <a href="/admin/dashboard" class="hover:text-gray-200">
                            <i class="fas fa-home mr-1"></i>Dashboard
                        </a>
                        <a href="/admin/certificates" class="hover:text-gray-200">
                            <i class="fas fa-certificate mr-1"></i>Certificates
                        </a>
                        <a href="/admin/centers" class="hover:text-gray-200">
                            <i class="fas fa-building mr-1"></i>Centers
                        </a>
                        <a href="/admin/programs" class="hover:text-gray-200 font-semibold border-b-2 border-white pb-1">
                            <i class="fas fa-book mr-1"></i>Programs
                        </a>
                        <button onclick="logout()" class="hover:text-gray-200">
                            <i class="fas fa-sign-out-alt mr-1"></i>Logout
                        </button>
                    </div>
                </div>
            </div>
        </nav>

        <!-- Main Content -->
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div class="flex justify-between items-center mb-6">
                <h1 class="text-3xl font-bold text-gray-800">
                    <i class="fas fa-book mr-2"></i>Training Programs Management
                </h1>
                <button onclick="showAddModal()" class="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition">
                    <i class="fas fa-plus mr-2"></i>Add Program
                </button>
            </div>

            <!-- Programs Table -->
            <div class="bg-white rounded-lg shadow-md overflow-hidden">
                <table class="w-full">
                    <thead class="bg-gray-200">
                        <tr>
                            <th class="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Program Name</th>
                            <th class="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Code</th>
                            <th class="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Training Center</th>
                            <th class="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Accredited Date</th>
                            <th class="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Status</th>
                            <th class="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody id="programs-table" class="divide-y divide-gray-200">
                        <tr>
                            <td colspan="6" class="px-6 py-12 text-center text-gray-500">
                                <i class="fas fa-spinner fa-spin text-3xl mb-2"></i>
                                <p>Loading programs...</p>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>

        <!-- Add/Edit Modal -->
        <div id="modal" class="hidden fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div class="bg-white rounded-lg shadow-2xl w-full max-w-2xl m-4">
                <div class="bg-red-800 text-white px-6 py-4 flex justify-between items-center">
                    <h2 id="modal-title" class="text-xl font-bold">Add New Program</h2>
                    <button onclick="closeModal()" class="text-white hover:text-gray-200">
                        <i class="fas fa-times text-2xl"></i>
                    </button>
                </div>
                
                <form id="program-form" class="p-6 space-y-4">
                    <input type="hidden" id="program-id">
                    
                    <div>
                        <label class="block text-gray-700 font-semibold mb-2">Program Name *</label>
                        <input type="text" id="program-name" required
                            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-800"
                            placeholder="e.g., Project Management Professional">
                    </div>

                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="block text-gray-700 font-semibold mb-2">Program Code *</label>
                            <input type="text" id="program-code" required
                                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-800"
                                placeholder="e.g., PMP-2024">
                        </div>

                        <div>
                            <label class="block text-gray-700 font-semibold mb-2">Training Center *</label>
                            <select id="program-center" required
                                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-800">
                                <option value="">Loading...</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label class="block text-gray-700 font-semibold mb-2">Accreditation Date *</label>
                        <input type="date" id="program-accred-date" required
                            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-800">
                    </div>

                    <div>
                        <label class="block text-gray-700 font-semibold mb-2">Status *</label>
                        <select id="program-status" required
                            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-800">
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                        </select>
                    </div>

                    <div class="flex gap-4 pt-4">
                        <button type="submit" class="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition font-semibold">
                            <i class="fas fa-save mr-2"></i>Save Program
                        </button>
                        <button type="button" onclick="closeModal()" class="flex-1 bg-gray-400 text-white py-2 rounded-lg hover:bg-gray-500 transition font-semibold">
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>

        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <script>
          let allPrograms = [];
          let allCenters = [];

          window.onload = async () => {
            await loadCenters();
            await loadPrograms();
          };

          async function loadCenters() {
            try {
              const response = await axios.get('/api/admin/centers/list');
              if (response.data.success) {
                allCenters = response.data.centers;
                const select = document.getElementById('program-center');
                select.innerHTML = '<option value="">Select center</option>';
                allCenters.forEach(center => {
                  select.innerHTML += \`<option value="\${center.id}">\${center.name}</option>\`;
                });
              }
            } catch (error) {
              console.error('Error loading centers:', error);
            }
          }

          async function loadPrograms() {
            try {
              const response = await axios.get('/api/admin/programs');
              if (response.data.success) {
                allPrograms = response.data.programs;
                displayPrograms(allPrograms);
              }
            } catch (error) {
              console.error('Error loading programs:', error);
              alert('Error loading programs');
            }
          }

          function displayPrograms(programs) {
            const tbody = document.getElementById('programs-table');
            
            if (programs.length === 0) {
              tbody.innerHTML = \`
                <tr>
                  <td colspan="6" class="px-6 py-12 text-center text-gray-500">
                    <i class="fas fa-inbox text-3xl mb-2"></i>
                    <p>No programs found</p>
                  </td>
                </tr>
              \`;
              return;
            }

            tbody.innerHTML = programs.map(prog => \`
              <tr class="hover:bg-gray-50">
                <td class="px-6 py-4 font-semibold">\${prog.program_name}</td>
                <td class="px-6 py-4 font-mono text-sm">\${prog.program_code}</td>
                <td class="px-6 py-4 text-sm">\${prog.center_name}</td>
                <td class="px-6 py-4 text-sm">\${prog.accreditation_date}</td>
                <td class="px-6 py-4">
                  <span class="px-2 py-1 rounded-full text-xs font-semibold 
                    \${prog.accreditation_status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">
                    \${prog.accreditation_status.toUpperCase()}
                  </span>
                </td>
                <td class="px-6 py-4">
                  <button onclick="editProgram(\${prog.id})" class="text-blue-600 hover:text-blue-800 mr-3" title="Edit">
                    <i class="fas fa-edit"></i>
                  </button>
                  <button onclick="deleteProgram(\${prog.id})" class="text-red-600 hover:text-red-800" title="Delete">
                    <i class="fas fa-trash"></i>
                  </button>
                </td>
              </tr>
            \`).join('');
          }

          function showAddModal() {
            document.getElementById('modal-title').textContent = 'Add New Program';
            document.getElementById('program-form').reset();
            document.getElementById('program-id').value = '';
            document.getElementById('modal').classList.remove('hidden');
          }

          function closeModal() {
            document.getElementById('modal').classList.add('hidden');
          }

          async function editProgram(id) {
            const prog = allPrograms.find(p => p.id === id);
            if (!prog) return;

            document.getElementById('modal-title').textContent = 'Edit Program';
            document.getElementById('program-id').value = prog.id;
            document.getElementById('program-name').value = prog.program_name;
            document.getElementById('program-code').value = prog.program_code;
            document.getElementById('program-center').value = prog.center_id;
            document.getElementById('program-accred-date').value = prog.accreditation_date;
            document.getElementById('program-status').value = prog.accreditation_status;

            document.getElementById('modal').classList.remove('hidden');
          }

          async function deleteProgram(id) {
            if (!confirm('Are you sure you want to delete this program?')) return;

            try {
              const response = await axios.delete(\`/api/admin/programs/\${id}\`);
              if (response.data.success) {
                alert('Program deleted successfully');
                await loadPrograms();
              }
            } catch (error) {
              console.error('Error deleting program:', error);
              alert('Error deleting program');
            }
          }

          document.getElementById('program-form').addEventListener('submit', async (e) => {
            e.preventDefault();

            const id = document.getElementById('program-id').value;
            const data = {
              program_name: document.getElementById('program-name').value,
              program_code: document.getElementById('program-code').value,
              center_id: parseInt(document.getElementById('program-center').value),
              accreditation_date: document.getElementById('program-accred-date').value,
              accreditation_status: document.getElementById('program-status').value
            };

            try {
              let response;
              if (id) {
                response = await axios.put(\`/api/admin/programs/\${id}\`, data);
              } else {
                response = await axios.post('/api/admin/programs', data);
              }

              if (response.data.success) {
                alert(id ? 'Program updated successfully' : 'Program added successfully');
                closeModal();
                await loadPrograms();
              }
            } catch (error) {
              console.error('Error saving program:', error);
              alert('Error saving program');
            }
          });

          function logout() {
            axios.post('/api/admin/logout')
              .then(() => {
                document.cookie = 'admin_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
                window.location.href = '/admin/login';
              })
              .catch(error => console.error('Logout error:', error));
          }
        </script>
    </body>
    </html>
  `)
})

// Admin Change Password Page
app.get('/admin/change-password', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Change Password - MOGU Edu Admin</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
    </head>
    <body class="bg-gray-100">
        <!-- Navigation -->
        <nav class="bg-blue-600 text-white shadow-lg">
            <div class="container mx-auto px-4">
                <div class="flex items-center justify-between h-16">
                    <div class="flex items-center space-x-8">
                        <a href="/admin/dashboard" class="text-xl font-bold">
                            <i class="fas fa-graduation-cap mr-2"></i>MOGU Edu Admin
                        </a>
                        <div class="hidden md:flex space-x-4">
                            <a href="/admin/dashboard" class="hover:bg-blue-700 px-3 py-2 rounded">
                                <i class="fas fa-tachometer-alt mr-1"></i>Dashboard
                            </a>
                            <a href="/admin/certificates" class="hover:bg-blue-700 px-3 py-2 rounded">
                                <i class="fas fa-certificate mr-1"></i>Certificates
                            </a>
                            <a href="/admin/centers" class="hover:bg-blue-700 px-3 py-2 rounded">
                                <i class="fas fa-building mr-1"></i>Centers
                            </a>
                            <a href="/admin/programs" class="hover:bg-blue-700 px-3 py-2 rounded">
                                <i class="fas fa-book mr-1"></i>Programs
                            </a>
                            <a href="/admin/change-password" class="bg-blue-700 px-3 py-2 rounded">
                                <i class="fas fa-key mr-1"></i>Change Password
                            </a>
                        </div>
                    </div>
                    <button onclick="logout()" class="bg-red-500 hover:bg-red-600 px-4 py-2 rounded">
                        <i class="fas fa-sign-out-alt mr-1"></i>Logout
                    </button>
                </div>
            </div>
        </nav>

        <!-- Main Content -->
        <div class="container mx-auto px-4 py-8">
            <div class="max-w-md mx-auto">
                <div class="bg-white rounded-lg shadow-lg p-8">
                    <h1 class="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                        <i class="fas fa-key text-blue-600 mr-3"></i>
                        Change Password
                    </h1>

                    <form id="password-form" class="space-y-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">
                                <i class="fas fa-lock mr-1"></i>Current Password
                            </label>
                            <input 
                                type="password" 
                                id="current-password"
                                required
                                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Enter current password"
                            >
                        </div>

                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">
                                <i class="fas fa-lock mr-1"></i>New Password
                            </label>
                            <input 
                                type="password" 
                                id="new-password"
                                required
                                minlength="6"
                                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Enter new password (min 6 characters)"
                            >
                        </div>

                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">
                                <i class="fas fa-lock mr-1"></i>Confirm New Password
                            </label>
                            <input 
                                type="password" 
                                id="confirm-password"
                                required
                                minlength="6"
                                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Confirm new password"
                            >
                        </div>

                        <div id="error-message" class="hidden bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                        </div>

                        <div id="success-message" class="hidden bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
                        </div>

                        <button 
                            type="submit"
                            class="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition duration-200"
                        >
                            <i class="fas fa-save mr-2"></i>Change Password
                        </button>
                    </form>

                    <div class="mt-6 pt-6 border-t border-gray-200">
                        <a href="/admin/dashboard" class="text-blue-600 hover:text-blue-800 flex items-center justify-center">
                            <i class="fas fa-arrow-left mr-2"></i>Back to Dashboard
                        </a>
                    </div>
                </div>
            </div>
        </div>

        <script>
          // Check authentication
          const sessionCookie = document.cookie.split('; ').find(row => row.startsWith('admin_session='));
          if (!sessionCookie) {
            window.location.href = '/admin/login';
          }

          document.getElementById('password-form').addEventListener('submit', async (e) => {
            e.preventDefault();

            const currentPassword = document.getElementById('current-password').value;
            const newPassword = document.getElementById('new-password').value;
            const confirmPassword = document.getElementById('confirm-password').value;

            const errorDiv = document.getElementById('error-message');
            const successDiv = document.getElementById('success-message');
            
            errorDiv.classList.add('hidden');
            successDiv.classList.add('hidden');

            // Validate passwords match
            if (newPassword !== confirmPassword) {
              errorDiv.textContent = 'New passwords do not match!';
              errorDiv.classList.remove('hidden');
              return;
            }

            // Validate password length
            if (newPassword.length < 6) {
              errorDiv.textContent = 'New password must be at least 6 characters long!';
              errorDiv.classList.remove('hidden');
              return;
            }

            try {
              const response = await axios.post('/api/admin/change-password', {
                currentPassword,
                newPassword
              });

              if (response.data.success) {
                successDiv.textContent = 'Password changed successfully! You can now use your new password.';
                successDiv.classList.remove('hidden');
                
                // Clear form
                document.getElementById('password-form').reset();

                // Redirect to dashboard after 2 seconds
                setTimeout(() => {
                  window.location.href = '/admin/dashboard';
                }, 2000);
              }
            } catch (error) {
              console.error('Change password error:', error);
              errorDiv.textContent = error.response?.data?.message || 'Error changing password. Please try again.';
              errorDiv.classList.remove('hidden');
            }
          });

          function logout() {
            axios.post('/api/admin/logout')
              .then(() => {
                document.cookie = 'admin_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
                window.location.href = '/admin/login';
              })
              .catch(error => console.error('Logout error:', error));
          }
        </script>
    </body>
    </html>
  `)
})


// ============================================
// ADDITIONAL ADMIN API ROUTES FOR CENTERS
// ============================================

app.get('/api/admin/centers', async (c) => {
  const { DB } = c.env;
  try {
    const stmt = DB.prepare(`
      SELECT * FROM training_centers ORDER BY name
    `);
    const { results } = await stmt.all();
    return c.json({ success: true, centers: results || [] });
  } catch (error) {
    return c.json({ success: false, message: 'Error fetching centers' }, 500);
  }
});

app.post('/api/admin/centers', async (c) => {
  const { DB } = c.env;
  const data = await c.req.json();
  try {
    const result = await DB.prepare(`
      INSERT INTO training_centers (name, country, city, website, accreditation_date, accreditation_status)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(
      data.name,
      data.country,
      data.city || null,
      data.website || null,
      data.accreditation_date,
      data.accreditation_status || 'active'
    ).run();
    return c.json({ success: true, id: result.meta.last_row_id });
  } catch (error) {
    return c.json({ success: false, message: 'Error adding center' }, 500);
  }
});

app.put('/api/admin/centers/:id', async (c) => {
  const { DB } = c.env;
  const id = c.req.param('id');
  const data = await c.req.json();
  try {
    await DB.prepare(`
      UPDATE training_centers 
      SET name = ?, country = ?, city = ?, website = ?, 
          accreditation_date = ?, accreditation_status = ?, updated_at = datetime('now')
      WHERE id = ?
    `).bind(
      data.name,
      data.country,
      data.city || null,
      data.website || null,
      data.accreditation_date,
      data.accreditation_status,
      id
    ).run();
    return c.json({ success: true });
  } catch (error) {
    return c.json({ success: false, message: 'Error updating center' }, 500);
  }
});

app.delete('/api/admin/centers/:id', async (c) => {
  const { DB } = c.env;
  const id = c.req.param('id');
  try {
    await DB.prepare(`DELETE FROM training_centers WHERE id = ?`).bind(id).run();
    return c.json({ success: true });
  } catch (error) {
    return c.json({ success: false, message: 'Error deleting center' }, 500);
  }
});


// ============================================
// ADDITIONAL ADMIN API ROUTES FOR PROGRAMS
// ============================================

app.post('/api/admin/programs', async (c) => {
  const { DB } = c.env;
  const data = await c.req.json();
  try {
    const result = await DB.prepare(`
      INSERT INTO training_programs (program_name, program_code, center_id, accreditation_date, accreditation_status)
      VALUES (?, ?, ?, ?, ?)
    `).bind(
      data.program_name,
      data.program_code,
      data.center_id,
      data.accreditation_date,
      data.accreditation_status || 'active'
    ).run();
    return c.json({ success: true, id: result.meta.last_row_id });
  } catch (error) {
    return c.json({ success: false, message: 'Error adding program' }, 500);
  }
});

app.put('/api/admin/programs/:id', async (c) => {
  const { DB } = c.env;
  const id = c.req.param('id');
  const data = await c.req.json();
  try {
    await DB.prepare(`
      UPDATE training_programs 
      SET program_name = ?, program_code = ?, center_id = ?, 
          accreditation_date = ?, accreditation_status = ?, updated_at = datetime('now')
      WHERE id = ?
    `).bind(
      data.program_name,
      data.program_code,
      data.center_id,
      data.accreditation_date,
      data.accreditation_status,
      id
    ).run();
    return c.json({ success: true });
  } catch (error) {
    return c.json({ success: false, message: 'Error updating program' }, 500);
  }
});

app.delete('/api/admin/programs/:id', async (c) => {
  const { DB } = c.env;
  const id = c.req.param('id');
  try {
    await DB.prepare(`DELETE FROM training_programs WHERE id = ?`).bind(id).run();
    return c.json({ success: true });
  } catch (error) {
    return c.json({ success: false, message: 'Error deleting program' }, 500);
  }
});

// Frontend Pages

// Home Page
app.get('/', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>MOGU Edu - Trusted Accreditation for Quality Education</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <style>
          .gradient-bg {
            background: linear-gradient(135deg, #8B1D1D 0%, #1F1F1F 100%);
          }
          .card-hover:hover {
            transform: translateY(-5px);
            box-shadow: 0 10px 25px rgba(0,0,0,0.1);
          }
        </style>
    </head>
    <body class="bg-gray-50">
        <!-- Navigation -->
        <nav class="bg-white shadow-md sticky top-0 z-50">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="flex justify-between items-center h-16">
                    <div class="flex items-center">
                        <img src="/mogu-logo.png" alt="MOGU Edu" class="h-24">
                    </div>
                    <div class="hidden md:flex space-x-8">
                        <a href="/" class="text-red-800 font-semibold">Home</a>
                        <a href="/about" class="text-gray-600 hover:text-red-800">About</a>
                        <a href="/services" class="text-gray-600 hover:text-red-800">Services</a>
                        <a href="/standards" class="text-gray-600 hover:text-red-800">Standards</a>
                        <a href="/verify" class="text-gray-600 hover:text-red-800">Verify Certificate</a>
                        <a href="/centers" class="text-gray-600 hover:text-red-800">Accredited Centers</a>
                        <a href="/contact" class="text-gray-600 hover:text-red-800">Contact</a>
                    </div>
                    <button id="mobile-menu-btn" class="md:hidden text-gray-600">
                        <i class="fas fa-bars text-2xl"></i>
                    </button>
                </div>
            </div>
            <!-- Mobile Menu -->
            <div id="mobile-menu" class="hidden md:hidden bg-white border-t">
                <div class="px-2 pt-2 pb-3 space-y-1">
                    <a href="/" class="block px-3 py-2 text-red-800 font-semibold">Home</a>
                    <a href="/about" class="block px-3 py-2 text-gray-600 hover:text-red-800">About</a>
                    <a href="/services" class="block px-3 py-2 text-gray-600 hover:text-red-800">Services</a>
                    <a href="/standards" class="block px-3 py-2 text-gray-600 hover:text-red-800">Standards</a>
                    <a href="/verify" class="block px-3 py-2 text-gray-600 hover:text-red-800">Verify Certificate</a>
                    <a href="/centers" class="block px-3 py-2 text-gray-600 hover:text-red-800">Accredited Centers</a>
                    <a href="/contact" class="block px-3 py-2 text-gray-600 hover:text-red-800">Contact</a>
                </div>
            </div>
        </nav>

        <!-- Hero Section -->
        <section class="gradient-bg text-white py-20">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                <h1 class="text-5xl font-bold mb-6">MOGU Education</h1>
                <p class="text-2xl mb-4">Trusted Accreditation for Quality Education</p>
                <p class="text-lg mb-8 max-w-3xl mx-auto">
                    Canadian Registered Accreditation Body specialized in accrediting training centers, 
                    professional programs, and certifications to ensure quality, credibility, and excellence.
                </p>
                <div class="flex flex-col sm:flex-row gap-4 justify-center">
                    <a href="/verify" class="bg-white text-red-800 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition">
                        <i class="fas fa-search mr-2"></i>Verify Certificate
                    </a>
                    <a href="/services" class="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-red-800 transition">
                        Our Services
                    </a>
                </div>
            </div>
        </section>

        <!-- Stats Section -->
        <section class="py-16 bg-white">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
                    <div class="p-6">
                        <div class="text-4xl font-bold text-red-800 mb-2" id="centers-count">0</div>
                        <p class="text-gray-600">Accredited Centers</p>
                    </div>
                    <div class="p-6">
                        <div class="text-4xl font-bold text-red-800 mb-2" id="programs-count">0</div>
                        <p class="text-gray-600">Accredited Programs</p>
                    </div>
                    <div class="p-6">
                        <div class="text-4xl font-bold text-red-800 mb-2" id="certificates-count">0</div>
                        <p class="text-gray-600">Issued Certificates</p>
                    </div>
                </div>
            </div>
        </section>

        <!-- Why MOGU Section -->
        <section class="py-16 bg-gray-50">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <h2 class="text-3xl font-bold text-center mb-12">Why Choose MOGU Education?</h2>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div class="bg-white p-6 rounded-lg shadow-md card-hover transition-all">
                        <div class="text-red-800 text-4xl mb-4">
                            <i class="fas fa-flag-checkered"></i>
                        </div>
                        <h3 class="text-xl font-semibold mb-3">Canadian Registered</h3>
                        <p class="text-gray-600">Officially registered in Canada, operating with full transparency and legal compliance.</p>
                    </div>
                    <div class="bg-white p-6 rounded-lg shadow-md card-hover transition-all">
                        <div class="text-red-800 text-4xl mb-4">
                            <i class="fas fa-certificate"></i>
                        </div>
                        <h3 class="text-xl font-semibold mb-3">Professional Standards</h3>
                        <p class="text-gray-600">Clear, measurable, and fair accreditation standards aligned with international best practices.</p>
                    </div>
                    <div class="bg-white p-6 rounded-lg shadow-md card-hover transition-all">
                        <div class="text-red-800 text-4xl mb-4">
                            <i class="fas fa-shield-alt"></i>
                        </div>
                        <h3 class="text-xl font-semibold mb-3">Verification System</h3>
                        <p class="text-gray-600">Online certificate verification system for transparency and protection against fraud.</p>
                    </div>
                    <div class="bg-white p-6 rounded-lg shadow-md card-hover transition-all">
                        <div class="text-red-800 text-4xl mb-4">
                            <i class="fas fa-balance-scale"></i>
                        </div>
                        <h3 class="text-xl font-semibold mb-3">Independent & Unbiased</h3>
                        <p class="text-gray-600">Neutral evaluation processes ensuring fairness and professional integrity.</p>
                    </div>
                    <div class="bg-white p-6 rounded-lg shadow-md card-hover transition-all">
                        <div class="text-red-800 text-4xl mb-4">
                            <i class="fas fa-chart-line"></i>
                        </div>
                        <h3 class="text-xl font-semibold mb-3">Continuous Improvement</h3>
                        <p class="text-gray-600">Ongoing quality assurance and support for accredited institutions.</p>
                    </div>
                    <div class="bg-white p-6 rounded-lg shadow-md card-hover transition-all">
                        <div class="text-red-800 text-4xl mb-4">
                            <i class="fas fa-globe"></i>
                        </div>
                        <h3 class="text-xl font-semibold mb-3">Global Recognition</h3>
                        <p class="text-gray-600">Internationally aligned standards recognized by employers and institutions.</p>
                    </div>
                </div>
            </div>
        </section>

        <!-- CTA Section -->
        <section class="py-16 gradient-bg text-white">
            <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                <h2 class="text-3xl font-bold mb-6">Ready to Get Accredited?</h2>
                <p class="text-lg mb-8">
                    Join our network of accredited training centers and enhance your institutional credibility.
                </p>
                <a href="/contact" class="bg-white text-red-800 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition inline-block">
                    Contact Us Today
                </a>
            </div>
        </section>

        <!-- Footer -->
        <footer class="bg-gray-900 text-white py-12">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
                    <div>
                        <h3 class="text-xl font-bold mb-4">MOGU Education</h3>
                        <p class="text-gray-400">Canadian Registered Accreditation Body</p>
                    </div>
                    <div>
                        <h4 class="font-semibold mb-4">Quick Links</h4>
                        <ul class="space-y-2 text-gray-400">
                            <li><a href="/about" class="hover:text-white">About Us</a></li>
                            <li><a href="/services" class="hover:text-white">Services</a></li>
                            <li><a href="/standards" class="hover:text-white">Standards</a></li>
                        </ul>
                    </div>
                    <div>
                        <h4 class="font-semibold mb-4">Resources</h4>
                        <ul class="space-y-2 text-gray-400">
                            <li><a href="/verify" class="hover:text-white">Verify Certificate</a></li>
                            <li><a href="/centers" class="hover:text-white">Accredited Centers</a></li>
                            <li><a href="/contact" class="hover:text-white">Contact</a></li>
                        </ul>
                    </div>
                    <div>
                        <h4 class="font-semibold mb-4">Legal</h4>
                        <ul class="space-y-2 text-gray-400">
                            <li><a href="/privacy" class="hover:text-white">Privacy Policy</a></li>
                            <li><a href="/terms" class="hover:text-white">Terms of Service</a></li>
                        </ul>
                    </div>
                </div>
                <div class="border-t border-gray-800 pt-8 text-center text-gray-400">
                    <p>© 2024 MOGU Education. All rights reserved.</p>
                    <p class="mt-2 text-sm">Accrediting Excellence. Empowering Learning.</p>
                </div>
            </div>
        </footer>

        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <script>
          // Mobile menu toggle
          document.getElementById('mobile-menu-btn').addEventListener('click', () => {
            const menu = document.getElementById('mobile-menu');
            menu.classList.toggle('hidden');
          });

          // Load statistics
          axios.get('/api/stats')
            .then(response => {
              if (response.data.success) {
                const stats = response.data.stats;
                document.getElementById('centers-count').textContent = stats.accreditedCenters;
                document.getElementById('programs-count').textContent = stats.accreditedPrograms;
                document.getElementById('certificates-count').textContent = stats.issuedCertificates;
              }
            })
            .catch(error => console.error('Error loading stats:', error));
        </script>
    </body>
    </html>
  `)
})

// About Page
app.get('/about', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>About Us - MOGU Edu</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <style>
          .gradient-bg {
            background: linear-gradient(135deg, #8B1D1D 0%, #1F1F1F 100%);
          }
        </style>
    </head>
    <body class="bg-gray-50">
        <!-- Navigation (same as home) -->
        <nav class="bg-white shadow-md sticky top-0 z-50">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="flex justify-between items-center h-16">
                    <div class="flex items-center">
                        <a href="/"><img src="/mogu-logo.png" alt="MOGU Edu" class="h-24"></a>
                    </div>
                    <div class="hidden md:flex space-x-8">
                        <a href="/" class="text-gray-600 hover:text-red-800">Home</a>
                        <a href="/about" class="text-red-800 font-semibold">About</a>
                        <a href="/services" class="text-gray-600 hover:text-red-800">Services</a>
                        <a href="/standards" class="text-gray-600 hover:text-red-800">Standards</a>
                        <a href="/verify" class="text-gray-600 hover:text-red-800">Verify Certificate</a>
                        <a href="/centers" class="text-gray-600 hover:text-red-800">Accredited Centers</a>
                        <a href="/contact" class="text-gray-600 hover:text-red-800">Contact</a>
                    </div>
                </div>
            </div>
        </nav>

        <!-- Hero -->
        <section class="gradient-bg text-white py-16">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                <h1 class="text-4xl font-bold mb-4">About MOGU Education</h1>
                <p class="text-xl">Canadian Registered Independent Accreditation Body</p>
            </div>
        </section>

        <!-- Content -->
        <section class="py-16">
            <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="bg-white p-8 rounded-lg shadow-md mb-8">
                    <h2 class="text-3xl font-bold mb-6 text-gray-800">Who We Are</h2>
                    <p class="text-gray-700 mb-4 leading-relaxed">
                        MOGU Education is an independent Canadian registered accreditation organization, 
                        established to support quality, integrity, and accountability in education and professional training.
                    </p>
                    <p class="text-gray-700 mb-4 leading-relaxed">
                        We collaborate with training centers, educational institutions, and professional certification 
                        providers to ensure their programs meet clear, transparent, and professionally defined standards.
                    </p>
                    <p class="text-gray-700 leading-relaxed">
                        Our accreditation approach goes beyond documentation, focusing on learning quality, 
                        professional relevance, delivery effectiveness, and measurable impact.
                    </p>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                    <div class="bg-white p-8 rounded-lg shadow-md">
                        <h3 class="text-2xl font-bold mb-4 text-red-800">
                            <i class="fas fa-eye mr-2"></i>Our Vision
                        </h3>
                        <p class="text-gray-700">
                            To be a leading Canadian accreditation body that contributes to raising the quality 
                            of education and training locally and internationally.
                        </p>
                    </div>
                    <div class="bg-white p-8 rounded-lg shadow-md">
                        <h3 class="text-2xl font-bold mb-4 text-red-800">
                            <i class="fas fa-bullseye mr-2"></i>Our Mission
                        </h3>
                        <p class="text-gray-700">
                            To empower education and training institutions to achieve excellence through trusted 
                            professional accreditation that reflects integrity, quality, and sustainability.
                        </p>
                    </div>
                </div>

                <div class="bg-white p-8 rounded-lg shadow-md mb-8">
                    <h3 class="text-2xl font-bold mb-6 text-gray-800">
                        <i class="fas fa-flag-checkered mr-2"></i>Legal Status & Governance
                    </h3>
                    <div class="space-y-3">
                        <div class="flex items-start">
                            <i class="fas fa-check-circle text-green-600 mt-1 mr-3"></i>
                            <p class="text-gray-700">Officially registered in Canada</p>
                        </div>
                        <div class="flex items-start">
                            <i class="fas fa-check-circle text-green-600 mt-1 mr-3"></i>
                            <p class="text-gray-700">Operates as an independent accreditation body</p>
                        </div>
                        <div class="flex items-start">
                            <i class="fas fa-check-circle text-green-600 mt-1 mr-3"></i>
                            <p class="text-gray-700">Applies transparent, non-biased evaluation processes</p>
                        </div>
                        <div class="flex items-start">
                            <i class="fas fa-check-circle text-green-600 mt-1 mr-3"></i>
                            <p class="text-gray-700">Complies with data protection and privacy principles</p>
                        </div>
                    </div>
                    <p class="mt-6 text-gray-600 italic">
                        Canadian registration reflects our commitment to high professional and ethical standards.
                    </p>
                </div>

                <div class="bg-white p-8 rounded-lg shadow-md">
                    <h3 class="text-2xl font-bold mb-6 text-gray-800">
                        <i class="fas fa-users mr-2"></i>Who We Serve
                    </h3>
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div class="text-center">
                            <div class="text-4xl text-red-800 mb-3">
                                <i class="fas fa-school"></i>
                            </div>
                            <h4 class="font-semibold mb-2">Training Centers</h4>
                            <p class="text-sm text-gray-600">Professional development institutions</p>
                        </div>
                        <div class="text-center">
                            <div class="text-4xl text-red-800 mb-3">
                                <i class="fas fa-university"></i>
                            </div>
                            <h4 class="font-semibold mb-2">Educational Institutions</h4>
                            <p class="text-sm text-gray-600">Academies and institutes</p>
                        </div>
                        <div class="text-center">
                            <div class="text-4xl text-red-800 mb-3">
                                <i class="fas fa-certificate"></i>
                            </div>
                            <h4 class="font-semibold mb-2">Certification Providers</h4>
                            <p class="text-sm text-gray-600">Professional credential issuers</p>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <!-- Footer -->
        <footer class="bg-gray-900 text-white py-12">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
                    <div>
                        <h3 class="text-xl font-bold mb-4">MOGU Education</h3>
                        <p class="text-gray-400">Canadian Registered Accreditation Body</p>
                    </div>
                    <div>
                        <h4 class="font-semibold mb-4">Quick Links</h4>
                        <ul class="space-y-2 text-gray-400">
                            <li><a href="/about" class="hover:text-white">About Us</a></li>
                            <li><a href="/services" class="hover:text-white">Services</a></li>
                            <li><a href="/standards" class="hover:text-white">Standards</a></li>
                        </ul>
                    </div>
                    <div>
                        <h4 class="font-semibold mb-4">Resources</h4>
                        <ul class="space-y-2 text-gray-400">
                            <li><a href="/verify" class="hover:text-white">Verify Certificate</a></li>
                            <li><a href="/centers" class="hover:text-white">Accredited Centers</a></li>
                            <li><a href="/contact" class="hover:text-white">Contact</a></li>
                        </ul>
                    </div>
                    <div>
                        <h4 class="font-semibold mb-4">Legal</h4>
                        <ul class="space-y-2 text-gray-400">
                            <li><a href="/privacy" class="hover:text-white">Privacy Policy</a></li>
                            <li><a href="/terms" class="hover:text-white">Terms of Service</a></li>
                        </ul>
                    </div>
                </div>
                <div class="border-t border-gray-800 pt-8 text-center text-gray-400">
                    <p>© 2024 MOGU Education. All rights reserved.</p>
                    <p class="mt-2 text-sm">Accrediting Excellence. Empowering Learning.</p>
                </div>
            </div>
        </footer>
    </body>
    </html>
  `)
})

// Verify Certificate Page
app.get('/verify', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verify Certificate - MOGU Edu</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <style>
          .gradient-bg {
            background: linear-gradient(135deg, #8B1D1D 0%, #1F1F1F 100%);
          }
        </style>
    </head>
    <body class="bg-gray-50">
        <!-- Navigation -->
        <nav class="bg-white shadow-md sticky top-0 z-50">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="flex justify-between items-center h-16">
                    <div class="flex items-center">
                        <a href="/"><img src="/mogu-logo.png" alt="MOGU Edu" class="h-24"></a>
                    </div>
                    <div class="hidden md:flex space-x-8">
                        <a href="/" class="text-gray-600 hover:text-red-800">Home</a>
                        <a href="/about" class="text-gray-600 hover:text-red-800">About</a>
                        <a href="/services" class="text-gray-600 hover:text-red-800">Services</a>
                        <a href="/standards" class="text-gray-600 hover:text-red-800">Standards</a>
                        <a href="/verify" class="text-red-800 font-semibold">Verify Certificate</a>
                        <a href="/centers" class="text-gray-600 hover:text-red-800">Accredited Centers</a>
                        <a href="/contact" class="text-gray-600 hover:text-red-800">Contact</a>
                    </div>
                </div>
            </div>
        </nav>

        <!-- Hero -->
        <section class="gradient-bg text-white py-16">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                <h1 class="text-4xl font-bold mb-4">Verify Accredited Certificate</h1>
                <p class="text-xl">Confirm the validity and authenticity of MOGU accredited certificates</p>
            </div>
        </section>

        <!-- Verification Form -->
        <section class="py-16">
            <div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="bg-white p-8 rounded-lg shadow-lg">
                    <div class="mb-8">
                        <h2 class="text-2xl font-bold mb-4 text-gray-800">Search Certificate</h2>
                        <p class="text-gray-600">Enter at least one search criterion to verify a certificate.</p>
                    </div>

                    <form id="verify-form" class="space-y-6">
                        <div>
                            <label class="block text-gray-700 font-semibold mb-2">
                                <i class="fas fa-hashtag mr-2"></i>Certificate Number
                            </label>
                            <input 
                                type="text" 
                                id="certificate-number"
                                placeholder="e.g., MOGU-2024-001"
                                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-800">
                        </div>

                        <div class="text-center text-gray-500 font-semibold">OR</div>

                        <div>
                            <label class="block text-gray-700 font-semibold mb-2">
                                <i class="fas fa-user mr-2"></i>Certificate Holder Name
                            </label>
                            <input 
                                type="text" 
                                id="holder-name"
                                placeholder="e.g., John Smith"
                                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-800">
                        </div>

                        <div>
                            <label class="block text-gray-700 font-semibold mb-2">
                                <i class="fas fa-building mr-2"></i>Training Provider (Optional)
                            </label>
                            <input 
                                type="text" 
                                id="training-provider"
                                placeholder="e.g., Excellence Training Institute"
                                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-800">
                        </div>

                        <button 
                            type="submit"
                            class="w-full bg-red-800 text-white py-4 rounded-lg font-semibold hover:bg-red-900 transition">
                            <i class="fas fa-search mr-2"></i>Verify Certificate
                        </button>
                    </form>

                    <!-- Result Area -->
                    <div id="result-area" class="mt-8 hidden">
                        <!-- Success Result -->
                        <div id="success-result" class="hidden">
                            <div class="bg-green-50 border-l-4 border-green-500 p-6 rounded-lg">
                                <div class="flex items-center mb-4">
                                    <i class="fas fa-check-circle text-green-600 text-3xl mr-3"></i>
                                    <h3 class="text-2xl font-bold text-green-800">Certificate Valid</h3>
                                </div>
                                <p class="text-gray-700 mb-6">
                                    This certificate is valid and issued by a MOGU Education accredited provider.
                                </p>
                                
                                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                    <div>
                                        <p class="text-sm text-gray-600 font-semibold">Certificate Number</p>
                                        <p class="text-gray-800" id="result-cert-number"></p>
                                    </div>
                                    <div>
                                        <p class="text-sm text-gray-600 font-semibold">Holder Name</p>
                                        <p class="text-gray-800" id="result-holder-name"></p>
                                    </div>
                                    <div>
                                        <p class="text-sm text-gray-600 font-semibold">Program</p>
                                        <p class="text-gray-800" id="result-program"></p>
                                    </div>
                                    <div>
                                        <p class="text-sm text-gray-600 font-semibold">Training Provider</p>
                                        <p class="text-gray-800" id="result-provider"></p>
                                    </div>
                                    <div>
                                        <p class="text-sm text-gray-600 font-semibold">Issue Date</p>
                                        <p class="text-gray-800" id="result-issue-date"></p>
                                    </div>
                                    <div>
                                        <p class="text-sm text-gray-600 font-semibold">Status</p>
                                        <p class="text-green-600 font-semibold" id="result-status"></p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Error Result -->
                        <div id="error-result" class="hidden">
                            <div class="bg-red-50 border-l-4 border-red-500 p-6 rounded-lg">
                                <div class="flex items-center mb-4">
                                    <i class="fas fa-times-circle text-red-600 text-3xl mr-3"></i>
                                    <h3 class="text-2xl font-bold text-red-800">Certificate Not Found</h3>
                                </div>
                                <p class="text-gray-700 mb-4">
                                    The information entered does not match any certificate in our accredited registry.
                                </p>
                                <p class="text-gray-600 text-sm">
                                    Please verify the information and try again. If you believe this is an error, 
                                    please <a href="/contact" class="text-red-800 font-semibold hover:underline">contact us</a>.
                                </p>
                            </div>
                        </div>
                    </div>

                    <!-- Privacy Notice -->
                    <div class="mt-8 p-4 bg-gray-100 rounded-lg">
                        <p class="text-sm text-gray-600">
                            <i class="fas fa-shield-alt mr-2"></i>
                            <strong>Privacy Notice:</strong> Data displayed is limited to verification purposes only 
                            and complies with applicable privacy and data protection regulations.
                        </p>
                    </div>
                </div>
            </div>
        </section>

        <!-- Footer -->
        <footer class="bg-gray-900 text-white py-12">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
                    <div>
                        <h3 class="text-xl font-bold mb-4">MOGU Education</h3>
                        <p class="text-gray-400">Canadian Registered Accreditation Body</p>
                    </div>
                    <div>
                        <h4 class="font-semibold mb-4">Quick Links</h4>
                        <ul class="space-y-2 text-gray-400">
                            <li><a href="/about" class="hover:text-white">About Us</a></li>
                            <li><a href="/services" class="hover:text-white">Services</a></li>
                            <li><a href="/standards" class="hover:text-white">Standards</a></li>
                        </ul>
                    </div>
                    <div>
                        <h4 class="font-semibold mb-4">Resources</h4>
                        <ul class="space-y-2 text-gray-400">
                            <li><a href="/verify" class="hover:text-white">Verify Certificate</a></li>
                            <li><a href="/centers" class="hover:text-white">Accredited Centers</a></li>
                            <li><a href="/contact" class="hover:text-white">Contact</a></li>
                        </ul>
                    </div>
                    <div>
                        <h4 class="font-semibold mb-4">Legal</h4>
                        <ul class="space-y-2 text-gray-400">
                            <li><a href="/privacy" class="hover:text-white">Privacy Policy</a></li>
                            <li><a href="/terms" class="hover:text-white">Terms of Service</a></li>
                        </ul>
                    </div>
                </div>
                <div class="border-t border-gray-800 pt-8 text-center text-gray-400">
                    <p>© 2024 MOGU Education. All rights reserved.</p>
                    <p class="mt-2 text-sm">Accrediting Excellence. Empowering Learning.</p>
                </div>
            </div>
        </footer>

        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <script>
          document.getElementById('verify-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const certificateNumber = document.getElementById('certificate-number').value.trim();
            const holderName = document.getElementById('holder-name').value.trim();
            const trainingProvider = document.getElementById('training-provider').value.trim();

            if (!certificateNumber && !holderName) {
              alert('Please enter at least a Certificate Number or Holder Name');
              return;
            }

            try {
              const response = await axios.post('/api/verify', {
                certificateNumber,
                holderName,
                trainingProvider
              });

              const resultArea = document.getElementById('result-area');
              const successResult = document.getElementById('success-result');
              const errorResult = document.getElementById('error-result');

              resultArea.classList.remove('hidden');
              
              if (response.data.success) {
                const cert = response.data.certificate;
                
                document.getElementById('result-cert-number').textContent = cert.certificate_number;
                document.getElementById('result-holder-name').textContent = cert.holder_name;
                document.getElementById('result-program').textContent = cert.program_name;
                document.getElementById('result-provider').textContent = cert.training_center;
                document.getElementById('result-issue-date').textContent = new Date(cert.issue_date).toLocaleDateString();
                document.getElementById('result-status').textContent = cert.status.toUpperCase();

                successResult.classList.remove('hidden');
                errorResult.classList.add('hidden');
              } else {
                successResult.classList.add('hidden');
                errorResult.classList.remove('hidden');
              }

              // Scroll to result
              resultArea.scrollIntoView({ behavior: 'smooth' });

            } catch (error) {
              const resultArea = document.getElementById('result-area');
              const successResult = document.getElementById('success-result');
              const errorResult = document.getElementById('error-result');

              resultArea.classList.remove('hidden');
              successResult.classList.add('hidden');
              errorResult.classList.remove('hidden');
            }
          });
        </script>
    </body>
    </html>
  `)
})

// Services Page
app.get('/services', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Our Services - MOGU Edu</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <style>.gradient-bg { background: linear-gradient(135deg, #8B1D1D 0%, #1F1F1F 100%); }</style>
    </head>
    <body class="bg-gray-50">
        <nav class="bg-white shadow-md sticky top-0 z-50">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="flex justify-between items-center h-16">
                    <div class="flex items-center">
                        <a href="/"><img src="/mogu-logo.png" alt="MOGU Edu" class="h-24"></a>
                    </div>
                    <div class="hidden md:flex space-x-8">
                        <a href="/" class="text-gray-600 hover:text-red-800">Home</a>
                        <a href="/about" class="text-gray-600 hover:text-red-800">About</a>
                        <a href="/services" class="text-red-800 font-semibold">Services</a>
                        <a href="/standards" class="text-gray-600 hover:text-red-800">Standards</a>
                        <a href="/verify" class="text-gray-600 hover:text-red-800">Verify Certificate</a>
                        <a href="/centers" class="text-gray-600 hover:text-red-800">Accredited Centers</a>
                        <a href="/contact" class="text-gray-600 hover:text-red-800">Contact</a>
                    </div>
                </div>
            </div>
        </nav>

        <section class="gradient-bg text-white py-16">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                <h1 class="text-4xl font-bold mb-4">Our Accreditation Services</h1>
                <p class="text-xl">Comprehensive accreditation solutions for education and training excellence</p>
            </div>
        </section>

        <section class="py-16">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div class="bg-white p-8 rounded-lg shadow-md">
                        <div class="text-4xl text-red-800 mb-4"><i class="fas fa-school"></i></div>
                        <h3 class="text-2xl font-bold mb-4">Training Center Accreditation</h3>
                        <p class="text-gray-700 mb-4">Comprehensive evaluation and accreditation of training institutions based on:</p>
                        <ul class="space-y-2 text-gray-600">
                            <li><i class="fas fa-check text-green-600 mr-2"></i>Governance & Management</li>
                            <li><i class="fas fa-check text-green-600 mr-2"></i>Trainer Qualifications</li>
                            <li><i class="fas fa-check text-green-600 mr-2"></i>Learning Delivery Quality</li>
                            <li><i class="fas fa-check text-green-600 mr-2"></i>Learner Experience</li>
                            <li><i class="fas fa-check text-green-600 mr-2"></i>Continuous Improvement</li>
                        </ul>
                        <div class="mt-6 p-4 bg-green-50 rounded-lg">
                            <p class="text-sm font-semibold text-green-800">Benefits:</p>
                            <p class="text-sm text-gray-700">Official accreditation certificate, MOGU logo usage rights, listing in accredited registry</p>
                        </div>
                    </div>

                    <div class="bg-white p-8 rounded-lg shadow-md">
                        <div class="text-4xl text-red-800 mb-4"><i class="fas fa-book-open"></i></div>
                        <h3 class="text-2xl font-bold mb-4">Program Accreditation</h3>
                        <p class="text-gray-700 mb-4">Review and accreditation of training programs focusing on:</p>
                        <ul class="space-y-2 text-gray-600">
                            <li><i class="fas fa-check text-green-600 mr-2"></i>Learning Objectives</li>
                            <li><i class="fas fa-check text-green-600 mr-2"></i>Curriculum Structure</li>
                            <li><i class="fas fa-check text-green-600 mr-2"></i>Training Hours & Methodology</li>
                            <li><i class="fas fa-check text-green-600 mr-2"></i>Assessment Methods</li>
                            <li><i class="fas fa-check text-green-600 mr-2"></i>Market Relevance</li>
                        </ul>
                        <div class="mt-6 p-4 bg-green-50 rounded-lg">
                            <p class="text-sm font-semibold text-green-800">Benefits:</p>
                            <p class="text-sm text-gray-700">Enhanced program credibility, increased learner trust, competitive advantage</p>
                        </div>
                    </div>

                    <div class="bg-white p-8 rounded-lg shadow-md">
                        <div class="text-4xl text-red-800 mb-4"><i class="fas fa-certificate"></i></div>
                        <h3 class="text-2xl font-bold mb-4">Professional Certification Accreditation</h3>
                        <p class="text-gray-700 mb-4">Accreditation of professional certifications ensuring:</p>
                        <ul class="space-y-2 text-gray-600">
                            <li><i class="fas fa-check text-green-600 mr-2"></i>Credential Credibility</li>
                            <li><i class="fas fa-check text-green-600 mr-2"></i>Clear Competency Standards</li>
                            <li><i class="fas fa-check text-green-600 mr-2"></i>Market Alignment</li>
                            <li><i class="fas fa-check text-green-600 mr-2"></i>Valid Assessment Methods</li>
                            <li><i class="fas fa-check text-green-600 mr-2"></i>Online Verification System</li>
                        </ul>
                        <div class="mt-6 p-4 bg-green-50 rounded-lg">
                            <p class="text-sm font-semibold text-green-800">Benefits:</p>
                            <p class="text-sm text-gray-700">Global recognition, employer trust, verifiable credentials</p>
                        </div>
                    </div>

                    <div class="bg-white p-8 rounded-lg shadow-md">
                        <div class="text-4xl text-red-800 mb-4"><i class="fas fa-clipboard-check"></i></div>
                        <h3 class="text-2xl font-bold mb-4">Quality Assurance & Monitoring</h3>
                        <p class="text-gray-700 mb-4">Ongoing quality support including:</p>
                        <ul class="space-y-2 text-gray-600">
                            <li><i class="fas fa-check text-green-600 mr-2"></i>Periodic Reviews</li>
                            <li><i class="fas fa-check text-green-600 mr-2"></i>Compliance Follow-ups</li>
                            <li><i class="fas fa-check text-green-600 mr-2"></i>Improvement Recommendations</li>
                            <li><i class="fas fa-check text-green-600 mr-2"></i>Performance Reports</li>
                            <li><i class="fas fa-check text-green-600 mr-2"></i>Continuous Support</li>
                        </ul>
                        <div class="mt-6 p-4 bg-green-50 rounded-lg">
                            <p class="text-sm font-semibold text-green-800">Benefits:</p>
                            <p class="text-sm text-gray-700">Maintained accreditation status, continuous improvement, expert guidance</p>
                        </div>
                    </div>
                </div>

                <div class="mt-12 bg-white p-8 rounded-lg shadow-md">
                    <h3 class="text-2xl font-bold mb-6 text-center">
                        <i class="fas fa-list-ol mr-2 text-red-800"></i>Accreditation Process
                    </h3>
                    <div class="grid grid-cols-1 md:grid-cols-7 gap-4">
                        <div class="text-center">
                            <div class="bg-red-800 text-white rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-2 text-xl font-bold">1</div>
                            <p class="text-sm font-semibold">Application</p>
                        </div>
                        <div class="text-center">
                            <div class="bg-red-800 text-white rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-2 text-xl font-bold">2</div>
                            <p class="text-sm font-semibold">Document Review</p>
                        </div>
                        <div class="text-center">
                            <div class="bg-red-800 text-white rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-2 text-xl font-bold">3</div>
                            <p class="text-sm font-semibold">Technical Assessment</p>
                        </div>
                        <div class="text-center">
                            <div class="bg-red-800 text-white rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-2 text-xl font-bold">4</div>
                            <p class="text-sm font-semibold">Site Visit</p>
                        </div>
                        <div class="text-center">
                            <div class="bg-red-800 text-white rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-2 text-xl font-bold">5</div>
                            <p class="text-sm font-semibold">Final Decision</p>
                        </div>
                        <div class="text-center">
                            <div class="bg-red-800 text-white rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-2 text-xl font-bold">6</div>
                            <p class="text-sm font-semibold">Accreditation Grant</p>
                        </div>
                        <div class="text-center">
                            <div class="bg-red-800 text-white rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-2 text-xl font-bold">7</div>
                            <p class="text-sm font-semibold">Monitoring</p>
                        </div>
                    </div>
                </div>

                <div class="mt-12 text-center">
                    <a href="/contact" class="bg-red-800 text-white px-8 py-4 rounded-lg font-semibold hover:bg-red-900 transition inline-block">
                        <i class="fas fa-paper-plane mr-2"></i>Apply for Accreditation
                    </a>
                </div>
            </div>
        </section>

        <footer class="bg-gray-900 text-white py-12">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="text-center text-gray-400">
                    <p>© 2024 MOGU Education. All rights reserved.</p>
                    <p class="mt-2 text-sm">Accrediting Excellence. Empowering Learning.</p>
                </div>
            </div>
        </footer>
    </body>
    </html>
  `)
})


// Standards Page (MOGU Method)
app.get('/standards', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Accreditation Standards - MOGU Edu</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <style>.gradient-bg { background: linear-gradient(135deg, #8B1D1D 0%, #1F1F1F 100%); }</style>
    </head>
    <body class="bg-gray-50">
        <nav class="bg-white shadow-md sticky top-0 z-50">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="flex justify-between items-center h-16">
                    <div class="flex items-center">
                        <a href="/"><img src="/mogu-logo.png" alt="MOGU Edu" class="h-24"></a>
                    </div>
                    <div class="hidden md:flex space-x-8">
                        <a href="/" class="text-gray-600 hover:text-red-800">Home</a>
                        <a href="/about" class="text-gray-600 hover:text-red-800">About</a>
                        <a href="/services" class="text-gray-600 hover:text-red-800">Services</a>
                        <a href="/standards" class="text-red-800 font-semibold">Standards</a>
                        <a href="/verify" class="text-gray-600 hover:text-red-800">Verify Certificate</a>
                        <a href="/centers" class="text-gray-600 hover:text-red-800">Accredited Centers</a>
                        <a href="/contact" class="text-gray-600 hover:text-red-800">Contact</a>
                    </div>
                </div>
            </div>
        </nav>

        <section class="gradient-bg text-white py-16">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                <h1 class="text-4xl font-bold mb-4">Accreditation Standards</h1>
                <p class="text-xl">The MOGU Edu Method: Comprehensive Quality Framework</p>
            </div>
        </section>

        <section class="py-16">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="bg-red-50 border-l-4 border-red-800 p-6 rounded-lg mb-12">
                    <h2 class="text-2xl font-bold text-red-800 mb-4">
                        <i class="fas fa-award mr-2"></i>The MOGU Edu Accreditation Method
                    </h2>
                    <p class="text-gray-700 mb-4">
                        The MOGU Edu Method focuses on approving the complete training ecosystem before certification issuance. 
                        This ensures that every certified learner has received quality education delivered by qualified professionals.
                    </p>
                    <p class="text-gray-700">
                        When a training organization applies for program accreditation, they submit documentation for all components: 
                        trainer credentials, training materials, learning processes, and delivery methods. Upon approval and program 
                        scheduling, MOGU Edu accredits certificates for attendees based on the pre-approved methodology.
                    </p>
                </div>

                <div class="mb-12">
                    <h3 class="text-2xl font-bold text-center mb-8">MOGU Method Core Components</h3>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div class="bg-white p-6 rounded-lg shadow-md border-l-4 border-red-800">
                            <h4 class="text-xl font-bold mb-3 text-red-800">
                                <i class="fas fa-user-tie mr-2"></i>1. Trainer Qualification
                            </h4>
                            <p class="text-gray-700 mb-3">Verification of trainer credentials, experience, and expertise</p>
                            <ul class="text-sm text-gray-600 space-y-1">
                                <li>• Professional certifications</li>
                                <li>• Industry experience</li>
                                <li>• Teaching competency</li>
                                <li>• Subject matter expertise</li>
                            </ul>
                        </div>

                        <div class="bg-white p-6 rounded-lg shadow-md border-l-4 border-red-800">
                            <h4 class="text-xl font-bold mb-3 text-red-800">
                                <i class="fas fa-book mr-2"></i>2. Training Material Quality
                            </h4>
                            <p class="text-gray-700 mb-3">Assessment of training content, structure, and relevance</p>
                            <ul class="text-sm text-gray-600 space-y-1">
                                <li>• Curriculum design</li>
                                <li>• Content accuracy</li>
                                <li>• Learning resources</li>
                                <li>• Material updates</li>
                            </ul>
                        </div>

                        <div class="bg-white p-6 rounded-lg shadow-md border-l-4 border-red-800">
                            <h4 class="text-xl font-bold mb-3 text-red-800">
                                <i class="fas fa-cogs mr-2"></i>3. Learning Process Design
                            </h4>
                            <p class="text-gray-700 mb-3">Evaluation of pedagogical approaches and learning methodologies</p>
                            <ul class="text-sm text-gray-600 space-y-1">
                                <li>• Instructional design</li>
                                <li>• Learning activities</li>
                                <li>• Engagement strategies</li>
                                <li>• Practice opportunities</li>
                            </ul>
                        </div>

                        <div class="bg-white p-6 rounded-lg shadow-md border-l-4 border-red-800">
                            <h4 class="text-xl font-bold mb-3 text-red-800">
                                <i class="fas fa-chalkboard-teacher mr-2"></i>4. Delivery Methods
                            </h4>
                            <p class="text-gray-700 mb-3">Review of training delivery techniques and effectiveness</p>
                            <ul class="text-sm text-gray-600 space-y-1">
                                <li>• Teaching methods</li>
                                <li>• Technology integration</li>
                                <li>• Interactive elements</li>
                                <li>• Learning environment</li>
                            </ul>
                        </div>
                    </div>
                </div>

                <div class="bg-white p-8 rounded-lg shadow-md mb-12">
                    <h3 class="text-2xl font-bold mb-6 text-center">
                        <i class="fas fa-clipboard-list mr-2"></i>Accreditation Workflow
                    </h3>
                    <div class="space-y-6">
                        <div class="flex items-start">
                            <div class="bg-red-800 text-white rounded-full w-10 h-10 flex items-center justify-center flex-shrink-0 text-lg font-bold mr-4">1</div>
                            <div>
                                <h4 class="font-semibold text-lg mb-1">Training Organization Submits Application</h4>
                                <p class="text-gray-600">Complete documentation including trainer credentials, training materials, learning process design, and delivery methods.</p>
                            </div>
                        </div>
                        <div class="flex items-start">
                            <div class="bg-red-800 text-white rounded-full w-10 h-10 flex items-center justify-center flex-shrink-0 text-lg font-bold mr-4">2</div>
                            <div>
                                <h4 class="font-semibold text-lg mb-1">MOGU Edu Reviews & Approves Program</h4>
                                <p class="text-gray-600">Comprehensive evaluation of all submitted components against MOGU Method standards.</p>
                            </div>
                        </div>
                        <div class="flex items-start">
                            <div class="bg-red-800 text-white rounded-full w-10 h-10 flex items-center justify-center flex-shrink-0 text-lg font-bold mr-4">3</div>
                            <div>
                                <h4 class="font-semibold text-lg mb-1">Program Accreditation Confirmation Sent</h4>
                                <p class="text-gray-600">Training organization receives official accreditation confirmation and program code.</p>
                            </div>
                        </div>
                        <div class="flex items-start">
                            <div class="bg-red-800 text-white rounded-full w-10 h-10 flex items-center justify-center flex-shrink-0 text-lg font-bold mr-4">4</div>
                            <div>
                                <h4 class="font-semibold text-lg mb-1">Program Scheduled & Delivered</h4>
                                <p class="text-gray-600">Training organization schedules and conducts the program according to approved methodology.</p>
                            </div>
                        </div>
                        <div class="flex items-start">
                            <div class="bg-red-800 text-white rounded-full w-10 h-10 flex items-center justify-center flex-shrink-0 text-lg font-bold mr-4">5</div>
                            <div>
                                <h4 class="font-semibold text-lg mb-1">Certificates Accredited for Attendees</h4>
                                <p class="text-gray-600">Upon program completion, MOGU Edu accredits certificates for participants based on the pre-approved methodology.</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                    <div class="bg-white p-6 rounded-lg shadow-md text-center">
                        <div class="text-4xl text-red-800 mb-3"><i class="fas fa-balance-scale"></i></div>
                        <h4 class="font-semibold mb-2">Quality Focus</h4>
                        <p class="text-sm text-gray-600">Accreditation based on quality, not documentation volume</p>
                    </div>
                    <div class="bg-white p-6 rounded-lg shadow-md text-center">
                        <div class="text-4xl text-red-800 mb-3"><i class="fas fa-chart-line"></i></div>
                        <h4 class="font-semibold mb-2">Measurable Standards</h4>
                        <p class="text-sm text-gray-600">Clear, objective criteria for fair evaluation</p>
                    </div>
                    <div class="bg-white p-6 rounded-lg shadow-md text-center">
                        <div class="text-4xl text-red-800 mb-3"><i class="fas fa-sync-alt"></i></div>
                        <h4 class="font-semibold mb-2">Continuous Improvement</h4>
                        <p class="text-sm text-gray-600">Ongoing support for quality enhancement</p>
                    </div>
                </div>

                <div id="standards-list" class="bg-white p-8 rounded-lg shadow-md">
                    <h3 class="text-2xl font-bold mb-6 text-center">
                        <i class="fas fa-list-check mr-2"></i>Complete Standards List
                    </h3>
                    <div class="text-center text-gray-500">
                        <i class="fas fa-spinner fa-spin text-3xl"></i>
                        <p class="mt-2">Loading standards...</p>
                    </div>
                </div>
            </div>
        </section>

        <footer class="bg-gray-900 text-white py-12">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="text-center text-gray-400">
                    <p>© 2024 MOGU Education. All rights reserved.</p>
                    <p class="mt-2 text-sm">Accrediting Excellence. Empowering Learning.</p>
                </div>
            </div>
        </footer>

        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <script>
          axios.get('/api/standards')
            .then(response => {
              if (response.data.success) {
                const standards = response.data.standards;
                const container = document.getElementById('standards-list');
                
                const grouped = standards.reduce((acc, std) => {
                  if (!acc[std.category]) acc[std.category] = [];
                  acc[std.category].push(std);
                  return acc;
                }, {});

                let html = '';
                Object.keys(grouped).forEach(category => {
                  html += \`<div class="mb-6"><h4 class="text-xl font-bold mb-3 text-red-800">\${category}</h4><ul class="space-y-2">\`;
                  grouped[category].forEach(std => {
                    html += \`<li class="flex items-start"><i class="fas fa-check-circle text-green-600 mt-1 mr-3"></i><div><strong>\${std.standard_name}</strong><p class="text-sm text-gray-600">\${std.description}</p></div></li>\`;
                  });
                  html += '</ul></div>';
                });
                
                container.innerHTML = html;
              }
            })
            .catch(error => {
              document.getElementById('standards-list').innerHTML = '<p class="text-red-600 text-center">Error loading standards</p>';
            });
        </script>
    </body>
    </html>
  `)
})


// Accredited Centers Page
app.get('/centers', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Accredited Centers - MOGU Edu</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <style>.gradient-bg { background: linear-gradient(135deg, #8B1D1D 0%, #1F1F1F 100%); }</style>
    </head>
    <body class="bg-gray-50">
        <nav class="bg-white shadow-md sticky top-0 z-50">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="flex justify-between items-center h-16">
                    <div class="flex items-center">
                        <a href="/"><img src="/mogu-logo.png" alt="MOGU Edu" class="h-24"></a>
                    </div>
                    <div class="hidden md:flex space-x-8">
                        <a href="/" class="text-gray-600 hover:text-red-800">Home</a>
                        <a href="/about" class="text-gray-600 hover:text-red-800">About</a>
                        <a href="/services" class="text-gray-600 hover:text-red-800">Services</a>
                        <a href="/standards" class="text-gray-600 hover:text-red-800">Standards</a>
                        <a href="/verify" class="text-gray-600 hover:text-red-800">Verify Certificate</a>
                        <a href="/centers" class="text-red-800 font-semibold">Accredited Centers</a>
                        <a href="/contact" class="text-gray-600 hover:text-red-800">Contact</a>
                    </div>
                </div>
            </div>
        </nav>

        <section class="gradient-bg text-white py-16">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                <h1 class="text-4xl font-bold mb-4">Accredited Training Centers</h1>
                <p class="text-xl">Our network of quality-assured education providers</p>
            </div>
        </section>

        <section class="py-16">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="bg-white p-8 rounded-lg shadow-md mb-8">
                    <p class="text-gray-700 text-center">
                        All listed training centers have successfully met MOGU Education accreditation standards 
                        and are authorized to issue MOGU-accredited certificates.
                    </p>
                </div>

                <div id="centers-list" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div class="text-center text-gray-500 col-span-full py-12">
                        <i class="fas fa-spinner fa-spin text-4xl"></i>
                        <p class="mt-4">Loading accredited centers...</p>
                    </div>
                </div>
            </div>
        </section>

        <footer class="bg-gray-900 text-white py-12">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="text-center text-gray-400">
                    <p>© 2024 MOGU Education. All rights reserved.</p>
                    <p class="mt-2 text-sm">Accrediting Excellence. Empowering Learning.</p>
                </div>
            </div>
        </footer>

        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <script>
          axios.get('/api/centers')
            .then(response => {
              if (response.data.success) {
                const centers = response.data.centers;
                const container = document.getElementById('centers-list');
                
                if (centers.length === 0) {
                  container.innerHTML = '<p class="col-span-full text-center text-gray-600">No accredited centers found.</p>';
                  return;
                }

                let html = '';
                centers.forEach(center => {
                  html += \`
                    <div class="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition">
                      <div class="flex items-start mb-4">
                        <div class="text-3xl text-red-800 mr-4"><i class="fas fa-university"></i></div>
                        <div class="flex-1">
                          <h3 class="text-xl font-bold text-gray-800 mb-2">\${center.name}</h3>
                          <p class="text-sm text-gray-600 mb-1">
                            <i class="fas fa-map-marker-alt mr-2"></i>\${center.country}
                          </p>
                          <p class="text-sm text-gray-600 mb-3">
                            <i class="fas fa-calendar mr-2"></i>Accredited: \${new Date(center.accreditation_date).toLocaleDateString()}
                          </p>
                          <div class="flex items-center">
                            <span class="bg-green-100 text-green-800 text-xs font-semibold px-3 py-1 rounded-full">
                              <i class="fas fa-check-circle mr-1"></i>Active
                            </span>
                          </div>
                        </div>
                      </div>
                      \${center.website ? \`<a href="\${center.website}" target="_blank" class="text-red-800 text-sm hover:underline"><i class="fas fa-external-link-alt mr-1"></i>Visit Website</a>\` : ''}
                    </div>
                  \`;
                });
                
                container.innerHTML = html;
              }
            })
            .catch(error => {
              document.getElementById('centers-list').innerHTML = '<p class="col-span-full text-center text-red-600">Error loading centers</p>';
            });
        </script>
    </body>
    </html>
  `)
})

// Contact Page
app.get('/contact', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Contact Us - MOGU Edu</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <style>.gradient-bg { background: linear-gradient(135deg, #8B1D1D 0%, #1F1F1F 100%); }</style>
    </head>
    <body class="bg-gray-50">
        <nav class="bg-white shadow-md sticky top-0 z-50">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="flex justify-between items-center h-16">
                    <div class="flex items-center">
                        <a href="/"><img src="/mogu-logo.png" alt="MOGU Edu" class="h-24"></a>
                    </div>
                    <div class="hidden md:flex space-x-8">
                        <a href="/" class="text-gray-600 hover:text-red-800">Home</a>
                        <a href="/about" class="text-gray-600 hover:text-red-800">About</a>
                        <a href="/services" class="text-gray-600 hover:text-red-800">Services</a>
                        <a href="/standards" class="text-gray-600 hover:text-red-800">Standards</a>
                        <a href="/verify" class="text-gray-600 hover:text-red-800">Verify Certificate</a>
                        <a href="/centers" class="text-gray-600 hover:text-red-800">Accredited Centers</a>
                        <a href="/contact" class="text-red-800 font-semibold">Contact</a>
                    </div>
                </div>
            </div>
        </nav>

        <section class="gradient-bg text-white py-16">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                <h1 class="text-4xl font-bold mb-4">Contact MOGU Education</h1>
                <p class="text-xl">We're here to help with your accreditation needs</p>
            </div>
        </section>

        <section class="py-16">
            <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                    <div class="bg-white p-6 rounded-lg shadow-md text-center">
                        <div class="text-4xl text-red-800 mb-4"><i class="fas fa-envelope"></i></div>
                        <h3 class="font-bold mb-2">Email Us</h3>
                        <p class="text-gray-600 text-sm">info@moguedu.ca</p>
                    </div>
                    <div class="bg-white p-6 rounded-lg shadow-md text-center">
                        <div class="text-4xl text-red-800 mb-4"><i class="fas fa-map-marker-alt"></i></div>
                        <h3 class="font-bold mb-2">Location</h3>
                        <p class="text-gray-600 text-sm">Canada</p>
                    </div>
                    <div class="bg-white p-6 rounded-lg shadow-md text-center">
                        <div class="text-4xl text-red-800 mb-4"><i class="fas fa-clock"></i></div>
                        <h3 class="font-bold mb-2">Business Hours</h3>
                        <p class="text-gray-600 text-sm">Mon-Fri: 9AM-5PM EST</p>
                    </div>
                </div>

                <div class="bg-white p-8 rounded-lg shadow-md">
                    <h2 class="text-2xl font-bold mb-6 text-center">Send Us a Message</h2>
                    <form id="contact-form" class="space-y-6">
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label class="block text-gray-700 font-semibold mb-2">Name *</label>
                                <input type="text" required class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-800">
                            </div>
                            <div>
                                <label class="block text-gray-700 font-semibold mb-2">Email *</label>
                                <input type="email" required class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-800">
                            </div>
                        </div>
                        <div>
                            <label class="block text-gray-700 font-semibold mb-2">Organization</label>
                            <input type="text" class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-800">
                        </div>
                        <div>
                            <label class="block text-gray-700 font-semibold mb-2">Inquiry Type *</label>
                            <select required class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-800">
                                <option value="">Select an option</option>
                                <option>Training Center Accreditation</option>
                                <option>Program Accreditation</option>
                                <option>Certification Accreditation</option>
                                <option>Certificate Verification</option>
                                <option>General Inquiry</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-gray-700 font-semibold mb-2">Message *</label>
                            <textarea required rows="6" class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-800"></textarea>
                        </div>
                        <div>
                            <button type="submit" class="w-full bg-red-800 text-white py-4 rounded-lg font-semibold hover:bg-red-900 transition">
                                <i class="fas fa-paper-plane mr-2"></i>Send Message
                            </button>
                        </div>
                    </form>
                    <div id="form-message" class="mt-4 hidden"></div>
                </div>

                <div class="mt-12 bg-red-50 border-l-4 border-red-800 p-6 rounded-lg">
                    <h3 class="text-xl font-bold text-red-800 mb-3">
                        <i class="fas fa-info-circle mr-2"></i>Before You Contact Us
                    </h3>
                    <ul class="space-y-2 text-gray-700">
                        <li><i class="fas fa-check text-green-600 mr-2"></i>For certificate verification, please use our <a href="/verify" class="text-red-800 font-semibold hover:underline">online verification system</a></li>
                        <li><i class="fas fa-check text-green-600 mr-2"></i>Review our <a href="/services" class="text-red-800 font-semibold hover:underline">services page</a> for accreditation options</li>
                        <li><i class="fas fa-check text-green-600 mr-2"></i>Check our <a href="/standards" class="text-red-800 font-semibold hover:underline">standards page</a> for accreditation criteria</li>
                    </ul>
                </div>
            </div>
        </section>

        <footer class="bg-gray-900 text-white py-12">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="text-center text-gray-400">
                    <p>© 2024 MOGU Education. All rights reserved.</p>
                    <p class="mt-2 text-sm">Accrediting Excellence. Empowering Learning.</p>
                </div>
            </div>
        </footer>

        <script>
          document.getElementById('contact-form').addEventListener('submit', (e) => {
            e.preventDefault();
            const messageDiv = document.getElementById('form-message');
            messageDiv.className = 'mt-4 p-4 bg-green-50 border-l-4 border-green-500 rounded-lg';
            messageDiv.innerHTML = '<p class="text-green-800"><i class="fas fa-check-circle mr-2"></i>Thank you for your message. We will respond within 24-48 business hours.</p>';
            messageDiv.classList.remove('hidden');
            e.target.reset();
          });
        </script>
    </body>
    </html>
  `)
})

export default app

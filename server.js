/**
 * Harsha CourseHub - Smart Student Course Registration System
 * Backend Server & REST API
 * Designed & Developed by Harsha
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const mysql = require('mysql2/promise');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Database Connection Pool configuration
function getDbConfig() {
  require('dotenv').config({ override: true });
  return {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'harsha_coursehub_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    charset: 'utf8mb4'
  };
}

let dbConfig = getDbConfig();
let pool = null;
let dbConnected = false;
let dbErrorMessage = null;

function initPool() {
  try {
    dbConfig = getDbConfig();
    pool = mysql.createPool(dbConfig);
  } catch (err) {
    dbConnected = false;
    dbErrorMessage = err.message;
  }
}

initPool();

// Health check and connection verification
async function testDbConnection() {
  initPool();
  if (!pool) return false;
  try {
    const connection = await pool.getConnection();
    await connection.ping();
    connection.release();
    dbConnected = true;
    dbErrorMessage = null;
    console.log(`[Database Connected]: Successfully connected to MySQL database "${dbConfig.database}" at ${dbConfig.host}:${dbConfig.port}`);
    return true;
  } catch (err) {
    dbConnected = false;
    dbErrorMessage = err.message;
    console.warn('\n============================================================');
    console.warn('[Database Notice]: Could not connect to MySQL database.');
    console.warn(`Reason: ${err.message}`);
    console.warn('Steps to resolve:');
    console.warn('1. Verify MySQL server is running on ' + dbConfig.host + ':' + dbConfig.port);
    console.warn('2. Run database/schema.sql in MySQL Workbench to create "harsha_coursehub_db"');
    console.warn('3. (Optional) Run database/seed.sql to insert demo data');
    console.warn('4. Ensure credentials in .env (DB_USER, DB_PASSWORD) match your MySQL setup');
    console.warn('============================================================\n');
    return false;
  }
}

// Middleware to check database connection
const requireDb = (req, res, next) => {
  if (!dbConnected) {
    return res.status(503).json({
      success: false,
      message: 'Database connection is currently unavailable.',
      details: dbErrorMessage || 'Please verify MySQL is running and harsha_coursehub_db is created.',
      instruction: 'Run schema.sql in MySQL Workbench and check your credentials in .env'
    });
  }
  next();
};

/* ==========================================================
 * REST APIs
 * ========================================================== */

// 1. Database Health Check
app.get('/api/health', async (req, res) => {
  const isHealthy = await testDbConnection();
  res.json({
    status: isHealthy ? 'healthy' : 'disconnected',
    database: {
      connected: isHealthy,
      host: dbConfig.host,
      database: dbConfig.database,
      error: dbErrorMessage
    },
    app: {
      name: 'Harsha CourseHub',
      version: '1.0.0',
      subtitle: 'Smart Student Course Registration System'
    }
  });
});

// 2. Dashboard Statistics & Overview
app.get('/api/dashboard/stats', requireDb, async (req, res) => {
  try {
    // 1. Total Students
    const [[{ totalStudents }]] = await pool.query('SELECT COUNT(*) AS totalStudents FROM students');
    
    // 2. Total Courses
    const [[{ totalCourses }]] = await pool.query('SELECT COUNT(*) AS totalCourses FROM courses');
    
    // 3. Total Registrations
    const [[{ totalRegistrations }]] = await pool.query('SELECT COUNT(*) AS totalRegistrations FROM registrations');
    
    // 4. Active Registrations (Confirmed / Registered)
    const [[{ activeRegistrations }]] = await pool.query(
      "SELECT COUNT(*) AS activeRegistrations FROM registrations WHERE status IN ('Confirmed', 'Registered')"
    );

    // Recent 5 registrations with joined student and course details
    const [rawRecentRegistrations] = await pool.query(`
      SELECT 
        r.registration_id,
        r.student_id,
        r.course_id,
        r.registration_date,
        r.status,
        s.name AS student_name,
        s.roll_no,
        s.branch,
        c.course_code,
        c.course_name,
        c.credits,
        c.department
      FROM registrations r
      JOIN students s ON r.student_id = s.student_id
      JOIN courses c ON r.course_id = c.course_id
      ORDER BY r.registration_id DESC
      LIMIT 5
    `);

    const recentRegistrations = rawRecentRegistrations.map(r => ({
      ...r,
      status: (r.status === 'Confirmed' || r.status === 'Registered') ? 'Registered' : r.status
    }));

    // Department course counts
    const [deptStats] = await pool.query(`
      SELECT department, COUNT(*) AS course_count
      FROM courses
      GROUP BY department
      ORDER BY course_count DESC
    `);

    res.json({
      success: true,
      data: {
        totalStudents,
        totalCourses,
        totalRegistrations,
        activeRegistrations,
        recentRegistrations,
        deptStats
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve dashboard statistics', error: error.message });
  }
});

// 3. Students API
// GET /api/students - List all students (with search, branch filter, and registration summary)
app.get('/api/students', requireDb, async (req, res) => {
  try {
    const { search, branch, sort = 'roll_asc' } = req.query;
    let query = `
      SELECT 
        s.student_id,
        s.name,
        s.roll_no,
        s.branch,
        s.email,
        s.created_at,
        COUNT(CASE WHEN r.status IN ('Confirmed', 'Registered') THEN r.registration_id END) AS registered_courses_count,
        COALESCE(SUM(CASE WHEN r.status IN ('Confirmed', 'Registered') THEN c.credits ELSE 0 END), 0) AS total_credits
      FROM students s
      LEFT JOIN registrations r ON s.student_id = r.student_id
      LEFT JOIN courses c ON r.course_id = c.course_id
      WHERE 1=1
    `;
    const params = [];

    if (search && search.trim() !== '') {
      query += ` AND (s.name LIKE ? OR s.roll_no LIKE ? OR s.email LIKE ?)`;
      const term = `%${search.trim()}%`;
      params.push(term, term, term);
    }

    if (branch && branch.trim() !== '' && branch !== 'all') {
      query += ` AND s.branch = ?`;
      params.push(branch.trim());
    }

    // Determine sort column and direction - default to roll_no ASC (roll number wise)
    let orderBy = 's.roll_no ASC';
    if (sort === 'roll_desc') {
      orderBy = 's.roll_no DESC';
    } else if (sort === 'name_asc') {
      orderBy = 's.name ASC';
    } else if (sort === 'name_desc') {
      orderBy = 's.name DESC';
    } else if (sort === 'newest') {
      orderBy = 's.student_id DESC';
    } else if (sort === 'oldest') {
      orderBy = 's.student_id ASC';
    } else if (sort === 'courses_desc') {
      orderBy = 'registered_courses_count DESC, s.roll_no ASC';
    } else if (sort === 'courses_asc') {
      orderBy = 'registered_courses_count ASC, s.roll_no ASC';
    } else {
      orderBy = 's.roll_no ASC';
    }

    query += ` GROUP BY s.student_id, s.name, s.roll_no, s.branch, s.email, s.created_at ORDER BY ${orderBy}`;

    const [students] = await pool.query(query, params);
    res.json({ success: true, count: students.length, data: students });
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve students', error: error.message });
  }
});

// GET /api/students/:id - Get single student details with registrations
app.get('/api/students/:id', requireDb, async (req, res) => {
  try {
    const studentId = parseInt(req.params.id, 10);
    if (isNaN(studentId)) {
      return res.status(400).json({ success: false, message: 'Invalid student ID' });
    }

    const [[student]] = await pool.query('SELECT * FROM students WHERE student_id = ?', [studentId]);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    // Fetch student's course registrations
    const [rawRegistrations] = await pool.query(`
      SELECT 
        r.registration_id,
        r.registration_date,
        r.status,
        c.course_id,
        c.course_code,
        c.course_name,
        c.credits,
        c.department,
        c.semester
      FROM registrations r
      JOIN courses c ON r.course_id = c.course_id
      WHERE r.student_id = ?
      ORDER BY r.registration_id DESC
    `, [studentId]);

    const registrations = rawRegistrations.map(r => ({
      ...r,
      status: (r.status === 'Confirmed' || r.status === 'Registered') ? 'Registered' : r.status
    }));

    const totalCredits = registrations
      .filter(r => r.status === 'Registered')
      .reduce((sum, item) => sum + Number(item.credits || 0), 0);

    res.json({
      success: true,
      data: {
        ...student,
        registrations,
        registered_courses_count: registrations.filter(r => r.status === 'Registered').length,
        total_credits: totalCredits
      }
    });
  } catch (error) {
    console.error('Error fetching student details:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve student details', error: error.message });
  }
});

// POST /api/students - Add new student
app.post('/api/students', requireDb, async (req, res) => {
  try {
    const { name, roll_no, branch, email } = req.body;

    // Validation
    if (!name || !roll_no || !branch || !email) {
      return res.status(400).json({ success: false, message: 'All fields (name, roll_no, branch, email) are required.' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ success: false, message: 'Please provide a valid email address.' });
    }

    // Check unique roll_no
    const [existingRoll] = await pool.query('SELECT student_id FROM students WHERE roll_no = ?', [roll_no.trim()]);
    if (existingRoll.length > 0) {
      return res.status(409).json({ success: false, message: `Roll Number "${roll_no}" is already registered.` });
    }

    // Check unique email
    const [existingEmail] = await pool.query('SELECT student_id FROM students WHERE email = ?', [email.trim()]);
    if (existingEmail.length > 0) {
      return res.status(409).json({ success: false, message: `Email "${email}" is already registered.` });
    }

    const [result] = await pool.query(
      'INSERT INTO students (name, roll_no, branch, email) VALUES (?, ?, ?, ?)',
      [name.trim(), roll_no.trim().toUpperCase(), branch.trim(), email.trim().toLowerCase()]
    );

    res.status(201).json({
      success: true,
      message: 'Student created successfully.',
      student_id: result.insertId
    });
  } catch (error) {
    console.error('Error creating student:', error);
    res.status(500).json({ success: false, message: 'Failed to create student', error: error.message });
  }
});

// PUT /api/students/:id - Update student
app.put('/api/students/:id', requireDb, async (req, res) => {
  try {
    const studentId = parseInt(req.params.id, 10);
    const { name, roll_no, branch, email } = req.body;

    if (isNaN(studentId)) {
      return res.status(400).json({ success: false, message: 'Invalid student ID' });
    }

    if (!name || !roll_no || !branch || !email) {
      return res.status(400).json({ success: false, message: 'All fields are required.' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ success: false, message: 'Invalid email address format.' });
    }

    // Check uniqueness excluding self
    const [existingRoll] = await pool.query(
      'SELECT student_id FROM students WHERE roll_no = ? AND student_id != ?',
      [roll_no.trim(), studentId]
    );
    if (existingRoll.length > 0) {
      return res.status(409).json({ success: false, message: `Roll Number "${roll_no}" is already in use by another student.` });
    }

    const [existingEmail] = await pool.query(
      'SELECT student_id FROM students WHERE email = ? AND student_id != ?',
      [email.trim(), studentId]
    );
    if (existingEmail.length > 0) {
      return res.status(409).json({ success: false, message: `Email "${email}" is already in use by another student.` });
    }

    const [result] = await pool.query(
      'UPDATE students SET name = ?, roll_no = ?, branch = ?, email = ? WHERE student_id = ?',
      [name.trim(), roll_no.trim().toUpperCase(), branch.trim(), email.trim().toLowerCase(), studentId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Student not found.' });
    }

    res.json({ success: true, message: 'Student updated successfully.' });
  } catch (error) {
    console.error('Error updating student:', error);
    res.status(500).json({ success: false, message: 'Failed to update student', error: error.message });
  }
});

// DELETE /api/students/:id - Delete student
app.delete('/api/students/:id', requireDb, async (req, res) => {
  try {
    const studentId = parseInt(req.params.id, 10);
    if (isNaN(studentId)) {
      return res.status(400).json({ success: false, message: 'Invalid student ID' });
    }

    const [result] = await pool.query('DELETE FROM students WHERE student_id = ?', [studentId]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    res.json({ success: true, message: 'Student and related registrations deleted successfully.' });
  } catch (error) {
    console.error('Error deleting student:', error);
    res.status(500).json({ success: false, message: 'Failed to delete student', error: error.message });
  }
});

// 4. Courses API
// GET /api/courses - List all courses (with search, department, and semester filters)
app.get('/api/courses', requireDb, async (req, res) => {
  try {
    const { search, department, semester } = req.query;
    let query = `
      SELECT 
        c.course_id,
        c.course_code,
        c.course_name,
        c.credits,
        c.department,
        c.semester,
        c.created_at,
        COUNT(CASE WHEN r.status IN ('Confirmed', 'Registered') THEN r.registration_id END) AS enrolled_students_count
      FROM courses c
      LEFT JOIN registrations r ON c.course_id = r.course_id
      WHERE 1=1
    `;
    const params = [];

    if (search && search.trim() !== '') {
      query += ` AND (c.course_code LIKE ? OR c.course_name LIKE ? OR c.department LIKE ?)`;
      const term = `%${search.trim()}%`;
      params.push(term, term, term);
    }

    if (department && department.trim() !== '' && department !== 'all') {
      query += ` AND c.department = ?`;
      params.push(department.trim());
    }

    if (semester && semester.trim() !== '' && semester !== 'all') {
      query += ` AND c.semester = ?`;
      params.push(semester.trim());
    }

    query += ` GROUP BY c.course_id, c.course_code, c.course_name, c.credits, c.department, c.semester, c.created_at ORDER BY c.course_code ASC`;

    const [courses] = await pool.query(query, params);
    res.json({ success: true, count: courses.length, data: courses });
  } catch (error) {
    console.error('Error fetching courses:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve courses', error: error.message });
  }
});

// GET /api/courses/:id - Single course with enrolled students
app.get('/api/courses/:id', requireDb, async (req, res) => {
  try {
    const courseId = parseInt(req.params.id, 10);
    if (isNaN(courseId)) {
      return res.status(400).json({ success: false, message: 'Invalid course ID' });
    }

    const [[course]] = await pool.query('SELECT * FROM courses WHERE course_id = ?', [courseId]);
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    const [rawEnrolledStudents] = await pool.query(`
      SELECT 
        r.registration_id,
        r.registration_date,
        r.status,
        s.student_id,
        s.name,
        s.roll_no,
        s.branch,
        s.email
      FROM registrations r
      JOIN students s ON r.student_id = s.student_id
      WHERE r.course_id = ?
      ORDER BY r.registration_id DESC
    `, [courseId]);

    const enrolledStudents = rawEnrolledStudents.map(e => ({
      ...e,
      status: (e.status === 'Confirmed' || e.status === 'Registered') ? 'Registered' : e.status
    }));

    res.json({
      success: true,
      data: {
        ...course,
        enrolledStudents,
        enrolled_count: enrolledStudents.filter(e => e.status === 'Registered').length
      }
    });
  } catch (error) {
    console.error('Error fetching course details:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve course details', error: error.message });
  }
});

// POST /api/courses - Add new course
app.post('/api/courses', requireDb, async (req, res) => {
  try {
    const { course_code, course_name, credits, department, semester } = req.body;

    if (!course_code || !course_name || !credits || !department || !semester) {
      return res.status(400).json({ success: false, message: 'All course fields are required.' });
    }

    const creditNum = parseInt(credits, 10);
    if (isNaN(creditNum) || creditNum <= 0 || creditNum > 10) {
      return res.status(400).json({ success: false, message: 'Credits must be a positive number between 1 and 10.' });
    }

    // Check unique course code
    const [existingCode] = await pool.query('SELECT course_id FROM courses WHERE course_code = ?', [course_code.trim().toUpperCase()]);
    if (existingCode.length > 0) {
      return res.status(409).json({ success: false, message: `Course code "${course_code.toUpperCase()}" already exists.` });
    }

    const [result] = await pool.query(
      'INSERT INTO courses (course_code, course_name, credits, department, semester) VALUES (?, ?, ?, ?, ?)',
      [course_code.trim().toUpperCase(), course_name.trim(), creditNum, department.trim(), semester.trim()]
    );

    res.status(201).json({
      success: true,
      message: 'Course created successfully.',
      course_id: result.insertId
    });
  } catch (error) {
    console.error('Error adding course:', error);
    res.status(500).json({ success: false, message: 'Failed to add course', error: error.message });
  }
});

// PUT /api/courses/:id - Update course
app.put('/api/courses/:id', requireDb, async (req, res) => {
  try {
    const courseId = parseInt(req.params.id, 10);
    const { course_code, course_name, credits, department, semester } = req.body;

    if (isNaN(courseId)) {
      return res.status(400).json({ success: false, message: 'Invalid course ID' });
    }

    if (!course_code || !course_name || !credits || !department || !semester) {
      return res.status(400).json({ success: false, message: 'All course fields are required.' });
    }

    const creditNum = parseInt(credits, 10);
    if (isNaN(creditNum) || creditNum <= 0 || creditNum > 10) {
      return res.status(400).json({ success: false, message: 'Credits must be a number between 1 and 10.' });
    }

    // Check duplicate code
    const [existing] = await pool.query(
      'SELECT course_id FROM courses WHERE course_code = ? AND course_id != ?',
      [course_code.trim().toUpperCase(), courseId]
    );
    if (existing.length > 0) {
      return res.status(409).json({ success: false, message: `Course code "${course_code.toUpperCase()}" is already taken.` });
    }

    const [result] = await pool.query(
      'UPDATE courses SET course_code = ?, course_name = ?, credits = ?, department = ?, semester = ? WHERE course_id = ?',
      [course_code.trim().toUpperCase(), course_name.trim(), creditNum, department.trim(), semester.trim(), courseId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Course not found.' });
    }

    res.json({ success: true, message: 'Course updated successfully.' });
  } catch (error) {
    console.error('Error updating course:', error);
    res.status(500).json({ success: false, message: 'Failed to update course', error: error.message });
  }
});

// DELETE /api/courses/:id - Delete course
app.delete('/api/courses/:id', requireDb, async (req, res) => {
  try {
    const courseId = parseInt(req.params.id, 10);
    if (isNaN(courseId)) {
      return res.status(400).json({ success: false, message: 'Invalid course ID' });
    }

    const [result] = await pool.query('DELETE FROM courses WHERE course_id = ?', [courseId]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Course not found.' });
    }

    res.json({ success: true, message: 'Course and related registrations deleted successfully.' });
  } catch (error) {
    console.error('Error deleting course:', error);
    res.status(500).json({ success: false, message: 'Failed to delete course', error: error.message });
  }
});

// 5. Registrations API
// GET /api/registrations - List all registrations with rich filters
app.get('/api/registrations', requireDb, async (req, res) => {
  try {
    const { search, status, course_id, student_id } = req.query;
    let query = `
      SELECT 
        r.registration_id,
        r.student_id,
        r.course_id,
        r.registration_date,
        r.status,
        s.name AS student_name,
        s.roll_no,
        s.branch,
        s.email AS student_email,
        c.course_code,
        c.course_name,
        c.credits,
        c.department,
        c.semester
      FROM registrations r
      JOIN students s ON r.student_id = s.student_id
      JOIN courses c ON r.course_id = c.course_id
      WHERE 1=1
    `;
    const params = [];

    if (search && search.trim() !== '') {
      query += ` AND (s.name LIKE ? OR s.roll_no LIKE ? OR c.course_code LIKE ? OR c.course_name LIKE ?)`;
      const term = `%${search.trim()}%`;
      params.push(term, term, term, term);
    }

    if (status && status !== 'all') {
      if (status === 'Registered') {
        query += ` AND r.status IN ('Confirmed', 'Registered')`;
      } else if (status === 'Dropped') {
        query += ` AND r.status = 'Dropped'`;
      } else {
        query += ` AND r.status = ?`;
        params.push(status);
      }
    }

    if (course_id && course_id !== 'all') {
      query += ` AND r.course_id = ?`;
      params.push(parseInt(course_id, 10));
    }

    if (student_id && student_id !== 'all') {
      query += ` AND r.student_id = ?`;
      params.push(parseInt(student_id, 10));
    }

    query += ` ORDER BY r.registration_id DESC`;

    const [rawRegistrations] = await pool.query(query, params);
    const registrations = rawRegistrations.map(r => ({
      ...r,
      status: (r.status === 'Confirmed' || r.status === 'Registered') ? 'Registered' : r.status
    }));

    res.json({ success: true, count: registrations.length, data: registrations });
  } catch (error) {
    console.error('Error fetching registrations:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve registrations', error: error.message });
  }
});

// GET /api/registrations/student/:student_id/course-status - Get courses with registration flag for a student
app.get('/api/registrations/student/:student_id/course-status', requireDb, async (req, res) => {
  try {
    const studentId = parseInt(req.params.student_id, 10);
    if (isNaN(studentId)) {
      return res.status(400).json({ success: false, message: 'Invalid student ID' });
    }

    const query = `
      SELECT 
        c.course_id,
        c.course_code,
        c.course_name,
        c.credits,
        c.department,
        c.semester,
        r.registration_id,
        r.registration_date,
        r.status AS raw_status,
        CASE WHEN r.registration_id IS NOT NULL AND r.status IN ('Confirmed', 'Registered') THEN 1 ELSE 0 END AS is_registered
      FROM courses c
      LEFT JOIN registrations r ON c.course_id = r.course_id AND r.student_id = ?
      ORDER BY c.department, c.course_code
    `;

    const [rows] = await pool.query(query, [studentId]);
    const courses = rows.map(c => ({
      ...c,
      registration_status: (c.raw_status === 'Confirmed' || c.raw_status === 'Registered')
        ? 'Registered'
        : (c.raw_status === 'Dropped' ? 'Dropped' : (c.raw_status || null))
    }));

    res.json({ success: true, data: courses });
  } catch (error) {
    console.error('Error checking student course status:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve student course status', error: error.message });
  }
});

// POST /api/registrations - Register student for course (duplicate check & safe re-activation)
app.post('/api/registrations', requireDb, async (req, res) => {
  try {
    const { student_id, course_id, status } = req.body;

    const studentId = parseInt(student_id, 10);
    const courseId = parseInt(course_id, 10);
    // Database enum stores 'Confirmed' or 'Dropped'
    const dbStatus = (status === 'Dropped') ? 'Dropped' : 'Confirmed';

    if (isNaN(studentId) || isNaN(courseId)) {
      return res.status(400).json({ success: false, message: 'Valid Student ID and Course ID are required.' });
    }

    // Verify student exists
    const [[student]] = await pool.query('SELECT name, roll_no FROM students WHERE student_id = ?', [studentId]);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Selected student does not exist.' });
    }

    // Verify course exists
    const [[course]] = await pool.query('SELECT course_code, course_name FROM courses WHERE course_id = ?', [courseId]);
    if (!course) {
      return res.status(404).json({ success: false, message: 'Selected course does not exist.' });
    }

    // Check for existing registration
    const [existing] = await pool.query(
      'SELECT registration_id, status FROM registrations WHERE student_id = ? AND course_id = ?',
      [studentId, courseId]
    );

    if (existing.length > 0) {
      const current = existing[0];
      if (current.status === 'Confirmed' || current.status === 'Registered') {
        return res.status(409).json({
          success: false,
          message: `Student "${student.name}" (${student.roll_no}) is already registered for "${course.course_code} - ${course.course_name}".`
        });
      } else {
        // Was previously Dropped: Re-activate seamlessly
        await pool.query(
          'UPDATE registrations SET status = ?, registration_date = NOW() WHERE registration_id = ?',
          [dbStatus, current.registration_id]
        );
        return res.status(200).json({
          success: true,
          message: `Successfully re-registered ${student.name} for ${course.course_code}!`,
          registration_id: current.registration_id
        });
      }
    }

    // Insert new registration
    const [result] = await pool.query(
      'INSERT INTO registrations (student_id, course_id, status, registration_date) VALUES (?, ?, ?, NOW())',
      [studentId, courseId, dbStatus]
    );

    res.status(201).json({
      success: true,
      message: `Successfully registered ${student.name} for ${course.course_code}!`,
      registration_id: result.insertId
    });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        success: false,
        message: 'This student is already registered for this course.'
      });
    }
    console.error('Error creating registration:', error);
    res.status(500).json({ success: false, message: 'Failed to process registration', error: error.message });
  }
});

// PATCH /api/registrations/:id/status - Update registration status (Registered / Dropped)
app.patch('/api/registrations/:id/status', requireDb, async (req, res) => {
  try {
    const regId = parseInt(req.params.id, 10);
    const { status } = req.body;

    if (isNaN(regId)) {
      return res.status(400).json({ success: false, message: 'Invalid registration ID.' });
    }

    const normalizedStatus = (status === 'Registered' || status === 'Confirmed') ? 'Confirmed' : (status === 'Dropped' ? 'Dropped' : null);
    if (!normalizedStatus) {
      return res.status(400).json({ success: false, message: 'Status must be Registered or Dropped.' });
    }

    const [result] = await pool.query(
      'UPDATE registrations SET status = ? WHERE registration_id = ?',
      [normalizedStatus, regId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Registration record not found.' });
    }

    const displayStatus = normalizedStatus === 'Confirmed' ? 'Registered' : 'Dropped';
    res.json({ success: true, message: `Registration status updated to ${displayStatus}.` });
  } catch (error) {
    console.error('Error updating registration status:', error);
    res.status(500).json({ success: false, message: 'Failed to update registration status', error: error.message });
  }
});

// DELETE /api/registrations/:id - Delete registration
app.delete('/api/registrations/:id', requireDb, async (req, res) => {
  try {
    const regId = parseInt(req.params.id, 10);
    if (isNaN(regId)) {
      return res.status(400).json({ success: false, message: 'Invalid registration ID.' });
    }

    const [result] = await pool.query('DELETE FROM registrations WHERE registration_id = ?', [regId]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Registration not found.' });
    }

    res.json({ success: true, message: 'Course registration deleted successfully.' });
  } catch (error) {
    console.error('Error deleting registration:', error);
    res.status(500).json({ success: false, message: 'Failed to delete registration', error: error.message });
  }
});

// 6. CSV Export of Registrations (Respects filters)
app.get('/api/reports/registrations/csv', requireDb, async (req, res) => {
  try {
    const { search, status } = req.query;
    let query = `
      SELECT 
        r.registration_id,
        s.name AS student_name,
        s.roll_no,
        s.branch,
        s.email AS student_email,
        c.course_code,
        c.course_name,
        c.credits,
        c.department,
        c.semester,
        DATE_FORMAT(r.registration_date, '%Y-%m-%d %H:%i:%s') AS formatted_date,
        r.status
      FROM registrations r
      JOIN students s ON r.student_id = s.student_id
      JOIN courses c ON r.course_id = c.course_id
      WHERE 1=1
    `;
    const params = [];

    if (search && search.trim() !== '') {
      query += ` AND (s.name LIKE ? OR s.roll_no LIKE ? OR c.course_code LIKE ? OR c.course_name LIKE ?)`;
      const term = `%${search.trim()}%`;
      params.push(term, term, term, term);
    }

    if (status && status !== 'all') {
      if (status === 'Registered') {
        query += ` AND r.status IN ('Confirmed', 'Registered')`;
      } else if (status === 'Dropped') {
        query += ` AND r.status = 'Dropped'`;
      } else {
        query += ` AND r.status = ?`;
        params.push(status);
      }
    }

    query += ` ORDER BY r.registration_id ASC`;

    const [rows] = await pool.query(query, params);

    const headers = [
      'Registration ID',
      'Student Name',
      'Roll Number',
      'Branch',
      'Student Email',
      'Course Code',
      'Course Name',
      'Credits',
      'Department',
      'Semester',
      'Registration Date',
      'Status'
    ];

    const escapeCsv = (str) => {
      if (str === null || str === undefined) return '""';
      const value = String(str).replace(/"/g, '""');
      return `"${value}"`;
    };

    let csvContent = headers.join(',') + '\r\n';
    rows.forEach(row => {
      const displayStatus = (row.status === 'Confirmed' || row.status === 'Registered') ? 'Registered' : row.status;
      const line = [
        row.registration_id,
        escapeCsv(row.student_name),
        escapeCsv(row.roll_no),
        escapeCsv(row.branch),
        escapeCsv(row.student_email),
        escapeCsv(row.course_code),
        escapeCsv(row.course_name),
        row.credits,
        escapeCsv(row.department),
        escapeCsv(row.semester),
        escapeCsv(row.formatted_date),
        escapeCsv(displayStatus)
      ].join(',');
      csvContent += line + '\r\n';
    });

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="harsha_coursehub_registrations.csv"');
    res.status(200).send(csvContent);
  } catch (error) {
    console.error('Error generating CSV export:', error);
    res.status(500).json({ success: false, message: 'Failed to export CSV report', error: error.message });
  }
});

// 7. Departments and Branches List API
app.get('/api/metadata/lists', requireDb, async (req, res) => {
  try {
    const [branches] = await pool.query('SELECT DISTINCT branch FROM students ORDER BY branch ASC');
    const [departments] = await pool.query('SELECT DISTINCT department FROM courses ORDER BY department ASC');
    const [semesters] = await pool.query('SELECT DISTINCT semester FROM courses ORDER BY semester ASC');

    res.json({
      success: true,
      branches: branches.map(b => b.branch),
      departments: departments.map(d => d.department),
      semesters: semesters.map(s => s.semester)
    });
  } catch (error) {
    console.error('Error fetching metadata:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve filter metadata', error: error.message });
  }
});

// Fallback route for SPA or direct page visits
app.get('*', (req, res) => {
  // If requesting an api route that was not handled
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ success: false, message: 'API endpoint not found' });
  }
  // Otherwise serve index.html or 404
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start Server
app.listen(PORT, async () => {
  console.log('============================================================');
  console.log(`🚀 Harsha CourseHub Server running at: http://localhost:${PORT}`);
  console.log(`📌 Smart Student Course Registration System`);
  console.log(`👨‍💻 Designed & Developed by Harsha`);
  console.log('============================================================');
  await testDbConnection();
});

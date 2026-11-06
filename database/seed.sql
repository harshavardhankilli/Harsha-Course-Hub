-- =======================================================
-- Harsha CourseHub - Smart Student Course Registration System
-- Seed / Fictional Demo Data Script (Andhra Pradesh Engineering College)
-- Designed & Developed by Harsha
-- =======================================================

USE harsha_coursehub_db;

-- 1. Safely clear demo data in foreign-key dependency order
DELETE FROM registrations;
DELETE FROM courses;
DELETE FROM students;

-- Reset Auto Increment IDs
ALTER TABLE registrations AUTO_INCREMENT = 1;
ALTER TABLE courses AUTO_INCREMENT = 1;
ALTER TABLE students AUTO_INCREMENT = 1;

-- 2. Insert Fictional Andhra Pradesh Engineering Students (24 Students)
INSERT INTO students (student_id, name, roll_no, branch, email) VALUES
(1, 'Harsha Vardhan', '23CS101', 'Computer Science and Engineering', 'harsha.vardhan@campus.edu'),
(2, 'Sai Kiran', '23CS102', 'Computer Science and Engineering', 'sai.kiran@campus.edu'),
(3, 'Pooja Reddy', '23AI101', 'Artificial Intelligence and Data Science', 'pooja.reddy@campus.edu'),
(4, 'Nikhil Kumar', '23IT101', 'Information Technology', 'nikhil.kumar@campus.edu'),
(5, 'Vamsi Krishna', '23EC101', 'Electronics and Communication Engineering', 'vamsi.krishna@campus.edu'),
(6, 'Sravani', '23CS103', 'Computer Science and Engineering', 'sravani@campus.edu'),
(7, 'Ravi Teja', '23EE101', 'Electrical and Electronics Engineering', 'ravi.teja@campus.edu'),
(8, 'Ananya Reddy', '23AI102', 'Artificial Intelligence and Data Science', 'ananya.reddy@campus.edu'),
(9, 'Charan Kumar', '23ME101', 'Mechanical Engineering', 'charan.kumar@campus.edu'),
(10, 'Divya Sri', '23CE101', 'Civil Engineering', 'divya.sri@campus.edu'),
(11, 'Manoj Varma', '23CS104', 'Computer Science and Engineering', 'manoj.varma@campus.edu'),
(12, 'Bhavya Lakshmi', '23CS105', 'Computer Science and Engineering', 'bhavya.lakshmi@campus.edu'),
(13, 'Tarun Naidu', '23AI103', 'Artificial Intelligence and Data Science', 'tarun.naidu@campus.edu'),
(14, 'Keerthi Suresh', '23IT102', 'Information Technology', 'keerthi.suresh@campus.edu'),
(15, 'Prashanth Raju', '23EC102', 'Electronics and Communication Engineering', 'prashanth.raju@campus.edu'),
(16, 'Tejaswi Goud', '23EC103', 'Electronics and Communication Engineering', 'tejaswi.goud@campus.edu'),
(17, 'Sandeep Varma', '23EE102', 'Electrical and Electronics Engineering', 'sandeep.varma@campus.edu'),
(18, 'Meghana Rao', '23ME102', 'Mechanical Engineering', 'meghana.rao@campus.edu'),
(19, 'Akhil Chowdary', '23CE102', 'Civil Engineering', 'akhil.chowdary@campus.edu'),
(20, 'Sneha Latha', '23CS106', 'Computer Science and Engineering', 'sneha.latha@campus.edu'),
(21, 'Madhav Krishna', '23AI104', 'Artificial Intelligence and Data Science', 'madhav.krishna@campus.edu'),
(22, 'Rohith Yadav', '23IT103', 'Information Technology', 'rohith.yadav@campus.edu'),
(23, 'Karthik Reddy', '23EE103', 'Electrical and Electronics Engineering', 'karthik.reddy@campus.edu'),
(24, 'Lavanya Devi', '23EC104', 'Electronics and Communication Engineering', 'lavanya.devi@campus.edu');

-- 3. Insert Academic Courses (13 Accredited Courses)
INSERT INTO courses (course_id, course_code, course_name, credits, department, semester) VALUES
(1, 'CS301', 'Data Structures', 4, 'Computer Science and Engineering', 'Semester 3'),
(2, 'CS302', 'Database Management Systems', 4, 'Computer Science and Engineering', 'Semester 3'),
(3, 'CS303', 'Operating Systems', 4, 'Computer Science and Engineering', 'Semester 4'),
(4, 'CS401', 'Full Stack Web Development', 4, 'Computer Science and Engineering', 'Semester 5'),
(5, 'CS402', 'Computer Networks', 3, 'Computer Science and Engineering', 'Semester 5'),
(6, 'AI301', 'Machine Learning', 4, 'Artificial Intelligence and Data Science', 'Semester 4'),
(7, 'AI401', 'Deep Learning & Neural Networks', 4, 'Artificial Intelligence and Data Science', 'Semester 5'),
(8, 'EC301', 'Digital Electronics', 3, 'Electronics and Communication Engineering', 'Semester 3'),
(9, 'EC401', 'VLSI Design', 3, 'Electronics and Communication Engineering', 'Semester 5'),
(10, 'IT301', 'Cloud Computing', 3, 'Information Technology', 'Semester 4'),
(11, 'EE301', 'Control Systems', 3, 'Electrical and Electronics Engineering', 'Semester 4'),
(12, 'ME301', 'Thermodynamics', 3, 'Mechanical Engineering', 'Semester 3'),
(13, 'CE301', 'Structural Analysis', 3, 'Civil Engineering', 'Semester 3');

-- 4. Insert Realistic Student Course Registrations (52 Registrations)
INSERT INTO registrations (student_id, course_id, registration_date, status) VALUES
-- Student 1: Harsha Vardhan
(1, 1, '2026-08-10 09:30:00', 'Confirmed'),
(1, 2, '2026-08-10 09:45:00', 'Confirmed'),
(1, 4, '2026-08-11 14:15:00', 'Confirmed'),
-- Student 2: Sai Kiran
(2, 1, '2026-08-10 10:00:00', 'Confirmed'),
(2, 2, '2026-08-10 10:15:00', 'Confirmed'),
(2, 3, '2026-08-12 11:30:00', 'Confirmed'),
-- Student 3: Pooja Reddy
(3, 1, '2026-08-10 11:00:00', 'Confirmed'),
(3, 6, '2026-08-11 10:30:00', 'Confirmed'),
(3, 7, '2026-08-12 15:20:00', 'Confirmed'),
-- Student 4: Nikhil Kumar
(4, 1, '2026-08-10 11:30:00', 'Confirmed'),
(4, 2, '2026-08-10 11:45:00', 'Confirmed'),
(4, 10, '2026-08-12 09:15:00', 'Confirmed'),
-- Student 5: Vamsi Krishna
(5, 8, '2026-08-10 12:00:00', 'Confirmed'),
(5, 9, '2026-08-11 16:00:00', 'Confirmed'),
(5, 1, '2026-08-11 16:30:00', 'Dropped'),
-- Student 6: Sravani
(6, 1, '2026-08-10 14:00:00', 'Confirmed'),
(6, 4, '2026-08-11 15:45:00', 'Confirmed'),
-- Student 7: Ravi Teja
(7, 11, '2026-08-10 14:30:00', 'Confirmed'),
(7, 1, '2026-08-12 10:00:00', 'Confirmed'),
-- Student 8: Ananya Reddy
(8, 6, '2026-08-10 15:00:00', 'Confirmed'),
(8, 1, '2026-08-11 11:00:00', 'Confirmed'),
-- Student 9: Charan Kumar
(9, 12, '2026-08-10 15:30:00', 'Confirmed'),
(9, 1, '2026-08-11 12:00:00', 'Dropped'),
-- Student 10: Divya Sri
(10, 13, '2026-08-10 16:00:00', 'Confirmed'),
-- Student 11: Manoj Varma
(11, 1, '2026-08-11 09:00:00', 'Confirmed'),
(11, 2, '2026-08-11 09:20:00', 'Confirmed'),
(11, 3, '2026-08-12 14:00:00', 'Confirmed'),
-- Student 12: Bhavya Lakshmi
(12, 1, '2026-08-11 09:40:00', 'Confirmed'),
(12, 4, '2026-08-12 10:15:00', 'Confirmed'),
(12, 5, '2026-08-12 10:30:00', 'Confirmed'),
-- Student 13: Tarun Naidu
(13, 1, '2026-08-11 10:00:00', 'Confirmed'),
(13, 6, '2026-08-11 10:45:00', 'Confirmed'),
(13, 7, '2026-08-13 11:00:00', 'Confirmed'),
-- Student 14: Keerthi Suresh
(14, 1, '2026-08-11 11:15:00', 'Confirmed'),
(14, 2, '2026-08-11 11:30:00', 'Confirmed'),
(14, 10, '2026-08-12 15:45:00', 'Confirmed'),
-- Student 15: Prashanth Raju
(15, 8, '2026-08-11 13:00:00', 'Confirmed'),
(15, 9, '2026-08-12 16:20:00', 'Confirmed'),
(15, 1, '2026-08-13 09:30:00', 'Dropped'),
-- Student 16: Tejaswi Goud
(16, 8, '2026-08-11 14:10:00', 'Confirmed'),
(16, 1, '2026-08-12 11:00:00', 'Confirmed'),
-- Student 17: Sandeep Varma
(17, 11, '2026-08-11 15:00:00', 'Confirmed'),
(17, 8, '2026-08-12 13:30:00', 'Confirmed'),
-- Student 18: Meghana Rao
(18, 12, '2026-08-11 15:30:00', 'Confirmed'),
(18, 1, '2026-08-13 10:00:00', 'Confirmed'),
-- Student 19: Akhil Chowdary
(19, 13, '2026-08-11 16:00:00', 'Confirmed'),
(19, 1, '2026-08-12 14:30:00', 'Dropped'),
-- Student 20: Sneha Latha
(20, 1, '2026-08-12 09:15:00', 'Confirmed'),
(20, 2, '2026-08-12 09:30:00', 'Confirmed'),
(20, 4, '2026-08-13 14:00:00', 'Confirmed'),
-- Student 21: Madhav Krishna
(21, 6, '2026-08-12 10:00:00', 'Confirmed'),
(21, 1, '2026-08-12 10:20:00', 'Confirmed'),
-- Student 22: Rohith Yadav
(22, 1, '2026-08-12 11:00:00', 'Confirmed'),
(22, 10, '2026-08-13 15:00:00', 'Confirmed'),
-- Student 23: Karthik Reddy
(23, 11, '2026-08-12 13:00:00', 'Confirmed'),
(23, 1, '2026-08-13 11:30:00', 'Confirmed'),
-- Student 24: Lavanya Devi
(24, 8, '2026-08-12 14:00:00', 'Confirmed'),
(24, 9, '2026-08-13 16:00:00', 'Confirmed');

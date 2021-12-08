const { DatabaseClient } = require('./src/Database');
const cli = new DatabaseClient();
cli.connect();
// const tables = [
// 	'instructor',
// 	'class',
// 	'student',
// 	'registrar',
// 	'course',
// 	'studentApplication',
// 	'instructorApplication',
// 	'graduationApplication',
// 	'graduatedStudents',
// 	'waitlist',
// 	'reviews',
// 	'semesterPeriod'
// ];
// cli.resetTables(tables);

const express = require('express');
const app = express();
const { 
	courses, 
	login, 
	signupInstructorApplication, 
	submitReport,
	signupStudentApplication } = require('./src/routes/generalRoutes');
const {
	reviewInstructorApplication,
	reviewStudentApplication,
	createCourse,
	getStudentApplications,
	getInstructorApplications,
	getGraduationApplications,
	reviewGraduationApplication,
	reviewReport,
	getReports,
	addTabooWords
} = require('./src/routes/registrarRoutes');
const {
	dropCourse,
	student,
	students,
	enroll,
	enrolledCourses,
	completedCourses,
	availableCourses,
	applyForGraduation,
	reviewCourse,
	reviewsForCourse
} = require('./src/routes/studentRoutes');
const {
	assignGrade,
	getInstructor,
	getCoursesTaughtByProfessor,
	getStudentsForCourse,
	getWaitlistedStudents,
	reviewWaitlistedStudent,
	getAllInstructors
} = require('./src/routes/instructorRoutes');

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use((req, res, next) => {
	req.db = cli.dbclient;
	next();
});

// General Routes
app.get('/courses', courses);
app.post('/login', login);
app.post('/signupInstructorApplication', signupInstructorApplication);
app.post('/signupStudentApplication', signupStudentApplication);
app.post('/submitReport', submitReport);
// Student Routes
app.get('/student', student);
app.get('/students', students);
app.post('/enroll', enroll);
app.get('/enrolledCourses', enrolledCourses);
app.get('/completedCourses', completedCourses);
app.get('/availableCourses', availableCourses);
app.post('/dropCourse', dropCourse);
app.post('/reviewCourse', reviewCourse);
app.get('/reviewsForCourse', reviewsForCourse);

//Registrar Routes
app.post('/reviewStudentApplication', reviewStudentApplication);
app.post('/reviewInstructorApplication', reviewInstructorApplication);
app.post('/createCourse', createCourse);
app.get('/getStudentApplications', getStudentApplications);
app.get('/getInstructorApplications', getInstructorApplications);
app.get('/applyForGraduation', applyForGraduation);
app.get('/getGraduationApplications', getGraduationApplications);
app.post('/reviewGraduationApplication', reviewGraduationApplication);
app.post('/reviewReport', reviewReport);
app.get('/getReports', getReports);
app.post('/addTabooWords', addTabooWords);
//Instructor Routes
app.post('/assignGrade', assignGrade);
app.get('/getInstructor', getInstructor);
app.get('/getCoursesTaughtByProfessor', getCoursesTaughtByProfessor);
app.get('/getStudentsForCourse', getStudentsForCourse);
app.get('/getWaitlistedStudents', getWaitlistedStudents);
app.post('/reviewWaitlistedStudent', reviewWaitlistedStudent);
app.get('/getAllInstructors', getAllInstructors);
app.get('/', (req, res) => {
	res.send('SEND REQUESTS TO \n /classes \n /professors \n /signin/:username/:password/:type');
});

app.listen(3000, () => {
	console.log('Listening on port 3000');
});

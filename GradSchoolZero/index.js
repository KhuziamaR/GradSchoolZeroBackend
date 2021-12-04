const { DatabaseClient } = require('./src/Database');
const cli = new DatabaseClient();
cli.connect();

const express = require('express');
const app = express();
const {courses, login, signupInstructorApplication, signupStudentApplication} = require("./src/routes/generalRoutes");
const {reviewInstructorApplication, reviewStudentApplication, createCourse} = require("./src/routes/registrarRoutes");
const {student, enroll, enrolledCourses, completedCourses, availableCourses} = require("./src/routes/studentRoutes");

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use((req, res, next) => {
	req.db = cli.dbclient;
	next();
})

// General Routes
app.get('/courses', courses);
app.post('/login', login);
app.post('/signupInstructorApplication', signupInstructorApplication);
app.post('/signupStudentApplication', signupStudentApplication);

// Student Routes
app.get("/student", student);
app.post("/enroll", enroll);
app.get("/enrolledCourses", enrolledCourses);
app.get("/completedCourses", completedCourses);
app.get("/availableCourses", availableCourses);

//Registrar Routes
app.post('/reviewStudentApplication', reviewStudentApplication);
app.post('/reviewInstructorApplication', reviewInstructorApplication);
app.post('/createCourse', createCourse);

app.get('/', (req, res) => {
	res.send('SEND REQUESTS TO \n /classes \n /professors \n /signin/:username/:password/:type');
});

app.listen(3000, () => {
	console.log('Listening on port 3000');
});

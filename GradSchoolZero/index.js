const express = require('express');
const app = express();
const {courses, login, signupInstructorApplication, signupStudentApplication} = require("./src/routes/generalRoutes");
const {reviewInstructorApplication, reviewStudentApplication} = require("./src/routes/registrarRoutes");

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// General Routes
app.get('/courses', courses);
app.post('/login', login);
app.post('/signupInstructorApplication', signupInstructorApplication);
app.post('/signupStudentApplication', signupStudentApplication);

//Registrar Routes
app.post('/reviewStudentApplication', reviewStudentApplication);
app.post('/reviewInstructorApplication', reviewInstructorApplication);

app.get('/', (req, res) => {
	res.send('SEND REQUESTS TO \n /classes \n /professors \n /signin/:username/:password/:type');
});

app.listen(3000, () => {
	console.log('Listening on port 3000');
});

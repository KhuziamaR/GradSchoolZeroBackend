const { DatabaseClient } = require('../Database');
const { v4: uuidv4 } = require('uuid');
const { createTransport } = require('nodemailer');

const cli = new DatabaseClient();
cli.connect();

const transporter = createTransport({
	host: 'smtp.gmail.com',
	port: 587,
	auth: {
		user: 'gradschoolzeroemailer@gmail.com',
		pass: 'GradSchoolZero1!'
	}
});


const reviewInstructorApplication = (req, res) => {
	const { id, decision } = req.query;

	if (decision == '0') {
		const applicationQuery = `SELECT * FROM instructorApplication WHERE id = '${id}';  `;
		cli.dbclient
			.query(applicationQuery)
			.then((result) => {
				var instructorApp = result.rows[0];
				console.log(instructorApp);
				const varQuery = `SELECT * FROM instructor WHERE email = '${instructorApp.email}'`;
				cli.dbclient
					.query(varQuery)
					.then((data) => {
						if (data.rowCount > 0) {
							// user already exists with email
							res.status(409).send({
								msg: `Instructor is already registed with email ${instructorApp.email}`
							});
						} else {
							// signup this student
							transporter
								.sendMail({
									from: '"GradSchoolZero" <gradschoolzeroemailer@gmail.com>',
									to: `${instructorApp.email}`,
									subject: 'Acceptance Letter Gradschoolzero',
									text: `Congratulations, your instructor applicaiton was reviewed by the registrar and was approved! You have been accepted!\nPlease use your email as your username and the first password you input will be your new password. \nUsername: ${instructorApp.email}`
								})
								.then((info) => {
									console.log(info);
								})
								.catch(console.log);
							/*
							id CHAR(36) NOT NULL PRIMARY KEY,
               firstName VARCHAR(64) NOT NULL,
               lastName VARCHAR(64) NOT NULL,
               email VARCHAR(64) NOT NULL,
               password VARCHAR(64),
               warnings INT NOT NULL,
               suspended BOOLEAN NOT NULL
							*/

							const createInstructorQuery = `INSERT INTO instructor (id, firstName, lastName, email , password, warnings, suspended) VALUES ('${uuidv4()}', '${instructorApp.firstname}','${instructorApp.lastname}', '${instructorApp.email}','',0, ${false});`;
							cli.dbclient
								.query(createInstructorQuery)
								.then((result) => {
									res.status(200).send({
										msg: `Successfully created user: instructor! ${instructorApp.email}`
									});
								})
								.finally(() => {
									const deleteApplicationQuery = `DELETE FROM instructorApplication WHERE id = '${id}'`;
									cli.dbclient
										.query(deleteApplicationQuery)
										.then((res) => {
											console.log('Successfully deleted instructor application');
										})
										.catch((error) => {
											console.log('Error deleting instructor application', error);
										});
								})
								.catch((error) => {
									res.status(500).send({
										msg: 'Error creating user, please try again'
									});
									console.log('Error creating instructor', error);
								});
						}
					})
					.catch((error) => {
						console.log('could not retrieve instructor using email ');
					});
			})
			.catch((error) => {
				console.log('ERROR, could not retrive id from instructor application');
			});
	}
};

const reviewStudentApplication = (req, res) => {
	const { id, decision } = req.query;

	if (decision == '0') {
		const applicationQuery = `SELECT * FROM studentApplication WHERE id = '${id}';  `;
		cli.dbclient
			.query(applicationQuery)
			.then((result) => {
				var studentApp = result.rows[0];
				console.log(studentApp);
				const varQuery = `SELECT * FROM student WHERE email = '${studentApp.email}'`;
				cli.dbclient
					.query(varQuery)
					.then((data) => {
						if (data.rowCount > 0) {
							// user already exists with email
							res.status(409).send({
								msg: `Student is already registed with email ${studentApp.email}`
							});
						} else {
							// signup this student
							transporter
								.sendMail({
									from: '"GradSchoolZero" <gradschoolzeroemailer@gmail.com>',
									to: `${studentApp.email}`,
									subject: 'Acceptance Letter Gradschoolzero',
									text: `Congratulations, your student applicaiton was reviewed by the registrar and was approved! You have been accepted!\nPlease use your email as your username and the first password you input will be your new password. \nUsername: ${studentApp.email}`
								})
								.then((info) => {
									console.log(info);
								})
								.catch(console.log);
							/*
								  id CHAR(36) NOT NULL PRIMARY KEY,
								firstName VARCHAR(64) NOT NULL,
								lastName VARCHAR(64) NOT NULL,
								email VARCHAR(64) NOT NULL,
								password VARCHAR(64),
								warnings INT NOT NULL,
								gpa FLOAT 
								*/
							//  `INSERT INTO studentApplication (id, firstName, lastName, email, gpa, program, graduationYear) VALUES ('${id}', '${firstName}','${lastName}', '${email}',${gpa}, '${program}',${graduationYear});`;

							const createStudentQuery = `INSERT INTO student (id, firstName, lastName, email, password, warnings, gpa) VALUES ('${uuidv4()}', '${studentApp.firstname}','${studentApp.lastname}', '${studentApp.email}','',0, 4.0);`;
							cli.dbclient
								.query(createStudentQuery)
								.then((result) => {
									res.status(200).send({
										msg: `Successfully created user! ${studentApp.email}`
									});
								})
								.finally(() => {
									const deleteApplicationQuery = `DELETE FROM studentApplication WHERE id = '${id}'`;
									cli.dbclient
										.query(deleteApplicationQuery)
										.then((res) => {
											console.log('Successfully deleted student application');
										})
										.catch((error) => {
											console.log('Error deleted student application', error);
										});
								})
								.catch((error) => {
									res.status(500).send({
										msg: 'Error creating user, please try again'
									});
									console.log('Error creating student', error);
								});
						}
					})
					.catch((error) => {
						console.log('could not retrieve student using email ');
					});
			})
			.catch((error) => {
				console.log('ERROR, could not retrive id from studentApplications');
			});
	}
};

module.exports = {
    reviewInstructorApplication,
    reviewStudentApplication
}
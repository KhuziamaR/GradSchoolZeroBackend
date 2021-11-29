require('dotenv').config();
const { v4: uuidv4 } = require('uuid');

const { Pool, Client } = require('pg');
const { createTransport } = require('nodemailer');
const e = require('express');
const express = require('express');
const app = express();
const { DatabaseClient } = require('./src/Database.js');

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

// transporter
// 	.sendMail({
// 		from: '"GradSchoolZero" <gradschoolzeroemailer@gmail.com>',
// 		to: 'rehmankhuziama14@gmail.com',
// 		subject: 'Acceptance Letter Gradschoolzero',
// 		text:
// 			'You have been accepted!\nPlease use your email as your username and the first password you input will be your new password.'
// 	})
// 	.then((info) => {
// 		console.log(info);
// 	})
// 	.catch(console.log);

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.get('/classes', (req, res) => {
	res.status(200).send(classes);
});

app.get('/professors', (req, res) => {
	res.status(200).send(professors);
});

app.get('/signin/:username/:password/:type', (req, res) => {
	const { username } = req.params;
	const { password } = req.params;
	const { type } = req.params;

	const user = users[type].find((user) => user.username == username && user.password == password);

	if (user) {
		res.status(200).send({
			auth: true
		});
	} else {
		res.status(200).send({
			auth: false
		});
	}
});

app.post('/login', (req, res) => {
	const username = req.body.username;
	const password = req.body.password;
	const type = req.body.type;
	if (username && password && type) {
		DatabaseClient.query(`SELECT * FROM ${type} WHERE username = ${username} AND password = ${password}`, function(
			error,
			results,
			fields
		) {
			if (results.length > 0) {
				console.log(results);
				res.send({
					auth: true,
					msg: 'Login Successfull'
				});
			}
		});
	}
});

app.post('/signupIntructorApplication', (req, res) => {
	// id CHAR(36) NOT NULL PRIMARY KEY,
	//             firstName VARCHAR(64) NOT NULL,
	//             lastName VARCHAR(64) NOT NULL,
	//             yearsOfExperience INT NOT NULL,
	//             program VARCHAR(128) NOT NULL,
	//             graduationYear INT NOT NULL,
	//             email VARCHAR(64) NOT NULL
	const id = uuidv4();
	const { firstName, lastName, yearsOfExperience, program, graduationYear, email } = req.query;
	if (firstName && lastName && email && yearsOfExperience && program && graduationYear) {
		cli.dbclient
			.query(`SELECT * FROM instructorApplication WHERE email = '${email}'`)
			.then((data) => {
				if (data.rows.length > 0) {
					res.status(409).send({
						msg: 'User has already applied for instructorApp'
					});
				} else {
					const insertQuery = `INSERT INTO instructorApplication (id, firstName, lastName, yearsOfExperience, program, graduationYear, email) VALUES ('${id}', '${firstName}','${lastName}', ${yearsOfExperience},${program}, ${graduationYear},'${email}');`;

					cli.dbclient
						.query(insertQuery)
						.then((success) => {
							res.status(200).send({
								msg: 'Success! Application recieved for instructor.'
							});
						})
						.catch((error) => {
							console.log('Error when inserting into intructor applicaiton', error);
							res.status(500).send({
								msg: 'error'
							});
						});
				}
			})
			.catch((error) => {
				console.log('Error when inserting into instructor applicaiton');
				res.status(500).send({
					msg: 'error'
				});
			});
	} else {
		res.send({
			msg: 'Please send all inputs'
		});
	}
});

app.post('/reviewInstructorApplication', (req, res) => {
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
});

app.post('/signupStudentApplication', (req, res) => {
	//   id CHAR(16) NOT NULL PRIMARY KEY,
	//             firstName VARCHAR(64) NOT NULL,
	//             lastName VARCHAR(64) NOT NULL,
	//             email VARCHAR(64) NOT NULL,
	//             gpa FLOAT NOT NULL,
	//             program VARCHAR(128) NOT NULL,
	//             graduationYear INT NOT NULL
	const id = uuidv4();
	const { firstName, lastName, email, gpa, program, graduationYear } = req.query;
	if (firstName && lastName && email && gpa && program && graduationYear) {
		cli.dbclient
			.query(`SELECT * FROM studentApplication WHERE email = '${email}'`)
			.then((data) => {
				if (data.rows.length > 0) {
					res.status(409).send({
						msg: 'User has already applied for studentApp'
					});
				} else {
					const insertQuery = `INSERT INTO studentApplication (id, firstName, lastName, email, gpa, program, graduationYear) VALUES ('${id}', '${firstName}','${lastName}', '${email}',${gpa}, '${program}',${graduationYear});`;

					cli.dbclient
						.query(insertQuery)
						.then((success) => {
							res.status(200).send({
								msg: 'Success! Application recieved for student.'
							});
						})
						.catch((error) => {
							console.log('Error when inserting into student applicaiton', error);
							res.status(500).send({
								msg: 'error'
							});
						});
				}
			})
			.catch((error) => {
				console.log('Error when inserting into student applicaiton');
				res.status(500).send({
					msg: 'error'
				});
			});
	} else {
		res.send({
			msg: 'Please send all inputs'
		});
	}
});

app.post('/reviewStudentApplication', (req, res) => {
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
});

app.get('/courses', (req, res) => {
	const databaseClient = new DatabaseClient();
	databaseClient.dbclient
		.query(`SELECT * FROM courses`)
		.then((results) => {
			res.send(results.rows);
		})
		.catch((error) => console.log(error));
});

app.get('/', (req, res) => {
	res.send('SEND REQUESTS TO \n /classes \n /professors \n /signin/:username/:password/:type');
});

app.listen(3000, () => {
	console.log('Listening on port 3000');
});

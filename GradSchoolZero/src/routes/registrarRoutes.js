const { v4: uuidv4 } = require('uuid');
const { createTransport } = require('nodemailer');
const e = require('express');

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
	if (!id || !decision) {
		res.status(500).send({
			msg: "please send id and decision, decicion '0' means accept"
		});
	}
	if (decision == '0') {
		const applicationQuery = `SELECT * FROM instructorApplication WHERE id = '${id}';  `;
		req.db
			.query(applicationQuery)
			.then((result) => {
				var instructorApp = result.rows[0];
				console.log(instructorApp);
				const varQuery = `SELECT * FROM instructor WHERE email = '${instructorApp.email}'`;
				req.db
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
									text: `Congratulations, your instructor application was reviewed by the registrar and was approved! You have been accepted!\nPlease use your email as your username and the first password you input will be your new password. \nUsername: ${instructorApp.email}`
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

							const createInstructorQuery = `INSERT INTO instructor (id, firstName, lastName, email , password, warnings, suspended, rating, numberOfReviews) VALUES ('${uuidv4()}', '${instructorApp.firstname}','${instructorApp.lastname}', '${instructorApp.email}','',0, ${false}, 0.0, 0);`;
							req.db
								.query(createInstructorQuery)
								.then((result) => {
									res.status(200).send({
										msg: `Successfully created user: instructor! ${instructorApp.email}`
									});
								})
								.finally(() => {
									const deleteApplicationQuery = `DELETE FROM instructorApplication WHERE id = '${id}'`;
									req.db
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
	console.log(req.query)
	if (decision == '0') {
		const applicationQuery = `SELECT * FROM studentApplication WHERE id = '${id}';  `;
		req.db
			.query(applicationQuery)
			.then((result) => {
				var studentApp = result.rows[0];
				console.log(studentApp);
				const varQuery = `SELECT * FROM student WHERE email = '${studentApp.email}'`;
				req.db
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
									text: `Congratulations, your student application was reviewed by the registrar and was approved! You have been accepted!\nPlease use your email as your username and the first password you input will be your new password. \nUsername: ${studentApp.email}`
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

							const createStudentQuery = `INSERT INTO student (id, firstName, lastName, email, password, warnings, suspended, gpa) VALUES ('${uuidv4()}', '${studentApp.firstname}','${studentApp.lastname}', '${studentApp.email}','',0, false, 4.0);`;
							console.log(createStudentQuery)
							req.db
								.query(createStudentQuery)
								.then((result) => {
									res.status(200).send({
										msg: `Successfully created user! ${studentApp.email}`
									});
								})
								.finally(() => {
									const deleteApplicationQuery = `DELETE FROM studentApplication WHERE id = '${id}'`;
									req.db
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

const createCourse = (req, res) => {
	const { name, capacity, instructorid, days, startTime, endTime } = req.query;
	const id = uuidv4();
	if (name && capacity && instructorid && days && startTime && endTime) {
		req.db
			.query(
				`
		SELECT * FROM instructor WHERE id = '${instructorid}';
        `
			)
			.then((data) => {
				if (data.rowCount == 1) {
					const instructorName = data.rows[0].firstname + ' ' + data.rows[0].lastname;
					req.db
						.query(
							`INSERT INTO course (id, name, capacity, studentcount, instructorid, instructorname, days, starttime, endtime, active) 
							VALUES ('${id}', '${name}', ${capacity}, 0, '${instructorid}', '${instructorName}', '${days}','${startTime}', '${endTime}', true );`
						)
						.then((_) => {
							res.status(200).send({ msg: 'Success!' });
						})
						.catch((error) => {
							console.error(error);
							res.status(500).send({ error: 'An error Occurred when inserting' });
						});
				} else {
					res.status(404).send({ error: 'Instructor Not Found' });
				}
			})
			.catch((error) => {
				console.error(error);
				res.status(500).send({ error: 'An error Occurred, cant find instrucotr' });
			});
	} else {
		console.log('Need inputs');
		res.status(500).send({
			msg: 'Please send all inputs'
		});
	}
};

const getStudentApplications = (req, res) => {
	req.db
		.query(`SELECT * FROM studentApplication;`)
		.then((data) => {
			res.status(200).send({
				data: data.rows
			});
		})
		.catch((error) => {
			res.status(404).send({
				msg: 'ERROR while retrieving student applications...'
			});
		});
};
const getInstructorApplications = (req, res) => {
	req.db
		.query(`SELECT * FROM instructorApplication;`)
		.then((data) => {
			res.status(200).send({
				data: data.rows
			});
		})
		.catch((error) => {
			console.log(error);
			res.status(404).send({
				msg: 'ERROR while retrieving instructor applications...'
			});
		});
};

const getGraduationApplications = (req, res) => {
	req.db
		.query(`SELECT * FROM graduationApplication`)
		.then((data) => {
			res.status(200).send({
				data: data.rows
			});
		})
		.catch((error) => {
			console.log(error);
			res.status(404).send({
				msg: 'error while retrieving graduation applications'
			});
		});
};

const reviewGraduationApplication = (req, res) => {
	const { studentid, decision } = req.query;

	if (!studentid) {
		res.status(500).send({
			msg: 'Please send student id.'
		});
	}
	if (decision == '0') {
		req.db.query(`SELECT * FROM graduatedStudents WHERE studentid = '${studentid}';`).then((grads) => {
			if (grads.rowCount > 0) {
				res.status(500).send({
					msg: 'Student has already graduated.'
				});
			} else {
				const graduateStudentQuery = `INSERT INTO graduatedStudents (studentid) VALUES ('${studentid}');`;

				req.db
					.query(graduateStudentQuery)
					.then((_) => {
						const deleteApplicationQuery = `DELETE FROM graduationApplication WHERE studentid = '${studentid}'`;
						req.db
							.query(deleteApplicationQuery)
							.then((_) => {
								console.log('successfully graduated student and deleted application');
								res.status(200).send({
									msg: 'Congratulations, you have graduated!'
								});
							})
							.catch((error) => {
								res.status(404).send({
									msg: 'error while deleting graduation application'
								});
							});
					})
					.catch((error) => {
						res.status(404).send({
							msg: 'ERROR while graduating student'
						});
					});
			}
		});
	} else {
		res.status(200).send({
			msg: 'Graduation application was denied.'
		});
	}
};

const reviewReport = (req, res) => {
	const {id, decision} = req.query;
	if (!decision) {
		req.db
		.query(`DELETE FROM reports WHERE id = '${id}'`)
		.then((data) => {
			if (data.rowCount == 0) {
				res.status(500).send({
					msg: `Failed to delete report`
				})
			}
			else {
				res.status(200).send({
					msg: `Successfully deleted report`
				})
			}
		})
	}
	else {
		req.db
		.query(`SELECT * FROM reports WHERE id = '${id}'`)
		.then((data) => {
			const report = data.rows[0];
			req.db
			.query(`SELECT * FROM ${report.reportedtype} WHERE id = '${report.reportedid}'`)
			.then((data2) => {
				if (data2.rowCount == 0) {
					return res.status(404).send({msg: `No student/instructor found`})
				}
				console.log(data2)
				let suspendedQuery;
				if (data2.rows[0].warnings == 2) { 
					suspendedQuery = `UPDATE ${report.reportedtype} SET warnings = 0, suspended = true WHERE id = '${report.reportedid}'`
				}
				else {
					suspendedQuery = `UPDATE ${report.reportedtype} SET warnings = warnings + 1 WHERE id = '${report.reportedid}'`
				}
				req.db
			.query(suspendedQuery)
			.then((result) => {
				if (result.rowCount > 0) {
					res.status(200).send({
						msg: 'Sucessfully updated warnings'
					})
				}
				else {
					res.status(500).send({
						msg: 'Failed to update warnings'
					})
				}
				req.db
					.query(`DELETE FROM reports WHERE id = '${id}'`)
					.catch((error) => {
						console.log(error);
					})
			})
			.catch(error => {
				console.log(error);
				res.status(500).send({msg: "Error updating warnings"});
			})
		}) 
		.catch(error => {
            console.log(error);
            res.status(500).send({msg: "Error getting type info"});
        })
	})
	.catch(error => {
		console.log(error);
		res.status(500).send({msg: "Error getting reporterID"});
	})
	}
}

const getReports = (req, res) => {
	req.db
	.query(`SELECT * FROM reports`)
	.then((data) => {
		res.status(200).send({
			data:data.rows
		})
	})
	.catch((error) => {
		console.log(error)
		res.status(404).send({
			msg: 'No reports found'
		})
	})
}

const addTabooWords = (req, res) => {
	const {taboo} = req.query;
	req.db
	.query(
		`INSERT INTO tabooWords (taboo)
		VALUES ('${taboo}')`)
	.then((data) => {
		res.status(200).send({
			msg:"Added taboo word"
		})
	})
	.catch((error) => {
		console.log(error);
	});
	}
/*
Get student applications route
Get Instructor Applications route
Get graduation application route
Review graduation application (just needs a student id)
Get all reports 
Set semester period (request will include a string of the new semester period)
Please look at the specifications for what happens when the registration period changes (ie when it changes from registration to course-run: give a warning to any student with less than 2 classes, there are more requirements in the specifications)
Fire instructor

*/

module.exports = {
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
};

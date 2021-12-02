const { v4: uuidv4 } = require('uuid');

const courses = (req, res) => {
	req.db.query("SELECT * FROM course;")
	.then(data => {
		res.status(200).send(data.rows);
	})
	.catch(error => {
		console.error(error);
		res.status(500).send({error: "An error occurred."});
	})
};


const login =  (req, res) => {
	const {email, password, type} = req.query;
	if (email && password && type) {
		req.db.query(`SELECT * FROM ${type} WHERE email = '${email}' AND password = '${password}' OR password = '';
                      SELECT * FROM semesterPeriod;
        `)
		.then(data => {
            period = data[1].rows[0].period;
            if (data[0].rowCount === 1) {
                if (data[0].rows[0].password == "") {
                    req.db.query(`UPDATE ${type} SET password = '${password}' WHERE id = '${data[0].rows[0].id}'`)
                    .then(_ => {
                        res.status(200).send({auth: "true", period, id: data[0].rows[0].id});
                    })
                    .catch(err => {
                        console.error(err);
                        res.status(500).send({error: "An Error Occurred"});
                    })
                } else {
                    res.status(200).send({auth: "true", period, id: data[0].rows[0].id});
                }
            } else {
                res.status(401).send({auth: "false"});
            }
		})
		.catch(err => {
			console.error(err);
			res.status(500).send({error: "An Error Occurred"});
		})
	} else {
		res.status(500).send({msg: "Error, Send all required Fields"});
	}
};

const signupInstructorApplication = (req, res) => {
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
		req.db
			.query(`SELECT * FROM instructorApplication WHERE email = '${email}'`)
			.then((data) => {
				if (data.rows.length > 0) {
					res.status(409).send({
						msg: 'User has already applied for instructorApp'
					});
				} else {
					const insertQuery = `INSERT INTO instructorApplication (id, firstName, lastName, yearsOfExperience, program, graduationYear, email) VALUES ('${id}', '${firstName}','${lastName}', ${yearsOfExperience},'${program}', ${graduationYear},'${email}');`;
					req.db
						.query(insertQuery)
						.then((success) => {
							res.status(200).send({
								msg: 'Success! Application recieved for instructor.'
							});
						})
						.catch((error) => {
							console.log('Error when inserting into intructor application', error);
							res.status(500).send({
								msg: 'error'
							});
						});
				}
			})
			.catch((error) => {
				console.log('Error when inserting into instructor applicaiton', error);
				res.status(500).send({
					msg: 'error'
				});
			});
	} else {
		res.send({
			msg: 'Please send all inputs'
		});
	}
};


const signupStudentApplication = (req, res) => {
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
		req.db
			.query(`SELECT * FROM studentApplication WHERE email = '${email}'`)
			.then((data) => {
				if (data.rows.length > 0) {
					res.status(409).send({
						msg: 'User has already applied for studentApp'
					});
				} else {
					const insertQuery = `INSERT INTO studentApplication (id, firstName, lastName, email, gpa, program, graduationYear) VALUES ('${id}', '${firstName}','${lastName}', '${email}',${gpa}, '${program}',${graduationYear});`;
					console.log("Inserting")
					req.db
						.query(insertQuery)
						.then((success) => {
							console.log("StudentApplication")
							res.status(200).send({
								msg: 'Success! Application recieved for student.'
							});
						})
						.catch((error) => {
							console.log('Error when inserting into student application', error);
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
		console.log("Need inputs")
		res.send({
			msg: 'Please send all inputs'
		});
	}
};

module.exports = {
    courses,
    login,
    signupInstructorApplication,
    signupStudentApplication
}
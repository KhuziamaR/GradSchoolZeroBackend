const { v4: uuidv4 } = require('uuid');

const students = (req, res) => {
	req.db
		.query('SELECT * FROM student ORDER BY gpa;')
		.then((students) => {
			res.status(200).send({ students: students.rows });
		})
		.catch((error) => {
			console.error(error);
			res.status(500).send({ error: 'An error occurred.' });
		});
};

const student = (req, res) => {
	const { id } = req.query;
	if (id) {
		req.db
			.query(`SELECT * FROM student WHERE id = '${id}';`)
			.then((data) => {
				const student = {
					id: data.rows[0].id,
					firstname: data.rows[0].firstname,
					lastname: data.rows[0].lastname,
					email: data.rows[0].email,
					warnings: data.rows[0].warnings,
					gpa: data.rows[0].gpa
				};
				res.status(200).send(student);
			})
			.catch((error) => {
				console.error(error);
				res.status(500).send({ error: 'An error occurred.' });
			});
	}
};

const availableCourses = (req, res) => {
	const { studentid } = req.query;
	if (!studentid) return res.status(500).send({ msg: 'Send all required inputs.' });
	req.db.query(`SELECT * FROM class WHERE studentid = '${studentid}' AND grade = '';`).then((data) => {
		const classesQuery =
			`SELECT * FROM course` +
			(data.rowCount == 0 ? '' : ' WHERE NOT (' + buildOrCourseList('', data.rows) + ')') +
			';';
		req.db
			.query(classesQuery)
			.then((data2) => {
				res.status(200).send({ courses: data2.rows });
			})
			.catch((error) => {
				console.log(error);
				res.status(500).send({ msg: 'An error occurred.' });
			});
	});
};

const enrolledCourses = (req, res) => {
	// Get a list of courses that the student is currently enrolled in
	const { studentid } = req.query;
	if (!studentid) return res.status(500).send({ msg: 'Send all required inputs.' });
	const year = new Date().getFullYear();
	req.db.query(`SELECT * FROM class WHERE studentid = '${studentid}' AND grade='';`).then((data) => {
		if (data.rowCount == 0) {
			return res.status(200).send({ courses: [] });
		}
		const classesQuery = 'SELECT * FROM course WHERE ' + buildOrCourseList('', data.rows) + ';';
		req.db
			.query(classesQuery)
			.then((data) => {
				return res.status(200).send({ courses: data.rows });
			})
			.catch((error) => {
				console.log(error);
				res.status(500).send({ msg: 'An error occurred.' });
			});
	});
};

const completedCourses = (req, res) => {
	const { studentid } = req.query;
	if (!studentid) return res.status(500).send({ msg: 'Send all required inputs.' });
	req.db.query(`SELECT * FROM class WHERE studentid = '${studentid}' AND NOT grade = '';`).then((data) => {
		const classesQuery =
			`SELECT * FROM course` + (data.rowCount == 0 ? '' : ' WHERE ' + buildOrCourseList('', data.rows)) + ';';
		req.db
			.query(classesQuery)
			.then((data2) => {
				const classes = data.rows.map((val, index) => {
					return { ...val, course: data2.rows[index] ? { ...data2.rows[index] } : {} };
				});
				res.status(200).send({ classes });
			})
			.catch((error) => {
				console.log(error);
				res.status(500).send({ msg: 'An error occurred.' });
			});
	});
};

const dropCourse = (req, res) => {
	const { studentid, courseid } = req.query;
	if (!courseid && !studentid) return res.status(500).send({ msg: 'Send all required inputs.' });
	console.log(`DELETE FROM class WHERE studentid = '${studentid}' AND courseid = '${courseid}';`);
	req.db
		.query(`DELETE FROM class WHERE studentid = '${studentid}' AND courseid = '${courseid}';`)
		.then((data) => {
			if (data.rowCount) {
				const decrementStudentCountQuery = `UPDATE course SET studentcount = studentcount - 1 WHERE id = '${courseid}';`;
				req.db
					.query(decrementStudentCountQuery)
					.then((_) => {
						console.log('Successfully decremented user from course');
						res.status(200).send({
							msg: 'Successfully dropped course!'
						});
					})
					.catch((error) => {
						res.status(500).send({
							msg: 'error when decrementing student count'
						});
					});
			} else res.status(500).send({ msg: 'Something went wrong.' });
		})
		.catch((error) => {
			res.status(500).send({
				msg: 'ERROR, Could not drop course.'
			});
		});
};

const enroll = (req, res) => {
	const { courseid, studentid } = req.query;

	// Check if they're already enrolled
	// Check if they have 4 classes
	// Check if any time conflicts exist
	// Check if course is full
	if (!courseid && !studentid) return res.status(500).send({ msg: 'Send all required inputs.' });
	req.db
		.query(
			`
        SELECT * FROM course WHERE id = '${courseid}';
        SELECT * FROM class WHERE studentid = '${studentid}' AND courseid = '${courseid}';
        SELECT * FROM class WHERE studentid = '${studentid}' AND grade = '';
        SELECT * FROM student WHERE id = '${studentid}';
    `
		)
		.then((data) => {
			// student enrolled already
			console.log(data);
			const course = data[0].rows[0];
			const alreadyEnrolled = data[1].rowCount >= 1;
			const enrolledClasses = data[2].rows;
			const student = data[3].rows[0];
			// Student is enrolled already
			if (alreadyEnrolled) {
				return res.status(409).send({ msg: 'Student already enrolled' });
			}
			// Student has max classes
			if (enrolledClasses.length == 4) {
				return res.status(409).send({ msg: 'Student is already registerd in 4 classes.' });
			}
			// Class is at max capacity
			if (course.studentCount == course.capacity) {
				req.db
					.query(
						`INSERT INTO waitlist (id, studentid, courseid) VALUES ('${uuidv4()}','${studentid}','${courseid}');`
					)
					.then((_) => {
						return res.status(409).send({ msg: 'Class was full, Student Waitlisted.' });
					})
					.catch((error) => {
						console.log('Error inserting into waitlist', error);
						res.status(500).send({ msg: 'An Error Occurred' });
					});
				return;
			}

			//Check if time conflicts exist;
			const coursesIDListSQL =
				enrolledClasses.length == 0 ? '' : ' WHERE ' + buildOrCourseList('', enrolledClasses);
			req.db
				.query(`SELECT * FROM course${coursesIDListSQL};`)
				.then((data2) => {
					if (addNewClassConflict(course, data2.rows) && !(enrolledClasses.length == 0)) {
						return res.status(401).send({
							msg: 'There exists a time conflict with students enrolled courses and the attempted course.'
						});
					}
					const date = new Date();
					/*
					CREATE TABLE IF NOT EXISTS class (
               studentid CHAR(36) NOT NULL,
               courseid CHAR(36) NOT NULL,
               grade VARCHAR(2),
               season VARCHAR(8) NOT NULL,
               year INT NOT NULL,
               PRIMARY KEY (studentid, courseid)
           );
					*/

					const addClassQuery = `INSERT INTO class (studentid, courseid, grade, season, year) VALUES ('${studentid}','${courseid}','','${getSeason()}',${date.getFullYear()});
                                    UPDATE course SET studentCount = studentCount +
										1 WHERE id = '${courseid}';`;
					req.db
						.query(addClassQuery)
						.then((_) => {
							res.status(200).send({ msg: 'Success!' });
						})
						.catch((error) => {
							console.log('Error inserting class: ', error);
							res.status(500).send({ msg: 'An Error Occurred 3' });
						});
				})
				.catch((error) => {
					console.log('Error getting students enrolled courses: ', error);
					res.status(500).send({ msg: 'An Error Occurred 2' });
				});
		})
		.catch((error) => {
			console.log('Error with first request:', error);
			res.status(500).send({ msg: 'An Error Occurred 1' });
		});
};

const getSeason = () => {
	const date = new Date();
	const m = date.getMonth() + 1;
	const seasons = [ 'winter', 'spring', 'summer', 'fall' ];
	return seasons[Math.floor(m / 3) % 4];
};

const conflicts = (days1, starttime1, endtime1, days2, starttime2, endtime2) => {
	const sh1 = parseInt(starttime1.slice(0, 2));
	const sm1 = parseInt(starttime1.slice(2, 4));
	const sh2 = parseInt(starttime2.slice(0, 2));
	const sm2 = parseInt(starttime2.slice(2, 4));
	const starttimeOverall1 = sh1 * 60 + sm1;
	const starttimeOverall2 = sh2 * 60 + sm2;

	const eh1 = parseInt(endtime1.slice(0, 2));
	const em1 = parseInt(endtime1.slice(2, 4));
	const eh2 = parseInt(endtime2.slice(0, 2));
	const em2 = parseInt(endtime2.slice(2, 4));
	const endtimeOverall1 = eh1 * 60 + em1;
	const endtimeOverall2 = eh2 * 60 + em2;

	const dayConflicts = (days1, days2) => {
		for (let i = 0; i < days1.length; i++) {
			if (days2.includes(days1[i])) return true;
		}
		return false;
	};
	const timeConflicts = (start1, end1, start2, end2) => {
		return Math.max(start1, start2) < Math.min(end1, end2) || start1 == start2 || endtime1 == endtime2;
	};

	return (
		dayConflicts(days1, days2) &&
		timeConflicts(starttimeOverall1, endtimeOverall1, starttimeOverall2, endtimeOverall2)
	);
};

const addNewClassConflict = (newCourse, enrolledCourses) => {
	if (enrolledCourses.length == 0) return false;
	for (let i = 0; i < enrolledCourses.length; i++) {
		if (
			conflicts(
				newCourse.days,
				newCourse.starttime,
				newCourse.endtime,
				enrolledCourses[i].days,
				enrolledCourses[i].starttime,
				enrolledCourses[i].endtime
			)
		) {
			return true;
		}
	}
	return false;
};

const buildOrCourseList = (result, classes) => {
	if (classes.length == 0) return result;
	if (classes.length == 1) return result + `id = '${classes[0].courseid}'`;
	return buildOrCourseList(result + `id = '${classes[0].courseid}' OR `, classes.slice(1, classes.length));
};

const applyForGraduation = (req, res) => {
	//`INSERT INTO waitlist (id, studentid, courseid) VALUES ('${uuidv4()}','${studentid}','${courseid}');`
	const { studentid } = req.query;
	req.db
		.query(`SELECT * from graduationApplication WHERE studentid = '${studentid}'`)
		.then((data) => {
			if (data.rowCount > 0) {
				res.status(500).send({
					msg:
						'You have already applied for graduation, please wait patiently for the registrar to approve your request.'
				});
			}
		})
		.catch((error) => {
			res.status(404).send({
				msg: 'Error!'
			});
		});
	req.db
		.query(`INSERT INTO graduationApplication (id, studentid) VALUES ('${uuidv4()}', '${studentid}')`)
		.then((data) => {
			res.status(200).send({
				msg: 'SUCCESS! Application recieved!'
			});
		})
		.catch((error) => {
			res.status(404).send({
				msg: 'ERROR, cannot apply for gradutaion.'
			});
		});
};
/*
         reviewerid CHAR(36) NOT NULL,
                reviewerName VARCHAR(64) NOT NULL,
                reviewerWrittenReview VARCHAR(256) NOT NULL,
	            reviewerRating FLOAT NOT NULL,
                courseid CHAR(36) NOT NULL,
                instructorid CHAR(36) NOT NULL
*/

const reviewCourse = (req, res) => {
	const { reviewerid, reviewerName, reviewerWrittenReview, reviewerRating, courseid, instructorid } = req.query;
	if (!(reviewerid && reviewerName && reviewerWrittenReview && reviewerRating && courseid && instructorid)) {
		res.status(500).send({
			msg: 'Please send all inputs!',
			inputsRequired: 'reviewerid, reviewerName, reviewerWrittenReview, reviewerRating, courseid , instructorid'
		});
	}
	const createReviewQuery = `INSERT INTO reviews (reviewerid, reviewerName, reviewerWrittenReview,reviewerRating, courseid, instructorid) VALUES ('${reviewerid}', '${reviewerName}', '${reviewerWrittenReview}', ${reviewerRating},'${courseid}', '${instructorid}');`;
	req.db
		.query(createReviewQuery)
		.then((result) => {
			if (result.rowCount == 0) {
				res.status(500).send({
					msg: 'error while inserting into reviews'
				});
			}
			console.log('INSERTED INTO REVIEWS', instructorid);
			req.db
				.query(`SELECT * FROM instructor WHERE id = '${instructorid}';`)
				.then((instructorData) => {
					let { rating, numberofreviews } = instructorData.rows[0];
					numberofreviews += 1;
					rating = (rating + reviewerRating) / numberofreviews;

					const updateInstructorQuery = `UPDATE instructor SET rating = ${rating}, numberOfReviews = ${numberofreviews} WHERE id = '${instructorid}';`;

					req.db
						.query(updateInstructorQuery)
						.then((_) => {
							console.log('hi');
							res.status(200).send({
								msg: 'Succesfuly created review and updated instructor rating!'
							});
						})
						.catch((error) => {
							console.log(error);
							res.status(404).send({
								msg: 'Error while updating instructor rating :( '
							});
						});
				})
				.catch((error) => {
					console.log(error);
					res.status(404).send({
						msg: 'error while retrieving instructor data :( '
					});
				});
		})
		.catch((error) => {
			res.status(500).send({
				msg: 'error while creating review'
			});
		});
};

const reviewsForCourse = (req, res) => {
	const { courseid } = req.query;
	if (!courseid) {
		res.status(500).send({
			msg: 'Please send courseid as input'
		});
	}

	req.db
		.query(`SELECT * FROM reviews WHERE courseid = '${courseid}';`)
		.then((data) => {
			res.status(200).send({
				data: data.rows
			});
		})
		.catch((error) => {
			res.status(404).send({
				msg: 'Error while retrieving reviews for course'
			});
		});
};

module.exports = {
	student,
	enroll,
	enrolledCourses,
	completedCourses,
	availableCourses,
	students,
	dropCourse,
	applyForGraduation,
	reviewCourse,
	reviewsForCourse,
};

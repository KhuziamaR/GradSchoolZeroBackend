const { v4: uuidv4 } = require('uuid');

// localhost:3000/assignGrade?studentid=asdasd&courseid=sdasd&grade=A

const getInstructor = (req, res) => {
	const { id } = req.query;
	if (!id) {
		res.status(404).send({
			msg: 'please send intructor id as parameter'
		});
	}
	req.db
		.query(`SELECT * FROM instructor WHERE id = '${id}';`)
		.then((data) => {
			if (data.rowCount > 0) {
				res.status(200).send({
					data: data.rows
				});
			} else {
				res.status(500).send({
					msg: 'Instructor not found'
				});
			}
		})
		.catch((error) => {
			res.status(404).send({
				msg: 'Error, cannot retrieve instructor data'
			});
		});
};

const getAllInstructors = (req, res) => {
    req.db.query("SELECT * FROM instructor;")
    .then(data => {
        return res.status(200).send({instructors: data.rows})
    })
    .catch(error => {
        return res.status(500).send({msg: "Error Occurred"})
    })
}

const getCoursesTaughtByProfessor = (req, res) => {
	const { id } = req.query;
	const getCoursesTaughtByProfessorQuery = `SELECT * FROM course WHERE instructorid = '${id}'`;
	req.db
		.query(getCoursesTaughtByProfessorQuery)
		.then((data) => {
			res.status(200).send({
				data: data.rows
			});
		})
		.catch((error) => {
			res.status(404).send({
				msg: 'error while trying to find all courses taught by professor'
			});
		});
};

const getStudentsForCourse = (req, res) => {
	const { courseid } = req.query;
	req.db
		.query(`SELECT studentid FROM class WHERE courseid = '${courseid}';`)
		.then((data) => {
			if (data.rowCount == 0) {
                return res.status(200).send({students: []});
            }
            req.db.query(`SELECT * from student WHERE ${buildOrStudentList("", data.rows)};`)
            .then(data => {
                return res.status(200).send({students: data.rows});
            })
            .catch((error) => {
                console.log(error)
                res.status(500).send({
                    msg: 'An error occurred.'
                });
            });
		})
		.catch((error) => {
            console.log(error)
			res.status(500).send({
				msg: 'An error occurred.'
			});
		});
};

const assignGrade = (req, res) => {
	const { studentid, courseid, grade } = req.query;
    const grades = {
        "A+": 4.0,
        "A": 4.0,
        "A-": 3.7,
        "B+": 3.3,
        "B": 3.0,
        "B-": 2.7,
        "C+": 2.3,
        "C": 2.0,
        "C-": 1.7,
        "D+": 1.3,
        "D": 1.0,
        "F": 0 
    }

	if (!studentid || !courseid || !grade) return res.status(500).send({ msg: 'Send all inputs' });

	req.db
		.query(`UPDATE class SET grade = '${grade}' WHERE studentid = '${studentid}' AND courseid = '${courseid}';`)
		.then((data) => {
            if (data.rowCount == 0) {
                res.status(500).send({ msg: 'Error' });
            }
            req.db.query(`SELECT * FROM class WHERE studentid = '${studentid}' AND NOT grade='';`)
            .then(data => {
                const studentGrades = data.rows.map((val) => {
                    return grades[val.grade];
                })
                const sum = (list) => {
                    if (list.length == 0) return 0;
                    return list[0] + sum(list.slice(1, list.length));
                }
                const avg = sum(studentGrades)/ studentGrades.length;
                req.db.query(`UPDATE student set gpa = ${avg} WHERE id = '${studentid}';`)
                .then(data2 => {
                    if (data2.rowCount) {
                        return res.status(200).send({msg: "Success!"});
                    }
                    return res.status(500).send({msg: "Error!"})
                })
                .catch((error) => {
                    console.log(error);
                    res.status(500).send({ msg: 'Something went wrong.' });
                });
            })
            .catch((error) => {
                console.log(error);
                res.status(500).send({ msg: 'Something went wrong.' });
            });
		})
		.catch((error) => {
			console.log(error);
			res.status(500).send({ msg: 'Something went wrong.' });
		});
};

const getWaitlistedStudents = (req, res) => {
    const {instructorid} = req.query;
    // get all of instructors courses
    // get all of the students on the waitlist for all courses
    // get all student profiles
    req.db.query(`SELECT * FROM course WHERE instructorid = '${instructorid}';`)
    .then(data => {
        if (data.rowCount == 0) return res.status(200).send({students: []});
        req.db.query(`SELECT * FROM waitlist WHERE ${modbuildOrCourseList("", data.rows)}`)
        .then(data2 => {
            if (data2.rowCount == 0) return res.status(200).send({students: []});
            const courseIDs = data2.rows.map(val => {return {id: val.courseid}});
            req.db.query(`SELECT * FROM course WHERE ${buildOrCourseList("", courseIDs)};
                          SELECT * FROM student WHERE ${buildOrStudentList("", data2.rows)};`)
            .then(data3 => {
                const courses = data3[0].rows;
                const students = data3[1].rows;
                const waitlist = data2.rows;
                let studentCourseArr = [];
                for (let i = 0; i < waitlist.length; i++) {
                    let val = waitlist[i];
                    studentCourseArr.push({
                        student: getObjectFromArr(students, (student) => (student.id === val.studentid)),
                        course:  getObjectFromArr(courses, (course) => (course.id === val.courseid))
                    })
                }
                return res.status(200).send({data: studentCourseArr});
            })
            .catch(error => {
                console.log(error);
                res.status(500).send({msg: "Error"});
            })
        })
        .catch(error => {
            console.log(error);
            res.status(500).send({msg: "Error"});
        })
    })
    .catch(error => {
        console.log(error);
        res.status(500).send({msg: "Error"});
    })
}

const reviewWaitlistedStudent = (req, res) => {
    const {studentid, courseid, decision} = req.query;
    if (!studentid || !courseid || !decision) return res.status(500).send({msg: "Send all inputs"});

    req.db.query(`DELETE FROM waitlist WHERE studentid = '${studentid}' AND courseid = '${courseid}';`)
    .then(data1 => {
        console.log(data1);
        if (!data1.rowCount) return res.status(500).send({msg: "Something went wrong"});
        if (!decision) return res.status(200).send({msg: "Success!"});
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
			const alreadyEnrolled = data[1].rowCount == 1;
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

			//Check if time conflicts exist;
			const coursesIDListSQL =
				enrolledClasses.length == 0 ? '' : ' WHERE ' + buildOrClassList('', enrolledClasses);
			req.db
				.query(`SELECT * FROM course${coursesIDListSQL};`)
				.then((data2) => {
					if (addNewClassConflict(course, data2.rows) && !(enrolledClasses.length == 0)) {
						return res.status(401).send({
							msg: 'There exists a time conflict with students enrolled courses and the attempted course.'
						});
					}
					const date = new Date();
					const addClassQuery = `INSERT INTO class (studentid, courseid, grade, season, year) VALUES ('${studentid}','${courseid}','','${getSeason()}',${date.getFullYear()});
                                    UPDATE course SET studentCount = ${course.studentcount +
										1} WHERE id = '${courseid}';`;
					req.db
						.query(addClassQuery)
						.then((_) => {
							res.status(200).send({ msg: 'Success!' });
						})
						.catch((error) => {
							console.log('Error inserting class: ', error);
							res.status(500).send({ msg: 'An Error Occurred' });
						});
				})
				.catch((error) => {
					console.log('Error getting students enrolled courses: ', error);
					res.status(500).send({ msg: 'An Error Occurred' });
				});
		})
		.catch((error) => {
			console.log('Error with first request:', error);
			res.status(500).send({ msg: 'An Error Occurred' });
		});
    })
}


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

const buildOrCourseList = (result, courses) => {
	if (courses.length == 0) return result;
	if (courses.length == 1) return result + `id = '${courses[0].id}'`;
	return buildOrCourseList(result + `id = '${courses[0].id}' OR `, courses.slice(1, courses.length));
};

const buildOrClassList = (result, classes) => {
	if (classes.length == 0) return result;
	if (classes.length == 1) return result + `id = '${classes[0].courseid}'`;
	return buildOrClassList(result + `id = '${classes[0].courseid}' OR `, classes.slice(1, classes.length));
};

const modbuildOrCourseList = (result, courses) => {
	if (courses.length == 0) return result;
	if (courses.length == 1) return result + `courseid = '${courses[0].id}'`;
	return modbuildOrCourseList(result + `courseid = '${courses[0].id}' OR `, courses.slice(1, courses.length));
};

const buildOrStudentList = (result, studentids) => {
	if (studentids.length == 0) return result;
	if (studentids.length == 1) return result + `id = '${studentids[0].studentid}'`;
	return buildOrStudentList(result + `id = '${studentids[0].studentid}' OR `, studentids.slice(1, studentids.length));
};

const getObjectFromArr = (list, isObj) => {
    if (list.length == 0) return null;
    if (isObj(list[0])) return list[0];
    return getObjectFromArr(list.slice(1, list.length), isObj);
}


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

//Instructor report to student
/*
            CREATE TABLE IF NOT EXISTS instructorToStudentReports (
                reportID CHAR(36) NOT NULL PRIMARY KEY,
                instructorName VARCHAR(64) NOT NULL,
                instructorID CHAR(36) NOT NULL,
                studentName VARCHAR(64) NOT NULL,
                studentID CHAR(36) NOT NULL,
                writtenReports VARCHAR(256)
            );
*/

const instructorReport = (req, res) => {
	const {instructorName, instructorID, studentName, studentID, writtenReports} = req.query;
	if (!instructorName || !instructorID || !studentName || !studentID || !writtenReports) return res.status(500).send({msg: "Send all inputs"});
	req.db
	.query(
		`INSERT INTO instructorToStudentReports (reportID, instructorName, instructorID, studentName, studentID, writtenReports)
		VALUES ('${uuidv4()}', '${instructorName}','${instructorID}','${studentName}','${studentID}','${writtenReports}') `
		)
		.then((_) => {
			res.status(200).send({
				msg: `Report submitted!`
			})
		})
		.catch((error) => {
			res.status(500).send({
				msg: 'Error creating report'
			});
		});
	}

module.exports = {
	assignGrade,
	getInstructor,
	getCoursesTaughtByProfessor,
	getStudentsForCourse,
    getWaitlistedStudents,
    reviewWaitlistedStudent,
    getAllInstructors,
	instructorReport
};

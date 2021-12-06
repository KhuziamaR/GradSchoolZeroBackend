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

const buildOrStudentList = (result, studentids) => {
	if (studentids.length == 0) return result;
	if (studentids.length == 1) return result + `id = '${studentids[0].studentid}'`;
	return buildOrStudentList(result + `id = '${studentids[0].studentid}' OR `, studentids.slice(1, studentids.length));
};

module.exports = {
	assignGrade,
	getInstructor,
	getCoursesTaughtByProfessor,
	getStudentsForCourse
};

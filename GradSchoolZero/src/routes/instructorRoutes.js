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
			res.status(200).send({
				data: data.rows
			});
		})
		.catch((error) => {
			res.status(404).send({
				msg: 'Error while retrieving students for course.'
			});
		});
};

const assignGrade = (req, res) => {
	const { studentid, courseid, grade } = req.query;

	if (!studentid || !courseid || !grade) return res.status(500).send({ msg: 'Send all inputs' });

	req.db
		.query(`UPDATE class SET grade = '${grade}' WHERE studentid = '${studentid}' AND courseid = '${courseid}';`)
		.then((data) => {
			if (data.rowCount) {
				res.status(200).send({ msg: 'Success!' });
			} else {
				res.status(500).send({ msg: 'Error' });
			}
		})
		.catch((error) => {
			console.log(error);
			res.status(500).send({ msg: 'Something went wrong.' });
		});
};

module.exports = {
	assignGrade,
	getInstructor,
	getCoursesTaughtByProfessor,
	getStudentsForCourse
};

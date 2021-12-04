const { v4: uuidv4 } = require('uuid');

// localhost:3000/assignGrade?studentid=asdasd&courseid=sdasd&grade=A

const assignGrade = (req, res) => {
    const {studentid, courseid, grade} = req.query;

    if (!studentid || !courseid || !grade) return res.status(500).send({msg: "Send all inputs"});

    req.db.query(`UPDATE class SET grade = '${grade}' WHERE studentid = '${studentid}' AND courseid = '${courseid}';`)
    .then(data => {
        if (data.rowCount) {
            res.status(200).send({msg: "Success!"});
        } else {
            res.status(500).send({msg: "Error"});
        }
    })
    .catch(error => {
        console.log(error);
        res.status(500).send({msg: "Something went wrong."})
    })
}

module.exports = {
    assignGrade
}


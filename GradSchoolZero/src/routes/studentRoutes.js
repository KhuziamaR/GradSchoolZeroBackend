const { v4: uuidv4 } = require('uuid');

const student = (req, res) => {
    const {id} = req.query;
    if (id) {
        req.db.query(`SELECT * FROM student WHERE id = '${id}';`)
        .then(data => {
            const student = {
                id: data.rows[0].id,
                firstname: data.rows[0].firstname,
                lastname: data.rows[0].lastname,
                email: data.rows[0].email,
                warnings: data.rows[0].warnings,
                gpa: data.rows[0].gpa
            }
            res.status(200).send(student);
        })
        .catch(error => {
            console.error(error);
            res.status(500).send({error: "An error occurred."});
        })
    }
    
}

module.exports = {
    student
}
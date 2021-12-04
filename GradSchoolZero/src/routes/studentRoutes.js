const MimeNode = require('nodemailer/lib/mime-node');
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

const availableCourses = (req, res) => {
    const {studentid} = req.query;
    if (!studentid) return res.status(500).send({msg: "Send all required inputs."});
    req.db.query(`SELECT * FROM class WHERE studentid = '${studentid}' AND grade = '';`)
    .then(data => {
        const classesQuery =`SELECT * FROM course` + ( data.rowCount == 0 ? "" : " WHERE " + buildNOTOrCourseList("", data.rows) ) + ";";
        req.db.query(classesQuery)
        .then(data2 => {
            res.status(200).send(data2.rows);
        })
        .catch(error => {
            console.log(error);
            res.status(500).send({msg: "An error occurred."});
        })
    })
}

const enrolledCourses = (req, res) => {
    // Get a list of courses that the student is currently enrolled in
    const {studentid} = req.query
    if (!studentid) return res.status(500).send({msg: "Send all required inputs."});
    const year = (new Date()).getFullYear();
    req.db.query(`SELECT * FROM class WHERE studentid = '${studentid}' AND year = ${year} AND season = '${getSeason()}';`)
    .then(data => {
        const classesQuery =`SELECT * FROM course` + ( data.rowCount == 0 ? "" : " WHERE " + buildOrCourseList("", data.rows) ) + ";";
        req.db.query(classesQuery)
        .then(data => {
            return res.status(200).send(data.rows);
        })
        .catch(error => {
            console.log(error);
            res.status(500).send({msg: "An error occurred."});
        })
    })


}

const completedCourses = (req, res) => {
    const {studentid} = req.query;
    if (!studentid) return res.status(500).send({msg: "Send all required inputs."});
    req.db.query(`SELECT * FROM class WHERE studentid = '${studentid}' AND NOT grade = '';`)
    .then(data => {
        const classesQuery =`SELECT * FROM course` + ( data.rowCount == 0 ? "" : " WHERE " + buildOrCourseList("", data.rows) ) + ";";
        req.db.query(classesQuery)
        .then(data2 => {
            const classes = data.rows.map((val, index) => {
                return {...val, course: data2.rows[index] ? {
                    id: data2.rows[index].id,
                    name: data2.rows[index].name,
                    capacity: data2.rows[index].capacity,
                    studentCount: data2.rows[index].studentCount,
                    instructorid: data2.rows[index].instructorid,
                    instructorname: data2.rows[index].instructorname,
                    days: data2.rows[index].days,
                    starttime: data2.rows[index].starttime,
                    endtime: data2.rows[index].endtime
                } : {}};
            })
            res.status(200).send(classes);
        })
        .catch(error => {
            console.log(error);
            res.status(500).send({msg: "An error occurred."});
        })
    })
}

const enroll = (req, res) => {
    const {courseid, studentid} = req.query;
    // Check if they're already enrolled
    // Check if they have 4 classes
    // Check if any time conflicts exist
    // Check if course is full
    if (!courseid && !studentid) return res.status(500).send({msg: "Send all required inputs."});
    req.db.query(`
        SELECT * FROM course WHERE id = '${courseid}';
        SELECT * FROM class WHERE studentid = '${studentid}' AND courseid = '${courseid} AND grade = ''';
        SELECT * FROM class WHERE studentid = '${studentid}';
        SELECT * FROM student WHERE id = '${studentid}';
    `)
    .then(data => {
        if (data[1].rowCount > 0) {
            return res.status(409).send({msg: "Student already enrolled"})
        }
        if (data[2].rowCount == 4) {
            return res.status(409).send({msg: "Student is already registerd in 4 classes."})
        }
        if (data[1].rowCount == 0) {
            if (data[0].rows[0].studentCount == data[0].rows[0].capacity) {
                req.db.query(`INSERT INTO waitlist (id, studentid, courseid) VALUES ('${uuidv4()}','${studentid}','${courseid}');`)
                .then(_ => {
                    return res.status(409).send({msg: "Class was full, Student Waitlisted."})
                })
                .catch(error => {
                    console.log("Error inserting into waitlist", error);
                    res.status(500).send({msg: "An Error Occurred"});
                })
            } else {
                // Class can be added to student schedule
                const date = new Date();
                const addClassQuery = `INSERT INTO class (studentid, courseid, grade, season, year) VALUES ('${studentid}','${courseid}','','${getSeason()}',${date.getFullYear()});
                                       UPDATE course SET studentCount = ${data[0].rows[0].studentcount + 1} WHERE id = '${courseid}';`
                req.db.query(addClassQuery)
                .then(_ => {
                    res.status(200).send({msg: "Success!"});
                })
                .catch(error => {
                    console.log("Error inserting class: ",error);
                    res.status(500).send({msg: "An Error Occurred"});
                })
            }
        } else {
            // Check for time conflicts
            const coursesIDListSQL = buildOrCourseList("", data[1].rows);
            req.db.query(`SELECT * FROM course WHERE ${coursesIDListSQL};`)
            .then(data => {
                courses = data.rows;
                const courseToBeRegistered = data[0].rows[0];
    
                for (let i = 0; i < courses.length; i++) {
                    if (conflicts(courseToBeRegistered.days,
                                    courseToBeRegistered.starttime,
                                    courseToBeRegistered.endtime,
                                    courses[i].days,
                                    course[i].starttime,
                                    courses[i].endtime)) {
                                        return res.status(409).send({msg: "There is a time Conflict"});
                                    }
                }
                // At this point there are no conflicts check if class is full
                if (data[0].rows[0].studentCount == data[0].rows[0].capacity) {
                    req.db.query(`INSERT INTO waitlist (id, studentid, courseid) VALUES ('${uuidv4()}','${studentid}','${courseid}');`)
                    .then(_ => {
                        return res.status(409).send({msg: "Class was full, Student Waitlisted."})
                    })
                    .catch(error => {
                        console.log("Error inserting into waitlist", error);
                        res.status(500).send({msg: "An Error Occurred"});
                    })
                } else {
                    // Class can be added to student schedule
                    const date = new Date();
                    const addClassQuery = `INSERT INTO class (studentid, courseid, grade, season, year) VALUES ('${studentid}','${courseid}','','${getSeason()}',${date.getFullYear()});
                                           UPDATE course SET studentCount = ${data[0].rows[0].studentcount + 1} WHERE id = '${courseid}';`
                    req.db.query(addClassQuery)
                    .then(_ => {
                        res.status(200).send({msg: "Success!"});
                    })
                    .catch(error => {
                        console.log("Error inserting class: ",error);
                        res.status(500).send({msg: "An Error Occurred"});
                    })
                }
    
            })
            .catch(error => {
                console.log("Error getting students enrolled courses: ", error);
                res.status(500).send({msg: "An Error Occurred"});
            })
        }
        
    })
    .catch(error => {
        console.log("Error with first request:", error);
        res.status(500).send({msg: "An Error Occurred"});
    })

}

const getSeason = () => {
    const date = new Date();
    const m = date.getMonth() + 1;
    const seasons = ["winter", "spring", "summer", "fall"];
    return seasons[Math.floor(m/3) % 4];
}

const conflicts = (days1, starttime1, endtime1, days2, starttime2, endtime2) => {
    const sh1 = parseInt(starttime1.slice(0,2));
    const sm1 = parseInt(starttime1.slice(2,4));
    const sh2 = parseInt(starttime2.slice(0,2));
    const sm2 = parseInt(starttime2.slice(2,4));
    const starttimeOverall1 = sh1 * 60 + sm1;
    const starttimeOverall2 = sh2 * 60 + sm2;

    const eh1 = parseInt(endtime1.slice(0,2));
    const em1 = parseInt(endtime1.slice(2,4));
    const eh2 = parseInt(endtime2.slice(0,2));
    const em2 = parseInt(endtime2.slice(2,4));
    const endtimeOverall1 = eh1 * 60 + em1;
    const endtimeOverall2 = eh2 * 60 + em2;

    const dayConflicts = (days1, days2) => {
        for (let i = 0; i <days1.length; i++) {
            if (days2.includes(days1[i])) return true
        }
        return false;
    }
    const timeConflicts = (start1, end1, start2, end2) => {
        return Math.max(start1, start2) < Math.min(end1, end2);
    }

    return dayConflicts(days1, days2) && timeConflicts(starttimeOverall1, endtimeOverall1, starttimeOverall2, endtimeOverall2);
}

const buildOrCourseList = (result, classes) => {
    if (classes.length == 0) return result;
    if (classes.length == 1) return result + `id = '${classes[0].courseid}'`;
    return buildOrCourseList(result + `id = '${classes[0].courseid}' OR `, classes.slice(1, classes.length));
}

const buildNOTOrCourseList = (result, classes) => {
    if (classes.length == 0) return result;
    if (classes.length == 1) return result + `NOT id = '${classes[0].courseid}'`;
    return buildOrCourseList(result + `NOT id = '${classes[0].courseid}' OR `, classes.slice(1, classes.length));
}

module.exports = {
    student,
    enroll,
    enrolledCourses,
    completedCourses,
    availableCourses
}
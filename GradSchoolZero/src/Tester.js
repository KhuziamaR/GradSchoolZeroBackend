const {DatabaseClient} = require("./Database.js")
const { v4: uuidv4 } = require('uuid')
const {names} = require("unique-names-generator");
const cli = new DatabaseClient()
cli.connect();

const getRandomName = () => {
    return names[Math.floor(Math.random() * names.length)];
}
const createStudentQuery = ( firstname, lastname, email) => {
    return `INSERT INTO student (id, firstName, lastName, email, password, warnings, suspended, gpa) VALUES ('${uuidv4()}', '${firstname}','${lastname}', '${email}','',0, false, 4.0);`;
}
const createRandomStudentQuery = () => {
    return createStudentQuery(getRandomName(), getRandomName(), getRandomName() + "@mail.com");
}
const createStudentQueries = (length) => {
    if (length == 1) return createRandomStudentQuery();
    return createRandomStudentQuery() + "\n" + createStudentQueries(length - 1)
}

const createInstructorQuery = (firstname, lastname, email) => {
    return `INSERT INTO instructor (id, firstName, lastName, email , password, warnings, suspended, rating, numberOfReviews) VALUES ('${uuidv4()}', '${firstname}','${lastname}', '${email}','',0, ${false}, 0.0, 0);`;
}
const createRandomInstructorQuery = () => {
    return createInstructorQuery(getRandomName(), getRandomName(), getRandomName() + "@mail.com")
}
const createInstructorQueries = (length) => {
    if (length == 1) return createRandomInstructorQuery();
    return createRandomInstructorQuery() + "\n" + createInstructorQueries(length - 1);
}

const createCourseQuery = (name, capacity, instructorid, instructorname, days, startTime, endTime, active) => {
    return `INSERT INTO course (id, name, capacity, studentcount, instructorid, instructorname, days, starttime, endtime, active) 
    VALUES ('${uuidv4()}', '${name}', ${capacity}, 0, '${instructorid}', '${instructorname}', '${days}','${startTime}', '${endTime}', ${active} );`
}



const createCoursesFromInstructors = (instructors, courseNames, active) => {
    let courses = "";
    let t1 = "1100 1215"
    let t2 = "1400 1515"
    let d1 = "13"
    let d2 = "24"
    for (let multiplier = 0; multiplier < 4; multiplier++) {
        for (let index = 0; index < 8; index++) {
            switch(multiplier) {
                case (1):
                    courses += createCourseQuery(courseNames[multiplier * 8 + index], 10, instructors[index].id, instructors[index].name, d1, t1.split(" ")[0], t1.split(" ")[1], active) + "\n"
                break;
                case (2):
                    courses += createCourseQuery(courseNames[multiplier * 8 + index], 10, instructors[index].id, instructors[index].name, d1, t2.split(" ")[0], t2.split(" ")[1], active) + "\n"
                break;
                case (3):
                    courses += createCourseQuery(courseNames[multiplier * 8 + index], 10, instructors[index].id, instructors[index].name, d2, t1.split(" ")[0], t1.split(" ")[1], active) + "\n"
                break;
                case (4):
                    courses += createCourseQuery(courseNames[multiplier * 8 + index], 10, instructors[index].id, instructors[index].name, d2, t2.split(" ")[0], t2.split(" ")[1], active) + "\n"
                break;
            }
        }
    }
    return courses
}

const createCompletedClass = (studentid, courseid, grade, season, year) => {
    return `INSERT INTO class (studentid, courseid, grade, season, year) VALUES ('${studentid}', '${courseid}', '${grade}', '${season}', ${year});`
}
const giveStudentLastSemesterClass = (studentid, courseid, grade) => {
    const grades = ["A", "B", "C", "D"]
    return createCompletedClass(studentid, courseid, grades[Math.floor(Math.random() * 3)], "spring", "2021")
}
const randLetterGrade = () => {
    const grades = ["A", "B", "C", "D"]
    return grades[Math.floor(Math.random() * 3)];
}

const letterGradeAvg = (l1, l2) => {
    const gradesNums = {"A": 4.0, "B": 3.0, "C": 2.0, "D": 1.0}
    return (gradesNums[l1] + gradesNums[l2])/2;
}

const createGradesList = (length, result) => {
    if (length == 0) return result;
    result.push(randLetterGrade() + " " + randLetterGrade())
    return createGradesList(length - 1, result);
}

const createClassesForStudent = (studentid, courseid1, courseid2, grade1, grade2) => {
    return giveStudentLastSemesterClass(studentid, courseid1, grade1) + "\n" + giveStudentLastSemesterClass(studentid, courseid2, grade2)
}

const createAvgList = (grades) => {
    if (grades.length == 1) return [letterGradeAvg(grades[0].split(" ")[0], grades[0].split(" ")[1])]
    let k = createAvgList(grades.splice(1, grades.length))
    k.unshift(letterGradeAvg(grades[0].split(" ")[0], grades[0].split(" ")[1]))
    return k
}

const updateStudentsGPA = (studentid, avg) => {
    return `UPDATE student SET gpa = ${avg} WHERE id = '${studentid}';`
}

const batchUpdateStudentgpa = (studentids, gpas) => {
    if (students.length == 0) return updateStudentsGPA(studentids[0], gpas[0])
    return updateStudentsGPA(studentids[0], gpas[0]) + "\n" + batchUpdateStudentgpa(studentids.splice(1, studentids.length), gpas.splice(1, gpas.length));
}


class Tester {
    static createStudents() {
        cli.resetTables([
            'instructor',
            'class',
            'student',
            'registrar',
            'course',
            'studentApplication',
            'instructorApplication',
            'graduationApplication',
            'graduatedStudents',
            'waitlist',
            'reviews',
            'semesterPeriod'
        ])
        cli.createTables()
        return cli.dbclient.query(createStudentQueries(40))
    }

    static createInstructors() {
        const newPromise = new Promise((resolve, reject) => {
            this.createStudents()
            .then(_ => {
                resolve(cli.dbclient.query(createInstructorQueries(8)));
            })
            .catch(error => {
                reject(error);
            })
        })
        return newPromise;
    }

    static createCourses() {
        const intros = ["Introduction to ", "Intermediate ", "Theoretical ", "History of "]
        const topics = ["Computer Science", "Machine Learning", "Artificial Intelligence", "Database Systems", "Software Engineering", "Calculus", "Statistics", "Art"];
        const mixed2List = (intros, topics) => {
            if (intros.length == 0 || topics.length == 0) return []
            return topics.map(el => intros[0] + el).concat(mixed2List(intros.splice(1, intros.length), topics))
        }
        const classNames = mixed2List(intros, topics)
        const newPromise = new Promise((resolve, reject) => {
            this.createInstructors()
            .then(data => {
                return cli.dbclient.query("SELECT * FROM instructor LIMIT 8;")
            })
            .then(data => {
                const instructors = data.rows.map(instructor => {
                    return {
                        id: instructor.id,
                        name: instructor.firstname + " " + instructor.lastname
                    }
                })
                const createCoursesQuery = createCoursesFromInstructors(instructors, classNames, true) + createCoursesFromInstructors(instructors, classNames, false);
                return cli.dbclient.query(createCoursesQuery)
            })
            .then(data => {
                resolve(cli.dbclient.query("SELECT * FROM course WHERE active = false;"))
            })
            .catch(error => {
                reject(error)
            })
        })
        return newPromise
    }

    static assignClassesToStudents() {
        this.createCourses()
        .then(data => {
            cli.dbclient.query("SELECT * FROM student;")
            .then(data2 => {
                const students = data2.rows;
                const courses = data.rows;
                let result = "";
                const gradesPerStudent = createGradesList(students.length, []);
                const avgPerStudent = createAvgList([...gradesPerStudent]);
                for (let i = 0; i < students.length; i++) {
                    let course1 = courses[Math.floor(Math.random() * Math.floor(courses.length/2))]
                    let course2 = courses[Math.floor(Math.random() * Math.floor(courses.length/2))+ Math.floor(courses.length/2)]
                    let query = createClassesForStudent(students[i].id, course1.id, course2.id, gradesPerStudent[i].split(" ")[0], gradesPerStudent[i].split(" ")[1]) + "\n"
                    query += updateStudentsGPA(students[i].id, avgPerStudent[i]);
                    result += query + "\n"
                }
                return cli.dbclient.query(result)
            })
            .then(_ => {
                console.log("Success")
            })
            .catch(err => {
                console.log(err)
            })
        }) 
    }
}

module.exports = {
    Tester
}
const { Client } = require('pg');

class DatabaseClient {
	constructor() {
		this.dbclient = new Client({
			user: process.env.USERNAME,
			password: process.env.PASSWORD,
			host: process.env.HOST,
			port: 5432,
			database: 'gradschoolzerodb'
		});
	}

	connect(callback = () => {}) {
		this.dbclient
			.connect()
			.then(() => {
				console.log('Connected to Database Successfully');
				this.createTables();
				callback();
			})
			.catch((e) => console.error(e));
	}

	createTables() {
		this.dbclient
			.query(
				`
            CREATE TABLE IF NOT EXISTS student (
               id CHAR(36) NOT NULL PRIMARY KEY,
               firstName VARCHAR(64) NOT NULL,
               lastName VARCHAR(64) NOT NULL,
               email VARCHAR(64) NOT NULL,
               password VARCHAR(64),
               warnings INT NOT NULL,
	           gpa FLOAT
           );

           CREATE TABLE IF NOT EXISTS instructor (
               id CHAR(36) NOT NULL PRIMARY KEY,
               firstName VARCHAR(64) NOT NULL,
               lastName VARCHAR(64) NOT NULL,
               email VARCHAR(64) NOT NULL,
               password VARCHAR(64),
               warnings INT NOT NULL,
               suspended BOOLEAN NOT NULL
           );

           CREATE TABLE IF NOT EXISTS registrar (
               id CHAR(36) NOT NULL PRIMARY KEY,
               email VARCHAR(64) NOT NULL,
               password VARCHAR(64)
           );

           CREATE TABLE IF NOT EXISTS course (
                id CHAR(36) NOT NULL PRIMARY KEY,
                name VARCHAR(256) NOT NULL,
                capacity INT NOT NULL,
                studentCount INT NOT NULL,
                instructorid CHAR(36) NOT NULL,
                instructorName VARCHAR(256) NOT NULL,
	            days VARCHAR(7) NOT NULL,
	            startTime VARCHAR(4) NOT NULL,
	            endTime VARCHAR(4) NOT NULL,
                active BOOLEAN NOT NULL
               );

           CREATE TABLE IF NOT EXISTS class (
               studentid CHAR(36) NOT NULL,
               courseid CHAR(36) NOT NULL,
               grade VARCHAR(2),
               season VARCHAR(8) NOT NULL,
               year INT NOT NULL,
               PRIMARY KEY (studentid, courseid)
           );


           CREATE TABLE IF NOT EXISTS studentApplication (
                id CHAR(36) NOT NULL PRIMARY KEY,
                firstName VARCHAR(64) NOT NULL,
                lastName VARCHAR(64) NOT NULL,
                email VARCHAR(64) NOT NULL,
	            gpa FLOAT NOT NULL,
	            program VARCHAR(128) NOT NULL,
	            graduationYear INT NOT NULL
           );


            CREATE TABLE IF NOT EXISTS instructorApplication (
                id CHAR(36) NOT NULL PRIMARY KEY,
                firstName VARCHAR(64) NOT NULL,
                lastName VARCHAR(64) NOT NULL,
                yearsOfExperience INT NOT NULL,
	            program VARCHAR(128) NOT NULL,
	            graduationYear INT NOT NULL,
                email VARCHAR(64) NOT NULL
           );

            CREATE TABLE IF NOT EXISTS graduationApplication (
               id CHAR(36) NOT NULL PRIMARY KEY,
               studentid CHAR(36) NOT NULL
           );

           CREATE TABLE IF NOT EXISTS waitlist (
               id CHAR(36) NOT NULL PRIMARY KEY,
               courseid CHAR(36) NOT NULL,
               studentid CHAR(36) NOT NULL
           );

           CREATE TABLE IF NOT EXISTS semesterPeriod (
                period VARCHAR(128) NOT NULL
            );

            
            INSERT INTO semesterPeriod (period) 
            SELECT 'pre-registration'
            WHERE NOT EXISTS (SELECT * FROM semesterPeriod);

            `
			)
			.then((results) => console.log('Created Tables Successfully'))
			.catch((e) => console.log(e));
	}

    resetTables(tables) {
        const query = (table) => `DROP TABLE ${table};\n`;
        const queries = (result, tablelst) => {
            if (tablelst.length == 0) return result;
            return queries(result + query(tablelst[0]), tablelst.slice(1,tablelst.length));
        }
        this.dbclient.query(queries("", tables))
        .then(_ => console.log("Successfully Deleted tables: "+ tables))
        .catch(error => {
            console.log(error);
        })
    }
}

module.exports = {
	DatabaseClient
};

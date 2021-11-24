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
            CREATE TABLE IF NOT EXISTS students (
                id CHAR(16) NOT NULL PRIMARY KEY,
                firstName VARCHAR(64) NOT NULL,
                lastName VARCHAR(64) NOT NULL,
                email VARCHAR(64) NOT NULL,
                password VARCHAR(64),
                warnings INT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS intructors (
            id CHAR(16) NOT NULL PRIMARY KEY,
                firstName VARCHAR(64) NOT NULL,
                lastName VARCHAR(64) NOT NULL,
                email VARCHAR(64) NOT NULL,
                password VARCHAR(64),
                warnings INT NOT NULL,
                suspended BOOLEAN NOT NULL
            );

            CREATE TABLE IF NOT EXISTS registrars (
                id CHAR(16) NOT NULL PRIMARY KEY,
                email VARCHAR(64) NOT NULL,
                password VARCHAR(64)
            );

            CREATE TABLE IF NOT EXISTS courses (
                id CHAR(16) NOT NULL PRIMARY KEY,
                name VARCHAR(256) NOT NULL,
                capacity INT NOT NULL,
                studentCount INT NOT NULL,
                instructorid CHAR(16) NOT NULL
                );

            CREATE TABLE IF NOT EXISTS classes (
                studentid CHAR(16) NOT NULL,
                courseid CHAR(64) NOT NULL,
                grade VARCHAR(2),
                season VARCHAR(8) NOT NULL,
                year INT NOT NULL,
                PRIMARY KEY (studentid, courseid)
            );
            `
			)
			.then((results) => console.log('Created Tables Successfully'))
			.catch((e) => console.log(e));
	}
}

module.exports = {
	DatabaseClient
};

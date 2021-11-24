require('dotenv').config();
const e = require('express');
const express = require('express');
const app = express();
const { DatabaseClient } = require('./src/Database.js');

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.get('/classes', (req, res) => {
	res.status(200).send(classes);
});

app.get('/professors', (req, res) => {
	res.status(200).send(professors);
});

app.get('/signin/:username/:password/:type', (req, res) => {
	const { username } = req.params;
	const { password } = req.params;
	const { type } = req.params;

	const user = users[type].find((user) => user.username == username && user.password == password);

	if (user) {
		res.status(200).send({
			auth: true
		});
	} else {
		res.status(200).send({
			auth: false
		});
	}
});

app.post('/login', (req, res) => {
	const username = req.body.username;
	const password = req.body.password;
	const type = req.body.type;
	if (username && password && type) {
		DatabaseClient.query(`SELECT * FROM ${type} WHERE username = ${username} AND password = ${password}`, function(
			error,
			results,
			fields
		) {
			if (results.length > 0) {
				res.send({
					auth: true,
					msg: 'Login Successfull'
				});
			}
		});
	}
});

app.post('/signup', (req, res) => {
	const { username } = req.query;
	const { password } = req.query;
	const { type } = req.query;

	if (username && password && type) {
		DatabaseClient.query(`SELECT * FROM ${type} WHERE username = ${username}`, function(error, results, fields) {
			if (results.length == 0) {
				const text = `INSERT INTO ${type} (username, password) VALUES ($1, $2) RETURNING id
  `;
				const values = [ username, password ];
				DatabaseClient.query(text, values);
				res.send({
					auth: true,
					msg: 'Sign up successfull'
				});
			} else {
				res.send({
					auth: false,
					msg: 'Error signing up, user already exists'
				});
			}
		});
	}
});

app.get('/courses', (req, res) => {
	const databaseClient = new DatabaseClient();
	databaseClient.dbclient
		.query(`SELECT * FROM courses`)
		.then((results) => {
			res.send(results);
		})
		.catch((error) => console.log(error));
});

app.get('/', (req, res) => {
	res.send('SEND REQUESTS TO \n /classes \n /professors \n /signin/:username/:password/:type');
});

app.listen(3000, () => {
	console.log('Listening on port 3000');
	const cli = new DatabaseClient();
	cli.connect();
});

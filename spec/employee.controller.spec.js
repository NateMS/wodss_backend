import * as bcrypt from "bcrypt";
import Credentials from "../models/credentials";
import Employee from "../models/employee";

var chai = require('chai');
var chaiHttp = require('chai-http');
var app = require('../index');
var should = chai.should();
const seeder = require('../services/endpointSeeder');

const saltRounds = 10;

chai.use(chaiHttp);

let id;
let token;

const testData = {
    "employees": [
    {
        "firstName": "Adrian",
        "lastName": "Tute",
        "active": true,
        "emailAddress": "adrian.tute@students.fhnw.ch",
        "role": "ADMINISTRATOR",
        "password": "AMKJUNGE110"
    },
    {
        "firstName": "Deine",
        "lastName": "Mutter",
        "active": false,
        "emailAddress": "deine.mutter@students.fhnw.ch",
        "role": "PROJECTMANAGER",
        "password": "AMKJUNGE110"
    },
    {
        "firstName": "Manuel",
        "lastName": "Stutz",
        "active": true,
        "emailAddress": "manuel.stutz@students.fhnw.ch",
        "role": "DEVELOPER",
        "password": "AMKJUNGE110"
    }
]
}

let credentialIds = [];
let employeeIds   = [];

describe('testing the employee endpoint', () => {
    beforeAll(async function() {
        for(let i = 0; i < testData.employees.length; i++) {
            const emp = Employee(testData.employees[i]);
            const salt = bcrypt.genSaltSync(saltRounds);
            const hashedPassword = bcrypt.hashSync(testData.employees[i].password, salt);
            const newCredentials = new Credentials({emailAddress: emp.emailAddress, password: hashedPassword});
            const c = await newCredentials.save();
            credentialIds.push(c);
            const e = await emp.save();
            employeeIds.push(e);
        }
    }, 50000);

    afterAll(async function() {
        for(let i = 0; i < credentialIds.length; i++) {
            await Employee.find({ id:employeeIds[i]}).deleteOne().exec();
            await Credentials.find({ id:credentialIds[i]}).deleteOne().exec();
        }
    }, 50000);


    it('Test token', function(done) {
        chai.request(app)
            .post("/token")
            .send({"emailAddress": "adrian.tute@students.fhnw.ch", "rawPassword": "AMKJUNGE110"})
            .end((err, res) => {
                res.should.have.status(201);
                token = res.body.token;
                done();
            });
    })

    it('GET all employees', function(done) {
        chai.request(app)
            .get("/api/employee")
            .set("Authorization", "Bearer "+token)
            .end((err, res) => {
                res.should.have.status(200);
                id = res.body[0].id;
                res.body.length.should.eql(3);
                done();
            });
    }, 5000);

    it('delete one employee', function(done) {
        chai.request(app)
            .delete("/api/employee/" + id)
            .set("Authorization", "Bearer " + token)
            .end((err, res) => {
                res.should.have.status(204);
                done();
            });
    }, 5000);

    it('GET all employees (one less)', function(done) {
        chai.request(app)
            .get("/api/employee")
            .set("Authorization", "Bearer "+token)
            .end((err, res) => {
                id = res.body[0].id;
                res.should.have.status(200);
                res.body.length.should.eql(2);
                done();
            });
    }, 5000);
});



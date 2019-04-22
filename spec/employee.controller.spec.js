import * as bcrypt from "bcrypt";
import Credentials from "../models/credentials";
import Employee from "../models/employee";

var chai = require('chai');
var chaiHttp = require('chai-http');
chai.use(chaiHttp);

var app = require('../index');
var should = chai.should();

const saltRounds = 10;

const testData = {
    "employees": [
    {
        "firstName": "Admin",
        "lastName": "VomBeruf",
        "active": true,
        "emailAddress": "admin.vomberuf@students.fhnw.ch",
        "role": "ADMINISTRATOR",
        "password": "AMKJUNGE110"
    },
    {
        "firstName": "Wallah",
        "lastName": "Habibi",
        "active": true,
        "emailAddress": "wallah.habibi@students.fhnw.ch",
        "role": "PROJECTMANAGER",
        "password": "AMKJUNGE110"
    },
    {
        "firstName": "John",
        "lastName": "Doe",
        "active": true,
        "emailAddress": "john.doe@students.fhnw.ch",
        "role": "DEVELOPER",
        "password": "AMKJUNGE110"
    }
]
}

let credentialIds = [];
let employeeIds   = [];
let countEmployeesBefore = 0;

let projectManagerToken;
let adminToken;
let idToDelete;
let projectManagerId;

describe('testing the employee endpoint', () => {
    beforeAll(async function() {
        for (let i = 0; i < 10; i++) {
            const numElems = await Employee.countDocuments().exec();
            countEmployeesBefore = await numElems;
        }

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
            await Employee.find({ _id:employeeIds[i]}).deleteOne().exec();
            await Credentials.find({ _id:credentialIds[i]}).deleteOne().exec();
        }
    }, 50000);

    it('Get admin & projectmanager token', function(done) {
        let adminIndex = 0;
        let projectManagerIndex = 0;
        for(let i in testData.employees) {
            if(testData.employees[i].role === "ADMINISTRATOR") {
                adminIndex = i;
            } else if(testData.employees[i].role === "PROJECTMANAGER") {
                projectManagerIndex = i;
            }
        }

        chai.request(app)
            .post("/api/token")
            .send({"emailAddress": testData.employees[adminIndex].emailAddress, "rawPassword": testData.employees[adminIndex].password})
            .end((err, res) => {
                adminToken = res.body.token;

                chai.request(app)
                    .post("/api/token")
                    .send({"emailAddress": testData.employees[projectManagerIndex].emailAddress, "rawPassword": testData.employees[projectManagerIndex].password})
                    .end((err, res) => {
                        projectManagerToken = res.body.token;
                        done();
                    });
            });
    })

    it('GET all employees', function(done) {
        let emps = 0;
        chai.request(app)
            .get("/api/employee")
            .set("Authorization", "Bearer " + adminToken)
            .end((err, res) => {
                res.should.have.status(200);
                emps = res.body.length;
                for(let i in res.body) {
                    if(res.body[i].emailAddress === "john.doe@students.fhnw.ch") {
                        idToDelete = res.body[i].id;
                    } else if(res.body[i].emailAddress === "wallah.habibi@students.fhnw.ch") {
                        projectManagerId = res.body[i].id;
                    }
                }
                res.body.length.should.eql(countEmployeesBefore + 3);

                chai.request(app)
                    .get("/api/employee")
                    .set("Authorization", "Bearer " + projectManagerToken)
                    .end((err, res) => {
                        res.should.have.status(200);
                        res.body.length.should.eq(emps); //projectmanager needs to see same amount of employees
                        emps = res.body.length;

                        done();
                    });

            });
    }, 5000);


    it('GET with role query param', function(done) {
        let count=0;

        chai.request(app)
            .get("/api/employee?role=ADMINISTRATOR")
            .set("Authorization", "Bearer " + adminToken)
            .end((err, res) => {
                res.should.have.status(200);
                for(let i in res.body) {
                    res.body[i].role.should.eq("ADMINISTRATOR");
                    if(res.body[i].emailAddress === "admin.vomberuf@students.fhnw.ch") {
                        count = count + 1;
                    }
                }

                chai.request(app)
                    .get("/api/employee?role=PROJECTMANAGER")
                    .set("Authorization", "Bearer " + adminToken)
                    .end((err, res) => {
                        res.should.have.status(200);
                        for(let i in res.body) {
                            res.body[i].role.should.eq("PROJECTMANAGER");
                            if(res.body[i].emailAddress === "wallah.habibi@students.fhnw.ch") {
                                count = count + 1;
                            }
                        }

                        chai.request(app)
                            .get("/api/employee?role=DEVELOPER")
                            .set("Authorization", "Bearer " + adminToken)
                            .end((err, res) => {
                                res.should.have.status(200);
                                for(let i in res.body) {
                                    res.body[i].role.should.eq("DEVELOPER");
                                    if(res.body[i].emailAddress === "john.doe@students.fhnw.ch") {
                                        count = count + 1;
                                    }
                                }
                                chai.expect(count).to.equal(3) //unsere 3 employees müssen vorkommen bei der jeweils richtigen query

                                chai.request(app)
                                    .get("/api/employee?role=DOESNOTEXIST")
                                    .set("Authorization", "Bearer " + adminToken)
                                    .end((err, res) => {
                                        res.should.have.status(412);

                                        done();
                                    });
                            });
                    });
            });
    });

    it('DELETE one employee', function(done) {

        chai.request(app)
            .delete("/api/employee/" + idToDelete)
            .set("Authorization", "Bearer " + projectManagerToken)
            .end((err, res) => {
                res.should.have.status(403);

                chai.request(app)
                    .delete("/api/employee/" + idToDelete)
                    .set("Authorization", "Bearer " + adminToken)
                    .end((err, res) => {
                        res.should.have.status(204);

                        chai.request(app)
                            .get("/api/employee/" + idToDelete)
                            .set("Authorization", "Bearer " + adminToken)
                            .end((err, res) => {
                                res.should.have.status(200);
                                res.body.firstName.should.eq("ANONYMIZED");
                                res.body.lastName.should.eq("ANONYMIZED");
                                res.body.active.should.eq(false);
                                done();
                            });
                    });
            });
    }, 5000);

    it('UPDATE an employee', function(done) {

        chai.request(app)
            .put("/api/employee/" + projectManagerId)
            .set("Authorization", "Bearer " + projectManagerToken)
            .send({"active":true, "firstName":"Endlich", "lastName":"Seriös", "emailAddress":"endlich.seriös@students.fhnw.ch"})
            .end((err, res) => {
                res.should.have.status(403);

                chai.request(app)
                    .put("/api/employee/" + projectManagerId)
                    .set("Authorization", "Bearer " + adminToken)
                    .send({"active":true, "firstName":"Endlich", "lastName":"Seriös", "emailAddress":"endlich.seriös@students.fhnw.ch"})
                    .end((err, res) => {
                        res.should.have.status(200);
                        res.body.firstName.should.eq("Endlich");
                        res.body.lastName.should.eq("Seriös");

                        chai.request(app)
                            .put("/api/employee/" + projectManagerId)
                            .set("Authorization", "Bearer " + adminToken)
                            .send({"firstName":"Endlich", "lastName":"Seriös", "emailAddress":"endlich.seriös@students.fhnw.ch"})
                            .end((err, res) => {
                                res.should.have.status(412); //active missing => precondition failed

                                chai.request(app)
                                    .put("/api/employee/" + projectManagerId*50)
                                    .set("Authorization", "Bearer " + adminToken)
                                    .send({"active":true, "firstName":"Endlich", "lastName":"Seriös", "emailAddress":"endlich.seriös@students.fhnw.ch"})
                                    .end((err, res) => {
                                        res.should.have.status(404);

                                        done();
                                    });
                            });
                    });
            });
    }, 5000);

    it('CREATE an employee', function(done) {

        chai.request(app)
            .post("/api/employee?role=DEVELOPER")
            .set("Authorization", "Bearer " + adminToken)
            .send({"active":true, "firstName":"Vorname1", "lastName":"Nachname1", "emailAddress":"vorname1.nachname1@students.fhnw.ch"})
            .end((err, res) => {
                res.should.have.status(412); //password flag query-param missing

                chai.request(app)
                    .post("/api/employee?role=DEVELOPER&password=123456789")
                    .set("Authorization", "Bearer " + adminToken)
                    .send({"active":true, "firstName":"Vorname1", "lastName":"Nachname1", "emailAddress":"vorname1.nachname1@students.fhnw.ch"})
                    .end((err, res) => {
                        res.should.have.status(201);
                        res.body.firstName.should.eq("Vorname1");
                        res.body.lastName.should.eq("Nachname1");
                        res.body.active.should.eq(false);
                        let id = res.body.id;

                        chai.request(app)
                            .get("/api/employee/" + id)
                            .set("Authorization", "Bearer " + adminToken)
                            .end(async (err, res) => {
                                res.should.have.status(200); //has actually been created!

                                await Employee.find({ _id:id}).deleteOne().exec();
                                await Credentials.find({ emailAddress:"vorname1.nachname1@students.fhnw.ch"}).deleteOne().exec();

                                done();
                            });
                    });
            });
    }, 5000);
});



import * as bcrypt from "bcrypt";
import Credentials from "../models/credentials";
import Employee from "../models/employee";
import Project from "../models/project";
import Contract from "../models/contract";
import Allocation from "../models/allocation";

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
            "lastName": "Istrator",
            "active": true,
            "emailAddress": "admin.istrator@students.fhnw.ch",
            "role": "ADMINISTRATOR",
            "password": "AMKJUNGE110"
        },
        {
            "firstName": "Project",
            "lastName": "Manager",
            "active": true,
            "emailAddress": "project.manager@students.fhnw.ch",
            "role": "PROJECTMANAGER",
            "password": "AMKJUNGE110"
        },
        {
            "firstName": "Ent",
            "lastName": "wickler",
            "active": true,
            "emailAddress": "ent.wickler@students.fhnw.ch",
            "role": "DEVELOPER",
            "password": "AMKJUNGE110"
        }
    ],
    "projects": [
        {
            "name": "TestProjekt1",
            "ftePercentage": "1000",
            "startDate": "2019-01-01",
            "endDate": "2020-12-31"
        },
        {
            "name": "TestProjekt2",
            "ftePercentage": "1000",
            "startDate": "2019-01-01",
            "endDate": "2020-12-31"
        },
        {
            "name": "TestProjekt3",
            "ftePercentage": "1000",
            "startDate": "2019-01-01",
            "endDate": "2020-12-31"
        }
    ],
    "contracts": [
        {
            "startDate": "2019-01-01",
            "endDate": "2020-12-31",
            "pensumPercentage": 100
        },
        {
            "startDate": "2019-01-01",
            "endDate": "2020-12-31",
            "pensumPercentage": 100
        },
        {
            "startDate": "2019-01-01",
            "endDate": "2020-12-31",
            "pensumPercentage": 100
        }
    ],
    "allocations": [
        {
            "startDate": "2020-01-01",
            "endDate": "2020-03-01",
            "pensumPercentage": 20
        },
        {
            "startDate": "2020-03-02",
            "endDate": "2020-05-01",
            "pensumPercentage": 20
        },
        {
            "startDate": "2020-05-02",
            "endDate": "2020-07-01",
            "pensumPercentage": 20
        },
        {
            "startDate": "2020-07-02",
            "endDate": "2020-09-01",
            "pensumPercentage": 20
        },{
            "startDate": "2020-09-02",
            "endDate": "2020-11-01",
            "pensumPercentage": 20
        },
        {
            "startDate": "2020-11-02",
            "endDate": "2020-12-31",
            "pensumPercentage": 20
        }
    ]
}

let credentialIds = [];
let employeeIds   = [];
let projectIds    = [];
let contractIds   = [];
let allocationIds = [];
let countContractsBefore = 0;

let projectManagerToken;
let adminToken;
let devToken;

describe('testing the contract endpoint', () => {
    beforeAll(async function() {
        for (let i = 0; i < 40; i++) {
            const numElems1 = await Project.countDocuments().exec();
            countContractsBefore = await numElems1;
        }
        let i;

        for(i = 0; i < testData.employees.length; i++) {
            const emp = Employee(testData.employees[i]);
            const salt = bcrypt.genSaltSync(saltRounds);
            const hashedPassword = bcrypt.hashSync(testData.employees[i].password, salt);
            const newCredentials = new Credentials({emailAddress: emp.emailAddress, password: hashedPassword});
            const c = await newCredentials.save();
            credentialIds.push(c.id);
            const e = await emp.save();
            employeeIds.push(e.id);
        }

        for(i=0; i < testData.projects.length; i++) {
            let e = Project(testData.projects[i]);
            e.projectManagerId = employeeIds[i%2+1];
            e = await e.save();
            projectIds.push(e.id);
        }

        for(i=0; i < testData.contracts.length; i++) {
            let e = Contract(testData.contracts[i]);
            e.employeeId = employeeIds[i];
            e = await e.save();
            contractIds.push(e.id);
        }

        for(i=0; i < testData.allocations.length; i++) {
            let e = Allocation(testData.allocations[i]);
            e.contractId = contractIds[i%3];
            e.projectId  = projectIds[i%3];
            e = await e.save();
            allocationIds.push(e.id);
        }

    }, 50000);

    afterAll(async function() {
        for(let i = 0; i < credentialIds.length; i++) {
            await Employee.find({ _id:employeeIds[i]}).deleteOne().exec();
            await Credentials.find({ _id:credentialIds[i]}).deleteOne().exec();
            await Project.find({ _id:projectIds[i]}).deleteOne().exec();
            await Contract.find({ _id:contractIds[i]}).deleteOne().exec();
        }
        for(let i = 0; i < allocationIds.length; i++) {
            await Allocation.find({ _id:allocationIds[i]}).deleteOne().exec();
        }
    }, 50000);

    it('Get admin, dev & projectmanager token', function(done) {
        let adminIndex = 0;
        let projectManagerIndex = 0;
        let devIndex = 0;

        for(let i in testData.employees) {
            if(testData.employees[i].role === "ADMINISTRATOR") {
                adminIndex = i;
            } else if(testData.employees[i].role === "PROJECTMANAGER") {
                projectManagerIndex = i;
            } else {
                devIndex = i;
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

                        chai.request(app)
                            .post("/api/token")
                            .send({"emailAddress": testData.employees[devIndex].emailAddress, "rawPassword": testData.employees[devIndex].password})
                            .end((err, res) => {
                                devToken = res.body.token;

                                done();
                            });
                    });
            });
    });

    it('GET contracts', function(done) {
        chai.request(app)
            .get("/api/contract")
            .set("Authorization", "Bearer " + devToken)
            .end((err, res) => {
                res.status.should.eq(200);
                res.body.length.should.eq(1); //nur ein contract

                chai.request(app)
                    .get("/api/contract")
                    .set("Authorization", "Bearer " + adminToken)
                    .end((err, res) => {
                        res.status.should.eq(200);
                        res.body.length.should.eq(countContractsBefore + testData.contracts.length);

                        chai.request(app)
                            .get("/api/contract?fromDate=2018-01-01")
                            .set("Authorization", "Bearer " + projectManagerToken)
                            .end((err, res) => {
                                res.status.should.eq(200);
                                res.body.length.should.eq(countContractsBefore + testData.contracts.length);

                                chai.request(app)
                                    .get("/api/contract?toDate=2000-01-01")
                                    .set("Authorization", "Bearer " + projectManagerToken)
                                    .end((err, res) => {
                                        res.status.should.eq(200);
                                        res.body.length.should.eq(0);

                                        done();
                                    });
                            });
                    });
            });
    });

    let createdContract;
    it('CREATE contract', function(done) {
        chai.request(app)
            .post("/api/contract")
            .set("Authorization", "Bearer " + adminToken)
            .send({"pensumPercentage": 100, "startDate": "2019-03-01", "endDate": "2019-08-01", "employeeId": employeeIds[0]})
            .end((err, res) => {
                res.status.should.eq(412); // already another contract inside this timerange

                chai.request(app)
                    .post("/api/contract")
                    .set("Authorization", "Bearer " + adminToken)
                    .send({"pensumPercentage": 100, "startDate": "2021-03-01", "endDate": "2021-08-01", "employeeId": employeeIds[0]*50})
                    .end((err, res) => {
                        res.status.should.eq(404); //employee does not exist

                        chai.request(app)
                            .post("/api/contract")
                            .set("Authorization", "Bearer " + adminToken)
                            .send({"pensumPercentage": 100, "startDate": "2021-03-01", "endDate": "2021-08-01", "employeeId": employeeIds[0]})
                            .end(async (err, res) => {
                                res.status.should.eq(200); //no interference

                                const c = await Contract.findOne({ "employeeId": employeeIds[0], "startDate": "2021-03-01", "endDate": "2021-08-01"}).exec();
                                createdContract = c._id;

                                done();
                            });
                    });
            });
    });

    it('DELETE contract', function(done) {
        chai.request(app)
            .delete("/api/contract/" + createdContract)
            .set("Authorization", "Bearer " + adminToken)
            .end(async (err, res) => {
                res.status.should.eq(204); // successfully deleted

                chai.request(app)
                    .delete("/api/contract/" + contractIds[1])
                    .set("Authorization", "Bearer " + adminToken)
                    .end(async (err, res) => {
                        res.status.should.eq(412); // allocations associated, so don't delete

                        done();
                    });
            });
    });

    it('GET deleted contract and test dev restrictions', function(done) {
        chai.request(app)
            .get("/api/contract/" + createdContract)
            .set("Authorization", "Bearer " + adminToken)
            .end((err, res) => {
                res.status.should.eq(404); // successfully deleted before

                chai.request(app)
                    .get("/api/contract/" + contractIds[0])
                    .set("Authorization", "Bearer " + devToken)
                    .end((err, res) => {
                        res.status.should.eq(403); // not sufficient permissions

                        done();
                    });
            });

    });

    it('UPDATE a contract', function(done) {
        chai.request(app)
            .put("/api/contract/" + contractIds[0])
            .set("Authorization", "Bearer " + projectManagerToken)
            .send({"startDate": "2019-03-01", "endDate": "2019-08-01", "pensumPercentage": 60, "employeeId":employeeIds[0]})
            .end((err, res) => {
                res.status.should.eq(403); // insufficient permissions for non-admin

                chai.request(app)
                    .put("/api/contract/" + contractIds[0])
                    .set("Authorization", "Bearer " + adminToken)
                    .send({"startDate": "2019-03-01", "endDate": "2019-08-01", "pensumPercentage": 60, "employeeId":employeeIds[1]})
                    .end((err, res) => {
                        res.status.should.eq(412); // collides with other contract of this employee

                        chai.request(app)
                            .put("/api/contract/" + contractIds[0])
                            .set("Authorization", "Bearer " + adminToken) //try to change another projectmanager's project
                            .send({"startDate": "2022-03-01", "endDate": "2022-08-01", "pensumPercentage": 60, "employeeId":employeeIds[1]})
                            .end((err, res) => {
                                res.status.should.eq(200); // successfully deleted
                                res.body.employeeId.should.eq(employeeIds[1]);

                                done();
                                /*

                                //try to do same call again after chaging the projectManager (has to fail!)
                                chai.request(app)
                                    .put("/api/project/" + projectIds[0])
                                    .set("Authorization", "Bearer " + projectManager1Token) //try to change another projectmanager's project
                                    .send({"name": "TestProjectXX", "ftePercentage": 1500, "startDate": "2019-03-01", "endDate": "2019-08-01", "projectManagerId": employeeIds[2]})
                                    .end((err, res) => {
                                        res.status.should.eq(403); // not authorized

                                        chai.request(app)
                                            .put("/api/project/" + projectIds[0])
                                            .set("Authorization", "Bearer " + projectManager2Token) //try to change another projectmanager's project
                                            .send({"name": "TestProjectXX", "ftePercentage": 1500, "startDate": "2019-06-01", "endDate": "2019-06-02", "projectManagerId": employeeIds[3]})
                                            .end(async (err, res) => {
                                                res.status.should.eq(412); // developer cannot be assigned as projectmanager!

                                                done();
                                            });
                                    });
                                    */
                            });


                    });
            });

    });

});



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
            "endDate": "2022-12-31",
            "pensumPercentage": 100
        },
        {
            "startDate": "2019-01-01",
            "endDate": "2022-12-31",
            "pensumPercentage": 100
        },
        {
            "startDate": "2019-01-01",
            "endDate": "2022-12-31",
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

describe('testing the allocation endpoint', () => {
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

    it('GET allocations', function(done) {
        chai.request(app)
            .get("/api/allocation")
            .set("Authorization", "Bearer " + devToken)
            .end((err, res) => {
                res.status.should.eq(200);
                res.body.length.should.eq(2);

                chai.request(app)
                    .get("/api/allocation?toDate=2020-07-01")
                    .set("Authorization", "Bearer " + devToken)
                    .end((err, res) => {
                        res.status.should.eq(200);
                        res.body.length.should.eq(1); //nur noch eine allocation ist in in diesem Rang

                        chai.request(app)
                            .get("/api/allocation?projectId="+projectIds[0])
                            .set("Authorization", "Bearer " + projectManagerToken) //projectmanager muss das auch sehen, weil sein project
                            .end((err, res) => {
                                res.status.should.eq(200);
                                res.body.length.should.eq(2); //pro Project genau 2 Allocations

                                chai.request(app)
                                    .get("/api/allocation?employeeId="+employeeIds[1])
                                    .set("Authorization", "Bearer " + adminToken)
                                    .end((err, res) => {
                                        res.status.should.eq(200);
                                        res.body.length.should.eq(2); //pro Person genau 2 Allocations

                                        chai.request(app)
                                            .get("/api/allocation?employeeId="+employeeIds[1]*200)
                                            .set("Authorization", "Bearer " + adminToken)
                                            .end((err, res) => {
                                                res.status.should.eq(404);

                                                done();
                                            });
                                    });
                            });
                    });
            });
    });

    let createdAllocation;
    it('CREATE allocation', function(done) {
        chai.request(app)
            .post("/api/allocation")
            .set("Authorization", "Bearer " + devToken)
            .send({"pensumPercentage": 20, "startDate": "2019-03-01", "endDate": "2019-08-01", "contractId": contractIds[0], "projectId": projectIds[0]})
            .end((err, res) => {
                res.status.should.eq(403); // dev is not allowed to do so

                chai.request(app)
                    .post("/api/allocation")
                    .set("Authorization", "Bearer " + projectManagerToken)
                    .send({"pensumPercentage": 20, "startDate": "2021-03-01", "endDate": "2021-08-01", "contractId": contractIds[0], "projectId": projectIds[0]})
                    .end(async (err, res) => {
                        res.status.should.eq(200); //no interference

                        const c = await Allocation.findOne({ "contractId": contractIds[0], "projectId": projectIds[0], "startDate": "2021-03-01", "endDate": "2021-08-01"}).exec();
                        createdAllocation = c._id;

                        chai.request(app)
                            .post("/api/allocation")
                            .set("Authorization", "Bearer " + projectManagerToken)
                            .send({"pensumPercentage": 100, "startDate": "2021-03-01", "endDate": "2021-08-01", "contractId": contractIds[0], "projectId": projectIds[0]})
                            .end(async (err, res) => {
                                res.status.should.eq(412); //Overbooking deteced (more than contract allows (100%))

                                chai.request(app)
                                    .post("/api/allocation")
                                    .set("Authorization", "Bearer " + projectManagerToken)
                                    .send({"pensumPercentage": 20, "startDate": "2023-03-01", "endDate": "2023-08-01", "contractId": contractIds[0], "projectId": projectIds[0]})
                                    .end(async (err, res) => {
                                        res.status.should.eq(412); //invalid allocation time-range (not inside the given contract time-range)

                                        done();
                                    });
                            });
                    });
            });
    });

    it('DELETE allocation', function(done) {
        chai.request(app)
            .delete("/api/allocation/" + allocationIds[0])
            .set("Authorization", "Bearer " + adminToken)
            .end(async (err, res) => {
                res.status.should.eq(204); // successfully deleted
                chai.request(app)
                    .delete("/api/allocation/" + allocationIds[0])
                    .set("Authorization", "Bearer " + adminToken)
                    .end(async (err, res) => {
                        res.status.should.eq(404); // does not exist anymore

                        done();
                    });
            });
    });

    it('GET deleted allocation and test dev restrictions', function(done) {
        chai.request(app)
            .get("/api/allocation/" + allocationIds[0])
            .set("Authorization", "Bearer " + adminToken)
            .end((err, res) => {
                res.status.should.eq(404); // successfully deleted before

                chai.request(app)
                    .get("/api/allocation/" + allocationIds[1])
                    .set("Authorization", "Bearer " + devToken)
                    .end((err, res) => {
                        res.status.should.eq(403); // not sufficient permissions

                        done();
                    });
            });

    });

    it('UPDATE allocation', function(done) {
        chai.request(app)
            .put("/api/allocation/" + createdAllocation)
            .set("Authorization", "Bearer " + devToken)
            .send({"pensumPercentage": 100, "startDate": "2021-03-01", "endDate": "2021-08-01", "contractId": contractIds[0], "projectId": projectIds[0]})
            .end((err, res) => {
                res.status.should.eq(403); // insufficient permissions for dev

                chai.request(app)
                    .put("/api/allocation/" + createdAllocation)
                    .set("Authorization", "Bearer " + adminToken)
                    .send({"pensumPercentage": 100, "startDate": "2021-03-01", "endDate": "2021-08-01", "contractId": contractIds[0], "projectId": projectIds[0]})
                    .end((err, res) => {
                        res.status.should.eq(412); // Overbooking

                        chai.request(app)
                            .put("/api/allocation/" + createdAllocation)
                            .set("Authorization", "Bearer " + adminToken) //try to change another projectmanager's project
                            .send({"pensumPercentage": 100, "startDate": "2021-03-01", "endDate": "2021-01-01", "contractId": contractIds[0], "projectId": projectIds[0]})
                            .end((err, res) => {
                                res.status.should.eq(412); // invalid time-range

                                done();
                            });
                    });
            });
    });
});



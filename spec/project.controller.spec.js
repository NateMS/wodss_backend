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
            "lastName": "Manager1",
            "active": true,
            "emailAddress": "project.manager1@students.fhnw.ch",
            "role": "PROJECTMANAGER",
            "password": "AMKJUNGE110"
        },
        {
            "firstName": "Project",
            "lastName": "Manager2",
            "active": true,
            "emailAddress": "project.manager2@students.fhnw.ch",
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
let countProjectsBefore = 0;
let countAllocationsBefore = 0;

let projectManager1Token;
let projectManager2Token;
let adminToken;
let devToken;

describe('testing the project endpoint', () => {
    beforeAll(async function() {
        for (let i = 0; i < 20; i++) {
            const numElems1 = await Project.countDocuments().exec();
            countProjectsBefore = await numElems1;

            const numElems2 = await Allocation.countDocuments().exec();
            countAllocationsBefore = await numElems2;
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
            e.employeeId = employeeIds[i+1];
            e = await e.save();
            contractIds.push(e.id);
        }

        for(i=0; i < testData.allocations.length; i++) {
            let e = Allocation(testData.allocations[i]);
            e.contractId = contractIds[(1+i)%3];
            e.projectId  = projectIds[(1+i)%3];
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
        let projectManager1Index = -1;
        let projectManager2Index = -1;
        let devIndex = 0;
        for(let i in testData.employees) {
            if(testData.employees[i].role === "ADMINISTRATOR") {
                adminIndex = i;
            } else if(testData.employees[i].role === "PROJECTMANAGER") {
                if(projectManager1Index === -1) {
                    projectManager1Index = i;
                } else {
                    projectManager2Index = i;
                }

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
                    .send({"emailAddress": testData.employees[projectManager1Index].emailAddress, "rawPassword": testData.employees[projectManager1Index].password})
                    .end((err, res) => {
                        projectManager1Token = res.body.token;

                        chai.request(app)
                            .post("/api/token")
                            .send({"emailAddress": testData.employees[projectManager2Index].emailAddress, "rawPassword": testData.employees[projectManager2Index].password})
                            .end((err, res) => {
                                projectManager2Token = res.body.token;

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
    });

    it('GET projects', function(done) {
        chai.request(app)
            .get("/api/project")
            .set("Authorization", "Bearer " + devToken)
            .end((err, res) => {
                res.status.should.eq(200);
                res.body.length.should.eq(1); //er arbeitet nur auf einem der Projekte (siehe Testdaten)

                chai.request(app)
                    .get("/api/project")
                    .set("Authorization", "Bearer " + projectManager2Token)
                    .end((err, res) => {
                        res.status.should.eq(200);
                        res.body.length.should.eq(countProjectsBefore + testData.projects.length);

                        chai.request(app)
                            .get("/api/project?projectManagerId=" + employeeIds[1]) //projectManager1
                            .set("Authorization", "Bearer " + projectManager1Token)
                            .end((err, res) => {
                                res.status.should.eq(200);
                                res.body.length.should.eq(2);

                                done();
                            });
                    });
            });
    });

    let createdProjectId;
    it('CREATE projects', function(done) {
        chai.request(app)
            .post("/api/project")
            .set("Authorization", "Bearer " + projectManager2Token)
            .send({"name": "TestProjectXX", "ftePercentage": 1500, "startDate": "2019-03-01", "endDate": "2019-08-01", "projectManagerId": employeeIds[2]})
            .end((err, res) => {
                res.status.should.eq(403); // only admin is allowed

                chai.request(app)
                    .post("/api/project")
                    .set("Authorization", "Bearer " + adminToken)
                    .send({"ftePercentage": 1500, "startDate": "2019-03-01", "endDate": "2019-08-01", "projectManagerId": employeeIds[2]})
                    .end((err, res) => {
                        res.status.should.eq(412); //missing projectname

                        chai.request(app)
                            .post("/api/project")
                            .set("Authorization", "Bearer " + adminToken)
                            .send({"name": "TestProjectXX", "ftePercentage": 1500, "startDate": "2019-03-01", "endDate": "2019-08-01", "projectManagerId": employeeIds[2]})
                            .end(async (err, res) => {
                                res.status.should.eq(201); //successfully created!

                                const p = await Project.findOne({ "name": "TestProjectXX" }).exec();
                                createdProjectId = p._id;

                                done();
                            });
                    });
            });
    });

    it('DELETE project', function(done) {
        chai.request(app)
            .delete("/api/project/" + createdProjectId)
            .set("Authorization", "Bearer " + adminToken)
            .end((err, res) => {
                res.status.should.eq(204); // successfully deleted

                chai.request(app)
                    .delete("/api/project/" + projectIds[1]) //this should cause to cascade remove 2 allocations
                    .set("Authorization", "Bearer " + adminToken)
                    .end(async (err, res) => {
                        res.status.should.eq(204); // successfully deleted

                        const allocations = await Allocation.find().exec();
                        chai.expect(allocations.length).to.equal(countAllocationsBefore + testData.allocations.length - 2); //2 less

                        done();
                    });
            });
    });

    it('GET deleted project and test dev restrictions', function(done) {
        chai.request(app)
            .get("/api/project/" + createdProjectId)
            .set("Authorization", "Bearer " + adminToken)
            .end((err, res) => {
                res.status.should.eq(404); // successfully deleted

                chai.request(app)
                    .get("/api/project/" + projectIds[0])
                    .set("Authorization", "Bearer " + devToken)
                    .end((err, res) => {
                        res.status.should.eq(403); // successfully deleted

                        done();
                    });
            });

    });

    it('UPDATE a project', function(done) {
        chai.request(app)
            .put("/api/project/" + projectIds[0])
            .set("Authorization", "Bearer " + devToken) //no dev can change a project
            .send({"name": "TestProjectXX", "ftePercentage": 1500, "startDate": "2019-03-01", "endDate": "2019-08-01", "projectManagerId": employeeIds[1]})
            .end((err, res) => {
                res.status.should.eq(403); // successfully deleted

                chai.request(app)
                    .put("/api/project/" + projectIds[0])
                    .set("Authorization", "Bearer " + projectManager2Token) //try to change another projectmanager's project
                    .send({"name": "TestProjectXX", "ftePercentage": 1500, "startDate": "2019-03-01", "endDate": "2019-08-01", "projectManagerId": employeeIds[1]})
                    .end((err, res) => {
                        res.status.should.eq(403); // not authorized

                        chai.request(app)
                            .put("/api/project/" + projectIds[0])
                            .set("Authorization", "Bearer " + projectManager1Token) //try to change another projectmanager's project
                            .send({"name": "TestProjectXX", "ftePercentage": 1500, "startDate": "2019-06-01", "endDate": "2019-06-02", "projectManagerId": employeeIds[2]})
                            .end(async (err, res) => {
                                res.status.should.eq(200); // successfully deleted
                                res.body.name.should.eq("TestProjectXX");
                                res.body.projectManagerId.should.eq(employeeIds[2]);

                                //das datum wurde angepasst in die vergangenheit
                                const allocations = await Allocation.find().exec();
                                chai.expect(allocations.length).to.equal(countAllocationsBefore + testData.allocations.length - 4); //2 less

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
                            });
                    });
            });

    });
});



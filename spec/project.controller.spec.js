import * as bcrypt from "bcrypt";
import Credentials from "../models/credentials";
import Employee from "../models/employee";
import Project from "../models/project";

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
    ],
    "projects": [
    {
        "name": "TestProject1",
        "ftePercentage": "1500",
        "startDate": "2018-05-03",
        "endDate": "2018-10-03"
    },
    {
        "name": "TestProjekt2",
        "ftePercentage": "1000",
        "startDate": "2018-05-03",
        "endDate": "2018-10-03"
    },
    {
        "name": "TestProjekt3",
        "ftePercentage": "1500",
        "startDate": "2018-05-03",
        "endDate": "2018-10-03"
    },
    {
        "name": "TestProjekt4",
        "ftePercentage": "1000",
        "startDate": "2018-05-03",
        "endDate": "2018-10-03"
    },
    {
        "name": "TestProjekt5",
        "ftePercentage": "1500",
        "startDate": "2018-05-03",
        "endDate": "2018-10-03"
    }
    ],
    "contracts": [

    ]
}

let credentialIds = [];
let employeeIds   = [];
let projectIds    = [];
let countProjectsBefore = 0;

let projectManagerToken;
let adminToken;
let devToken;
let idToDelete;
let projectManagerId;

describe('testing the employee endpoint', () => {
    beforeAll(async function() {
        for (let i = 0; i < 10; i++) {
            const numElems = await Project.countDocuments().exec();
            countProjectsBefore = await numElems;
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

        for(let i = 0; i < testData.projects.length; i++) {
            const proj = Project(testData.projects[i]);
            proj.projectManagerId = employeeIds[1];
            const p = await proj.save();
            projectIds.push(p);
        }

    }, 50000);

    afterAll(async function() {
        for(let i = 0; i < credentialIds.length; i++) {
            await Employee.find({ _id:employeeIds[i]}).deleteOne().exec();
            await Credentials.find({ _id:credentialIds[i]}).deleteOne().exec();
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
});



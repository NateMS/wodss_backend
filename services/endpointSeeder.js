import Employee from '../models/employee';
import Project from '../models/project';
import Contract from '../models/contract';
import Allocation from '../models/allocation';
let seed = require('../services/seed');

import * as bcrypt from "bcrypt";
import Credentials from "../models/credentials";
const saltRounds = 10;

let employeeIds   = [];
let projectIds    = [];
let contractIds   = [];
let allocationIds = [];

export async function seedDB() {
    console.log("Setting up test data");
    resetEndpoints();
    await seedEndpoints();
}

async function seedEndpoints() {
    let i;

    for(i=0; i < seed.employees.length; i++) {
        let e = Employee(seed.employees[i]);
        const salt = bcrypt.genSaltSync(saltRounds);
        const hashedPassword = bcrypt.hashSync(seed.employees[i].password, salt);
        const newCredentials = new Credentials({emailAddress: e.emailAddress, password: hashedPassword});
        await newCredentials.save();
        e = await e.save();
        employeeIds.push(e.id);
    }

    for(i=0; i < seed.projects.length; i++) {
        let e = Project(seed.projects[i]);
        e.projectManagerId = employeeIds[i%2+1];
        e = await e.save();
        projectIds.push(e.id);
    }

    for(i=0; i < seed.contracts.length; i++) {
        let e = Contract(seed.contracts[i]);
        e.employeeId = employeeIds[i];
        e = await e.save();
        contractIds.push(e.id);
    }

    for(i=0; i < seed.allocations.length; i++) {
        let e = Allocation(seed.allocations[i]);
        e.contractId = contractIds[i%3];
        e.projectId  = projectIds[i%3];
        e = await e.save();
        allocationIds.push(e.id);
    }
}

function resetEndpoints() {
    Promise.all([
        Employee.deleteMany().exec(),
        Project.deleteMany().exec(),
        Allocation.deleteMany().exec(),
        Contract.deleteMany().exec(),
        Credentials.deleteMany().exec()
    ]).then(() => { return; });
}

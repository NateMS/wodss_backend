import Employee from '../models/employee';
import Project from '../models/project';
import Contract from '../models/contract';
import Allocation from '../models/allocation';
let seed = require('../services/seed');

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
        e = await e.save();
        employeeIds.push(e.id);
    }

    for(i=0; i < seed.projects.length; i++) {
        let e = Project(seed.projects[i]);
        e.projectManagerId = employeeIds[Math.floor(Math.random() * employeeIds.length)];
        e = await e.save();
        projectIds.push(e.id);
    }

    for(i=0; i < seed.contracts.length; i++) {
        let e = Contract(seed.contracts[i]);
        e.employeeId = employeeIds[Math.floor(Math.random() * employeeIds.length)];
        e = await e.save();
        contractIds.push(e.id);
    }

    for(i=0; i < seed.allocations.length; i++) {
        let e = Allocation(seed.allocations[i]);
        e.contractId = contractIds[Math.floor(Math.random() * contractIds.length)];
        e.projectId  = projectIds[Math.floor(Math.random() * projectIds.length)];
        e = await e.save();
        allocationIds.push(e.id);
    }
}

function resetEndpoints() {
    Promise.all([
        Employee.deleteMany().exec(),
        Project.deleteMany().exec(),
        Allocation.deleteMany().exec(),
        Contract.deleteMany().exec()
    ]).then(() => { return; });
}

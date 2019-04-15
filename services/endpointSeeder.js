import Employee from '../models/employee';
import Project from '../models/project';
import Contract from '../models/contract';
import Allocation from '../models/allocation';
let seed = require('../services/seed');

let employeeIds   = [];
let projectIds    = [];
let contractIds   = [];
let allocationIds = [];

export function seedDB() {
    resetEndpoints();
    seedEmployees();
}

function seedEmployees() {
    console.log("Seeding /api/employees..");
    seed.employees.forEach(function (employee) {
        Employee(employee).save((error, saved) => {
            if(!error) {
                employeeIds.push(saved.id);
                if(employeeIds.length == seed.employees.length) {
                    seedProjects();
                }
            }
        });
    })
}

function seedProjects() {
    console.log("Seeding /api/projects..");
    seed.projects.forEach(function (project) {
        project.projectManagerId = employeeIds[Math.floor(Math.random() * employeeIds.length)];
        new Project(project).save((error, saved) => {
            if(!error) {
                projectIds.push(saved.id);
                if(projectIds.length == seed.projects.length) {
                    seedContracts();
                }
            }
        });
    });
}

function seedContracts() {
    console.log("Seeding /api/contracts..");
    seed.contracts.forEach(function (contract) {
        contract.employeeId = employeeIds[Math.floor(Math.random() * employeeIds.length)];
        new Contract(contract).save((error, saved) => {
            if(!error) {
                contractIds.push(saved.id);
                if(contractIds.length == seed.contracts.length) {
                    seedAllocations();
                }
            }
        });
    });
}

function seedAllocations() {
    console.log("Seeding /api/allocations..");
    seed.allocations.forEach(function (allocation) {
        allocation.contractId = contractIds[Math.floor(Math.random() * contractIds.length)];
        allocation.projectId  = projectIds[Math.floor(Math.random() * projectIds.length)];
        new Allocation(allocation).save((error, saved) => {
            if(!error) {
                allocationIds.push(saved.id);
                if(allocationIds.length == seed.allocations.length) {
                    console.log("Done seeding!");;
                }
            }
        });
    });
}

function resetEndpoints() {
    Promise.all([
        Employee.deleteMany().exec(),
        Project.deleteMany().exec(),
        Allocation.deleteMany().exec(),
        Contract.deleteMany().exec()
    ]).then(() => { return; });
}

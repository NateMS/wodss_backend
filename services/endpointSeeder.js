import Employee from '../models/employee';
import Project from '../models/project';
import Contract from '../models/contract';
import Allocation from '../models/allocation';

const mongoose = require('mongoose');

var employeeIds   = [];
var projectIds    = [];
var contractIds   = [];
var allocationIds = [];

export function seedDB() {
    resetEndpoints();
    seedEmployees();
}

function seedEmployees() {
    var employeeSeed = {
        'employees': [
            {
                firstName: 'Adrian',
                lastName: 'Tute',
                active: true,
                emailAddress: 'adrian.tute@students.fhnw.ch',
                role: 'ADMINISTRATOR',
                password: "AMKJUNGE110"
            },
            {
                firstName: 'Deine',
                lastName: 'Mutter',
                active: false,
                emailAddress: 'deine.mutter@students.fhnw.ch',
                role: 'PROJECTMANAGER',
                password: "AMKJUNGE110"
            },
            {
                firstName: 'Manuel',
                lastName: 'Stutz',
                active: true,
                emailAddress: 'manuel.stutz@students.fhnw.ch',
                role: 'DEVELOPER',
                password: "AMKJUNGE110"
            }
        ]
    };

    employeeSeed.employees.forEach(function (employee) {
        Employee(employee).save((error, saved) => {
            if(!error) {
                employeeIds.push(saved.id);
                if(employeeIds.length == employeeSeed.employees.length) {
                    seedProjects();
                }
            }
        });
    });
}

function seedProjects() {
    var projectSeed = {
        'projects': [
            {
                name: 'Projekt1',
                ftePercentage: '1500',
                startDate: '2018-05-03',
                endDate: '2018-10-03',
                projectManagerId: employeeIds[0]
            },
            {
                name: 'Projekt2',
                ftePercentage: '1000',
                startDate: '2019-02-01',
                endDate: '2019-10-01',
                projectManagerId: employeeIds[1]
            },
            {
                name: 'Projekt3',
                ftePercentage: '500',
                startDate: '2019-11-01',
                endDate: '2020-03-01',
                projectManagerId: employeeIds[2]
            }
        ]
    }

    projectSeed.projects.forEach(function (project) {
        new Project(project).save((error, saved) => {
            if(!error) {
                projectIds.push(saved.id);
                if(projectIds.length == projectSeed.projects.length) {
                    seedContracts();
                }
            }
        });
    });
}

function seedContracts() {
    var contractSeed = {
        'contracts': [
            {
                startDate: '2018-05-03',
                endDate: '2018-10-03',
                pensumPercentage: 100,
                employeeId: employeeIds[0]
            },
            {
                startDate: '2018-05-03',
                endDate: '2018-10-03',
                pensumPercentage: 100,
                employeeId: employeeIds[1]
            },
            {
                startDate: '2018-05-03',
                endDate: '2018-10-03',
                pensumPercentage: 100,
                employeeId: employeeIds[2]
            }
        ]
    }

    contractSeed.contracts.forEach(function (contract) {
        new Contract(contract).save((error, saved) => {
            if(!error) {
                contractIds.push(saved.id);
                if(contractIds.length == contractSeed.contracts.length) {
                    seedAllocations();
                }
            }
        });
    });
}

function seedAllocations() {
    var allocationSeed = {
        'allocations': [
            {
                startDate: '2018-05-03',
                endDate: '2018-10-03',
                pensumPercentage: 100,
                contractId: contractIds[0],
                projectId: projectIds[0]
            },
            {
                startDate: '2018-05-03',
                endDate: '2018-10-03',
                pensumPercentage: 100,
                contractId: contractIds[1],
                projectId: projectIds[1]
            },
            {
                startDate: '2018-05-03',
                endDate: '2018-10-03',
                pensumPercentage: 100,
                contractId: contractIds[2],
                projectId: projectIds[2]
            }
        ]
    }

    allocationSeed.allocations.forEach(function (allocation) {
        new Allocation(allocation).save((error, saved) => {
            if(!error) {
                allocationIds.push(saved.id);
                if(allocationIds.length == allocationSeed.allocations.length) {
                    console.log("Done seeding..");
                }
            }
        });
    });
}

function resetEndpoints() {
    Employee.deleteMany().exec().then(
        Project.deleteMany().exec().then(
            Allocation.deleteMany().exec().then(
                Contract.deleteMany().exec().then(() => {
                    return; //Garantie, dass wirklich alle gelöscht sind!
                })
            )
        )
    );

}

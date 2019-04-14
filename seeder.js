import Employee from './models/employee';
import Project from './models/project';

var employeeIds = [];
var projectIds  = [];

export function seedDB() {
    /*
     Employee Seed
     */
    Employee.find({}).exec((_, employees) => {
        employees.forEach(function (employee) {
            employee.remove();
        })
    });

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
                    seedProjects(employeeIds);
                }
            }
        });
    });
}

function seedProjects(employeeIds) {
    Project.find({}).exec((_, projects) => {
        projects.forEach(function (project) {
            project.remove();
        })
    });

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
            }
        });
    });
}

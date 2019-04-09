import Employee from './models/employee';

export function seedDB() {
    /*
     Employee Seed
     */
    Employee.find({}).exec((_, employees) => {
        employees.forEach(function(employee) { employee.remove(); })
    });

    var employeeSeed = {
        'employees': [
            { 'firstName': 'Adrian', 'lastName': 'Tute', 'active': true, 'emailAddress': 'adrian.tute@students.fhnw.ch',
            'role': 'ADMINISTRATOR', 'password': "AMKJUNGE110" },
            { 'firstName': 'Deine', 'lastName': 'Mutter', 'active': false, 'emailAddress': 'deine.mutter@students.fhnw.ch',
                'role': 'PROJECTMANAGER', 'password': "AMKJUNGE110" },
            { 'firstName': 'Manuel', 'lastName': 'Stutz', 'active': true, 'emailAddress': 'manuel.stutz@students.fhnw.ch',
                'role': 'DEVELOPER', 'password': "AMKJUNGE110" }
        ]
    };

    employeeSeed.employees.forEach(function(employee) {
        Employee(employee).save(()=>{});
    });
}

import Employee from './models/employee';

export function seedDB() {
    var employeeSeed = {
        'employees': [
            { 'firstName': 'Adrian', 'lastName': 'Tute', 'active': true, 'emailAddress': 'adrian.tute@students.fhnw.ch',
            'role': 'ADMINISTRATOR', 'password': "AMKJUNGE110" },
            { 'firstName': 'Manuel', 'lastName': 'Stutz', 'active': true, 'emailAddress': 'manuel.stutz@students.fhnw.ch',
                'role': 'DEVELOPER', 'password': "AMKJUNGE110" }
        ]
    };

    for (const i in employeeSeed.employees) {
        Employee(employeeSeed.employees[i]).save((err, _) => {});
    }
}
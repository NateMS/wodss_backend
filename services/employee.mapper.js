const Employee = require('../models/employee');

/**
 * Maps the JWT 'Credential' to a employee using the credential's email address.
 * Saves the employee to the request to be used in the controllers.
 * The employee is then accessible in the controller under <code>req.employee</code>
 */
export function map(req, res, next) {
    if(req.user === undefined || req.user.length < 1){ return next({message: "No credentials set by JWT"}, null) }

    Employee.default.findOne({emailAddress: {$eq: req.user[0].emailAddress}}, function (err, employee){
        if(err){ return next(err, null) }

        if(employee){
            req.employee = employee;
            next(null, employee);
        }else{
            res.status(401);
            res.send("Your token has been invalidated.");
            return;
        }
    });
}
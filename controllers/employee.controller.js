import Employee from '../models/employee';
import Credentials from '../models/credentials'
import * as bcrypt from "bcrypt";
import * as Role from '../models/roles'

const saltRounds = process.env.SALT_ROUNDS || 10;

/**
 * Get all employees
 * @param req
 * @param res
 * @returns void
 */
export function getEmployees(req, res) {
  const query = {};

  if(req.query.hasOwnProperty('role')) {
    const role = req.query.role;
    if(!isValidRole(role)) {
      res.status(412).send("Invalid role query parameter!").end();
      return;
    } else {
      query["role"] = {$eq: role};
    }
  }

  //find the employee by using the query
  Employee.find(query).exec((err, employees) => {
    if (err) {
      res.status(500).send(err).end();
      return;
    }
    res.json(employees);
  });
}

/**
 * Save a new employee
 * @param req
 * @param res
 * @returns void
 */
export function addEmployee(req, res) {
  if (!req.body.hasOwnProperty('firstName')
      || !req.body.hasOwnProperty('lastName')
      || !req.body.hasOwnProperty('emailAddress')
      || !req.query.hasOwnProperty('password')
      || !req.query.hasOwnProperty('role')) {
    res.status(412).send("Missing property (firstName, lastName, emailAddress, password or role").end();
    return
  }

  if(!isValidRole(req.query.role)){
    res.status(412).send("Invalid role query parameter. Must be one of DEVELOPER, PROJECTMANAGER or ADMINISTRATOR");
    return;
  }

  const newEmployee = new Employee(req.body);
  newEmployee.active = false; //needs to be set active manually by an admin!
  newEmployee.role   = req.query.role;

  const salt = bcrypt.genSaltSync(saltRounds);
  const hashedPassword = bcrypt.hashSync(req.query.password, salt);

  newEmployee.save((err, saved) => {
    if (err) {
      if(err.message.indexOf('duplicate key error') > 0){
        res.status(412).send(err);
      }else{
        res.status(500).send(err);
      }
    } else {
      const newCredentials = new Credentials({password: hashedPassword, emailAddress: req.body.emailAddress});
      newCredentials.save((err, savedCred) => {
        if(err){
          if(err.message.indexOf('duplicate key error') > 0){
            res.sendStatus(500).send("Something went wrong. An employee with the given mail was created, but there " +
                "were already existing credentials for this mail. Please contact your system administrator.");
                //this should NEVER be able to happen
          }else{
            res.status(500).send(err);
          }
        }else{
          res.status(201).json(saved);
        }
      });
    }
  });
}

/**
 * Get a single employee
 * @param req
 * @param res
 * @returns void
*/
export function getEmployee(req, res) {
  if(isNaN(req.params.id)) {
    res.status(412).send("id param has to be a number!").end();
    return;
  }

  Employee.findOne({ _id: {$eq: req.params.id} }).exec((err, employee) => {
    if (err) {
      res.status(500).send(err);
    }else if(!employee){
      res.status(404).send("Employee does not exist!").end();
    }else{
      res.json(employee);
    }
  });
}

/**
 * Anonymize a employee
 * @param req
 * @param res
 * @returns void
*/
export function anonymizeEmployee(req, res) {
  if(isNaN(req.params.id)) {
    res.status(412).send("id param has to be a number!").end();
    return;
  }

  if(req.employee.role !== Role.ADMINISTRATOR) { //only admin has the ability
    res.status(403).send("No admin rights!").end();
    return;
  }

  //anonymize (hash-value of emailaddress (unique constraint))
  Employee.findOne({ _id: {$eq: req.params.id} }).exec((err, employee) => {
    if(err){
      res.status(500).send(err);
    }else if(!employee){
      res.status(404).send("Employee does not exist!").end();
    }else{ //Anonymize Employee
      employee.active = false;
      employee.firstName = "ANONYMIZED";
      employee.lastName = "ANONYMIZED";
      const salt = bcrypt.genSaltSync(saltRounds);
      const hashedEmail = bcrypt.hashSync(employee.emailAddress, salt);
      employee.emailAddress = hashedEmail + "@invalid.ch"; //email has to be unique but not a valid email-address afterwards!
      employee.save((err, saved) => {
        if(err){
          res.status(500).send(err);
        }else{
          res.status(204).end();
        }
      })
    }
  });
}

/**
 * Updates the specified employee
 * @param req
 * @param res
 */
export function updateEmployee(req, res){
  if(isNaN(req.params.id)) {
    res.status(412).send("id param has to be a number!").end();
    return;
  }

  if(req.employee.role !== Role.ADMINISTRATOR) {
    res.status(403).send("No admin rights!").end();
    return;
  }

  if(!req.body.hasOwnProperty('active')
      || !req.body.hasOwnProperty('firstName')
      || !req.body.hasOwnProperty('lastName')
      || !req.body.hasOwnProperty('emailAddress')){
    res.status(412).send("Missing property (active, firstName, lastName or emailAddress").end();
    return;
  }

  Employee.findOne({ _id: {$eq: req.params.id} }).exec((err, employee) => {
    if(err){
      res.status(500).send(err);
    }else if(!employee){
      res.status(404).end();
    }else{ //actually update
      employee.active = req.body.active;
      employee.firstName = req.body.firstName;
      employee.lastName = req.body.lastName;
      employee.emailAddress = req.body.emailAddress;
      employee.save((err, saved) => {
        if(err){
          res.status(500).send(err);
        }else{
          res.json(saved);
        }
      })
    }
  });
}

/**
 * Validates the parameter 'role' and returns true if it is a valid role and false otherwise.
 * @param role
 * @returns {boolean}
 */
function isValidRole(role) {
  return role === Role.ADMINISTRATOR || role === Role.DEVELOPER || role === Role.PROJECTMANAGER
}
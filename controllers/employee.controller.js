import Employee from '../models/employee';
import bcrypt from 'bcrypt';

const saltRounds = 10;

/**
 * Get all posts
 * @param req
 * @param res
 * @returns void
 */
export function getEmployees(req, res) {
  // todo: if unauthenticated, return 401
  // todo: if token invalid, return 401

  Employee.find().sort('-dateAdded').exec((err, employees) => {
    if (err) {
      res.status(500).send(err);
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
  if (!req.body.hasOwnProperty('active')
      || !req.body.hasOwnProperty('firstName')
      || !req.body.hasOwnProperty('lastName')
      || !req.body.hasOwnProperty('emailAddress')
      || !req.query.hasOwnProperty('password')
      || !req.query.hasOwnProperty('role')) {

    res.status(412).end();
    return
  }

  const salt = bcrypt.genSaltSync(saltRounds);
  const newEmployee = new Employee(req.body);
  newEmployee.password = bcrypt.hashSync(req.query.password, salt);
  newEmployee.role = req.query.role;

  newEmployee.save((err, saved) => {
    if (err) {
      if(err.message.indexOf('duplicate key error') > 0){
        res.status(412).send(err); //todo: check if 409 is correct status code according to API definition
      }else{
        res.status(500).send(err);
      }
    } else {
      res.json(saved);
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
  //todo: return 401 if unauthenticated or invalid token

  Employee.findOne({ _id: {$eq: req.params.id} }).exec((err, employee) => {
    if (err) {
      res.status(500).send(err);
    }else if(!employee){
      res.status(404).end();
    }else{
      res.json(employee);
    }
  });
}

/**
 * Delete a employee
 * @param req
 * @param res
 * @returns void
*/
export function deleteEmployee(req, res) {
  Employee.findOne({ _id: {$eq: req.params.id} }).exec((err, employee) => {
    if (err) {
      res.status(500).send(err);
    }else if(!employee){
      res.status(404).end();
    }else {
      employee.remove(() => {
        res.status(204).end();
      });
    }
  });
}

/**
 * Updates the specified employee
 * @param req
 * @param res
 */
export function updateEmployee(req, res){
  //todo: 401 if unauthenticated or invalid token
  //todo: 403 if user is not allowed to update this employee

  //active can't be validated the same as the others, because a value of "false" would validate to 'false' (Boolean).
  if(!req.body.hasOwnProperty('active')
      || !req.body.hasOwnProperty('firstName')
      || !req.body.hasOwnProperty('lastName')
      || !req.body.hasOwnProperty('emailAddress')){
    res.status(412).send(req.body);
    return;
  }

  Employee.findOne({ _id: {$eq: req.params.id} }).exec((err, employee) => {
    if(err){
      res.status(500).send(err);
    }else if(!employee){
      res.status(404).end();
    }else{
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
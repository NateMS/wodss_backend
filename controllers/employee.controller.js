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
  if (!req.body.active
      || !req.body.firstName
      || !req.body.lastName
      || !req.body.emailAddress
      || !req.query.password
      || !req.query.role) {

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
        res.status(409).send(err);
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
  Employee.findOne({ _id: {$eq: req.params.id} }).exec((err, employee) => {
    if (err) {
      res.status(500).send(err);
    }
    res.json(employee);
  });
}

/**
 * Delete a post
 * @param req
 * @param res
 * @returns void
*/
export function deleteEmployee(req, res) {
  Employee.findOne({ _id: {$eq: req.params.id} }).exec((err, employee) => {
    if (err) {
      res.status(500).send(err);
    }else {
      employee.remove(() => {
        res.status(204).end();
      });
    }
  });
}

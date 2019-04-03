import Employee from '../models/employee';
import sanitizeHtml from 'sanitize-html';
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
    res.json({ employees });
  });
}

/**
 * Save a post
 * @param req
 * @param res
 * @returns void
 */
export function addEmployee(req, res) {
  if (!req.body.employee || !req.body.password || !req.body.role) {
    res.status(412).end();
  }

  const employeeVar = req.body.employee;

  // remove id and change to _id, to comply with MongoDB-ID as well as API definition
  // const idTmp = employeeVar.id;
  // delete employeeVar.id;
  // employeeVar._id = idTmp;

  employeeVar.role = req.body.role;

  const salt = bcrypt.genSaltSync(saltRounds);
  employeeVar.password = bcrypt.hashSync(req.body.password, salt);

  const newEmployee = new Employee(employeeVar);

  // Let's sanitize inputs
  newEmployee.firstName = sanitizeHtml(newEmployee.firstName);
  newEmployee.lastName = sanitizeHtml(newEmployee.lastName);
  newEmployee.emailAddress = sanitizeHtml(newEmployee.emailAddress);

  newEmployee.save((err, saved) => {
    if (err) {
      res.status(500).send(err);
    } else {
      res.json({ employee: saved });
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
  Employee.findOne({ _id: req.params.id }).exec((err, employee) => {
    if (err) {
      res.status(500).send(err);
    }
    res.json({ employee });
  });
}

/**
 * Delete a post
 * @param req
 * @param res
 * @returns void
*/
export function deleteEmployee(req, res) {
  Employee.findOne({ _id: req.params.id }).exec((err, employee) => {
    if (err) {
      res.status(500).send(err);
    }

    employee.remove(() => {
      res.status(204).end();
    });
  });
}

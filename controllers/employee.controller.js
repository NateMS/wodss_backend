import Employee from '../models/employee';
import Credentials from '../models/credentials'
import * as bcrypt from "bcrypt";

const saltRounds = process.env.SALT_ROUNDS || 10;
/**
 * Get all posts
 * @param req
 * @param res
 * @returns void
 */
//todo einpflegen der active-logik (was darf ein employee wenn er nicht active=true ist => guest)
export function getEmployees(req, res) {
  Employee.find().exec((err, employees) => {
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
      //Password will be hashed by the pre-save hook
      const newCredentials = new Credentials({password: hashedPassword, emailAddress:req.body.emailAddress});
      newCredentials.save((err, savedCred) => {
        if(err){
          if(err.message.indexOf('duplicate key error') > 0){
            res.sendStatus(412);
          }else{
            res.status(500).send(err);
          }
        }else{
          res.json(saved);
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
 * Anonymize a employee
 * @param req
 * @param res
 * @returns void
*/
export function anonymizeEmployee(req, res) {
  if(req.employee.role !== "ADMINISTRATOR") {
    res.status(403).end();
    return;
  }

  //anonymize (hash-value of emailaddress (unique constraint))
  Employee.findOne({ _id: {$eq: req.params.id} }).exec((err, employee) => {
    if(err){
      res.status(500).send(err);
    }else if(!employee){
      res.status(404).end();
    }else{
      employee.active = false;
      employee.firstName = "ANONYMIZED";
      employee.lastName = "ANONYMIZED";
      const salt = bcrypt.genSaltSync(saltRounds);
      const hashedEmail = bcrypt.hashSync(employee.emailAddress, salt);
      employee.emailAddress = hashedEmail + "@invalid";
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
  if(req.employee.role !== "ADMINISTRATOR") {
    res.status(403).end();
    return;
  }

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
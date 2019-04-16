import Project from '../models/project';
import Employee from '../models/employee';
import Contract from '../models/contract';
import Allocation from '../models/allocation';

/**
 * Get all posts
 * @param req
 * @param res
 * @returns void
 */
export async function getProjects(req, res) {
  const query = {};
  if(req.query.hasOwnProperty('projectManagerId')) {
    const projectManagerId = req.query.projectManagerId;
    query["projectManagerId"] = {$eq: projectManagerId};

    //Check whether projectmanager exists
    const emp = await Employee.findById(projectManagerId).exec();
    if(emp === null) {
      res.status(404).end();
      return;
    }

    const role = req.employee.role;
    let contractIds = [];
    let projectIds  = [];
    const
    if(role === "DEVELOPER") {
      await Contract.find({employeeId: req.employee.id}).forEach((err, contract) => {
        contractIds.push(contract.id);
      })
      await Allocation.find({contractId: { "$in" : contractIds}}).forEach((err, allocation) => {
        projectIds.push(allocation.projectId);
      })
    }
  }

  const fromDate = req.query.fromDate;
  const toDate = req.query.toDate;
  if(new Date(fromDate) > new Date(toDate)) {
    res.status(412).end();  //Precondition Failed, because it's something the user should fix.
    return;
  }

  Project.findInRange(fromDate, toDate).find(query).sort('-dateAdded').exec((err,projects) => {
    if (err) {
      res.status(500).send(err);
    }
    res.json(projects);
  })
}

/**
 * Save a post
 * @param req
 * @param res
 * @returns void
 */
export function addProject(req, res) {
  //todo: 403 if user is not administrator
  if (!req.body.hasOwnProperty('name')
      || !req.body.hasOwnProperty('ftePercentage')
      || !req.body.hasOwnProperty('startDate')
      || !req.body.hasOwnProperty('endDate')
      || !req.body.hasOwnProperty('projectManagerId')) {
    res.status(412).end();
    return
  }

  new Project(req.body).save((err, saved) => {
    if (err) {
      res.status(500).send(err);
    } else {
      res.status(201).json(saved);
    }
  });
}

/**
 * Get a single employee
 * @param req
 * @param res
 * @returns void
*/
export function getProject(req, res){
  //todo: return 403 if user is not allowed to get the project

  Project.findOne({ _id: {$eq:req.params.id} }).exec((err, project) => {
    if (err) {
      res.status(500).send(err);
    }else if(!project){
      res.status(404).end();
    }else{
      res.json(project);
    }
  });
}

/**
 * Delete a post
 * @param req
 * @param res
 * @returns void
*/
export function deleteProject(req, res) {
  //todo: 403 if user is not allowed to delete this project

  Project.findOne({ _id: {$eq: req.params.id} }).exec((err, project) => {
    if (err) {
      res.status(500).send(err);
    }else if(!project){
      res.status(404).end();
    }else{
      project.remove(() => {
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
//todo: Code project
export function updateProject(req, res){
  //todo: 403 if user is not allowed to update this project

  if(!req.body.hasOwnProperty('name')
      || !req.body.hasOwnProperty('ftePercentage')
      || !req.body.hasOwnProperty('startDate')
      || !req.body.hasOwnProperty('endDate')
      || !req.body.hasOwnProperty('projectManagerId')){
    res.status(412).end();
    return;
  }

  Project.findOne({ _id: {$eq: req.params.id} }).exec((err, employee) => {
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
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

  const projectIds = [];
  const contractIds = [];
  if(req.employee.role === "DEVELOPER") { //filter for only projects, that the dev is working on
    const contracts = await Contract.find({employeeId: req.employee._id});
    for(let i = 0; i < contracts.length; i++) {
      contractIds.push(contracts[i]._id);
    }
    const allocations = await Allocation.find({contractId: { "$in" : contractIds}});
    for(let i = 0; i < allocations.length; i++) {
      projectIds.push(allocations[i].projectId);
    }

    query["_id"] = { "$in": projectIds};
  }

  if(req.query.hasOwnProperty('projectManagerId')) {
    const projectManagerId = req.query.projectManagerId;
    query["projectManagerId"] = {$eq: projectManagerId};

    //Check whether projectmanager exists
    const emp = await Employee.findById(projectManagerId).exec();
    if(emp === null) {
      res.status(404).end();
      return;
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
  if(req.employee.role !== "ADMINISTRATOR") {
    res.status(403).end();
    return;
  }

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
export async function getProject(req, res){
  if(req.employee.role === "DEVELOPER") { //filter for only projects, that the dev is working on
    const contractIds =[];
    const allocations = await Allocation.find({projectId: req.params.id });
    for(let i = 0; i < allocations.length; i++) {
      contractIds.push(allocations[i].contractId);
    }
    let isForbidden=false;
    for(let i = 0; i < contractIds.length; i++) {
      const contract = await Contract.findOne({_id: contractIds[i]});
      if(contract.employeeId === req.employee._id) {
        isForbidden = true;
      }
    }
    if(!isForbidden) {
      res.status(403).end();
      return;
    }
  }

  Project.findOne({ _id: req.params.id }).exec((err, project) => {
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
  if(req.employee.role !== "ADMINISTRATOR") {
    res.status(403).end();
    return;
  }

  Project.findOne({ _id: req.params.id }).exec((err, project) => {
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
export async function updateProject(req, res) {
  if(req.employee.role === "DEVELOPER") {
    res.status(403).end();
    return;
  }
  if(req.employee.role === "PROJECTMANAGER") {
    const project = await Project.findOne({ _id: req.params.id });
    if(project.projectManagerId === req.employee.role) {
      res.status(403).end();
      return;
    }
  }

  if(!req.body.hasOwnProperty('name')
      || !req.body.hasOwnProperty('ftePercentage')
      || !req.body.hasOwnProperty('startDate')
      || !req.body.hasOwnProperty('endDate')
      || !req.body.hasOwnProperty('projectManagerId')){
    res.status(412).end();
    return;
  }

  Project.findOne({ _id: {$eq: req.params.id} }).exec((err, project) => {
    if(err){
      res.status(500).send(err);
    }else if(!project){
      res.status(404).end();
    }else{
      project.name = req.body.name;
      project.ftePercentage = req.body.ftePercentage;
      project.startDate = req.body.startDate;
      project.endDate = req.body.endDate;
      project.projectManagerId = req.body.projectManagerId;
      project.save((err, saved) => {
        if(err){
          res.status(500).send(err);
        }else{
          res.json(saved);
        }
      })
    }
  });
}
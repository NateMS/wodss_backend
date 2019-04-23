import Project from '../models/project';
import Employee from '../models/employee';
import Contract from '../models/contract';
import Allocation from '../models/allocation';

/**
 * Get all projects
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
    if(isNaN(projectManagerId)) {
      res.status(412).send("projectManagerId has to be a number!").end();
      return;
    }

    query["projectManagerId"] = {$eq: projectManagerId};

    //Check whether projectmanager exists
    const emp = await Employee.findById(projectManagerId).exec();
    if(emp === null) {
      res.status(404).send("The projectManager does not exist!").end();
      return;
    }
  }

  const a = new Date(req.query.fromDate), b = new Date(req.query.toDate);
  if(req.query.hasOwnProperty("fromDate") && isNaN(a.getTime())) {
    res.status(412).send("Invalid date format for fromDate!").end();
    return;
  } else if(req.query.hasOwnProperty("toDate") && isNaN(b.getTime())) {
    res.status(412).send("Invalid date format for toDate!").end();
    return;
  } else if(a >= b) {
    res.status(412).send("fromDate has to be older than toDate!").end();
    return;
  }

  Project.findInRange(req.query.fromDate, req.query.toDate).find(query).sort('-dateAdded').exec((err,projects) => {
    if (err) {
      res.status(500).send(err);
    }
    res.json(projects);
  })

}

/**
 * Save a project
 * @param req
 * @param res
 * @returns void
 */
//todo
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
//todo
export async function getProject(req, res){
  if(req.employee.role === "DEVELOPER") { //check whether dev is allowed to see the project
    const contractIds =[];
    const allocations = await Allocation.find({projectId: req.params.id });
    for(let i = 0; i < allocations.length; i++) {
      contractIds.push(allocations[i].contractId);
    }
    let isAllowed=false;
    for(let i = 0; i < contractIds.length; i++) {
      const contract = await Contract.findOne({_id: contractIds[i]});
      if(contract.employeeId === req.employee._id) {
        isAllowed = true;
      }
    }
    if(!isAllowed) {
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
 * Delete a project and all associated allocations
 * @param req
 * @param res
 * @returns void
*/
//todo
export async function deleteProject(req, res) {
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
      project.remove(async () => { //after removing the project, remove all associated allocations
        await Allocation.find({ projectId: req.params.id }).exec((err, allocation) => {
          if(!err) {
            allocation.remove(() => {})
          }
        })
        res.status(204).end(); //successfully deleted
      });
    }
  });
}

/**
 * Updates the specified employee
 * @param req
 * @param res
 */
//todo
export async function updateProject(req, res) {
  if(req.employee.role === "DEVELOPER") { //dev is not allowed
    res.status(403).end();
    return;
  }
  if(req.employee.role === "PROJECTMANAGER") { //projectmanager of his own projects is allowed
    const project = await Project.findOne({ _id: req.params.id });
    if(project.projectManagerId !== req.employee._id) {
      res.status(403).end();
      return;
    }
  }

  //Precondition Check
  if(!req.body.hasOwnProperty('name')
      || !req.body.hasOwnProperty('ftePercentage')
      || !req.body.hasOwnProperty('startDate')
      || !req.body.hasOwnProperty('endDate')
      || !req.body.hasOwnProperty('projectManagerId')){
    res.status(412).end();
    return;
  }

  //Date adjustment check (endDate in past or exact present is not allowed)
  if(req.body.endDate < new Date().getTime()) {
    res.status(412).end();
    return;
  } else { //check and adjust all influenced allocations
    await Allocation.find({ projectId: req.params.id }).exec(async (err, allocation) => {
      if (allocation.startDate > req.body.endDate) { //delete all future allocations which are beyond the project runtime
        allocation.remove();
      } else { //adjust endDate of all allocations to actual projectend's date
        allocation.endDate = req.body.endDate
        await allocation.save();
      }
    });
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
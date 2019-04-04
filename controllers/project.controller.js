import Project from '../models/project';

/**
 * Get all posts
 * @param req
 * @param res
 * @returns void
 */
export function getProjects(req, res) {
  // todo: if unauthenticated, return 401
  // todo: if token invalid, return 401
  // todo: 404 if project manager is not found

  const query = {};

  if(req.query.hasOwnProperty('projectManagerId')) {
    query["projectManagerId"] = {$eq: req.query.projectManagerId};
  }

  if(req.query.hasOwnProperty('startDate')){
    query["startDate"] = {$gte: req.query.startDate};
  }

  if(req.query.hasOwnProperty('endDate')){
    query["endDate"] = {$lte: req.query.endDate};
  }

  Project.find(query).exec((err,projects) => {
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
  //todo: 401 if unauthenticated or invalid token
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
  //todo: return 401 if unauthenticated or invalid token
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
  //todo: 401 if unauthenticated or invalid token
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
export function updateProject(req, res){
  //todo: 401 if unauthenticated or invalid token
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
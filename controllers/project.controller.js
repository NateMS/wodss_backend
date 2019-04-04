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

  const pmId = req.query.projectManagerId;
  if(pmId) {
    query["projectManagerId"] = {$eq: pmId};
  }

  const startDate = req.query.startDate;
  if(startDate){
    query["startDate"] = {$gte: startDate};
  }

  const endDate = req.query.endDate;
  if(endDate){
    query["endDate"] = {$lte: endDate};
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
  if (!req.body.name
      || !req.body.ftePercentage
      || !req.body.startDate
      || !req.body.endDate
      || !req.body.projectManagerId) {
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

//todo: add put-function
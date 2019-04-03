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
  // todo: add filter

  Project.find().sort('-dateAdded').exec((err, projects) => {
    if (err) {
      res.status(500).send(err);
    }
    res.json(projects);
  });
}

/**
 * Save a post
 * @param req
 * @param res
 * @returns void
 */
export function addProject(req, res) {
  if (!req.body.name || !req.body.ftePercentage || !req.body.startDate || !req.body.endDate || !req.body.projectManagerId) {
    res.status(412).end();
    return
  }

  new Project(req.body).save((err, saved) => {
    if (err) {
      res.status(500).send(err);
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

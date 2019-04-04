//todo: re-enable authentication using JWT
//const Authentication = require('./controllers/authentication');
import * as EmployeeController from './controllers/employee.controller';
import * as ProjectController from "./controllers/project.controller";

//const passportService = require('./services/passport');
//const passport = require('passport');

//const requireAuth = passport.authenticate('jwt', {session: false});
//const requireSignin = passport.authenticate('local', { session: false});

module.exports = function (app) {
  app.get('/', function(req, res){
    res.send({hi: 'there'})
  });

  /*app.get('/', requireAuth, function(req, res){
    res.send({hi: 'there'})
  });*/

  //app.post('/signin', requireSignin , Authentication.signin);

  //app.post('/signup', Authentication.signup);

  /**
   * Employee-Endpoint
   */
  app.get('/api/employee', EmployeeController.getEmployees);
  app.get('/api/employee/:id', EmployeeController.getEmployee);
  app.post('/api/employee', EmployeeController.addEmployee);
  app.delete('/api/employee/:id', EmployeeController.deleteEmployee);

  /**
   * Project-Endpoint
   */
  app.get('/api/project', ProjectController.getProjects);
  app.get('/api/project/:id', ProjectController.getProject);
  app.post('/api/project', ProjectController.addProject);
  app.delete('/api/project/:id', ProjectController.deleteProject)
};

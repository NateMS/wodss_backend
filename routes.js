//todo: re-enable authentication using JWT
import * as EmployeeController from './controllers/employee.controller';
import * as ProjectController from "./controllers/project.controller";
import * as ContractController from "./controllers/contract.controller";
import * as TokenController from "./controllers/token.controller";

const passport = require('passport');

const requireAuth = passport.authenticate('jwt', {session: false}, null);
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
  app.get('/api/employee', requireAuth, EmployeeController.getEmployees);
  app.get('/api/employee/:id', EmployeeController.getEmployee);
  app.post('/api/employee', EmployeeController.addEmployee);
  app.delete('/api/employee/:id', EmployeeController.deleteEmployee);
  app.put('/api/employee/:id', EmployeeController.updateEmployee);

  /**
   * Project-Endpoint
   */
  app.get('/api/project', ProjectController.getProjects);
  app.get('/api/project/:id', ProjectController.getProject);
  app.post('/api/project', ProjectController.addProject);
  app.delete('/api/project/:id', ProjectController.deleteProject);

  /**
   * Contract-Endpoint
   */
  app.get('/api/contract', ContractController.getContracts);
  app.get('/api/contract/:id', ContractController.getContract);
  app.post('/api/contract', ContractController.addContract);
  app.delete('/api/contract/:id', ContractController.deleteContract);
  app.put('/api/contract/:id', ContractController.updateContract);

  /**
   * JWT-Token-Endpoint
   */
  app.post('/token', TokenController.createToken);
  app.put('/token', TokenController.refreshToken);
};

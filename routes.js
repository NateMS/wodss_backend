//todo: re-enable authentication using JWT
import * as EmployeeController from './controllers/employee.controller';
import * as ProjectController from "./controllers/project.controller";
import * as ContractController from "./controllers/contract.controller";
import * as TokenController from "./controllers/token.controller";

require('./services/passport');
const passport = require('passport');

const requireAuth = passport.authenticate('jwt', {session: false}, null);

module.exports = function (app) {
  app.get('/', function(req, res){
    res.send({hi: 'there'})
  });

  /**
   * Employee-Endpoint
   */
  app.get('/api/employee', requireAuth, EmployeeController.getEmployees);
  app.get('/api/employee/:id', requireAuth, EmployeeController.getEmployee);
  app.post('/api/employee', requireAuth, EmployeeController.addEmployee);
  app.delete('/api/employee/:id', requireAuth, EmployeeController.deleteEmployee);
  app.put('/api/employee/:id', requireAuth, EmployeeController.updateEmployee);

  /**
   * Project-Endpoint
   */
  app.get('/api/project', requireAuth, ProjectController.getProjects);
  app.get('/api/project/:id', requireAuth, ProjectController.getProject);
  app.post('/api/project', requireAuth, ProjectController.addProject);
  app.delete('/api/project/:id', requireAuth, ProjectController.deleteProject);

  /**
   * Contract-Endpoint
   */
  app.get('/api/contract', requireAuth, ContractController.getContracts);
  app.get('/api/contract/:id', requireAuth, ContractController.getContract);
  app.post('/api/contract', requireAuth, ContractController.addContract);
  app.delete('/api/contract/:id', requireAuth, ContractController.deleteContract);
  app.put('/api/contract/:id', requireAuth, ContractController.updateContract);

  /**
   * JWT-Token-Endpoint
   */
  app.post('/token', TokenController.createToken);
  app.put('/token', TokenController.refreshToken);
};

//todo: re-enable authentication using JWT
import * as EmployeeController from './controllers/employee.controller';
import * as ProjectController from "./controllers/project.controller";
import * as ContractController from "./controllers/contract.controller";
import * as AllocationController from "./controllers/allocation.controller";
import * as TokenController from "./controllers/token.controller";

require('./services/passport');
const passport = require('passport');

const mapEmployees = require('./services/employee.mapper');

const requireAuth = passport.authenticate('jwt', {session: false}, null);

module.exports = function (app) {
  app.get('/', function(req, res){
    res.send({hi: 'there'})
  });

  /**
   * Employee-Endpoint
   */
  /*
  app.get('/api/employee', requireAuth, mapEmployees.map, EmployeeController.getEmployees);
  app.get('/api/employee/:id', requireAuth, mapEmployees.map, EmployeeController.getEmployee);
  app.post('/api/employee', requireAuth, mapEmployees.map, EmployeeController.addEmployee);
  app.delete('/api/employee/:id', requireAuth, mapEmployees.map, EmployeeController.deleteEmployee);
  app.put('/api/employee/:id', requireAuth, mapEmployees.map, EmployeeController.updateEmployee);
   */
  app.get('/api/employee',EmployeeController.getEmployees);
  app.get('/api/employee/:id', EmployeeController.getEmployee);
  app.post('/api/employee', EmployeeController.addEmployee);
  app.delete('/api/employee/:id', EmployeeController.deleteEmployee);
  app.put('/api/employee/:id', EmployeeController.updateEmployee);

  /**
   * Project-Endpoint
   */
  /*
  app.get('/api/project', requireAuth, mapEmployees.map, ProjectController.getProjects);
  app.get('/api/project/:id', requireAuth, mapEmployees.map, ProjectController.getProject);
  app.post('/api/project', requireAuth, mapEmployees.map, ProjectController.addProject);
  app.delete('/api/project/:id', requireAuth, mapEmployees.map, ProjectController.deleteProject);
   */

  app.get('/api/project', ProjectController.getProjects);
  app.get('/api/project/:id', ProjectController.getProject);
  app.post('/api/project', ProjectController.addProject);
  app.delete('/api/project/:id', ProjectController.deleteProject);

  /**
   * Contract-Endpoint
   */
  /*
  app.get('/api/contract', requireAuth, mapEmployees.map, ContractController.getContracts);
  app.get('/api/contract/:id', requireAuth, mapEmployees.map, ContractController.getContract);
  app.post('/api/contract', requireAuth, mapEmployees.map, ContractController.addContract);
  app.delete('/api/contract/:id', requireAuth, mapEmployees.map, ContractController.deleteContract);
  app.put('/api/contract/:id', requireAuth, mapEmployees.map, ContractController.updateContract);
   */
  app.get('/api/contract', ContractController.getContracts);
  app.get('/api/contract/:id', ContractController.getContract);
  app.post('/api/contract', ContractController.addContract);
  app.delete('/api/contract/:id', ContractController.deleteContract);
  app.put('/api/contract/:id', ContractController.updateContract);

  /**
   * Allocation-Endpoint
   */
  /*
  app.get('/api/allocation', requireAuth, mapEmployees.map, AllocationController.getAllocations);
  app.get('/api/allocation/:id', requireAuth, mapEmployees.map, AllocationController.getAllocation);
  app.get('/api/allocation', requireAuth, mapEmployees.map, AllocationController.addAllocation);
   */
  app.get('/api/allocation', AllocationController.getAllocations);
  app.get('/api/allocation/:id', AllocationController.getAllocation);
  app.get('/api/allocation', AllocationController.addAllocation);

  /**
   * JWT-Token-Endpoint
   */
  app.post('/token', TokenController.createToken);
  //PUT on /token requires Auth, because it's only accessible if a token exists that can be renewed
  app.put('/token', requireAuth, TokenController.refreshToken);
};

//todo: re-enable authentication using JWT
import * as EmployeeController from './controllers/employee.controller';
import * as ProjectController from "./controllers/project.controller";
import * as ContractController from "./controllers/contract.controller";
import * as AllocationController from "./controllers/allocation.controller";
import * as TokenController from "./controllers/token.controller";
import * as responseTypeJson from "./services/responseTypeJson";

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
  app.get('/api/employee',requireAuth, mapEmployees.map, responseTypeJson.setResponseType, EmployeeController.getEmployees);
  app.get('/api/employee/:id',requireAuth, mapEmployees.map, responseTypeJson.setResponseType, EmployeeController.getEmployee);
  app.post('/api/employee', requireAuth, mapEmployees.map, responseTypeJson.setResponseType, EmployeeController.addEmployee);
  app.delete('/api/employee/:id', requireAuth, mapEmployees.map, responseTypeJson.setResponseType, EmployeeController.anonymizeEmployee);
  app.put('/api/employee/:id', requireAuth, mapEmployees.map, responseTypeJson.setResponseType, EmployeeController.updateEmployee);

  /**
   * Project-Endpoint
   */
  app.get('/api/project', requireAuth, mapEmployees.map, responseTypeJson.setResponseType, ProjectController.getProjects);
  app.get('/api/project/:id', requireAuth, mapEmployees.map, responseTypeJson.setResponseType, ProjectController.getProject);
  app.post('/api/project', requireAuth, mapEmployees.map, responseTypeJson.setResponseType, ProjectController.addProject);
  app.delete('/api/project/:id', requireAuth, mapEmployees.map, responseTypeJson.setResponseType, ProjectController.deleteProject);
  app.put('/api/project/:id', requireAuth, mapEmployees.map, responseTypeJson.setResponseType, ProjectController.updateProject);

  /**
   * Contract-Endpoint
   */
  app.get('/api/contract', requireAuth, mapEmployees.map, responseTypeJson.setResponseType, ContractController.getContracts);
  app.get('/api/contract/:id', requireAuth, mapEmployees.map, responseTypeJson.setResponseType, ContractController.getContract);
  app.post('/api/contract', requireAuth, mapEmployees.map, responseTypeJson.setResponseType, ContractController.addContract);
  app.delete('/api/contract/:id', requireAuth, mapEmployees.map, responseTypeJson.setResponseType, ContractController.deleteContract);
  app.put('/api/contract/:id', requireAuth, mapEmployees.map, responseTypeJson.setResponseType, ContractController.updateContract);

  /**
   * Allocation-Endpoint
   */
  app.get('/api/allocation', requireAuth, mapEmployees.map, responseTypeJson.setResponseType, AllocationController.getAllocations);
  app.get('/api/allocation/:id', requireAuth, mapEmployees.map, responseTypeJson.setResponseType, AllocationController.getAllocation);
  app.post('/api/allocation', requireAuth, mapEmployees.map, responseTypeJson.setResponseType, AllocationController.addAllocation);
  app.delete('/api/allocation/:id', requireAuth, mapEmployees.map, responseTypeJson.setResponseType, AllocationController.deleteAllocation);
  app.put('/api/allocation/:id', requireAuth, mapEmployees.map, responseTypeJson.setResponseType, AllocationController.updateAllocation);

  /**
   * JWT-Token-Endpoint
   */
  app.post('/api/token', responseTypeJson.setResponseType, TokenController.createToken);
  //PUT on /token requires Auth, because it's only accessible if a token exists that can be renewed
  app.put('/api/token', requireAuth, responseTypeJson.setResponseType, TokenController.refreshToken);
};

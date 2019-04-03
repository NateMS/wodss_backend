//todo: re-install authentication using JWT
//const Authentication = require('./controllers/authentication');
import * as EmployeeController from './controllers/employee.controller';

const Blog = require('./controllers/blogpost');
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

  app.post('/posts', Blog.posts);
  app.get('/posts', Blog.getPosts);
  app.get('/posts/:id', Blog.getPost);
  app.delete('/posts/:id', Blog.deletePost);

  // Get all Posts
  app.get('/employee', EmployeeController.getEmployees);

  // Get one post by id
  app.get('/employee/:id', EmployeeController.getEmployee);

  // Add a new Post
  app.post('/employee', EmployeeController.addEmployee);

  // Delete a employee by id
  app.delete('/employee/:id', EmployeeController.deleteEmployee);

};

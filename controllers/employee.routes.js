import { Router } from 'express';
import * as EmployeeController from '../controllers/employee.controller';
const router = new Router();

// Get all Posts
router.route('/posts').get(EmployeeController.getEmployees);

/*
// Get one post by cuid
//router.route('/posts/:cuid').get(EmployeeController.getPost);
*/

// Add a new Post
router.route('/posts').post(EmployeeController.addEmployee);

/*
// Delete a post by cuid
//router.route('/posts/:cuid').delete(EmployeeController.deletePost);
*/

export default router;

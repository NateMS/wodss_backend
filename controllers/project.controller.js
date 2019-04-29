import Project from '../models/project';
import Employee from '../models/employee';
import Contract from '../models/contract';
import Allocation from '../models/allocation';
import * as Role from '../models/roles'

/**
 * Get all projects
 * @param req
 * @param res
 * @returns void
 */
export async function getProjects(req, res) {
    const query = {};
    const projectIds = [];
    const contractIds = [];
    if (req.employee.role === Role.DEVELOPER) { //filter for only projects, that the dev is working on
        const contracts = await Contract.find({employeeId: {$eq: req.employee._id}});
        for (let i = 0; i < contracts.length; i++) { //contracts of the employee
            contractIds.push(contracts[i]._id);
        }
        const allocations = await Allocation.find({contractId: {$in: contractIds}}); //get allocations using the contracts of an employee
        for (let i = 0; i < allocations.length; i++) {
            projectIds.push(allocations[i].projectId);
        }

        query["_id"] = {$in: projectIds};
    }

    if (req.query.hasOwnProperty('projectManagerId')) {
        const projectManagerId = req.query.projectManagerId;
        if (isNaN(projectManagerId)) { //prevent 500
            res.status(412).send("projectManagerId has to be a number!").end();
            return;
        }

        query["projectManagerId"] = {$eq: projectManagerId};

        //Check whether projectmanager exists
        const emp = await Employee.findById({$eq: projectManagerId}).exec();
        if (emp === null) {
            res.status(404).send("The projectManager does not exist!").end();
            return;
        }
    }

    //check the rime-range
    const a = new Date(req.query.fromDate);
    const b = new Date(req.query.toDate);
    if (req.query.hasOwnProperty("fromDate") && isNaN(a.getTime())) {
        res.status(412).send("Invalid date format for fromDate!").end();
        return;
    } else if (req.query.hasOwnProperty("toDate") && isNaN(b.getTime())) {
        res.status(412).send("Invalid date format for toDate!").end();
        return;
    } else if (a >= b) {
        res.status(412).send("fromDate has to be older than toDate!").end();
        return;
    }

    Project.findInRange(req.query.fromDate, req.query.toDate).find(query).sort('-dateAdded').exec((err, projects) => {
        if (err) {
            res.status(500).send(err);
        }
        res.json(projects);
    })
}

/**
 * Save a project
 * @param req
 * @param res
 * @returns void
 */
export async function addProject(req, res) {
    if (req.employee.role !== Role.ADMINISTRATOR) {
        res.status(403).send("No admin rights!").end();
        return;
    }

    if (!req.body.hasOwnProperty('name')
        || !req.body.hasOwnProperty('ftePercentage')
        || !req.body.hasOwnProperty('startDate')
        || !req.body.hasOwnProperty('endDate')
        || !req.body.hasOwnProperty('projectManagerId')) {
        res.status(412).send("Missing property (ftePercentage, startDate, endDate or projectManagerId").end();
        return;
    }

    //Check whether projectmanager exists
    const emp = await Employee.findById({$eq: req.body.projectManagerId}).exec();
    if (emp === null) {
        res.status(404).send("The projectManager does not exist!").end();
        return;
    } else {
        if (emp.role !== Role.PROJECTMANAGER) { //is actually projectmanager
            res.status(412).send("The referenced employee is not a projectManager!").end();
            return;
        }
        if (!emp.active) { //and actually active
            res.status(412).send("The projectManager is not active!").end();
            return;
        }
    }

    //check time-range
    const a = new Date(req.body.startDate), b = new Date(req.body.endDate);
    if (req.body.hasOwnProperty("startDate") && isNaN(a.getTime())) {
        res.status(412).send("Invalid date format for startDate!").end();
        return;
    } else if (req.body.hasOwnProperty("endDate") && isNaN(b.getTime())) {
        res.status(412).send("Invalid date format for endDate!").end();
        return;
    } else if (a >= b) {
        res.status(412).send("startDate has to be older than endDate!").end();
        return;
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
 * Get a single project
 * @param req
 * @param res
 * @returns void
 */
export async function getProject(req, res) {
    if (isNaN(req.params.id)) {
        res.status(412).send("id param has to be a number!").end();
        return;
    }

    if (req.employee.role === Role.DEVELOPER) { //check whether dev is allowed to see the project
        const contractIds = [];
        const allocations = await Allocation.find({projectId: {$eq: req.params.id}});
        for (let i = 0; i < allocations.length; i++) {
            contractIds.push(allocations[i].contractId);
        }

        let isAllowed = false;
        for (let i = 0; i < contractIds.length; i++) {
            const contract = await Contract.findOne({_id: {$eq: contractIds[i]}});
            if (contract.employeeId === req.employee._id) {
                isAllowed = true;
            }
        }
        if (!isAllowed) {
            res.status(403).send("You are not authorized to see this project!").end();
            return;
        }
    }

    Project.findOne({_id: {$eq: req.params.id}}).exec((err, project) => {
        if (err) {
            res.status(500).send(err);
        } else if (!project) {
            res.status(404).send("This project does not exist!").end();
        } else {
            res.json(project);
        }
    });
}

/**
 * Delete a project and all associated allocations
 * @param req
 * @param res
 * @returns void
 */
export async function deleteProject(req, res) {
    if (isNaN(req.params.id)) {
        res.status(412).send("id param has to be a number!").end();
        return;
    }

    if (req.employee.role !== Role.ADMINISTRATOR) {
        res.status(403).send("No admin rights!").end();
        return;
    }

    const a = await Project.deleteOne({_id: {$eq: req.params.id}}).exec();
    if (a.deletedCount === 0) { //not found
        res.status(404).send("Project not found!").end();
    } else { //deleted, cascade delete on referenced allocations
        await Allocation.deleteMany({projectId: {$eq: req.params.id}}).exec();
        res.status(204).end(); //successfully deleted
    }
}

/**
 * Updates the specified project
 * @param req
 * @param res
 */
export async function updateProject(req, res) {
    if (isNaN(req.params.id)) {
        res.status(412).send("id param has to be a number!").end();
        return;
    }

    if (req.employee.role === Role.DEVELOPER) { //dev is not allowed
        res.status(403).send("Missing permissions!").end();
        return;
    }
    if (req.employee.role === Role.PROJECTMANAGER) { //projectmanager of his own projects is allowed
        const project = await Project.findOne({_id: {$eq: req.params.id}});
        if (!project) { //does the project exist?
            res.status(404).send("Project not found!").end();
            return;
        } else if (project.projectManagerId !== req.employee._id) { //is the authenticated user the projectmanager?
            res.status(403).end();
            return;
        }
    }

    //Precondition Check
    if (!req.body.hasOwnProperty('name')
        || !req.body.hasOwnProperty('ftePercentage')
        || !req.body.hasOwnProperty('startDate')
        || !req.body.hasOwnProperty('endDate')
        || !req.body.hasOwnProperty('projectManagerId')) {
        res.status(412).send("Missing property (ftePercentage, startDate, endDate or projectManagerId").end();
        return;
    }

    //Check whether the referenced projectmanager exists and has the role projectmanager
    const emp = await Employee.findOne({_id: {$eq: req.body.projectManagerId}}).exec();
    if (!emp) {
        res.status(404).send("Projectmanager does not exist!").end();
        return;
    } else {
        if (emp.role !== Role.PROJECTMANAGER) {
            res.status(412).send("Referenced projectmanager is not of role PROJECTMANAGER!").end();
            return;
        }
    }

    //check time-range
    const a = new Date(req.body.startDate), b = new Date(req.body.endDate);
    if (req.body.hasOwnProperty("startDate") && isNaN(a.getTime())) {
        res.status(412).send("Invalid date format for startDate!").end();
        return;
    } else if (req.body.hasOwnProperty("endDate") && isNaN(b.getTime())) {
        res.status(412).send("Invalid date format for endDate!").end();
        return;
    } else if (a >= b) {
        res.status(412).send("startDate has to be older than endDate!").end();
        return;
    }

    //Date adjustment check (endDate in past or exact present is not allowed)
    if (new Date(req.body.endDate).getTime() < new Date().getTime()) {
        res.status(412).send("EndDate has to be in future!").end();
        return;
    } else { //check and adjust all influenced allocations
        //delete all future allocations which are beyond the project runtime
        await Allocation.deleteMany({$and: [{projectId: {$eq: req.params.id}}, {startDate: {$gt: req.body.endDate}}]}).exec();

        //adjust endDate of all allocations to actual projectend's date
        await Allocation.updateMany(
            {$and: [
                {projectId: {$eq: req.params.id}},
                {startDate: {$lte: req.body.endDate}},
                {endDate: {$gt: req.body.endDate}}
            ]},
            {endDate: req.body.endDate}).exec();
    }

    Project.findOne({_id: {$eq: req.params.id}}).exec((err, project) => {
        if (err) {
            res.status(500).send(err);
        } else if (!project) {
            res.status(404).send("Project not found!").end();
        } else { //actually adjust
            project.name = req.body.name;
            project.ftePercentage = req.body.ftePercentage;
            project.startDate = req.body.startDate;
            project.endDate = req.body.endDate;
            project.projectManagerId = req.body.projectManagerId;
            project.save((err, saved) => {
                if (err) {
                    res.status(500).send(err);
                } else {
                    res.json(saved);
                }
            })
        }
    });
}
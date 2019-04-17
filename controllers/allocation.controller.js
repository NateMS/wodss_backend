import Allocation from '../models/allocation';
import Employee from '../models/employee';
import Project from '../models/project';
import Contract from "../models/contract";

/**
 * Get all allocations
 * @param req
 * @param res
 * @returns void
 */
export async function getAllocations(req, res) {
    const query = {};
    if(req.query.hasOwnProperty('projectId')){
        query["projectId"] = {$eq: req.query.projectId};
    }

    //Check whether the project or employee actually exists
    await Employee.findOne({ _id: req.query.employeeId }).exec((err, e) => {
        if(err) {
            res.status(500).send(err);
        } else if(!e) {
            res.status(404).end();
        }
        return;
    });
    await Project.findOne({ _id: req.query.projectId }).exec((err, p) => {
        if(err) {
            res.status(500).send(err);
        } else if(!p) {
            res.status(404).end();
        }
        return;
    });

    const fromDate = req.query.fromDate;
    const toDate   = req.query.toDate;
    if(new Date(fromDate) > new Date(toDate)) {
        res.status(412).end();  //Precondition Failed, because it's something the user should fix.
        return;
    }

    Allocation.findInRange(fromDate, toDate).find(query).sort('-dateAdded').exec(async (err, allocations) => {
        if(req.query.hasOwnProperty('employeeId')) { //remove all allocations from employees other than employee X
            let contractIds = [];
            let ids = allocations.map(a => a.contractId);
            for(let i = 0; i < ids.length; i++) {
                await Contract.find({employeeId: req.query.employeeId }).exec((err, c) => {
                    contractIds.push(c._id);
                })
            }
            allocations.filter(a => contractIds.includes(a.contractId));
        }

        if(req.employee.role === "DEVELOPER") {
            let contractIds = [];
            for(let i = 0; i < contractIds.length; i++) {
                await Contract.find({employeeId: req.query.employeeId }).exec((err, c) => {
                    contractIds.push(c._id);
                })
            }
            allocations.filter(a => contractIds.includes(a.contractId));
        }
        if (err) {
            res.status(500).send(err);
        }
        res.json(allocations);
    });
}

/**
 * Save a new allocation
 * @param req
 * @param res
 * @returns void
 */
export function addAllocation(req, res) {
    if (!req.body.hasOwnProperty('startDate')
        || !req.body.hasOwnProperty('endDate')
        || !req.body.hasOwnProperty('pensumPercentage')
        || !req.body.hasOwnProperty('contractId')
        || !req.body.hasOwnProperty('projectId')) {

        res.status(412).end();
        return;
    }

    const newAllocation = new Allocation(req.body);
    newAllocation.save((err, saved) => {
        if (err) {
            res.status(500).send(err);
        } else {
            res.json(saved);
        }
    });
}

/**
 * Get a single allocation
 * @param req
 * @param res
 * @returns void
 */
export function getAllocation(req, res) {
    //todo: return 401 if unauthenticated or invalid token
    //todo: return 403 if missing permission due to role

    Allocation.findOne({ _id: {$eq: req.params.id} }).exec((err, allocation) => {
        if (err) {
            res.status(500).send(err);
        }else if(!allocation){
            res.status(404).end();
        }else{
            res.json(allocation);
        }
    });
}

/**
 * Delete an allocation
 * @param req
 * @param res
 * @returns void
 */
export function deleteAllocation(req, res) {
    //todo: return 401 if unauthenticated or invalid token
    //todo: return 403 if missing permission due to role

    Allocation.findOne({ _id: {$eq: req.params.id} }).exec((err, allocation) => {
        if (err) {
            res.status(500).send(err);
        }else if(!allocation){
            res.status(404).end();
        }else {
            allocation.remove(() => {
                res.status(204).end();
            });
        }
    });
}


/**
 * Updates the specified allocation
 * @param req
 * @param res
 */
export function updateAllocation(req, res){
    //todo: 401 if unauthenticated or invalid token
    //todo: 403 if user is not allowed to update this contract

    if (!req.body.hasOwnProperty('startDate')
        || !req.body.hasOwnProperty('endDate')
        || !req.body.hasOwnProperty('pensumPercentage')
        || !req.body.hasOwnProperty('contractId')
        || !req.body.hasOwnProperty('projectId')) {

        res.status(412).send(req.body);
        return;
    }

    Allocation.findOne({ _id: {$eq: req.params.id} }).exec((err, allocation) => {
        if(err){
            res.status(500).send(err);
        }else if(!allocation){
            res.status(404).end();
        }else{
            allocation.startDate = req.body.startDate;
            allocation.endDate = req.body.endDate;
            allocation.pensumPercentage = req.body.pensumPercentage;
            allocation.contractId = req.body.contractId;
            allocation.projectId = req.body.projectId;
            allocation.save((err, saved) => {
                if(err){
                    res.status(500).send(err);
                }else{
                    res.json(saved);
                }
            })
        }
    });
}
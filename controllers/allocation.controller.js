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

    //Check whether the employee actually exists
    if(req.employee.role !== "DEVELOPER" && req.query.hasOwnProperty('employeeId')) {
        const employee = await Employee.findOne({_id: req.query.employeeId});
        if(!employee) {
            res.status(404).end();
            return;
        }
    }

    //Check whether the project actually exists
    if(req.query.hasOwnProperty('projectId')) {
        const project = await Project.findOne({_id: req.query.projectId});
        if(!project) {
            res.status(404).end();
            return;
        }
    }

    const fromDate = req.query.fromDate;
    const toDate   = req.query.toDate;
    if(new Date(fromDate) > new Date(toDate)) {
        res.status(412).end();  //Precondition failed
        return;
    }

    Allocation.findInRange(fromDate, toDate).find(query).sort('-dateAdded').exec(async (err, allocations) => {
        if (err) res.status(500).send(err).end();

        let contractIds = [];
        if(req.employee.role === "DEVELOPER") {
            let contracts = await Contract.find({employeeId: req.employee._id}).exec();
            for(const i in contracts) {
                contractIds.push(contracts[i]._id);
            }

            allocations = allocations.filter(function(allocation) {
                return contractIds.includes(allocation.contractId);
            });

        } else if(req.query.hasOwnProperty('employeeId')) {
            let contractIds = [];
            let ids = [...new Set(allocations.map(a => a.contractId))]; //alle contractIds der bisherigen allocations
            for(let i = 0; i < ids.length; i++) {
                let contract = await Contract.findOne({_id: ids[i]}).exec();
                if(contract.employeeId == req.query.employeeId) {
                    contractIds.push(contract._id);
                }
            }

            allocations = allocations.filter(function(allocation) {
                return contractIds.includes(allocation.contractId);
            });
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
export async function addAllocation(req, res) {
    if(req.employee.role === "DEVELOPER") {
        res.status(403).end();
        return;
    }

    if (!req.body.hasOwnProperty('startDate')
        || !req.body.hasOwnProperty('endDate')
        || !req.body.hasOwnProperty('pensumPercentage')
        || !req.body.hasOwnProperty('contractId')
        || !req.body.hasOwnProperty('projectId')) {

        res.status(412).end();
        return;
    }

    //Check whether the project actually exists
    const project = await Project.findOne({_id: req.body.projectId});
    if(!project) {
        res.status(404).end();
        return;
    } else { //only loading the project once
        if(req.employee.role === "PROJECTMANAGER") {
            if(project.projectManagerId !== req.employee._id) {
                res.status(403).end();
                return;
            }
        }
    }

    //Check whether the contract actually exists
    const contract = await Contract.findOne({_id: req.body.contractId});
    if(!contract) {
        res.status(404).end();
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
    Allocation.findOne({ _id: {$eq: req.params.id} }).exec(async (err, allocation) => {
        let isAllowed=false;
        if(req.employee.role === "DEVELOPER") {
            let contracts = await Contract.find({employeeId: req.employee._id}).exec();
            for(const i in contracts) {
                if(allocation.contractId == contracts[i]) {
                    isAllowed=true;
                    break;
                }
            }
        }

        if (err) {
            res.status(500).send(err);
        }else if(!isAllowed) {
            res.status(403).end();
        } else if(!allocation){
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
    if(req.employee.role === "DEVELOPER") {
        res.status(403).end();
        return;
    }

    Allocation.findOne({ _id: {$eq: req.params.id} }).exec(async (err, allocation) => {
        let isAllowed=false;
        if(req.employee.role === "DEVELOPER") {
            let contracts = await Contract.find({employeeId: req.employee._id}).exec();
            for (const i in contracts) {
                if (allocation.contractId == contracts[i]) {
                    isAllowed = true;
                    break;
                }
            }
        }

        if (err) {
            res.status(500).send(err);
        }else if(!isAllowed) {
            res.status(403).end();
        } else if(!allocation){
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
    if(req.employee.role === "DEVELOPER") {
        res.status(403).end();
        return;
    }

    if (!req.body.hasOwnProperty('startDate')
        || !req.body.hasOwnProperty('endDate')
        || !req.body.hasOwnProperty('pensumPercentage')
        || !req.body.hasOwnProperty('contractId')
        || !req.body.hasOwnProperty('projectId')) {

        res.status(412).send(req.body);
        return;
    }

    Allocation.findOne({ _id: {$eq: req.params.id} }).exec(async (err, allocation) => {
        let isAllowed=false;
        if(req.employee.role === "DEVELOPER") {
            let contracts = await Contract.find({employeeId: req.employee._id}).exec();
            for (const i in contracts) {
                if (allocation.contractId == contracts[i]) {
                    isAllowed = true;
                    break;
                }
            }
        }

        if(err){
            res.status(500).send(err);
        }else if(!isAllowed) {
            res.status(403).end();
        } else if(!allocation){
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
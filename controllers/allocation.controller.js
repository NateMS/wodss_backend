import Allocation from '../models/allocation';
import Employee from '../models/employee';
import Project from '../models/project';
import Contract from "../models/contract";
import * as Role from '../models/roles';

/**
 * Get all allocations
 * @param req
 * @param res
 * @returns void
 */
export async function getAllocations(req, res) {
    const query = {};

    //check whether a valid projectId & query it
    if(req.query.hasOwnProperty('projectId')){
        query["projectId"] = {$eq: req.query.projectId};
    }

    //Check whether the employee actually exists
    if(req.query.hasOwnProperty('employeeId')) {
        const employee = await Employee.findOne({_id: {$eq: req.query.employeeId}});
        if(!employee) {
            res.status(404).end();
            return;
        }
    }

    //Check whether the project actually exists
    if(req.query.hasOwnProperty('projectId')) {
        const project = await Project.findOne({_id: {$eq: req.query.projectId}});
        if(!project) {
            res.status(404).end();
            return;
        }
    }

    //check the query's time-range
    const a = new Date(req.query.fromDate), b = new Date(req.query.toDate);
    if(req.query.hasOwnProperty("fromDate") && isNaN(a.getTime())) {
        res.status(412).send("Invalid date format for fromDate!").end();
        return;
    } else if(req.query.hasOwnProperty("toDate") && isNaN(b.getTime())) {
        res.status(412).send("Invalid date format for toDate!").end();
        return;
    } else if(a >= b) {
        res.status(412).send("fromDate has to be older than toDate!").end();
        return;
    }

    Allocation.findInRange(req.query.fromDate, req.query.toDate).find(query).sort('-dateAdded').exec(async (err, allocations) => {
        if (err) res.status(500).end();

        let contractIds = [];
        if(req.employee.role === Role.DEVELOPER) { //if dev than check for all his contracts and collect the associated allocations
            let contracts = await Contract.find({employeeId: {$eq: req.employee._id}}).exec();
            for(const i in contracts) {
                contractIds.push(contracts[i]._id);
            }

            allocations = allocations.filter(function(allocation) {
                return contractIds.includes(allocation.contractId);
            });

        } else if(req.query.hasOwnProperty('employeeId')) { //check for all the employee's contracts and collect the associated allocations
            let contractIds = [];
            let ids = [...new Set(allocations.map(a => a.contractId))]; //alle contractIds der bisherigen allocations
            for(let i = 0; i < ids.length; i++) {
                let contract = await Contract.findOne({_id: ids[i]}).exec();
                // WICHTIG: Hier ist der Vergleich mit == korrekt, da nur die Werte verglichen werden dürfen.
                if(contract && contract.employeeId == req.query.employeeId) {
                    contractIds.push(contract._id);
                }
            }

            //remove all allocations, that do not belong to a valid (right to see or explicit filter) contract
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
    if(req.employee.role === Role.DEVELOPER) { //insufficient permissions
        res.status(403).end();
        return;
    }

    if (!req.body.hasOwnProperty('contractId')){
        res.status(412).send("No contract found.");
    }
    if (!req.body.hasOwnProperty('startDate') || !req.body.startDate
        || !req.body.hasOwnProperty('endDate') || !req.body.endDate
        || !req.body.hasOwnProperty('pensumPercentage') || isNaN(req.body.pensumPercentage)
        || !req.body.hasOwnProperty('projectId')) {

        res.status(412).send("Missing property (startDate, endDate, pensumPercentage, contractId or projectId)").end();
        return;
    }

    const project = await Project.findOne({_id: {$eq: req.body.projectId}});
    if(!project) {
        res.status(404).end();
        return;
    } else { //only loading the project once
        if(req.employee.role === Role.PROJECTMANAGER) {
            if(project.projectManagerId !== req.employee._id) {
                res.status(403).end();
                return;
            }
        }
    }

    const a = new Date(req.body.startDate), b = new Date(req.body.endDate);
    if(req.body.hasOwnProperty("startDate") && isNaN(a.getTime())) {
        res.status(412).send("Invalid date format for startDate!").end();
        return;
    } else if(req.body.hasOwnProperty("endDate") && isNaN(b.getTime())) {
        res.status(412).send("Invalid date format for endDate!").end();
        return;
    } else if(a >= b) {
        res.status(412).send("startDate has to be older than endDate!").end();
        return;
    }

    if(isNaN(req.body.pensumPercentage)) {
        res.status(412).send("pensumPercentage has to be a number!").end();
        return;
    }
    let contractTotalPercentage = 0;
    const contract = await Contract.findOne({_id: {$eq: req.body.contractId}}); //get the allocation's contract
    if(!contract) {
        res.status(404).end();
        return;
    } else { //is the contract time-range valid for that allocation time-range?
        const startDate = new Date(req.body.startDate);
        const endDate   = new Date(req.body.endDate);
        if(!(contract.startDate <= startDate && contract.endDate >= endDate)) {
            res.status(412).send("Invalid time-range for the chosen contract!").end();
            return;
        }
        contractTotalPercentage = contract.pensumPercentage;
    }

    //check for overbooking
    const allocations = await Allocation.find({contractId: {$eq: req.body.contractId}}).exec();
    let currentSum = 0;
    for(let i in allocations) {
        currentSum += parseInt(allocations[i].pensumPercentage);
    }
    let nextTotalPensum = parseInt(req.body.pensumPercentage) + currentSum; //new total pensum with the new allocation
    if(nextTotalPensum > contractTotalPercentage) {
        res.status(412).send("Overbooking of this contract!" + currentSum + ", " + nextTotalPensum + ", " + contractTotalPercentage).end();
        return;
    }

    //actually try to create allocation (only integers!)
    req.body.pensumPercentage = Math.floor(req.body.pensumPercentage);
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
    //Check whether the contract actually exists

    Allocation.findOne({ _id: {$eq: req.params.id} }).exec(async (err, allocation) => {
        if(err) {
            res.status(500).send(err);
        } else {
            if(!allocation) {
                res.status(404).send("Allocation not found!").end();
            } else {
                let isAllowed=false;

                if(req.employee.role === Role.DEVELOPER) { //check whether the dev owns this allocation's contract (set the isAllowed bool-Flag)
                    let contracts = await Contract.find({employeeId: {$eq: req.employee._id}}).exec();
                    for(const i in contracts) {
                        if(allocation.contractId === contracts[i]._id) {
                            isAllowed=true;
                            break;
                        }
                    }
                } else { //all other roles have sufficient permissions
                    isAllowed=true;
                }

                if(!isAllowed) {
                    res.status(403).end();
                } else {
                    res.json(allocation);
                }
            }
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
    //Check whether dev (prevent db call)
    if(req.employee.role === Role.DEVELOPER) {
        res.status(403).end();
        return;
    }

    Allocation.findOne({ _id: {$eq: req.params.id} }).exec(async (err, allocation) => {
        if (err) {
            res.status(500).send(err);
            return;
        } else if(!allocation) {
            res.status(404).end();
            return;
        }

        let isAllowed=false;
        if(req.employee.role === Role.PROJECTMANAGER) { //check whether the current user is the projectmananger of the allocation's project
            let projects = await Project.find({projectManagerId: {$eq: req.employee._id}}).exec();
            for(let i in projects) {
                if(allocation.projectId === projects[i]._id) {
                    isAllowed = true;
                    break;
                }
            }
        } else if(req.employee.role === Role.ADMINISTRATOR) {
            isAllowed = true;
        }

        if(!isAllowed) {
            res.status(403).end();
        } else {
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
export async function updateAllocation(req, res){
    //Check whether dev (because no permissions)
    if(req.employee.role === Role.DEVELOPER) {
        res.status(403).end();
        return;
    }

    //check all fields to be present
    if (!req.body.hasOwnProperty('startDate') || !req.body.startDate
        || !req.body.hasOwnProperty('endDate') || !req.body.endDate
        || !req.body.hasOwnProperty('pensumPercentage') || isNaN(req.body.pensumPercentage)
        || !req.body.hasOwnProperty('contractId')
        || !req.body.hasOwnProperty('projectId')) {

        res.status(412).send("Missing property (startDate, endDate, pensumPercentage, contractId or projectId)").end();
        return;
    }

    let allocation = await Allocation.findOne({ _id: {$eq: req.params.id} }).exec();
    if(!allocation) {
        res.status(404).send("Allocation does not exist!").end();
        return;
    } else {
        if(req.employee.role === Role.PROJECTMANAGER) { //check whether the current user is the projectmananger of the allocation's project
            let projects = await Project.find({projectManagerId: {$eq: req.employee._id}}).exec();
            let isAllowed = false;
            for(let i in projects) {
                if(projects[i]._id === allocation.projectId) {
                    isAllowed = true;
                    break;
                }
            }
            if(!isAllowed) {
                res.status(403).send("No permissions for the current project of this allocation!").end();
                return;
            }
        }
    }

    const project = await Project.findOne({_id: {$eq: req.body.projectId}});
    if(!project) {
        res.status(404).send("Project does not exist!").end();
        return;
    } else { //only loading the project once
        if(req.employee.role === Role.PROJECTMANAGER) {
            if(project.projectManagerId !== req.employee._id) {
                res.status(403).end();
                return;
            }
        }
    }

    //check startDate & endDate to be from valid format & range
    const a = new Date(req.body.startDate), b = new Date(req.body.endDate);
    if(req.body.hasOwnProperty("startDate") && isNaN(a.getTime())) {
        res.status(412).send("Invalid date format for startDate!").end();
        return;
    } else if(req.body.hasOwnProperty("endDate") && isNaN(b.getTime())) {
        res.status(412).send("Invalid date format for endDate!").end();
        return;
    } else if(a >= b) {
        res.status(412).send("startDate has to be older than endDate!").end();
        return;
    }

    //Check whether the contract actually exists
    if(isNaN(req.body.pensumPercentage)) {
        res.status(412).send("pensumPercentage has to be a number!").end();
        return;
    }
    let contractTotalPercentage = 0;
    const contract = await Contract.findOne({_id: {$eq: req.body.contractId}});
    if(!contract) {
        res.status(404).send("Contract does not exist!").end();
        return;
    } else { //is the contract time-range valid for that allocation time-range?
        const startDate = new Date(req.body.startDate);
        const endDate   = new Date(req.body.endDate);
        if(!(contract.startDate <= startDate && contract.endDate >= endDate)) {
            res.status(412).send("Invalid time-range for the chosen contract!").end();
            return;
        }
        contractTotalPercentage = contract.pensumPercentage;
    }

    //check for overbooking
    const allocations = await Allocation.find({contractId: {$eq: req.body.contractId}}).exec();
    let currentSum = 0;
    for(let i in allocations) {
        if(allocations[i]._id !== allocation._id) { //do not include the allocation we are going to change!
            currentSum += allocations[i].pensumPercentage;
        }
    }
    let nextTotalPensum = req.body.pensumPercentage + currentSum;
    if(nextTotalPensum > contractTotalPercentage) {
        res.status(412).send("Overbooking of this contract!").end();
        return;
    }

    //actually try to create allocation
    req.body.pensumPercentage = Math.floor(req.body.pensumPercentage); //prevent from floats
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
    });
}

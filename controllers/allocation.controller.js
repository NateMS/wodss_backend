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
        if(isNaN(req.query.projectId)) {
            res.status(412).send("projectId has to be a number!").end();
            return;
        }
        query["projectId"] = {$eq: req.query.projectId};
    }

    //Check whether the employee actually exists
    if(req.query.hasOwnProperty('employeeId')) {
        if(isNaN(req.query.employeeId)) {
            res.status(412).send("employeeId has to be a number!").end();
            return;
        }

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
                if(contract && contract.employeeId == req.query.employeeId) {
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
    if(isNaN(req.body.projectId)) {
        res.status(412).send("projectId has to be a number!").end();
        return;
    }
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
    if(isNaN(req.body.contractId)) {
        res.status(412).send("contractId has to be a number!").end();
        return;
    }
    if(isNaN(req.body.pensumPercentage)) {
        res.status(412).send("pensumPercentage has to be a number!").end();
        return;
    }
    let contractTotalPercentage = 0;
    const contract = await Contract.findOne({_id: req.body.contractId});
    if(!contract) {
        res.status(404).end();
        return;
    } else { //is the contract timerange valid for that allocation timerange?
        const startDate = new Date(req.body.startDate);
        const endDate   = new Date(req.body.endDate);
        if(!(contract.startDate <= startDate && contract.endDate >= endDate)) {
            res.status(412).send("Invalid time-range for the chosen contract!").end();
            return;
        }
        contractTotalPercentage = contract.pensumPercentage;
    }

    //check for overbooking
    const allocations = await Allocation.find({contractId: req.body.contractId}).exec();
    let currentSum = 0;
    for(let i in allocations) {
        currentSum += allocations[i].pensumPercentage;
    }
    let nextTotalPensum = req.body.pensumPercentage + currentSum;
    if(nextTotalPensum > contractTotalPercentage) {
        res.status(412).send("Overbooking of this contract!").end();
        return;
    }

    //actually try to create allocation
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
    if(isNaN(req.params.id)) {
        res.status(412).send("id param has to be a number!").end();
        return;
    }

    Allocation.findOne({ _id: {$eq: req.params.id} }).exec(async (err, allocation) => {
        let isAllowed=false;
        if(req.employee.role === "DEVELOPER") {
            let contracts = await Contract.find({employeeId: req.employee._id}).exec();
            for(const i in contracts) {
                if(allocation.contractId === contracts[i]._id) {
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
    if(isNaN(req.params.id)) {
        res.status(412).send("id param has to be a number!").end();
        return;
    }

    //Check whether dev
    if(req.employee.role === "DEVELOPER") {
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
        if(req.employee.role === "PROJECTMANAGER") {
            let projects = await Project.find({projectManagerId: req.employee._id}).exec();
            for(let i in projects) {
                if(allocation.projectId === projects[i]._id) {
                    isAllowed = true;
                    break;
                }
            }
        } else if(req.employee.role === "ADMINISTRATOR") {
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
    if(isNaN(req.params.id)) {
        res.status(412).send("id param has to be a number!").end();
        return;
    }

    //Check whether dev (because no rights)
    if(req.employee.role === "DEVELOPER") {
        res.status(403).end();
        return;
    }

    //check all fields to be present
    if (!req.body.hasOwnProperty('startDate')
        || !req.body.hasOwnProperty('endDate')
        || !req.body.hasOwnProperty('pensumPercentage')
        || !req.body.hasOwnProperty('contractId')
        || !req.body.hasOwnProperty('projectId')) {

        res.status(412).end();
        return;
    }

    let allocation = await Allocation.findOne({ _id: {$eq: req.params.id} }).exec();
    if(!allocation) {
        res.status(404).send("Allocation does not exist!").end();
        return;
    } else {
        if(req.employee.role === "PROJECTMANAGER") {
            let projects = await Project.find({projectManagerId: req.employee._id}).exec();
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

    //Check whether the project actually exists
    if(isNaN(req.body.projectId)) {
        res.status(412).send("projectId has to be a number!").end();
        return;
    }
    const project = await Project.findOne({_id: req.body.projectId});
    if(!project) {
        res.status(404).send("Project does not exist!").end();
        return;
    } else { //only loading the project once
        if(req.employee.role === "PROJECTMANAGER") {
            if(project.projectManagerId !== req.employee._id) {
                res.status(403).end();
                return;
            }
        }
    }

    //check startDate & endDate to be from valid format
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
    if(isNaN(req.body.contractId)) {
        res.status(412).send("contractId has to be a number!").end();
        return;
    }
    if(isNaN(req.body.pensumPercentage)) {
        res.status(412).send("pensumPercentage has to be a number!").end();
        return;
    }
    let contractTotalPercentage = 0;
    const contract = await Contract.findOne({_id: req.body.contractId});
    if(!contract) {
        res.status(404).send("Contract does not exist!").end();
        return;
    } else { //is the contract timerange valid for that allocation timerange?
        const startDate = new Date(req.body.startDate);
        const endDate   = new Date(req.body.endDate);
        if(!(contract.startDate <= startDate && contract.endDate >= endDate)) {
            res.status(412).send("Invalid time-range for the chosen contract!").end();
            return;
        }
        contractTotalPercentage = contract.pensumPercentage;
    }

    //check for overbooking
    const allocations = await Allocation.find({contractId: req.body.contractId}).exec();
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
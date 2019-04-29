import Contract from '../models/contract';
import Employee from '../models/employee';
import Allocation from "../models/allocation";
import * as Role from '../models/roles'

/**
 * Get all contracts
 * @param req
 * @param res
 * @returns void
 */
export function getContracts(req, res) {
    const query = {};
    if(req.employee.role === Role.DEVELOPER) { //filter for only projects, that the dev is working on
        query["employeeId"] = { $eq: req.employee._id };
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

    Contract.findInRange(req.query.fromDate, req.query.toDate).find(query).sort('-dateAdded').exec((err, contracts) => {
        if (err) {
            res.status(500).send(err);
        } else {
            res.json(contracts);
        }
    });
}

/**
 * Save a new contract
 * @param req
 * @param res
 * @returns void
 */
export async function addContract(req, res) {
    if(req.employee.role !== Role.ADMINISTRATOR) {
        res.status(403).end();
        return;
    }

    if (!req.body.hasOwnProperty('startDate') || !req.body.startDate
        || !req.body.hasOwnProperty('endDate') || !req.body.endDate
        || !req.body.hasOwnProperty('pensumPercentage') || !req.body.pensumPercentage
        || !req.body.hasOwnProperty('employeeId') || !req.body.employeeId) {
        res.status(412).send("Missing property (startDate, endDate, pensumPercentage or employeeId)").end();
        return;
    }

    //check time-range
    const a = new Date(req.body.startDate), b = new Date(req.body.endDate);
    if(req.body.hasOwnProperty("startDate") && isNaN(a.getTime())) {
        res.status(412).send("Invalid date format for fromDate!").end();
        return;
    } else if(req.body.hasOwnProperty("endDate") && isNaN(b.getTime())) {
        res.status(412).send("Invalid date format for endDate!").end();
        return;
    } else if(a >= b) {
        res.status(412).send("fromDate has to be older than endDate!").end();
        return;
    }

    //Does the referenced employee exist?
    const e = await Employee.findOne({ _id: {$eq: req.body.employeeId}}).exec();
    if(!e) {
        res.status(404).send("The referenced employee does not exist!").end();
        return;
    }

    //find out whether another contract is already inside this time range
    const contracts = await Contract.findInRange(req.body.startDate, req.body.endDate).find({ employeeId: {$eq: req.body.employeeId}}).exec();
    if(contracts === undefined || contracts.length > 0) {
        res.status(412).send("This contract's time-range interferes with another existing contract of this employee").end();
        return;
    }

    const newContract = new Contract(req.body);
    newContract.save((err, saved) => {
        if (err) {
            res.status(500).send(err).end();
        } else {
            res.json(saved);
        }
    });
}

/**
 * Get a single contract
 * @param req
 * @param res
 * @returns void
 */
export function getContract(req, res) {
    if(isNaN(req.params.id)) {
        res.status(412).send("id param has to be a number!").end();
        return;
    }

    Contract.findOne({ _id: {$eq: req.params.id} }).exec((err, contract) => {
        if (err) {
            res.status(500).send(err);
        }else if(!contract){
            res.status(404).send("This contract does not exist!").end();
        }else{
            if(req.employee.role === Role.DEVELOPER) { //Check whether dev is allowed to see
                if(contract.employeeId !== req.employee._id) {
                    res.status(403).send("Your are not authorized to see this contract!").end();
                    return;
                }
            }
            res.json(contract);
        }
    });
}

/**
 * Delete a contract
 * @param req
 * @param res
 * @returns void
 */
export async function deleteContract(req, res) {
    if(isNaN(req.params.id)) {
        res.status(412).send("id param has to be a number!").end();
        return;
    }

    //current user has to be admin
    if(req.employee.role !== Role.ADMINISTRATOR) {
        res.status(403).send("No admin rights!").end();
        return;
    }

    //Check precondition that contract only deleted when no allocations associated
    const allocs = await Allocation.find({ contractId: {$eq: req.params.id }}).exec();
    if(allocs !== null && allocs.length > 0) {
        res.status(412).send("There are allocations associated with this contract!").end();
        return;
    }

    Contract.findOne({ _id: {$eq: req.params.id} }).exec(async (err, contract) => {
        if (err) {
            res.status(500).send(err);
        }else if(!contract){
            res.status(404).send("Contract not found!").end();
        }else {
            await Contract.deleteOne( { _id: {$eq: req.params.id} });
            res.status(204).end();
        }
    });
}

/**
 * Updates the specified contract
 * @param req
 * @param res
 */
export async function updateContract(req, res){
    if(isNaN(req.params.id)) {
        res.status(412).send("id param has to be a number!").end();
        return;
    }

    //Test whether current user is authorized
    if(req.employee.role !== Role.ADMINISTRATOR) {
        res.status(403).send("No admin rights!").end();
        return;
    }

    if (!req.body.hasOwnProperty('startDate') || !req.body.startDate
        || !req.body.hasOwnProperty('endDate') || !req.body.endDate
        || !req.body.hasOwnProperty('pensumPercentage') || !req.body.pensumPercentage
        || !req.body.hasOwnProperty('employeeId') || !req.body.employeeId) {
        res.status(412).send("Missing property (startDate, endDate, pensumPercentage or employeeId)").end();
        return;
    }

    //check time-range
    const a = new Date(req.body.startDate), b = new Date(req.body.endDate);
    if(req.body.hasOwnProperty("startDate") && isNaN(a.getTime())) {
        res.status(412).send("Invalid date format for fromDate!").end();
        return;
    } else if(req.body.hasOwnProperty("endDate") && isNaN(b.getTime())) {
        res.status(412).send("Invalid date format for endDate!").end();
        return;
    } else if(a >= b) {
        res.status(412).send("fromDate has to be older than endDate!").end();
        return;
    }

    //Does the referenced employee exist?
    const e = await Employee.findOne({ _id: {$eq: req.body.employeeId}}).exec();
    if(!e) {
        res.status(404).send("The referenced employee does not exist!").end();
        return;
    }

    Contract.findOne({ _id: {$eq: req.params.id} }).exec(async (err, contract) => {
        if(err){
            res.status(500).send(err);
        }else if(!contract){
            res.status(404).send("This contract does not exist yet!").end();
        }else{
            //check whether the change time-range could interfere with another existing contract
            const contracts = await Contract.findInRange(req.body.startDate, req.body.endDate).find({ employeeId: {$eq: req.body.employeeId}}).exec();
            if(contracts !== undefined) {
                if(contracts.length >= 1 && contracts[0].id !== contract.id) {
                    res.status(412).send("Changes (time-range) made to this contract interfers with other contract(s)");
                    return;
                }
            }

            //update values
            contract.startDate = req.body.startDate;
            contract.endDate = req.body.endDate;
            contract.pensumPercentage = req.body.pensumPercentage;
            contract.employeeId = req.body.employeeId;
            contract.save((err, saved) => {
                if(err){
                    res.status(500).send(err);
                }else{
                    res.json(saved);
                }
            })
        }
    });
}
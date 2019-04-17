import Contract from '../models/contract';
import Employee from '../models/employee';
import Allocation from "../models/allocation";

/**
 * Get all contracts
 * @param req
 * @param res
 * @returns void
 */
export function getContracts(req, res) {
    const query = {};
    if(req.employee.role === "DEVELOPER") { //filter for only projects, that the dev is working on
        query["employeeId"] = {$eq: req.employee._id};
    }

    const fromDate = req.query.fromDate;
    const toDate = req.query.toDate;
    if(new Date(fromDate) > new Date(toDate)) {
        res.status(412).end();  //Precondition Failed, because it's something the user should fix.
        return;
    }

    Contract.findInRange(fromDate, toDate).find(query).sort('-dateAdded').exec((err, contracts) => {
        if (err) {
            res.status(500).send(err);
        }
        res.json(contracts);
    });
}

/**
 * Save a new contract
 * @param req
 * @param res
 * @returns void
 */
export async function addContract(req, res) {
    if(req.employee.role !== "ADMINISTRATOR") {
        res.status(403).end();
        return;
    }

    if (!req.body.hasOwnProperty('startDate')
        || !req.body.hasOwnProperty('endDate')
        || !req.body.hasOwnProperty('pensumPercentage')
        || !req.body.hasOwnProperty('employeeId')) {

        res.status(412).end();
        return;
    }

    await Employee.findOne({ _id: req.body.employeeId }).exec((err, e) => {
        if (err) {
            res.status(500).send(err);
        } else if(!e) {
            res.status(404).end();
        }
    });

    const newContract = new Contract(req.body);
    newContract.save((err, saved) => {
        if (err) {
            res.status(500).send(err);
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
    Contract.findOne({ _id: {$eq: req.params.id} }).exec((err, contract) => {
        if (err) {
            res.status(500).send(err);
        }else if(!contract){
            res.status(404).end();
        }else{
            if(req.employee.role === "DEVELOPER") { //Check whether dev is allowed to see
                if(contract.employeeId !== req.employee._id) {
                    res.status(403).end();
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
    if(req.employee.role !== "ADMINISTRATOR") {
        res.status(403).end();
        return;
    }

    await Allocation.find({ contractId: {$eq: req.params.id }}).exec((err, allocs) => { //Check precondition that contract only deleted when no allocations associated
        if(allocs !== null && allocs.length > 0) {
            res.status(412).end();
            return;
        }
    })

    Contract.findOne({ _id: {$eq: req.params.id} }).exec((err, contract) => {
        if (err) {
            res.status(500).send(err);
        }else if(!contract){
            res.status(404).end();
        }else {
            contract.remove(() => {
                res.status(204).end();
            });
        }
    });
}


/**
 * Updates the specified employee
 * @param req
 * @param res
 */
export async function updateContract(req, res){
    //Test whether current user is authorized
    if(req.employee.role !== "ADMINISTRATOR") {
        res.status(403).end();
        return;
    }
    if (!req.body.hasOwnProperty('startDate')
        || !req.body.hasOwnProperty('endDate')
        || !req.body.hasOwnProperty('pensumPercentage')
        || !req.body.hasOwnProperty('employeeId')) {
        res.status(412).send(req.body);
        return;
    }

    //Does the referenced employee exist?
    await Employee.findOne({ _id: {$eq: req.body.employeeId}}).exec((err, e) => {
        if(err){
            res.status(500).send(err);
        }else if(!e){
            res.status(404).end();
        }
        return;
    });

    Contract.findOne({ _id: {$eq: req.params.id} }).exec((err, contract) => {
        if(err){
            res.status(500).send(err);
        }else if(!contract){
            res.status(404).end();
        }else{
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
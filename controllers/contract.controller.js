import Contract from '../models/contract';
import Employee from "../models/employee";

/**
 * Get all contracts
 * @param req
 * @param res
 * @returns void
 */
export function getContracts(req, res) {
    // todo: if unauthenticated, return 401
    // todo: if token invalid, return 401

    var fromDate = req.query.fromDate;
    var toDate = req.query.toDate;
    if(new Date(fromDate) > new Date(toDate)) {
        res.status(500).json([]);
    } else {
        Contract.find().inRange(fromDate, toDate).sort('-dateAdded').exec((err, contracts) => {
            if (err) {
                res.status(500).send(err);
            }
            res.json(contracts);
        });
    }
}

export function addContract(req, res) {
    if (!req.body.hasOwnProperty('startDate')
        || !req.body.hasOwnProperty('endDate')
        || !req.body.hasOwnProperty('pensumPercentage')
        || !req.body.hasOwnProperty('employeeId')) {

        console.error("fehler!");
        res.status(412).end();
        return
    }

    const newContract = new Contract(req.body);

    newContract.save((err, saved) => {
        if (err) {
            if (err.message.indexOf('duplicate key error') > 0) {
                res.status(412).send(err); //todo: check if 409 is correct status code according to API definition
            } else {
                res.status(500).send(err);
            }
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
    //todo: return 401 if unauthenticated or invalid token
    //todo: return 403 if missing permission due to role

    Contract.findOne({ _id: {$eq: req.params.id} }).exec((err, contract) => {
        if (err) {
            res.status(500).send(err);
        }else if(!contract){
            res.status(404).end();
        }else{
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
export function deleteContract(req, res) {
    //todo: return 401 if unauthenticated or invalid token
    //todo: return 403 if missing permission due to role

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
export function updateContract(req, res){
    //todo: 401 if unauthenticated or invalid token
    //todo: 403 if user is not allowed to update this contract

    if (!req.body.hasOwnProperty('startDate')
        || !req.body.hasOwnProperty('endDate')
        || !req.body.hasOwnProperty('pensumPercentage')
        || !req.body.hasOwnProperty('employeeId')) {
        res.status(412).send(req.body);
        return;
    }

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
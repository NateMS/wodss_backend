import Contract from '../models/contract';

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
export function addContract(req, res) {
    if (!req.body.hasOwnProperty('startDate')
        || !req.body.hasOwnProperty('endDate')
        || !req.body.hasOwnProperty('pensumPercentage')
        || !req.body.hasOwnProperty('employeeId')) {

        res.status(412).end();
        return;
    }

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
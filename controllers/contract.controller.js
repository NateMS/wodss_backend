import Contract from '../models/contract';

/**
 * Get all contracts
 * @param req
 * @param res
 * @returns void
 */
export function getContracts(req, res) {
    // todo: if unauthenticated, return 401
    // todo: if token invalid, return 401

    const fromDate = req.query.fromDate;
    const toDate = req.query.toDate;
    if(new Date(fromDate) > new Date(toDate)) {
        res.status(412).end();  //I'd prefer Precondition Failed, because it's something the user should fix.
        return;                 //then abort the request.
    }

    Contract.inRange(fromDate, toDate).sort('-dateAdded').exec((err, contracts) => {
        if (err) {
            res.status(500).send(err);
        }
        res.json(contracts);
    });
}

export function addContract(req, res) {
    if (!req.body.hasOwnProperty('startDate')
        || !req.body.hasOwnProperty('endDate')
        || !req.body.hasOwnProperty('pensumPercentage')
        || !req.body.hasOwnProperty('employeeId')) {

        console.error("fehler!");
        res.status(412).end();
        return;
    }

    const newContract = new Contract(req.body);

    newContract.save((err, saved) => {
        if (err) {
            res.status(500).send(err);
            //todo: remove comment - it's not possible to get a duplicate key error, because no field is marked as "unique"
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
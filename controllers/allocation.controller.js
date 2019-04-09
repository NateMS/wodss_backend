import Allocation from '../models/allocation';

/**
 * Get all allocations
 * @param req
 * @param res
 * @returns void
 */
export function getAllocations(req, res) {
    // todo: if unauthenticated, return 401
    // todo: if token invalid, return 401

    const query = {};
    if(req.query.hasOwnProperty('employeeId')) {
        query["employeeId"] = {$eq: req.query.employeeId};
    }
    if(req.query.hasOwnProperty('projectId')){
        query["projectId"] = {$eq: req.query.projectId};
    }

    const fromDate   = req.query.fromDate;
    const toDate     = req.query.toDate;
    if(new Date(fromDate) > new Date(toDate)) {
        res.status(412).end();  //Precondition Failed, because it's something the user should fix.
        return;
    }

    Allocation.findInRange(fromDate, toDate).find(query).sort('-dateAdded').exec((err, contracts) => {
        if (err) {
            res.status(500).send(err);
        }
        res.json(contracts);
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
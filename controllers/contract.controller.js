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
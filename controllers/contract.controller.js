import Contract from '../models/contract';
import bcrypt from 'bcrypt';

const saltRounds = 10;

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
    var toDate   = req.query.toDate;
    console.log(typeof(toDate));

    Contract.find().inRange(fromDate, toDate).sort('-dateAdded').exec((err, contracts) => {
        if (err) {
            res.status(500).send(err);
        }
        res.json(contracts);
    });
}
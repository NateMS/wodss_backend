import Credentials from '../models/credentials';
import * as jwt from "jwt-simple";

export function createToken(req, res) {
    if (!req.body.hasOwnProperty('emailAddress')
        || !req.body.hasOwnProperty('rawPassword')) {
        res.status(412).end();
        return
    }

    Credentials.findOne({emailAddress:{$eq: req.body.emailAddress}},function (err,user) {
        if(err){ return res.status(500).send(err) }

        if(!user){ return res.status(404).send({error: "Wrong Username or wrong password"}) }

        //compare password - is 'password' equal to user.password
        user.comparePassword(req.body.rawPassword, function (err, isMatch) {
            if(err){ return res.status(500).send(err) }

            if(!isMatch) { return res.status(404).send({error: "Wrong username or wrong Password"}) }

            const timestamp = new Date().getTime();
            const token = jwt.encode({
                sub: user._id,
                iat: timestamp
            }, process.env.JWT_SECRET);
            res.status(201).send({token});
        })
    });
}

export function refreshToken(req, res){
    //todo: 401 if unauthenticated or invalid token
    //todo: 403 if user is not allowed to update this project

    /*if(!req.body.hasOwnProperty('name')
        || !req.body.hasOwnProperty('ftePercentage')
        || !req.body.hasOwnProperty('startDate')
        || !req.body.hasOwnProperty('endDate')
        || !req.body.hasOwnProperty('projectManagerId')){
        res.status(412).end();
        return;
    }

    Project.findOne({ _id: {$eq: req.params.id} }).exec((err, employee) => {
        if(err){
            res.status(500).send(err);
        }else if(!employee){
            res.status(404).end();
        }else{
            employee.active = req.body.active;
            employee.firstName = req.body.firstName;
            employee.lastName = req.body.lastName;
            employee.emailAddress = req.body.emailAddress;
            employee.save((err, saved) => {
                if(err){
                    res.status(500).send(err);
                }else{
                    res.json(saved);
                }
            })
        }
    });*/
}
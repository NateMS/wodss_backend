import Credentials from '../models/credentials';
import * as jwt from "jwt-simple";
import Employee from '../models/employee';

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
            const tokenTtl = (Number(process.env.JWT_TTL) || 86400)*1000;
            const timestampExpiration = timestamp + tokenTtl;

            Employee.findOne({emailAddress: {$eq: req.body.emailAddress}}, function (err, e) {
                if(err){ return res.status(500).send(err) }

                //Deny access to employees with active=false
                if(e.active === false) {
                    return res.status(403).send({ error: "Inactive account. Ask an administrator to activate your account!"});
                }

                const token = jwt.encode({
                    sub: user._id,
                    iss: "FHNW Wodss 2019",
                    iat: timestamp,
                    exp: timestampExpiration,
                    employee: e
                }, process.env.JWT_SECRET);
                res.status(201).send({token});
            });
        })
    });
}

export function refreshToken(req, res){
    const email = req.user[0].emailAddress;
    Employee.findOne({emailAddress: {$eq: email}}, function (err, e) {
        if(err){
            return res.status(500).send(err);
        }
        //Deny access to employees with active=false
        if(e.active === false) {
            return res.status(403).send({ error: "Inactive account. Ask an administrator to activate your account!"});
        }

        const timestamp = new Date().getTime();
        const tokenTtl = (Number(process.env.JWT_TTL) || 86400)*1000;
        const timestampExpiration = timestamp + tokenTtl;
        const token = jwt.encode({
            sub: req.user[0]._id,
            iss: "FHNW Wodss 2019",
            iat: timestamp,
            exp: timestampExpiration,
            employee: e
        }, process.env.JWT_SECRET);
        res.status(201).send({token});
    });
}
import mongoose from 'mongoose'
import Credentials from '../models/credentials'
import Employee from '../models/employee'
import * as bcrypt from "bcrypt";

const saltRounds = 10;

export function seed(){
    Credentials.countDocuments().then(function (numElems) {
        if(numElems === 0){
            const email = process.env.DEFAULT_ADMIN_EMAIL || 'admin@wodss.fhnw.ch';
            const password = process.env.DEFAULT_ADMIN_PASSWORD || 'secret';
            const salt = bcrypt.genSaltSync(saltRounds);
            const hashedPassword = bcrypt.hashSync(password, salt);
            const newAdmin = new Credentials({emailAddress: email, password: hashedPassword});

            newAdmin.save(function(err, saved){
                if(err){
                    console.error(err);
                }else{
                    const newEmployee = new Employee({
                        emailAddress: email,
                        firstName: "Admin",
                        lastName: "Administrator",
                        role: "ADMINISTRATOR",
                        active: true
                    });
                    newEmployee.save(function (err, saved) {
                        if(err){
                            console.error(err);
                        }else{
                            console.info("Saved default admin as employee");
                        }
                    });
                    console.info("Saved default admin as credentials");
                }
            });
        }
    });
}
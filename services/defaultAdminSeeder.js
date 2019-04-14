import mongoose from 'mongoose'
import Credentials from '../models/credentials'

export function seed(){
    if(Credentials.count() > 0){
        console.log("No seeding needed, credentials are set available.");
        return;
    }

    const email = process.env.DEFAULT_ADMIN_EMAIL || 'admin@wodss.fhnw.ch';
    const password = process.env.DEFAULT_ADMIN_PASSWORD || 'secret';
    const newAdmin = new Credentials({emailAddress: email, password: password});

    newAdmin.save(function(err, saved){

    });
}
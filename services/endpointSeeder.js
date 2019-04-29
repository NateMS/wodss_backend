import Employee from '../models/employee';
import Project from '../models/project';
import Contract from '../models/contract';
import Allocation from '../models/allocation';
let seed = require('../services/seed');

import * as bcrypt from "bcrypt";
import Credentials from "../models/credentials";
import * as adminSeeder from "./defaultAdminSeeder";
import * as Roles from "../models/roles";
const saltRounds = 10;

let employeeIds   = [];
let pmIds         = [];
let projectIds    = [];
let contractIds   = [];
let allocationIds = [];

export async function seedDB() {
    console.log("Setting up test data");
    await resetEndpoints();
    console.log("Resettet Endpoints");
    await seedEndpoints();
    console.log("Seeded");
}

async function seedEndpoints() {
    let i;
    for(i=0; i < seed.employees.length; i++) {
        let e = Employee(seed.employees[i]);
        const salt = bcrypt.genSaltSync(saltRounds);
        const hashedPassword = bcrypt.hashSync(seed.employees[i].password, salt);
        const newCredentials = new Credentials({emailAddress: e.emailAddress, password: hashedPassword});
        await newCredentials.save();
        e = await e.save();

        employeeIds.push(e.id);
        if(e.role === Roles.PROJECTMANAGER){
            pmIds.push(e.id);
        }
    }

    for(i=0; i < seed.projects.length; i++) {
        let e = Project(seed.projects[i]);
        e.projectManagerId = pmIds[0];
        e = await e.save();
        projectIds.push(e.id);
    }

    for(i=0; i < seed.contracts.length; i++) {
        let e = Contract(seed.contracts[i]);
        e.employeeId = employeeIds[i];
        e = await e.save();
        contractIds.push(e.id);
    }

    for(i=0; i < seed.allocations.length; i++) {
        let e = Allocation(seed.allocations[i]);
        e.contractId = contractIds[i];
        e.projectId  = projectIds[i%3];
        e = await e.save();
        allocationIds.push(e.id);
    }
}

async function resetEndpoints() {
    const emps = [];
    let pmId;
    for(let i in seed.employees) {
        const e = await Employee.findOne({ emailAddress: { $eq: seed.employees[i].emailAddress }}).exec();
        await Credentials.deleteOne({ emailAddress: { $eq: seed.employees[i].emailAddress}}).exec();
        if(e) {
            if(e.role === Roles.PROJECTMANAGER) {
                pmId = e.id;
            }
            emps.push(e.id);
            await Employee.deleteOne({ _id: { $eq: e.id}}).exec();
        }
    }

    const projs = await Project.find({ projectManagerId: { $eq: pmId }}).exec();
    for(let i in projs) {
        await Project.deleteOne({ _id: { $eq: projs[i].id }}).exec();
    }

    const contractIds = [];
    const contracts = await Contract.find({ employeeId: { $in: emps }}).exec();
    for(let i in contracts) {
        await Contract.deleteOne({ _id: { $eq: contracts[i].id }}).exec();
        contractIds.push(contracts[i].id);
    }

    const allocations = await Allocation.find({ contractId: { $in: contractIds }}).exec();
    for(let i in allocations) {
        await Allocation.deleteOne({ _id: { $eq: allocations[i].id }}).exec();
    }
}

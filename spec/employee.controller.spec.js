var chai = require('chai');
var chaiHttp = require('chai-http');
var app = require('../index');
var should = chai.should();
const seeder = require('../services/endpointSeeder');

chai.use(chaiHttp);

let id;

describe('testing the employee endpoint', () => {
    beforeAll(async function() {
        await seeder.seedDB();
    }, 50000);

    it('GET all employees', function(done) {
        chai.request(app)
            .get("/api/employee")
            .end((err, res) => {
                id = res.body[0].id;
                res.should.have.status(200);
                res.body.length.should.eql(3);
                done();
            });
    }, 5000);

    it('delete one employee', function(done) {
        chai.request(app)
            .delete("/api/employee/" + id)
            .end((err, res) => {
                res.should.have.status(204);
                done();
            });
    }, 5000);

    it('GET all employees (one less)', function(done) {
        chai.request(app)
            .get("/api/employee")
            .end((err, res) => {
                id = res.body[0].id;
                res.should.have.status(200);
                res.body.length.should.eql(2);
                done();
            });
    }, 5000);
});



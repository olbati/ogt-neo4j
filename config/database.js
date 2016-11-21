
var neo4j = require('neo4j-driver').v1;

var driver = neo4j.driver('bolt://localhost', neo4j.auth.basic('neo4j', 'neo4j'));
var session = driver.session();


module.exports = session;

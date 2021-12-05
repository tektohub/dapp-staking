/*
var SimpleStorage = artifacts.require("./SimpleStorage.sol");

module.exports = function(deployer) {
  deployer.deploy(SimpleStorage);
};
*/

const OBS = artifacts.require("OBS");
const OBS2 = artifacts.require("OBS2");
const GetLastPrice = artifacts.require("GetLastPrice");
const OBdefiStaking = artifacts.require("OBdefiStaking");

module.exports = function (deployer) {
  deployer.deploy(OBS, "1000000000000000");
  deployer.deploy(OBS2, "2000000000000000");
  deployer.deploy(GetLastPrice);
  deployer.deploy(OBdefiStaking);
};
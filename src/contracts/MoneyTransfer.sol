//SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.17;

contract MoneyTransfer{
    address payable private owner;

    receive() external payable{}
    
    struct rnsData{
        bool isInUse;
        address linkedAddress;
        string rns;
    }
    
    mapping(string=>rnsData) public registry;
    
    constructor(){
        owner = payable(msg.sender);
    }

    function makeTransfer(address payable addr) public payable{
        payable(addr).transfer(msg.value);
    }

    function rnsTransfer(string memory rns) public payable{
        require(registry[rns].isInUse,"RNS not in use");
        payable(registry[rns].linkedAddress).transfer(msg.value);
    }

    function changeRNS(string memory oldRNS,string memory newRNS) public{
        require(msg.sender==registry[oldRNS].linkedAddress,"Not owner of RNS");
        delete registry[oldRNS];
        registerRNS(newRNS);
    }
    
    function registerRNS(string memory rns) public{
        require(!registry[rns].isInUse,"RNS not available");
        registry[rns]=rnsData(true,msg.sender,rns);
    }

    function isRNSRegistered(string memory rns) public view returns(bool){
        return registry[rns].isInUse;
    }

    function ownerOfRNS(string memory rns) public view returns(address){
        return registry[rns].linkedAddress;
    }

    function getBalanceOf(address addr) public view returns(uint256){
        return uint256(addr.balance);
    }
}
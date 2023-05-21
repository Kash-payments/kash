// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

// Uncomment this line to use console.log
import {Functions, FunctionsClient} from "./dev/functions/FunctionsClient.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/metatx/ERC2771Context.sol";
import "@openzeppelin/contracts/metatx/MinimalForwarder.sol";
import "hardhat/console.sol";

contract KashToken is ERC20,ERC2771Context,FunctionsClient {
    using Functions for Functions.Request;

    bytes32 public latestRequestId;
    bytes public latestResponse;
    bytes public latestError;

    uint public unlockTime;
    address payable public owner;

    event Withdrawal(uint amount, uint when);

    event OCRResponse(bytes32 indexed requestId, bytes result, bytes err);

    constructor(uint256 initialSupply,MinimalForwarder forwarder,address initAdmin,address oracle) ERC20("KashToken","KSH") ERC2771Context(address(forwarder)) FunctionsClient(oracle){
        _mint(initAdmin,initialSupply*(10**decimals()));
    }

    function fulfillRequest(bytes32 requestId, bytes memory response, bytes memory err) internal override {
        latestResponse = response;
        latestError = err;
        emit OCRResponse(requestId, response, err);
    }

    function executeRequest(
        string calldata source,
        bytes calldata secrets,
        string[] calldata args,
        uint64 subscriptionId,
        uint32 gasLimit
    ) public returns (bytes32) {
        Functions.Request memory req;
        req.initializeRequest(Functions.Location.Inline, Functions.CodeLanguage.JavaScript, source);
        if (secrets.length > 0) {
            req.addRemoteSecrets(secrets);
        }
        if (args.length > 0) req.addArgs(args);

        bytes32 assignedReqID = sendRequest(req, subscriptionId, gasLimit);
        latestRequestId = assignedReqID;
        return assignedReqID;
    }
    function purchaseToken(address user, string calldata source, bytes calldata secrets, string[] calldata args, uint64 subscriptionId, uint32 gasLimit) public{
        executeRequest(source,secrets,args,subscriptionId,gasLimit);
        _mint(user,2*(10**decimals()));
    }

    function withdraw() public {
        // Uncomment this line, and the import of "hardhat/console.sol", to print a log in your terminal
        // console.log("Unlock time is %o and block timestamp is %o", unlockTime, block.timestamp);

        require(block.timestamp >= unlockTime, "You can't withdraw yet");
        require(msg.sender == owner, "You aren't the owner");

        emit Withdrawal(address(this).balance, block.timestamp);

        owner.transfer(address(this).balance);
    }
    function _msgSender()
    internal
    view
    override(Context, ERC2771Context)
    returns (address sender)
    {
        sender = ERC2771Context._msgSender();
    }

    function _msgData()
    internal
    view
    override(Context, ERC2771Context)
    returns (bytes calldata)
    {
        return ERC2771Context._msgData();
    }
}

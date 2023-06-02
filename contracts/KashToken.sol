// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

// Uncomment this line to use console.log
import {Functions, FunctionsClient} from "./dev/functions/FunctionsClient.sol";
import "@openzeppelin/contracts/metatx/ERC2771Context.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "hardhat/console.sol";

contract KashToken is ERC20,FunctionsClient,ERC2771Context  {
  using Functions for Functions.Request;

  bytes32 public latestRequestId;
  bytes public latestResponse;
  bytes public latestError;
  string private latestUserRequestedId;

  struct User {
    string name;
    string email;
    string userId;
    address walletAddress;
  }

  mapping(string=>User) public userData;

  event OCRResponse(bytes32 indexed requestId, bytes result, bytes err);
  event UserPurchaseTokens(string userId, uint256 tokens);

  error RecordLabel_UserPaymentError(string userId, uint256 payment, string errorMsg);

  constructor(address forwarder,address oracle) ERC20("KashToken","KSH") ERC2771Context(address(forwarder)) FunctionsClient(oracle){
  }

  function setUserData(
    string memory userId,
    string memory name,
    string memory email,
    address walletAddress
  ) public {
    userData[userId].userId = userId;
    userData[userId].name = name;
    userData[userId].email = email;
    userData[userId].walletAddress = walletAddress;
  }

  function purchaseToken(string memory userId, uint256 amountDue) internal {
    if (userData[userId].walletAddress == address(0)) {
      revert RecordLabel_UserPaymentError(userId, amountDue, "user has no wallet associated.");
    }
    _mint(userData[userId].walletAddress,amountDue*(10**decimals()));
    emit UserPurchaseTokens(userId, amountDue);

  }

  function fulfillRequest(bytes32 requestId, bytes memory response, bytes memory err) internal override {
    latestResponse = response;
    latestError = err;
    emit OCRResponse(requestId, response, err);
    bool nilErr=(err.length==0);

    if (nilErr) {
      string memory userId=latestUserRequestedId; 

      (uint32 typeResponse,uint256 amount) = abi.decode(response,(uint32,uint256));

      if(typeResponse==0){
        purchaseToken(userId,amount);
      }
    }   
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
    latestUserRequestedId=args[0];
    return assignedReqID;
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

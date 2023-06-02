// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

// Uncomment this line to use console.log
import {Functions, FunctionsClient} from "./dev/functions/FunctionsClient.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "hardhat/console.sol";

contract KashToken is ERC20,FunctionsClient {
  using Functions for Functions.Request;

  bytes32 public latestRequestId;
  bytes public latestResponse;
  bytes public latestError;
  string private latestUserRequestedId;

  enum OperationsTypes{ TOKEN_PURCHASE, MEDIUM, LARGE }

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

  constructor(uint256 initialSupply,address oracle) ERC20("KashToken","KSH") FunctionsClient(oracle){
    _mint(msg.sender,initialSupply*(10**decimals()));
  }

  function setUserData(
    string memory userId,
    string memory name,
    string memory email,
    uint256 lastPaidAmount,
    address walletAddress
  ) public {
    userData[userId].userId = userId;
    userData[userId].name = name;
    userData[userId].email = email;
    userData[userId].lastPaidAmount = lastPaidAmount;
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

}

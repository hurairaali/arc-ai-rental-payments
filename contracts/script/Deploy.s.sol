// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../contracts/PropertyToken.sol";
import "../contracts/PaymentManager.sol";

contract DeployScript is Script {
    function run() external {
        // Get deployer private key from environment
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address usdc = vm.envAddress("USDC_CONTRACT_ADDRESS");
        
        vm.startBroadcast(deployerPrivateKey);
        
        // Deploy PropertyToken
        PropertyToken propertyToken = new PropertyToken();
        console.log("PropertyToken deployed at:", address(propertyToken));
        
        // Deploy PaymentManager
        PaymentManager paymentManager = new PaymentManager(
            address(propertyToken),
            usdc
        );
        console.log("PaymentManager deployed at:", address(paymentManager));
        
        vm.stopBroadcast();
    }
}




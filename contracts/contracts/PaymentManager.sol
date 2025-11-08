// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./PropertyToken.sol";

/**
 * @title PaymentManager
 * @dev Manages automated USDC payments for tokenized properties
 */
contract PaymentManager is Ownable {
    PropertyToken public propertyToken;
    IERC20 public usdc;

    struct PaymentSchedule {
        uint256 propertyId;
        address tenant;
        uint256 amount; // in USDC (6 decimals)
        uint256 frequency; // days between payments (e.g., 30 for monthly)
        uint256 nextPaymentDate;
        bool isActive;
        uint256 totalPaid;
        uint256 missedPayments;
    }

    struct Payment {
        uint256 paymentId;
        uint256 propertyId;
        address from;
        address to;
        uint256 amount;
        uint256 timestamp;
        bool successful;
        string reason;
    }

    mapping(uint256 => PaymentSchedule) public paymentSchedules; // propertyId => schedule
    mapping(uint256 => Payment[]) public paymentHistory; // propertyId => payments[]
    mapping(address => uint256[]) public tenantProperties; // tenant => propertyIds

    uint256 private _nextPaymentId = 1;
    uint256 public constant PAYMENT_DECIMALS = 6; // USDC has 6 decimals

    event PaymentScheduled(
        uint256 indexed propertyId,
        address indexed tenant,
        uint256 amount,
        uint256 frequency
    );
    event PaymentExecuted(
        uint256 indexed paymentId,
        uint256 indexed propertyId,
        address indexed from,
        address to,
        uint256 amount,
        bool successful
    );
    event PaymentScheduleUpdated(
        uint256 indexed propertyId,
        bool isActive
    );

    constructor(address _propertyToken, address _usdc) Ownable(msg.sender) {
        propertyToken = PropertyToken(_propertyToken);
        usdc = IERC20(_usdc);
    }

    /**
     * @dev Schedule recurring payments for a property
     */
    function schedulePayment(
        uint256 propertyId,
        address tenant,
        uint256 amount,
        uint256 frequency
    ) external {
        require(propertyToken.getProperty(propertyId).isActive, "Property not active");
        require(amount > 0, "Amount must be greater than 0");
        require(frequency > 0, "Frequency must be greater than 0");

        PaymentSchedule storage schedule = paymentSchedules[propertyId];
        require(schedule.tenant == address(0) || !schedule.isActive, "Payment already scheduled");

        schedule.propertyId = propertyId;
        schedule.tenant = tenant;
        schedule.amount = amount;
        schedule.frequency = frequency;
        schedule.nextPaymentDate = block.timestamp + (frequency * 1 days);
        schedule.isActive = true;
        schedule.totalPaid = 0;
        schedule.missedPayments = 0;

        tenantProperties[tenant].push(propertyId);

        emit PaymentScheduled(propertyId, tenant, amount, frequency);
    }

    /**
     * @dev Execute payment (called by AI agent or authorized address)
     */
    function executePayment(uint256 propertyId) public returns (bool) {
        PaymentSchedule storage schedule = paymentSchedules[propertyId];
        require(schedule.isActive, "Payment schedule not active");
        require(block.timestamp >= schedule.nextPaymentDate, "Payment not due yet");

        uint256 amount = schedule.amount;
        address tenant = schedule.tenant;
        PropertyToken.Property memory property = propertyToken.getProperty(propertyId);
        address propertyOwner = property.propertyOwner;

        // Check tenant balance
        uint256 tenantBalance = usdc.balanceOf(tenant);
        bool success = false;
        string memory reason = "";

        if (tenantBalance >= amount) {
            // Transfer USDC from tenant to property owner
            require(usdc.transferFrom(tenant, propertyOwner, amount), "Transfer failed");
            
            schedule.totalPaid += amount;
            schedule.nextPaymentDate = block.timestamp + (schedule.frequency * 1 days);
            success = true;
            reason = "Payment successful";
        } else {
            schedule.missedPayments++;
            reason = "Insufficient balance";
        }

        // Record payment
        Payment memory payment = Payment({
            paymentId: _nextPaymentId++,
            propertyId: propertyId,
            from: tenant,
            to: propertyOwner,
            amount: amount,
            timestamp: block.timestamp,
            successful: success,
            reason: reason
        });

        paymentHistory[propertyId].push(payment);

        emit PaymentExecuted(payment.paymentId, propertyId, tenant, propertyOwner, amount, success);

        return success;
    }

    /**
     * @dev Execute payment with AI agent decision (conditional payment)
     */
    function executeConditionalPayment(
        uint256 propertyId,
        bool shouldProcess,
        string memory reason
    ) external onlyOwner returns (bool) {
        PaymentSchedule storage schedule = paymentSchedules[propertyId];
        require(schedule.isActive, "Payment schedule not active");

        if (!shouldProcess) {
            schedule.missedPayments++;
            
            Payment memory payment = Payment({
                paymentId: _nextPaymentId++,
                propertyId: propertyId,
                from: schedule.tenant,
                to: propertyToken.getProperty(propertyId).propertyOwner,
                amount: schedule.amount,
                timestamp: block.timestamp,
                successful: false,
                reason: reason
            });

            paymentHistory[propertyId].push(payment);
            return false;
        }

        return executePayment(propertyId);
    }

    /**
     * @dev Distribute rental income to property shareholders
     */
    function distributeToShareholders(uint256 propertyId, uint256 totalAmount) external {
        PropertyToken.Property memory property = propertyToken.getProperty(propertyId);
        require(property.isActive, "Property not active");

        // This would require iterating through all shareholders
        // For simplicity, we'll distribute to the property owner
        // In production, you'd want to track all shareholders and distribute proportionally
        address propertyOwner = property.propertyOwner;
        require(usdc.transfer(propertyOwner, totalAmount), "Distribution failed");
    }

    /**
     * @dev Update payment schedule status
     */
    function updatePaymentSchedule(uint256 propertyId, bool isActive) external {
        PaymentSchedule storage schedule = paymentSchedules[propertyId];
        require(schedule.tenant != address(0), "Schedule does not exist");
        
        schedule.isActive = isActive;
        emit PaymentScheduleUpdated(propertyId, isActive);
    }

    /**
     * @dev Get payment schedule for a property
     */
    function getPaymentSchedule(uint256 propertyId) external view returns (PaymentSchedule memory) {
        return paymentSchedules[propertyId];
    }

    /**
     * @dev Get payment history for a property
     */
    function getPaymentHistory(uint256 propertyId) external view returns (Payment[] memory) {
        return paymentHistory[propertyId];
    }

    /**
     * @dev Get all properties for a tenant
     */
    function getTenantProperties(address tenant) external view returns (uint256[] memory) {
        return tenantProperties[tenant];
    }

    /**
     * @dev Check if payment is due
     */
    function isPaymentDue(uint256 propertyId) external view returns (bool) {
        PaymentSchedule memory schedule = paymentSchedules[propertyId];
        return schedule.isActive && block.timestamp >= schedule.nextPaymentDate;
    }
}

const { generateEntitySecret, registerEntitySecretCiphertext } = require("@circle-fin/developer-controlled-wallets");
const fs = require('fs');
const path = require('path');
require('dotenv').config();

/**
 * Script to generate and register Entity Secret with Circle
 * 
 * This will:
 * 1. Generate a new Entity Secret
 * 2. Register it with Circle
 * 3. Save recovery file
 * 4. Show you what to add to .env
 */

async function main() {
  console.log("🔐 Entity Secret Setup\n");
  
  const apiKey = process.env.CIRCLE_API_KEY;
  
  if (!apiKey) {
    console.error("❌ Error: CIRCLE_API_KEY not found in .env");
    console.log("\nPlease add your API key to backend/.env:");
    console.log("CIRCLE_API_KEY=your_api_key_here\n");
    process.exit(1);
  }
  
  console.log("Step 1: Generating Entity Secret...\n");
  
  // Generate a 32-byte Entity Secret (64 hex characters)
  const crypto = require('crypto');
  const entitySecret = crypto.randomBytes(32).toString('hex');
  
  console.log("✅ Entity Secret generated!");
  console.log(`\n⚠️  IMPORTANT: Save this Entity Secret securely!`);
  console.log(`   Entity Secret: ${entitySecret.substring(0, 20)}...${entitySecret.substring(entitySecret.length - 10)}\n`);
  
  // Create recovery file directory
  const recoveryDir = path.join(__dirname, '../.circle-recovery');
  if (!fs.existsSync(recoveryDir)) {
    fs.mkdirSync(recoveryDir, { recursive: true });
  }
  
  console.log("Step 2: Registering Entity Secret with Circle...");
  try {
    await registerEntitySecretCiphertext({
      apiKey: apiKey,
      entitySecret: entitySecret,
      recoveryFileDownloadPath: recoveryDir, // SDK expects directory path
    });
    
    // Find the recovery file that was created
    const recoveryFiles = fs.readdirSync(recoveryDir).filter(f => f.includes('recovery'));
    const latestRecoveryFile = recoveryFiles.length > 0 
      ? path.join(recoveryDir, recoveryFiles[recoveryFiles.length - 1])
      : null;
    
    console.log(`✅ Entity Secret registered successfully!`);
    if (latestRecoveryFile) {
      console.log(`✅ Recovery file saved to: ${latestRecoveryFile}\n`);
    } else {
      console.log(`✅ Recovery file saved in: ${recoveryDir}\n`);
    }
    
    console.log("=".repeat(60));
    console.log("📋 NEXT STEPS:");
    console.log("=".repeat(60));
    console.log("\n1. Add this to your backend/.env file:");
    console.log(`   CIRCLE_ENTITY_SECRET=${entitySecret}\n`);
    console.log("2. Keep your Entity Secret secure:");
    console.log("   - Store in a password manager");
    console.log("   - Never commit to git");
    console.log("   - Backup the recovery file\n");
    console.log("3. Recovery file location:");
    if (latestRecoveryFile) {
      console.log(`   ${latestRecoveryFile}\n`);
    } else {
      console.log(`   ${recoveryDir}\n`);
    }
    console.log("⚠️  WARNING: If you lose your Entity Secret, you'll lose access to all wallets!");
    console.log("   The recovery file is your only backup.\n");
    
  } catch (error) {
    console.error("❌ Error registering Entity Secret:");
    console.error(error.message);
    if (error.response) {
      console.error("Response:", error.response.data);
    }
    console.log("\n⚠️  Your Entity Secret was generated but NOT registered:");
    console.log(`   ${entitySecret}`);
    console.log("\nYou can try again or register it manually via Circle Console.");
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });


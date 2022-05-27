const fcl = require("@onflow/fcl");
const t = require("@onflow/types");
const { serverAuthorization } = require("./auth/authorization.js");
require("../flow/config.js");

async function mintTokens() {
  const amount = '30.0';
  const recipient = '0xf8d6e0586b0a20c7';

  try {
    const transactionId = await fcl.send([
      fcl.transaction`
      import FungibleToken from 0xDeployer
      import ExampleToken from 0xDeployer

      transaction(recipient: Address, amount: UFix64) {

          /// Reference to the Example Token Minter Resource
          let Minter: &ExampleToken.Minter

          /// Reference to the Fungible Token Receiver of the recipient
          let TokenReceiver: &ExampleToken.Vault{FungibleToken.Receiver}

          prepare(signer: AuthAccount) {
              if signer.borrow<&ExampleToken.Vault>(from: ExampleToken.VaultStoragePath) == nil {
                signer.save(<- ExampleToken.createEmptyVault(), to: ExampleToken.VaultStoragePath)
                signer.link<&ExampleToken.Vault{FungibleToken.Receiver}>(
                  /public/ExampleTokenReceiver,
                  target: ExampleToken.VaultStoragePath
                )
                signer.link<&ExampleToken.Vault{FungibleToken.Balance}>(
                  /public/ExampleTokenBalance,
                  target: ExampleToken.VaultStoragePath
                )
              }

              // Borrow a reference to the minter resource
              self.Minter = signer.borrow<&ExampleToken.Minter>(from: ExampleToken.MinterStoragePath)
                  ?? panic("Signer is not the token minter")

              // Get the account of the recipient and borrow a reference to their receiver
              self.TokenReceiver = getAccount(recipient).getCapability(/public/ExampleTokenReceiver)
                                    .borrow<&ExampleToken.Vault{FungibleToken.Receiver}>()
                                    ?? panic("Unable to borrow receiver reference")
          }

          execute {
              let mintedVault <- self.Minter.mintTokens(amount: amount)
              // Deposit them to the receiever
              self.TokenReceiver.deposit(from: <-mintedVault)
          }
      }
      `,
      fcl.args([
        fcl.arg(recipient, t.Address),
        fcl.arg(amount, t.UFix64)
      ]),
      fcl.proposer(serverAuthorization),
      fcl.payer(serverAuthorization),
      fcl.authorizations([serverAuthorization]),
      fcl.limit(999)
    ]).then(fcl.decode);

    console.log({ transactionId });
  } catch (e) {
    console.log(e);
  }
}

mintTokens();
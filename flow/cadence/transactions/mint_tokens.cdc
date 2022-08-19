import FungibleToken from "../utility/FungibleToken.cdc"
import ExampleToken from "../ExampleToken.cdc"

transaction(recipient: Address, amount: UFix64) {

    /// Reference to the Example Token Minter Resource
    let Minter: &ExampleToken.Minter

    /// Reference to the Fungible Token Receiver of the recipient
    let TokenReceiver: &ExampleToken.Vault{FungibleToken.Receiver}

    prepare(signer: AuthAccount) {
        // Borrow a reference to the minter resource
        self.Minter = signer.borrow<&ExampleToken.Minter>(from: ExampleToken.MinterStoragePath)
            ?? panic("Signer is not the token minter")

        // Get the account of the recipient and borrow a reference to their receiver
        self.TokenReceiver = getAccount(recipient).getCapability(ExampleToken.VaultReceiverPath)
                              .borrow<&ExampleToken.Vault{FungibleToken.Receiver}>()
                              ?? panic("Unable to borrow receiver reference")
    }

    execute {
        let mintedVault <- self.Minter.mintTokens(amount: amount)
        // Deposit them to the receiever
        self.TokenReceiver.deposit(from: <-mintedVault)
    }
}
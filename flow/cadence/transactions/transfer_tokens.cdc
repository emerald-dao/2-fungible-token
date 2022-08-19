// This transaction is a template for a transaction that
// could be used by anyone to send tokens to another account
// that has been set up to receive tokens.
//
// The withdraw amount and the account from getAccount
// would be the parameters to the transaction
import FungibleToken from "../utility/FungibleToken.cdc"
import ExampleToken from "../ExampleToken.cdc"

transaction(amount: UFix64, recipient: Address) {

    // The Vault resource that holds the tokens that are being transferred
    let SentVault: @FungibleToken.Vault

    prepare(signer: AuthAccount) {

        // Get a reference to the signer's stored vault
        let vaultRef = signer.borrow<&ExampleToken.Vault>(from: ExampleToken.VaultStoragePath)
			?? panic("Could not borrow reference to the owner's Vault!")

        // Withdraw tokens from the signer's stored vault
        self.SentVault <- vaultRef.withdraw(amount: amount)
    }

    execute {
        // Get a reference to the recipient's Receiver
        let receiverRef = getAccount(recipient).getCapability(ExampleToken.VaultReceiverPath)
                            .borrow<&ExampleToken.Vault{FungibleToken.Receiver}>()
			                ?? panic("Could not borrow receiver reference to the recipient's Vault")

        // Deposit the withdrawn tokens in the recipient's receiver
        receiverRef.deposit(from: <-self.SentVault)
    }
}
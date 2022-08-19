// This transaction is a template for a transaction
// to add a Vault resource to their account
// so that they can use the exampleToken
import FungibleToken from "../utility/FungibleToken.cdc"
import ExampleToken from "../ExampleToken.cdc"

transaction() {

    prepare(signer: AuthAccount) {
        // Only setup if they aren't setup already.
        if signer.borrow<&ExampleToken.Vault>(from: ExampleToken.VaultStoragePath) == nil {
            // Create a new ExampleToken Vault and put it in storage
            signer.save(
                <-ExampleToken.createEmptyVault(),
                to: ExampleToken.VaultStoragePath
            )

            // Create a public capability to the Vault that only exposes
            // the deposit function through the Receiver interface
            signer.link<&ExampleToken.Vault{FungibleToken.Receiver}>(
                ExampleToken.VaultReceiverPath,
                target: ExampleToken.VaultStoragePath
            )

            // Create a public capability to the Vault that only exposes
            // the balance field through the Balance interface
            signer.link<&ExampleToken.Vault{FungibleToken.Balance}>(
                ExampleToken.VaultBalancePath,
                target: ExampleToken.VaultStoragePath
            )
        }
    }
}